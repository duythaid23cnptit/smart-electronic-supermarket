# W6 Requirements Traceability — FR-06, FR-11, FR-12

Ngày đối chiếu: **2026-10-29**
Phạm vi: **Module 1 — Kho QR Code & Serial/IMEI** và **Module 2 — POS bán hàng tại quầy**.

## Nguồn yêu cầu

- File gốc: `docs/ba-input/FRS_V2 (1)).docx`.
- Tiêu đề metadata: `Đặc tả yêu cầu chức năng`.
- Revision metadata: `2`; last modified by `Huy Nguyễn` lúc `2026-10-25T14:01:00Z`.
- File gốc chỉ được đọc, không bị sửa.
- `Use_Case_Matrix (1).docx` cũng ánh xạ UC-05 → FR-06 và UC-09 → FR-11/FR-12.

Trạng thái `PARTIAL` bên dưới nghĩa là một phần tiêu chí đã có code/test/evidence,
nhưng chưa đủ để tuyên bố toàn bộ FR đạt. `NOT VERIFIED` nghĩa là chưa có bằng
chứng kiểm thử hoặc tiêu chí cần BA/PM xác nhận; không suy đoán phần thiếu.

## Bảng truy vết

| Yêu cầu FRS | Nội dung cần truy vết | Code / test / evidence thực tế | Trạng thái | Khoảng trống và giới hạn |
|---|---|---|---|---|
| FR-06 — Nhận hàng và ghi nhận thiết bị theo QR hoặc Serial | Chỉ nhận chứng từ hợp lệ/PO đã duyệt; giữ Serial/IMEI; kiểm tra trùng, số lượng, chất lượng; cập nhật tồn và số đã nhận cùng giao dịch | `InventoryReceivingService.receive()` có `@Transactional`, khóa PO, kiểm tra `APPROVED` và idempotency; `ProductUnit` đặt `GOOD → AVAILABLE`, `DEFECTIVE → DEFECTIVE`. `InventoryReceivingServiceTests`: approved/defective, duplicate, leading-zero, unapproved PO, over-limit, replay và concurrent retry. Live W6: DRAFT/over-limit/duplicate đều HTTP 409; GR `GR-e5ccc299-087b-4aa8-844b-a1ba27bbb1cf`; replay HTTP 200 cùng receipt. W5 ảnh `EV-W5-IMG-03/04`; W6 UI `EV-W6-IMG-01`. | **PARTIAL** | Chưa có authentication/authorization theo nhân viên kho; vị trí kho trong input và phiếu nháp chưa được triển khai/kiểm chứng. Webcam **NOT RUN**. Ảnh W6 cho camera/image/API đều `NOT RUN`; mục tiêu QR dưới 1 giây không ổn định. |
| FR-11 — Lập giao dịch POS và gán thiết bị | Tìm/chọn sản phẩm, giỏ hàng, khách/khách lẻ, tạm tính; gán duy nhất thiết bị còn bán được; giữ hàng trong phiên trước tính tiền | `PosPage.jsx` có chọn sản phẩm/unit, giỏ, customer name và tạm tính. `InventoryPosAdapter` chỉ trả `GOOD + AVAILABLE`, khóa unit khi checkout. `PosCheckoutIntegrationTests`: list sellable units, không bán `SOLD`/`DEFECTIVE`, concurrent cashiers không cùng bán một Serial. W5 cart `EV-W5-IMG-02`; W6 POS interface `EV-W6-IMG-02`. | **PARTIAL** | Không có authentication/permission hoặc phiên bán được phê duyệt. Không có cơ chế giữ hàng/reservation có thời hạn; giỏ frontend chưa phải giao dịch/hold persisted. Chưa có test mất kết nối ở bước giữ. Vì vậy không xác nhận tiêu chí “hai phiên không cùng giữ” trước checkout. |
| FR-12 — Tính tiền và hoàn tất giao dịch POS | Kiểm tra lại giá/tồn, tính tổng, ghi nhận thanh toán, hoàn tất đơn, giảm tồn và phát hành receipt đúng một lần | `PosCheckoutService.checkout()` chạy trong transaction, lấy giá server, ghi sale/receipt rồi `markSold`; chỉ nhận `DEMO_CASH`. `PosPricingTests` kiểm tra tổng. `PosCheckoutIntegrationTests` kiểm tra receipt + SOLD nguyên tử, retry idempotent, key mismatch, rollback và concurrent sale. Live W6: sale `POS-51430c55-5697-4ae2-996d-415f4a0819dc`, `DEMO_CONFIRMED`, GET receipt HTTP 200, unit không còn trong danh sách, replay HTTP 200, resale HTTP 409. W5 receipt `EV-W5-IMG-01`. | **PARTIAL** | `DEMO_CASH` chỉ là mô phỏng, không phải thu tiền thật. Chưa có quyền giảm giá, thuế/phí/chương trình giá, trạng thái thanh toán thất bại/chưa rõ, hủy/tra soát, in/in lại hóa đơn hoặc máy in vật lý. Không có UAT. |

## Kết luận truy vết

- FR-06, FR-11 và FR-12 đều có phần triển khai và bằng chứng kiểm thử phù hợp với
  hai module demo, nhưng **không FR nào được đánh dấu VERIFIED toàn phần**.
- Webcam: **NOT RUN**.
- QR dưới 1 giây ổn định: **NOT ACHIEVED** theo dữ liệu W4 (max 1380,9 ms).
- npm audit: còn cảnh báo; không thay dependency trong lần cập nhật hồ sơ này.
- UAT/PM/BA/Architect/QA approval: **NOT PROVIDED / NOT VERIFIED**.
