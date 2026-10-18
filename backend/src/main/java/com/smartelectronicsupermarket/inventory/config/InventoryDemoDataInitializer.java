package com.smartelectronicsupermarket.inventory.config;

import com.smartelectronicsupermarket.inventory.domain.Product;
import com.smartelectronicsupermarket.inventory.domain.PurchaseOrder;
import com.smartelectronicsupermarket.inventory.domain.PurchaseOrderStatus;
import com.smartelectronicsupermarket.inventory.domain.Warehouse;
import com.smartelectronicsupermarket.inventory.repository.ProductRepository;
import com.smartelectronicsupermarket.inventory.repository.PurchaseOrderRepository;
import com.smartelectronicsupermarket.inventory.repository.WarehouseRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@Profile("demo")
public class InventoryDemoDataInitializer implements CommandLineRunner {
    private final ProductRepository productRepository;
    private final WarehouseRepository warehouseRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;

    public InventoryDemoDataInitializer(ProductRepository productRepository,
                                        WarehouseRepository warehouseRepository,
                                        PurchaseOrderRepository purchaseOrderRepository) {
        this.productRepository = productRepository;
        this.warehouseRepository = warehouseRepository;
        this.purchaseOrderRepository = purchaseOrderRepository;
    }

    @Override
    @Transactional
    public void run(String... args) {
        Warehouse warehouse = warehouseRepository.findByCode("WH-HCM-01")
            .orElseGet(() -> warehouseRepository.save(new Warehouse("WH-HCM-01", "Kho demo TP.HCM")));
        Product tv = productRepository.findBySku("TV-55-DEMO")
            .orElseGet(() -> productRepository.save(new Product("TV-55-DEMO", "Smart TV 55 inch Demo")));
        Product phone = productRepository.findBySku("PHONE-DEMO")
            .orElseGet(() -> productRepository.save(new Product("PHONE-DEMO", "Điện thoại Demo")));

        if (purchaseOrderRepository.findByOrderNumber("PO-DEMO-APPROVED").isEmpty()) {
            PurchaseOrder approved = new PurchaseOrder("PO-DEMO-APPROVED", PurchaseOrderStatus.APPROVED, warehouse);
            approved.addLine(tv, 3);
            approved.addLine(phone, 3);
            purchaseOrderRepository.save(approved);
        }
        if (purchaseOrderRepository.findByOrderNumber("PO-DEMO-DRAFT").isEmpty()) {
            PurchaseOrder draft = new PurchaseOrder("PO-DEMO-DRAFT", PurchaseOrderStatus.DRAFT, warehouse);
            draft.addLine(tv, 1);
            purchaseOrderRepository.save(draft);
        }
    }
}
