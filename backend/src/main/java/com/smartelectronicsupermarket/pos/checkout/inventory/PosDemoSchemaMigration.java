package com.smartelectronicsupermarket.pos.checkout.inventory;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Keeps the file-based W3/W4 H2 demo database compatible with the additive W5
 * SOLD state. Production database migrations remain an architecture decision.
 */
@Component
@Profile("demo")
@Order(Ordered.HIGHEST_PRECEDENCE)
public class PosDemoSchemaMigration implements CommandLineRunner {
    private final JdbcTemplate jdbcTemplate;

    public PosDemoSchemaMigration(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(String... args) {
        jdbcTemplate.execute("""
            ALTER TABLE product_units
            ALTER COLUMN inventory_status ENUM('AVAILABLE', 'DEFECTIVE', 'SOLD') NOT NULL
            """);
    }
}
