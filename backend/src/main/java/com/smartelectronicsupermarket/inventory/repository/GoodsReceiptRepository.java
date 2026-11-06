package com.smartelectronicsupermarket.inventory.repository;

import com.smartelectronicsupermarket.inventory.domain.GoodsReceipt;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GoodsReceiptRepository extends JpaRepository<GoodsReceipt, Long> {
    @EntityGraph(attributePaths = {"purchaseOrder", "warehouse", "items", "items.productUnit", "items.productUnit.product"})
    Optional<GoodsReceipt> findByIdempotencyKey(String idempotencyKey);
}
