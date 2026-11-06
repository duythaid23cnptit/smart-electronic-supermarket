package com.smartelectronicsupermarket.pos.checkout.service;

import com.smartelectronicsupermarket.pos.checkout.model.PosDtos.CreateSaleRequest;
import com.smartelectronicsupermarket.pos.checkout.model.PosDtos.ProductView;
import com.smartelectronicsupermarket.pos.checkout.model.PosDtos.ReceiptLine;
import com.smartelectronicsupermarket.pos.checkout.model.PosDtos.SaleLine;
import com.smartelectronicsupermarket.pos.checkout.model.PosDtos.SaleReceipt;
import com.smartelectronicsupermarket.pos.checkout.model.PosDtos.UnitView;
import com.smartelectronicsupermarket.pos.checkout.persistence.PosSaleEntity;
import com.smartelectronicsupermarket.pos.checkout.persistence.PosSaleRepository;
import com.smartelectronicsupermarket.pos.checkout.port.PosInventoryPort;
import com.smartelectronicsupermarket.pos.checkout.port.PosInventoryPort.SellableUnit;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PosCheckoutService {
    private final PosInventoryPort inventory;
    private final PosSaleRepository sales;

    public PosCheckoutService(PosInventoryPort inventory, PosSaleRepository sales) {
        this.inventory = inventory;
        this.sales = sales;
    }

    @Transactional(readOnly = true)
    public List<ProductView> products() {
        return inventory.listProducts();
    }

    @Transactional(readOnly = true)
    public List<UnitView> units(String sku) {
        return inventory.listUnits(sku);
    }

    @Transactional(readOnly = true)
    public SaleReceipt receipt(String saleNumber) {
        return sales.findBySaleNumber(saleNumber)
            .map(sale -> toReceipt(sale, false))
            .orElseThrow(() -> new PosCheckoutException(HttpStatus.NOT_FOUND, "Không tìm thấy biên nhận"));
    }

    @Transactional
    public SaleReceipt checkout(CreateSaleRequest request) {
        validate(request);
        String key = request.idempotencyKey().trim();
        String customerName = normalizeName(request.customerName());
        String fingerprint = fingerprint(request, customerName);

        PosSaleEntity previous = sales.findByIdempotencyKey(key).orElse(null);
        if (previous != null) {
            if (!previous.getRequestFingerprint().equals(fingerprint)) {
                throw new PosCheckoutException(HttpStatus.CONFLICT, "Idempotency key đã dùng cho giỏ hàng khác");
            }
            return toReceipt(previous, true);
        }

        List<SaleLine> sortedLines = new ArrayList<>(request.lines());
        sortedLines.sort((left, right) -> left.serialImei().compareTo(right.serialImei()));
        List<SellableUnit> lockedUnits = new ArrayList<>();
        List<Long> prices = new ArrayList<>();
        for (SaleLine line : sortedLines) {
            SellableUnit unit = inventory.lockUnit(line.serialImei());
            if (!unit.isSellable() || !unit.sku().equals(line.sku())) {
                throw new PosCheckoutException(
                    HttpStatus.CONFLICT,
                    "Thiết bị không còn khả dụng hoặc SKU không khớp: " + line.serialImei()
                );
            }
            lockedUnits.add(unit);
            prices.add(unit.unitPriceVnd());
        }

        final long total;
        try {
            total = PosPricing.totalVnd(prices);
        } catch (ArithmeticException | IllegalArgumentException exception) {
            throw new PosCheckoutException(HttpStatus.BAD_REQUEST, "Giá trị giao dịch không hợp lệ");
        }

        String saleNumber = "POS-" + UUID.randomUUID();
        PosSaleEntity sale = new PosSaleEntity(
            saleNumber,
            key,
            fingerprint,
            customerName,
            "DEMO_CASH",
            total,
            Instant.now().truncatedTo(ChronoUnit.MICROS)
        );
        lockedUnits.forEach(unit -> sale.addLine(
            unit.sku(), unit.productName(), unit.serialImei(), unit.unitPriceVnd()
        ));

        sales.saveAndFlush(sale);
        lockedUnits.forEach(unit -> inventory.markSold(unit.serialImei(), saleNumber));
        return toReceipt(sale, false);
    }

    private static String normalizeName(String value) {
        return value == null || value.isBlank() ? "Khách lẻ" : value.trim();
    }

    private static void validate(CreateSaleRequest request) {
        if (request == null || request.idempotencyKey() == null
            || !request.idempotencyKey().matches("[A-Za-z0-9_-]{8,100}")) {
            throw new PosCheckoutException(HttpStatus.BAD_REQUEST, "Idempotency key không hợp lệ");
        }
        if (!"DEMO_CASH".equals(request.paymentMethod())) {
            throw new PosCheckoutException(HttpStatus.BAD_REQUEST, "W5 chỉ hỗ trợ xác nhận tiền mặt mô phỏng");
        }
        if (request.customerName() != null && request.customerName().length() > 120) {
            throw new PosCheckoutException(HttpStatus.BAD_REQUEST, "Tên khách tối đa 120 ký tự");
        }
        if (request.lines() == null || request.lines().isEmpty() || request.lines().size() > 30) {
            throw new PosCheckoutException(HttpStatus.BAD_REQUEST, "Giỏ hàng cần 1–30 thiết bị");
        }
        try {
            PosPricing.requireUniqueSerials(
                request.lines().stream().map(line -> line == null ? null : line.serialImei()).toList()
            );
        } catch (IllegalArgumentException exception) {
            throw new PosCheckoutException(HttpStatus.BAD_REQUEST, exception.getMessage());
        }
        for (SaleLine line : request.lines()) {
            if (line == null || line.sku() == null || line.sku().isBlank()
                || line.serialImei() == null || line.serialImei().isBlank()
                || line.sku().length() > 100 || line.serialImei().length() > 160) {
                throw new PosCheckoutException(HttpStatus.BAD_REQUEST, "SKU/Serial không hợp lệ");
            }
        }
    }

    private static String fingerprint(CreateSaleRequest request, String customerName) {
        StringBuilder canonical = new StringBuilder("DEMO_CASH;");
        appendPart(canonical, customerName);
        request.lines().stream()
            .sorted((left, right) -> left.serialImei().compareTo(right.serialImei()))
            .forEach(line -> {
                appendPart(canonical, line.sku());
                appendPart(canonical, line.serialImei());
            });
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                .digest(canonical.toString().getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is required by the Java runtime.", exception);
        }
    }

    private static void appendPart(StringBuilder target, String value) {
        target.append(value.length()).append(':').append(value).append('|');
    }

    private static SaleReceipt toReceipt(PosSaleEntity sale, boolean replay) {
        return new SaleReceipt(
            sale.getSaleNumber(),
            sale.getPaymentMethod(),
            sale.getPaymentStatus(),
            sale.getCustomerName(),
            sale.getTotalVnd(),
            sale.getCreatedAt(),
            sale.getLines().stream().map(line -> new ReceiptLine(
                line.getSku(), line.getProductName(), line.getSerialImei(), line.getUnitPriceVnd()
            )).toList(),
            replay
        );
    }
}
