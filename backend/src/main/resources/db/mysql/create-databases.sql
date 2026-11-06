-- Run as a MySQL administrator. This script does not create users or store passwords.
-- The application account should receive privileges only for the database it uses.

CREATE DATABASE IF NOT EXISTS sasms_tv4_demo
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_0900_as_cs;

CREATE DATABASE IF NOT EXISTS sasms_tv4_test
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_0900_as_cs;
