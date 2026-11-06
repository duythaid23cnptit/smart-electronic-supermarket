# TV4 Week 4 — Inventory QR Release Candidate 1

Ngày thực hiện: **23/10/2026**
Nhánh làm việc: `feat/tv4-w4-inventory-rc1`
Nền tảng: Windows desktop, Java 26.0.2.1, Spring Boot 4.1.1, React 18, Vite 5

## Mục tiêu và phạm vi

RC1 chỉ cải tiến QR Scanner PoC W1 và luồng QR/Serial-IMEI của Module Kho W3. Không có thay đổi POS, VietQR, thanh toán, máy in, AI, Logistics, Warranty, API contract, database schema hoặc dependency.

Mục tiêu kỹ thuật là sửa lỗi lifecycle/submit có căn cứ, hỗ trợ đọc QR từ PNG/JPG khi không dùng webcam, và đo riêng thời gian giải mã ảnh, camera và API. Camera và mobile không được chạy trong đợt kiểm thử này.

## Git baseline

- W1: commit `333797c` trên `feat/tv4-w1-qr-poc`.
- W3: commit `61cbe94` trên `feat/tv4-w3-inventory-qr`.
- W4 được tạo từ W3 khi tracked working tree sạch.
- File người dùng `docs/tv4-w4/SASMS_TV4_W4_RC1_STARTER.zip` được giữ nguyên, không giải nén hoặc stage.
- Không push, merge, rebase hoặc commit.

## Audit và lỗi thực tế

Chi tiết nằm trong `W4_BUG_LOG.csv`. Các vấn đề đã xử lý:

1. Inventory chưa có đường đọc QR từ file ảnh cho môi trường không webcam.
2. Start/cleanup scanner chưa có khóa thao tác tức thời và cleanup unmount gọi cập nhật state.
3. Lỗi duplicate item được ném trong state updater nên không nằm chắc chắn trong biên `try/catch` của event handler.
4. Submit dựa vào disabled state của lần render sau, nên có cửa sổ gửi lặp trong cùng tick.

Không quan sát thấy regression backend trong bộ test hiện có. Các luật đã được test gồm PO phải APPROVED, không vượt số lượng, Serial/IMEI duy nhất và giữ số 0 đầu, DEFECTIVE không vào AVAILABLE, idempotent retry và concurrent retry.

## Thay đổi mã nguồn

- `frontend/src/poc/qr-scanner/QrScannerPoc.jsx`: khóa start lặp, cleanup an toàn khi unmount, định nghĩa và hiển thị `CAMERA_SCAN_LATENCY` từ lúc gọi thư viện start đến callback hợp lệ đầu tiên.
- `frontend/src/poc/qr-scanner/scanUtils.js`: operation guard và thống kê n/mean/median/p95/min/max.
- `frontend/src/features/inventory/InventoryReceivingPage.jsx`: đọc file PNG/JPG trong browser, trạng thái scanner rõ ràng, cảnh báo URL không tự mở, đo ảnh/API, benchmark 20 lần, khóa submit, bắt lỗi add item đồng bộ.
- `frontend/src/features/inventory/inventoryUtils.js`: kiểm tra MIME, file rỗng và giới hạn 5 MB.
- Các test JS và CSS tương ứng được cập nhật.
- Backend không đổi.

## Định nghĩa phép đo

- `IMAGE_FILE_DECODE`: từ ngay trước `Html5Qrcode.scanFile()` đến khi promise trả chuỗi. Không gồm thời gian người dùng chọn file và không trộn với camera.
- `CAMERA_SCAN_LATENCY`: từ ngay trước lời gọi `scanner.start()`/`decodeFromConstraints()` đến callback hợp lệ đầu tiên. Chưa chạy vì không có bằng chứng webcam.
- `API_REQUEST_MS`: từ ngay trước `createGoodsReceipt()` đến khi request resolve/reject tại frontend.

### Kết quả thực tế

Benchmark ảnh dùng Chrome headless với đồng hồ hệ thống thật, ảnh `01-leading-zeroes.png`, 20 lần liên tiếp:

| n | Mean | Median | p95 | Min | Max | Fail |
|---:|---:|---:|---:|---:|---:|---:|
| 20 | 86.3 ms | 17.3 ms | 29.1 ms | 13.5 ms | 1380.9 ms | 0 |

