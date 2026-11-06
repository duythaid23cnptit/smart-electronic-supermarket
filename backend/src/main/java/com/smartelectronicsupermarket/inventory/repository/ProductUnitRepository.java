package com.smartelectronicsupermarket.inventory.repository;

import com.smartelectronicsupermarket.inventory.domain.InventoryStatus;
import com.smartelectronicsupermarket.inventory.domain.ProductUnit;
import com.smartelectronicsupermarket.inventory.domain.UnitCondition;
import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProductUnitRepository extends JpaRepository<ProductUnit, Long> {
    boolean existsBySerialImei(String serialImei);
    Optional<ProductUnit> findBySerialImei(String serialImei);
    long countByInventoryStatus(InventoryStatus inventoryStatus);
    long countByProductSkuAndConditionAndInventoryStatus(
        String sku, UnitCondition condition, InventoryStatus inventoryStatus
    );

    @Query("""
        select unit from ProductUnit unit
        join fetch unit.product product
        where product.sku = :sku
          and unit.condition = :condition
          and unit.inventoryStatus = :status
        order by unit.serialImei
        """)
    List<ProductUnit> findSellableBySku(
        @Param("sku") String sku,
        @Param("condition") UnitCondition condition,
        @Param("status") InventoryStatus status
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
        select unit from ProductUnit unit
        join fetch unit.product
        where unit.serialImei = :serialImei
        """)
    Optional<ProductUnit> findBySerialImeiForUpdate(@Param("serialImei") String serialImei);
}
