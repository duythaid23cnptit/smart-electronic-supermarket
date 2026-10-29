package com.smartelectronicsupermarket.pos.checkout.api;

import com.smartelectronicsupermarket.pos.checkout.model.PosDtos.CreateSaleRequest;
import com.smartelectronicsupermarket.pos.checkout.model.PosDtos.ProductView;
import com.smartelectronicsupermarket.pos.checkout.model.PosDtos.SaleReceipt;
import com.smartelectronicsupermarket.pos.checkout.model.PosDtos.UnitView;
import com.smartelectronicsupermarket.pos.checkout.service.PosCheckoutException;
import com.smartelectronicsupermarket.pos.checkout.service.PosCheckoutService;
import java.util.List;
import java.util.Map;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/pos")
public class PosCheckoutController {
    private final PosCheckoutService service;

    public PosCheckoutController(PosCheckoutService service) {
        this.service = service;
    }

    @GetMapping("/products")
    public List<ProductView> products() {
        return service.products();
    }

    @GetMapping("/products/{sku}/units")
    public List<UnitView> units(@PathVariable String sku) {
        return service.units(sku);
    }

    @PostMapping("/sales")
    public ResponseEntity<SaleReceipt> checkout(@RequestBody CreateSaleRequest request) {
        SaleReceipt result = service.checkout(request);
        return ResponseEntity.status(result.replay() ? HttpStatus.OK : HttpStatus.CREATED).body(result);
    }

    @GetMapping("/sales/{saleNumber}")
    public SaleReceipt sale(@PathVariable String saleNumber) {
        return service.receipt(saleNumber);
    }

    @ExceptionHandler(PosCheckoutException.class)
    public ResponseEntity<Map<String, String>> known(PosCheckoutException exception) {
        return ResponseEntity.status(exception.getStatus()).body(Map.of("message", exception.getMessage()));
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, String>> constraint(DataIntegrityViolationException exception) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
            "message", "Xung đột giao dịch hoặc Serial/IMEI. Thử lại bằng cùng idempotency key để kiểm tra kết quả."
        ));
    }
}