20/20 kết quả bằng chính xác `00001234567890`. p95 dưới 1 giây, nhưng max có một outlier 1380.9 ms; vì vậy **không kết luận mục tiêu dưới 1 giây đạt nhất quán**. Một lần đi qua đúng file-input UI đo được 54.3 ms. Camera là `NOT RUN`.

Luồng desktop UI → Vite proxy → REST API → H2 demo tạo một đơn vị `DEFECTIVE` có Serial `000020261023W4RC1`: HTTP thành công, available `0`, defective `1`, `API_REQUEST_MS` 208.5 ms. Hai lần click submit trong cùng tick chỉ tạo một resource request.

## Test evidence

- `npm.cmd test`: **PASS**, 9 test, 9 pass, 0 fail.
- `npm.cmd run build`: **PASS**, 355 modules transformed.
- `.\mvnw.cmd clean verify`: **PASS**, 8 test, 0 failure, 0 error, 0 skipped; `BUILD SUCCESS`.
- `npm.cmd audit --json`: hoàn tất với exit code 1 do có **4 vulnerability** (3 high, 1 moderate). Không tự nâng Vite major; cần PM/technical review riêng.
- Bảng đầy đủ: `W4_TEST_MATRIX.csv` và `W4_PERF_MEASUREMENTS.csv`.

## Cách kiểm tra desktop

1. Chạy backend demo bằng `.\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=demo"` trong `backend`.
2. Chạy `npm.cmd run dev:inventory` trong `frontend` và mở `http://localhost:5173/inventory.html`.
3. Tải `PO-DEMO-APPROVED`.
4. Chọn **Chọn ảnh QR** và dùng `frontend/public/qr-samples/01-leading-zeroes.png`; xác nhận ô Serial/IMEI là `00001234567890`.
5. Có thể bấm **Benchmark ảnh mẫu ×20** để tạo bảng đo mới cho máy đang dùng.
6. Thêm mã, chọn GOOD/DEFECTIVE và tạo Goods Receipt. URL quét được chỉ hiển thị như text, không tự điều hướng.

## Bộ ảnh minh chứng đề xuất

1. Trang Inventory sau khi đọc QR từ file với `IMAGE_FILE_DECODE` và Serial có số 0 đầu.
2. Thông báo duplicate Serial/IMEI.
3. Phản hồi PO `DRAFT` bị chặn.
4. Goods Receipt có một dòng `DEFECTIVE`, available bằng 0.
5. Bảng benchmark 20 lần trong UI.
6. Terminal Maven 8/8, frontend 9/9 và Vite build PASS.

## Kết luận release

Mã nguồn đáp ứng phạm vi **RC1 để review nội bộ trên desktop**. Đây không phải tuyên bố nghiệm thu: camera/mobile chưa chạy, max benchmark ảnh có một lần vượt 1 giây, npm audit còn findings, và chưa có PM approval. Không có commit được tạo.

## Bảng kết thúc

| Hạng mục | Trạng thái | Evidence | Lỗi/hạn chế còn lại |
|---|---|---|---|
| QR file PNG/JPG | VERIFIED | Chrome file-input: exact `00001234567890`, 54.3 ms | Chưa thử nhiều kích thước/ánh sáng ảnh |
| QR image benchmark | VERIFIED_WITH_LIMITATION | n=20, fail=0, p95 29.1 ms | Max 1380.9 ms; chưa đạt dưới 1 giây nhất quán |
| Camera lifecycle | IMPLEMENTED_NOT_TESTED | Operation-guard unit test và build PASS | Không có webcam evidence |
| Duplicate callback/string/URL safety | VERIFIED | Frontend unit tests PASS; không có lệnh điều hướng | Chưa test camera thực tế |
| Inventory UI → API → H2 | VERIFIED | Receipt `GR-83c47795-b150-4b71-83c4-21d117918354`; API 208.5 ms | Dữ liệu demo, không phải nghiệm thu production |
| Submit lặp | VERIFIED | Hai click cùng tick, một resource request | Backend idempotency vẫn là lớp bảo vệ bắt buộc |
| Inventory business rules | VERIFIED_BY_TEST | Maven 8/8; 7 test inventory + 1 context | Không thay thế UAT/SRS approval |
| Dependency security | OPEN_RISK | npm audit: 3 high, 1 moderate | Fix đề xuất có Vite major; chưa được phê duyệt |
| PM acceptance | NOT_REQUESTED | Không có approval | Cần review/approval riêng |
