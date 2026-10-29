package com.smartelectronicsupermarket.inventory.repository;

import com.smartelectronicsupermarket.inventory.domain.Product;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductRepository extends JpaRepository<Product, Long> {
    Optional<Product> findBySku(String sku);
    List<Product> findAllByOrderBySkuAsc();
}
