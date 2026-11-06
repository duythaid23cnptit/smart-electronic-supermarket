package com.smartelectronicsupermarket.mysql;

import static org.assertj.core.api.Assertions.assertThat;

import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.util.Set;
import java.util.stream.Collectors;
import javax.sql.DataSource;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;

/**
 * Read-only, explicit opt-in validation for a dedicated SASMS MySQL database.
 * It is skipped during the normal H2 test suite and never creates or deletes data.
 */
@SpringBootTest
@ActiveProfiles("mysql")
@EnabledIfEnvironmentVariable(named = "SASMS_MYSQL_IT", matches = "true")
class MySqlSchemaValidationTests {
    private static final Set<String> EXPECTED_TABLES = Set.of(
        "warehouses",
        "products",
        "purchase_orders",
        "purchase_order_lines",
        "product_units",
        "goods_receipts",
        "goods_receipt_items",
        "pos_sales",
        "pos_sale_items"
    );

    @Autowired DataSource dataSource;
    @Autowired JdbcTemplate jdbcTemplate;

    @Test
    void connectsToExplicitExpectedDatabaseAndValidatesImplementedTables() throws Exception {
        String expectedDatabase = requireEnvironment("SASMS_MYSQL_EXPECTED_DATABASE");

        try (Connection connection = dataSource.getConnection()) {
            DatabaseMetaData metadata = connection.getMetaData();
            assertThat(metadata.getDatabaseProductName()).isEqualTo("MySQL");
            assertThat(connection.getCatalog()).isEqualTo(expectedDatabase);
            assertThat(metadata.getURL()).contains("/" + expectedDatabase);
        }

        Set<String> implementedTables = jdbcTemplate.queryForList(
            """
            select table_name
            from information_schema.tables
            where table_schema = database()
              and table_type = 'BASE TABLE'
            """,
            String.class
        ).stream().map(String::toLowerCase).collect(Collectors.toSet());

        assertThat(implementedTables).containsAll(EXPECTED_TABLES);
        assertThat(jdbcTemplate.queryForObject("select database()", String.class))
            .isEqualTo(expectedDatabase);
    }

    private String requireEnvironment(String name) {
        String value = System.getenv(name);
        assertThat(value).as(name + " must be set for MySQL integration validation").isNotBlank();
        return value;
    }
}
