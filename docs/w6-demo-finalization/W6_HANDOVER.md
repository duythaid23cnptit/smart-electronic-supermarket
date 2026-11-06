# W6 Technical Handover

## Baseline bàn giao

- Repository: `D:\smart-electronic-supermarket`
- Branch: `feat/tv4-w6-demo-finalization`
- Parent: W5 commit `3798d83`
- Java/Spring: Java 26 / Spring Boot 4.1.1 / Maven Wrapper 3.9.16
- Frontend: React 18 / Vite 5 / Axios
- Database demo: H2 file, profile `demo`

## Nội dung bàn giao

- Module 1: QR/manual/image-file receiving, approved PO checks, Serial/IMEI,
  GOOD/DEFECTIVE, idempotent Goods Receipt.
- Module 2: real inventory selection, cart, server demo price, DEMO_CASH,
  sale/receipt, SOLD transition, rollback/idempotency/concurrency protection.
- W6 documentation: report, test matrix, bug log, risk register, evidence
  index, FR-06/11/12 traceability, W1–W6 comparison and demo guide.

## Trạng thái kiểm chứng

- Backend: 20/20 PASS.
- Frontend: 13/13 PASS.
- Vite build: PASS, 355 modules.
- Live W6 flow: PASS with GR and sale identifiers in Evidence Index.
- Visual evidence: bốn ảnh W5 đã được xác minh và tái sử dụng trong bộ hồ sơ
  W6; chúng thể hiện POS cart/receipt và Inventory interface/receipt của W5.
- W6-specific screenshots: hai ảnh đã xác minh. Ảnh Kho xác nhận
  `Module 1 — Kho QR Code & Serial/IMEI`; ảnh POS xác nhận
  `Module 2 — POS bán hàng tại quầy` và `TV4 · W6 · DESKTOP DEMO`.
- FRS traceability: FR-06, FR-11 và FR-12 đều **PARTIAL**; không tuyên bố
  VERIFIED toàn phần. Chi tiết ở `W6_REQUIREMENTS_TRACEABILITY.md`.
- npm audit: FAIL/findings, 3 high + 1 moderate.
- Webcam: NOT RUN.
- Stable QR <1 second: not achieved by W4 max result.
- UAT/stakeholder acceptance: NOT PROVIDED; không tuyên bố PASS.

## Không thay đổi trong W6

- Không đổi schema, API contract, business rules, dependencies hoặc architecture.
- Không thêm module ngoài hai demo parts.
- Không reset/xóa H2.
- Không stage input folders.

## Review bắt buộc

### PM

- Xác nhận phạm vi cuối chỉ Kho + POS và tiêu chí nghiệm thu môn học.
- Quyết định security remediation/dependency upgrade có nằm trong scope không.
- Phê duyệt cách chuẩn bị PO demo mới thay vì reset DB.

### BA

- Xác nhận revision 2 của FRS hiện có là baseline được PM/BA phê duyệt.
- Review các gap FR-06/11/12 trong `W6_REQUIREMENTS_TRACEABILITY.md`, đặc biệt
  quyền, vị trí/phiếu nháp, phiên/giữ hàng, giảm giá/thuế và lỗi thanh toán.
- Xác nhận giá, thuế, giảm giá, giữ hàng, hủy/hoàn và lifecycle sau bán.

### Architect/DBA/Security

- Review `SOLD`, `sold_sale_number`, ownership Sale–Inventory.
- Thay demo H2 migration/`ddl-auto=update` bằng migration strategy nếu đi xa hơn.
- Review authentication/authorization và npm advisories.

### QA

- Chạy webcam/HTTPS thật nếu camera thuộc acceptance.
- Chốt môi trường và tiêu chí QR latency dưới 1 giây.
- Thu screenshot/video evidence, kiểm tra repeatable browser flow và ký test
  matrix.
- Thực hiện UAT theo baseline FRS đã duyệt; hai ảnh W6 hiện tại chưa thay thế
  biên bản UAT.

## Git handoff

Trước khi commit, chỉ chọn source/doc W6 cần thiết. Không stage:

- `docs/tv4-w4/`
- `docs/tv4-w5-input/`
- `docs/ba-input/`
- `backend/data/`

Không có commit W6 được tạo tự động.
