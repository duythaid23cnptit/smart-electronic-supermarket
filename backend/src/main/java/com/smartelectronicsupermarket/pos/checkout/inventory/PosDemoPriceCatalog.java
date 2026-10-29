package com.smartelectronicsupermarket.pos.checkout.inventory;

import com.smartelectronicsupermarket.pos.checkout.service.PosCheckoutException;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

@Component
public class PosDemoPriceCatalog {
    private static final String PREFIX = "sasms.pos.demo-prices.";
    private final Environment environment;

    public PosDemoPriceCatalog(Environment environment) {
        this.environment = environment;
    }

    public long requirePrice(String sku) {
        String configured = environment.getProperty(PREFIX + sku);
        if (configured == null) {
            throw new PosCheckoutException(
                HttpStatus.SERVICE_UNAVAILABLE,
                "SKU chưa có giá DEMO được cấu hình: " + sku
            );
        }
        try {
            long price = Long.parseLong(configured);
            if (price < 0) throw new NumberFormatException("negative");
            return price;
        } catch (NumberFormatException exception) {
            throw new PosCheckoutException(
                HttpStatus.SERVICE_UNAVAILABLE,
                "Giá DEMO không hợp lệ cho SKU: " + sku
            );
        }
    }
}
