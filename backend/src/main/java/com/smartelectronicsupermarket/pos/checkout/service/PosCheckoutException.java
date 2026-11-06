package com.smartelectronicsupermarket.pos.checkout.service;

import org.springframework.http.HttpStatus;

public class PosCheckoutException extends RuntimeException {
    private final HttpStatus status;

    public PosCheckoutException(HttpStatus status, String message) {
        super(message);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
