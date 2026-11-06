package com.smartelectronicsupermarket.pos.checkout.service;

import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

public final class PosPricing {
    private PosPricing() {}

    public static long totalVnd(Collection<Long> unitPrices) {
        if (unitPrices == null || unitPrices.isEmpty() || unitPrices.size() > 30) {
            throw new IllegalArgumentException("Giỏ hàng phải có 1–30 thiết bị");
        }
        long total = 0;
        for (Long price : unitPrices) {
            if (price == null || price < 0) {
                throw new IllegalArgumentException("Giá bán không hợp lệ");
            }
            total = Math.addExact(total, price);
        }
        return total;
    }

    public static void requireUniqueSerials(List<String> serials) {
        if (serials == null || serials.isEmpty() || serials.size() > 30) {
            throw new IllegalArgumentException("Giỏ hàng phải có 1–30 thiết bị");
        }
        Set<String> seen = new HashSet<>();
        for (String serial : serials) {
            if (serial == null || serial.isBlank() || !seen.add(serial)) {
                throw new IllegalArgumentException("Serial/IMEI trống hoặc trùng trong giỏ hàng");
            }
        }
    }
}
