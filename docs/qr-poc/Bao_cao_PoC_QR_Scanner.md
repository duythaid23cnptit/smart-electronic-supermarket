# Báo cáo PoC QR Scanner

## Thông tin

- Dự án: Smart Electronic Supermarket Management System (SASMS)
- Thành viên: Vũ Duy Thái
- Vai trò: TV4 - Dev Lead
- Nhiệm vụ: W1 - PoC thử nghiệm thư viện quét QR trên điện thoại
- Trạng thái báo cáo: Phần cài đặt và kiểm thử tự động đã thực hiện; thử nghiệm camera trên điện thoại chưa thực hiện

## 1. Mục tiêu

Xây dựng một trang React độc lập để so sánh `html5-qrcode` và `@zxing/browser`, tập trung vào:

- Khả năng xin quyền và truy cập camera sau của điện thoại.
- Đọc chính xác chuỗi QR.
- Giữ nguyên số 0 đầu và nội dung Unicode.
- Ngăn callback trùng khi QR nằm lâu trong khung hình.
- Hỗ trợ nhập tay để đối chiếu.
- Không tự mở URL hoặc gửi dữ liệu tới backend.

PoC không triển khai nghiệp vụ QR, POS, thanh toán, tồn kho hoặc database.

## 2. Phương pháp

1. Tạo trang `/qr-poc.html` tách khỏi POS hiện tại.
2. Dùng cùng tập QR samples và cùng quy tắc ghi nhận cho hai thư viện.
3. Chạy unit test cho xử lý chuỗi và duplicate guard.
4. Chạy production build.
5. Mở trang trên điện thoại qua HTTPS và thử camera thực tế.
6. Ghi thiết bị, browser, ánh sáng, độ chính xác, thời gian và lỗi quyền camera.
7. Chỉ kết luận thư viện sau khi có kết quả thực tế.

## 3. Môi trường đã xác minh

- Windows development machine.
- Node.js 22.23.1.
- npm 10.9.8.
- React 18.3.1.
- Vite 5.4.x.
- `html5-qrcode` 2.3.8.
- `@zxing/browser` 0.1.5 với `@zxing/library` 0.21.3.

Thiết bị điện thoại, hệ điều hành điện thoại và browser mobile: `NOT RUN`.

### 3.1. Kết quả kiểm chứng kỹ thuật

| Kiểm tra | Kết quả | Ghi chú |
|---|---|---|
| Unit test QR utilities | PASS | 3/3 test pass |
| Vite production build | PASS | Có cảnh báo chunk PoC lớn hơn 500 kB |
| HTTPS page smoke test | PASS | `/qr-poc.html` trả HTTP 200 |
| npm audit | ATTENTION | 3 cảnh báo trong chuỗi Vite: 1 moderate, 2 high; chưa tự nâng major |
| Camera trên điện thoại | NOT RUN | Cần thiết bị thật và HTTPS được tin cậy |

## 4. Thiết kế an toàn dữ liệu

- Kết quả được xử lý dưới dạng string, không chuyển sang number.
- Không gọi `trim()`, vì whitespace có thể thuộc dữ liệu QR.
- Duplicate guard so sánh exact string.
- URL chỉ được nhận diện để hiển thị cảnh báo.
- Không có `window.open`, redirect hoặc clickable link từ kết quả quét.
- Không gọi API backend và không lưu lịch sử quét.

## 5. QR test samples

| Sample | Chuỗi kỳ vọng | Mục tiêu |
|---|---|---|
| Leading zeroes | `00001234567890` | Giữ số 0 đầu |
| SASMS code | `SASMS-TV4-W1-QR-001` | Chuỗi ASCII |
| Unicode | `SASMS\|Ghi chú: Kiểm thử QR tiếng Việt` | UTF-8 tiếng Việt |
| URL | `https://example.com/qr-test?code=000123` | Không tự điều hướng |

## 6. Bảng kết quả thực nghiệm

Chưa chạy camera trên điện thoại. Tất cả kết quả dưới đây phải giữ `NOT RUN` cho tới khi có phép đo thật.

| Library | Thiết bị/browser | Ánh sáng | Exact match | Thời gian | Quyền camera | Evidence | Status |
|---|---|---|---|---|---|---|---|
| html5-qrcode | Chưa ghi | Chưa thử | Chưa thử | Chưa đo | Chưa thử | Chưa có | NOT RUN |
| @zxing/browser | Chưa ghi | Chưa thử | Chưa thử | Chưa đo | Chưa thử | Chưa có | NOT RUN |

## 7. So sánh sơ bộ

Chỉ có thể so sánh cấu trúc tích hợp, chưa thể so sánh độ chính xác hoặc tốc độ:

| Tiêu chí | html5-qrcode | @zxing/browser |
|---|---|---|
| Tích hợp camera | Quản lý reader trong một DOM container | Dùng video element và scanner controls |
| Cấu hình PoC | Giới hạn QR_CODE, fps và qrbox | QR code reader với khoảng nghỉ callback |
| Duplicate handling | Lớp dùng chung của PoC | Lớp dùng chung của PoC |
| Hiệu năng thực tế | Chưa đo | Chưa đo |
| Quyền camera mobile | Chưa thử | Chưa thử |

## 8. Kết luận

Hai thư viện đã được tích hợp trong cùng một trang PoC và dùng chung quy tắc bảo toàn chuỗi,
duplicate guard và chính sách không tự mở URL. Chưa có đủ bằng chứng để chọn thư viện tốt hơn.
Kết luận cuối cùng bị chặn cho đến khi thử camera thật trên ít nhất một điện thoại qua HTTPS.

## 9. Ảnh minh chứng cần chụp

- Trang PoC trên điện thoại với HTTPS URL.
- Prompt hoặc lỗi quyền camera.
- Kết quả leading-zero của từng thư viện.
- Kết quả Unicode của từng thư viện.
- URL được hiển thị kèm cảnh báo không điều hướng.
- Duplicate counter.
- Thử nghiệm đủ sáng, thiếu sáng và góc nghiêng.

## 10. Tiêu chí hoàn tất PoC

- Build và unit test PASS.
- Hai thư viện khởi động được camera trên thiết bị thực hoặc lỗi được ghi rõ.
- Bốn samples được thử với cả hai thư viện.
- Bảng kết quả có số liệu thực tế và file evidence.
- Kết luận lựa chọn thư viện dựa trên dữ liệu, không dựa trên giả định.
