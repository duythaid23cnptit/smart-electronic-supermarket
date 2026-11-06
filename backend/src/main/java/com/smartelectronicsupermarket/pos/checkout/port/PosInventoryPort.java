package com.smartelectronicsupermarket.pos.checkout.port;

import com.smartelectronicsupermarket.pos.checkout.model.PosDtos.ProductView;
import com.smartelectronicsupermarket.pos.checkout.model.PosDtos.UnitView;
import java.util.List;

public interface PosInventoryPort {
    List<ProductView> listProducts();
    List<UnitView> listUnits(String sku);
    SellableUnit lockUnit(String serialImei);
    void markSold(String serialImei, String saleNumber);

    record SellableUnit(
        String sku, String productName, String serialImei,
        long unitPriceVnd, String quality, String status
    ) {
        public boolean isSellable() {
            return "GOOD".equals(quality) && "AVAILABLE".equals(status);
        }
    }
}
