package com.smartelectronicsupermarket.pos.checkout.service;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.util.List;
import org.junit.jupiter.api.Test;

class PosPricingTests {
    @Test
    void totalIsSumOfUnitPrices() {
        assertEquals(20_000_000L, PosPricing.totalVnd(List.of(15_000_000L, 5_000_000L)));
    }

    @Test
    void preservesLeadingZeroesInSerial() {
        assertDoesNotThrow(() -> PosPricing.requireUniqueSerials(List.of("00001234567890", "00001234567891")));
    }

    @Test
    void duplicateSerialIsRejected() {
        assertThrows(
            IllegalArgumentException.class,
            () -> PosPricing.requireUniqueSerials(List.of("0001", "0001"))
        );
    }

    @Test
    void invalidPriceAndOverflowAreRejected() {
        assertThrows(IllegalArgumentException.class, () -> PosPricing.totalVnd(List.of(-1L)));
        assertThrows(ArithmeticException.class, () -> PosPricing.totalVnd(List.of(Long.MAX_VALUE, 1L)));
    }

    @Test
    void emptyCartIsRejected() {
        assertThrows(IllegalArgumentException.class, () -> PosPricing.totalVnd(List.of()));
    }
}
