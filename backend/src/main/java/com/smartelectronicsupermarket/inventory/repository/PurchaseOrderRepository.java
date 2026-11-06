package com.smartelectronicsupermarket.inventory.repository;

import com.smartelectronicsupermarket.inventory.domain.PurchaseOrder;
import jakarta.persistence.LockModeType;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PurchaseOrderRepository extends JpaRepository<PurchaseOrder, Long> {
    Optional<PurchaseOrder> findByOrderNumber(String orderNumber);

    @Query("""
        select distinct po from PurchaseOrder po
        join fetch po.warehouse
        left join fetch po.lines line
        left join fetch line.product
        where po.orderNumber = :orderNumber
        """)
    Optional<PurchaseOrder> findDetailedByOrderNumber(@Param("orderNumber") String orderNumber);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
        select distinct po from PurchaseOrder po
        join fetch po.warehouse
        left join fetch po.lines line
        left join fetch line.product
        where po.orderNumber = :orderNumber
        """)
    Optional<PurchaseOrder> findByOrderNumberForUpdate(@Param("orderNumber") String orderNumber);
}
