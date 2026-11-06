package com.smartelectronicsupermarket.pos.checkout.persistence;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PosSaleRepository extends JpaRepository<PosSaleEntity, Long> {
    Optional<PosSaleEntity> findByIdempotencyKey(String idempotencyKey);
    Optional<PosSaleEntity> findBySaleNumber(String saleNumber);
}
