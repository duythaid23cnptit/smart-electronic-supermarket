# SASMS TV4 — Báo cáo hoàn thiện demo Tuần 6

Ngày thực hiện audit và kiểm thử: **2026-10-29**
Thành viên: **Vũ Duy Thái (TV4 — Dev Lead)**
Nhánh: `feat/tv4-w6-demo-finalization`
Baseline: W5 commit `3798d83`

## 1. Phạm vi được chốt

Chỉ có hai phần demo:

1. **Module 1 — Kho QR Code & Serial/IMEI**.
2. **Module 2 — POS bán hàng tại quầy**.

Không triển khai AI, ecommerce, logistics, bảo hành, VietQR thật hoặc máy in vật
lý. POS chỉ xác nhận `DEMO_CASH`; đây không phải thanh toán tài chính.

## 2. Trạng thái Git và source

- Nhánh W6 tồn tại và trỏ từ W5 commit `3798d83`.
- Lịch sử W1–W5 liên tục: `333797c` → `61cbe94` → `930c79f` → `3798d83`;
  baseline W2 là `84a4558`, merge `e3a83f8`.
- Trước W6, tracked working tree sạch. Chỉ
  `docs/tv4-w4/` và `docs/tv4-w5-input/` là untracked.
- Hai thư mục đầu vào và `backend/data/` không được stage.
- Không commit, push, merge, rebase, reset hoặc xóa H2 trong lần thực hiện này.

Các ngày trong `W1_W6_PLANNED_VS_ACTUAL.md` là ngày commit lấy trực tiếp từ
Git hoặc ngày thực thi thực tế; không được hiểu là ngày kế hoạch ban đầu.

## 3. Kết quả audit kỹ thuật

### Module 1 — Kho

- API chỉ nhập kho cho PO `APPROVED`, khóa PO khi nhận hàng và chặn vượt hạn
  mức.
- Serial/IMEI là `String`, có unique constraint toàn bảng và giữ số 0 đầu.
- `GOOD` tạo `AVAILABLE`; `DEFECTIVE` tạo `DEFECTIVE` và không xuất hiện trong
  danh sách bán của POS.
- Goods Receipt dùng fingerprint/idempotency key và có test concurrent retry.
- Scanner có guard callback trùng, cleanup stream, nhập tay, đọc PNG/JPG cục bộ,
  không tự mở URL và giới hạn ảnh 5 MB.

### Module 2 — POS

- Danh sách sản phẩm/unit dùng repository Kho thật; không có kho giả.
- Chỉ `GOOD + AVAILABLE` được chọn. Giá được resolve từ cấu hình demo phía
  server; client không gửi giá.
- Checkout `DEMO_CASH`, sale, receipt và chuyển unit sang `SOLD` nằm trong cùng
  transaction.
- Pessimistic lock, unique constraints và idempotency chống bán trùng/concurrent.
- Test rollback xác nhận một dòng lỗi làm cả giao dịch không lưu.

### Giao diện

Lỗi có bằng chứng: trang Kho vẫn ghi `WEEK 4 RC1 / Inventory QR Receiving` trong
khi phạm vi demo chốt Module 1, và trang POS còn mô tả `Week 5`. Đã sửa nhãn
thành Module 1/Module 2 và W6 demo; không đổi nghiệp vụ.

Backend metadata và các endpoint status cũ vẫn chứa từ `skeleton` /
`SKELETON_READY`. Đây là bất nhất đã quan sát nhưng **không sửa**, vì W6 cấm thay
đổi API ngoài phạm vi và UI demo không còn dùng status này.

## 4. Kết quả kiểm thử tự động

- `backend\\mvnw.cmd clean verify`: **PASS** — 20 tests, 0 failure, 0 error,
  0 skipped; BUILD SUCCESS.
- `npm.cmd test`: **PASS** — 13 tests, 13 pass, 0 fail.
- `npm.cmd run build`: **PASS** — 355 modules transformed.
- `npm.cmd audit`: **FAIL** (exit 1) — 4 findings: 3 high, 1 moderate. Không
  chạy `npm audit fix` hoặc nâng major.

Bảy test Inventory, bảy test POS integration, năm test pricing và một context
test tạo tổng 20 backend tests. Frontend gồm năm scanner tests, bốn Inventory
tests và bốn POS utility tests.

## 5. Luồng tích hợp mới trên H2 hiện hữu

Không reset database. Dữ liệu mới dùng Serial
`000020261029W6FLOW01`:

| Bước | Kết quả thực tế |
|---|---|
| Nhập vào PO DRAFT | HTTP 409 |
| Nhập 2 units khi PO chỉ còn 1 | HTTP 409 |
| Nhập Serial đã tồn tại `000020261029W5GOOD` | HTTP 409 |
| Nhập 1 PHONE-DEMO GOOD | HTTP 201, `GR-e5ccc299-087b-4aa8-844b-a1ba27bbb1cf` |
| Replay Goods Receipt cùng key | HTTP 200, cùng receipt, `replayed=true` |
| POS đọc unit | GOOD, AVAILABLE, giữ đủ số 0 đầu |
| Checkout DEMO_CASH | HTTP 201, `POS-51430c55-5697-4ae2-996d-415f4a0819dc`, VND 5,000,000 |
| Replay sale cùng key | HTTP 200, cùng sale, `replay=true` |
| GET receipt | HTTP 200, `DEMO_CONFIRMED` |
| Tải units sau sale | `[]` |
| Bán lại bằng key mới | HTTP 409 |
| Nhập thêm sau khi PO đầy | HTTP 409 |

