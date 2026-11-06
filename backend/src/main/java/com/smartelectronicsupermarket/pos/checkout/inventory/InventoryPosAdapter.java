package com.smartelectronicsupermarket.pos.checkout.inventory;

import com.smartelectronicsupermarket.inventory.domain.InventoryStatus;
import com.smartelectronicsupermarket.inventory.domain.ProductUnit;
import com.smartelectronicsupermarket.inventory.domain.UnitCondition;
import com.smartelectronicsupermarket.inventory.repository.ProductRepository;
import com.smartelectronicsupermarket.inventory.repository.ProductUnitRepository;
import com.smartelectronicsupermarket.pos.checkout.model.PosDtos.ProductView;
import com.smartelectronicsupermarket.pos.checkout.model.PosDtos.UnitView;
import com.smartelectronicsupermarket.pos.checkout.port.PosInventoryPort;
import com.smartelectronicsupermarket.pos.checkout.service.PosCheckoutException;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

@Component
public class InventoryPosAdapter implements PosInventoryPort {
    private final ProductRepository products;
    private final ProductUnitRepository units;
    private final PosDemoPriceCatalog prices;

    public InventoryPosAdapter(
        ProductRepository products,
        ProductUnitRepository units,
        PosDemoPriceCatalog prices
    ) {
        this.products = products;
        this.units = units;
        this.prices = prices;
    }

    @Override
    public List<ProductView> listProducts() {
        return products.findAllByOrderBySkuAsc().stream()
            .map(product -> new ProductView(
                product.getSku(),
                product.getName(),
                prices.requirePrice(product.getSku()),
                units.countByProductSkuAndConditionAndInventoryStatus(
                    product.getSku(), UnitCondition.GOOD, InventoryStatus.AVAILABLE
                )
            ))
            .toList();
    }

    @Override
    public List<UnitView> listUnits(String sku) {
        if (products.findBySku(sku).isEmpty()) {
            throw new PosCheckoutException(HttpStatus.NOT_FOUND, "Không tìm thấy SKU: " + sku);
        }
        prices.requirePrice(sku);
        return units.findSellableBySku(sku, UnitCondition.GOOD, InventoryStatus.AVAILABLE).stream()
            .map(unit -> new UnitView(
                unit.getSerialImei(),
                unit.getProduct().getSku(),
                unit.getCondition().name(),
                unit.getInventoryStatus().name()
            ))
            .toList();
    }

    @Override
    public SellableUnit lockUnit(String serialImei) {
        ProductUnit unit = units.findBySerialImeiForUpdate(serialImei)
            .orElseThrow(() -> new PosCheckoutException(
                HttpStatus.CONFLICT, "Serial/IMEI không tồn tại trong kho: " + serialImei
            ));
        return snapshot(unit);
    }

    @Override
    public void markSold(String serialImei, String saleNumber) {
        ProductUnit unit = units.findBySerialImeiForUpdate(serialImei)
            .orElseThrow(() -> new PosCheckoutException(
                HttpStatus.CONFLICT, "Serial/IMEI không tồn tại trong kho: " + serialImei
            ));
        try {
            unit.markSold(saleNumber);
        } catch (IllegalArgumentException | IllegalStateException exception) {
            throw new PosCheckoutException(
                HttpStatus.CONFLICT, "Serial/IMEI không còn khả dụng: " + serialImei
            );
        }
    }

    private SellableUnit snapshot(ProductUnit unit) {
        return new SellableUnit(
            unit.getProduct().getSku(),
            unit.getProduct().getName(),
            unit.getSerialImei(),
            prices.requirePrice(unit.getProduct().getSku()),
            unit.getCondition().name(),
            unit.getInventoryStatus().name()
        );
    }
}
