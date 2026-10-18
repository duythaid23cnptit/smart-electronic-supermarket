package com.smartelectronicsupermarket.inventory.repository;

import com.smartelectronicsupermarket.inventory.domain.InventoryStatus;
import com.smartelectronicsupermarket.inventory.domain.ProductUnit;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductUnitRepository extends JpaRepository<ProductUnit, Long> {
    boolean existsBySerialImei(String serialImei);
    Optional<ProductUnit> findBySerialImei(String serialImei);
    long countByInventoryStatus(InventoryStatus inventoryStatus);
}