Sau test, `PO-DEMO-APPROVED` đã hết remaining quantity cho cả TV và PHONE. Đây
là trạng thái dữ liệu thật cần lưu ý khi demo lại; không tự tạo PO hoặc reset DB
trong W6.

## 6. Minh chứng hình ảnh

Bộ hồ sơ W6 có bốn ảnh kiểm thử W5 trong `evidence/`:

- POS cart và POS receipt cho TV `000020261029POS02`, giá/tổng 15.000.000 đ,
  sale `POS-1c4b42f3-d75d-4fe9-9a28-1bc3d9907a2c` và `DEMO_CONFIRMED`.
- Inventory interface và Goods Receipt
  `GR-7e86369d-5658-4dcd-84af-fed3e0318efb`, condition `GOOD`, khả dụng 1.

Đây là ảnh chụp **W5 được tái sử dụng để bổ sung evidence W6**, không phải ảnh
chụp lại sau sửa nhãn W6. Các nhãn cũ `Module 1 — POS`, `Inventory QR
Receiving` và phần skeleton nhìn thấy trong ảnh phù hợp với thời điểm W5. Phạm
vi chứng minh chi tiết và hash từng file nằm trong `W6_EVIDENCE_INDEX.md`.

Hai ảnh W6 mới được kiểm tra riêng:

- `W6_01_Inventory_Interface.png` xác nhận tiêu đề
  `Module 1 — Kho QR Code & Serial/IMEI` và kicker
  `SASMS · MODULE 1 · W6 DEMO`.
- `W6_02_POS_Interface.png` xác nhận tiêu đề
  `Module 2 — POS bán hàng tại quầy`, kicker
  `SASMS · MODULE 2 · W6 DEMO` và nhãn `TV4 · W6 · DESKTOP DEMO`.

Ảnh Kho W6 không chứa chuỗi `TV4 · W6 · DESKTOP DEMO`; nhãn đó được xác nhận
trên ảnh POS W6 và trong source. Hai ảnh W6 chỉ là evidence giao diện, không tự
chứng minh giao dịch backend hoặc tiêu chí hiệu năng.

Trong ảnh Inventory, camera và image decode đều `NOT RUN`. Vì vậy bộ ảnh không
đổi trạng thái webcam, không chứng minh mục tiêu QR dưới 1 giây và không được
coi là UAT hoặc stakeholder acceptance.

## 7. Đối chiếu yêu cầu

Đã đọc `docs/ba-input/FRS_V2 (1)).docx` (revision 2, last modified by
`Huy Nguyễn` ngày 2026-10-25) và đối chiếu đúng nội dung FR-06, FR-11, FR-12.
Bản FRS gốc không bị sửa. Kết quả tổng quát:

- FR-06 — nhận hàng theo QR/Serial: **PARTIAL**. Các nhánh PO đã duyệt, Serial
  duy nhất/giữ số 0, giới hạn số lượng, GOOD/DEFECTIVE, transaction và
  idempotency có code/test/live evidence. Quyền nhân viên kho, vị trí và phiếu
  nháp chưa được triển khai/kiểm chứng; webcam vẫn NOT RUN.
- FR-11 — lập giao dịch POS và gán thiết bị: **PARTIAL**. Chọn hàng, giỏ, khách
  lẻ, tạm tính và chống bán cùng Serial có bằng chứng. Permission/phiên bán và
  cơ chế giữ hàng có thời hạn trước checkout chưa có.
- FR-12 — tính tiền và hoàn tất POS: **PARTIAL**. Giá server, tổng, receipt,
  SOLD, rollback và idempotency có bằng chứng cho `DEMO_CASH`. Thuế/giảm giá,
  quyền, thanh toán thật/thất bại/chưa rõ và in/in lại hóa đơn chưa có.

Bảng chi tiết từng yêu cầu, code, test, evidence và khoảng trống nằm trong
`W6_REQUIREMENTS_TRACEABILITY.md`. Không yêu cầu nào được đánh dấu VERIFIED toàn
phần và không suy đoán tiêu chí ngoài FRS.

## 8. Giới hạn bắt buộc

- Webcam/camera scan: **NOT RUN**.
- Mục tiêu QR dưới 1 giây ổn định: **FAIL** theo evidence W4 vì max 1380.9 ms,
  dù p95 29.1 ms và 20/20 decode đúng.
- npm audit: còn 3 high, 1 moderate.
- H2 file + `ddl-auto=update` và migration enum riêng profile demo không phải
  chiến lược production.
- Giá, thuế/giảm giá, giữ hàng, hủy/hoàn, receipt numbering và lifecycle sau
  bán chưa có phê duyệt nghiệp vụ đầy đủ.
- Không có authentication/authorization.
- PO demo hiện đã nhận đủ; muốn lặp lại luồng nhập mới cần dữ liệu PO được kiểm
  soát và phê duyệt, không nên reset DB tùy tiện.
- Bốn screenshot W5 là evidence tái sử dụng; hai screenshot W6 chỉ xác nhận
  nhãn/trạng thái giao diện. Chưa có biên bản UAT.

## 9. Kết luận

Hai module là **demo candidate đã kiểm chứng bằng automated tests và live API
flow**, không phải nghiệm thu production. W6 chưa được commit. Các quyết định
PM/BA/Architect/QA còn mở được liệt kê trong Risk Register và Handover.
