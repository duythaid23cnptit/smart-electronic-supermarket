# Hướng dẫn demo W6 trên PC

## 1. Khởi động

Backend:

```powershell
cd D:\smart-electronic-supermarket\backend
.\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=demo"
```

Frontend:

```powershell
cd D:\smart-electronic-supermarket\frontend
npm.cmd run dev -- --host 127.0.0.1
```

- Module 1 Kho: `http://127.0.0.1:5173/inventory.html`
- Module 2 POS: `http://127.0.0.1:5173/`

## 2. Demo Module 1 — Kho

1. Tải `PO-DEMO-APPROVED` và quan sát trạng thái/remaining quantity.
2. Thử `PO-DEMO-DRAFT`: backend phải từ chối nhập.
3. Có thể nhập Serial bằng tay hoặc đọc PNG/JPG cục bộ; không tự mở URL.
4. Serial phải được giữ dạng chuỗi, kể cả số 0 đầu.
5. `GOOD` mới vào tồn khả dụng; `DEFECTIVE` không xuất hiện trong POS.

**Trạng thái DB sau W6:** `PO-DEMO-APPROVED` đã nhận đủ cả TV và PHONE. Không
thể tạo Goods Receipt mới hợp lệ từ PO này. Để lặp lại phần tạo mới, PM/BA/QA
cần chuẩn bị một approved PO mới bằng quy trình dữ liệu được thống nhất. Không
xóa/reset H2 chỉ để làm đẹp demo.

Evidence có thể trình bày thay cho tạo mới:

- W6 Goods Receipt: `GR-e5ccc299-087b-4aa8-844b-a1ba27bbb1cf`.
- Serial: `000020261029W6FLOW01`.
- Replay key: `w6-gr-flow-20261029-01`.

## 3. Demo Module 2 — POS

1. Tải sản phẩm và chọn một unit còn `GOOD + AVAILABLE`.
2. Thêm unit vào giỏ; đối chiếu giá demo do server trả về.
3. Xác nhận `DEMO_CASH` và chụp sale number/receipt.
4. Reload units: Serial đã bán không được xuất hiện.
5. Gửi lại cùng idempotency key: phải trả cùng sale.
6. Gửi key mới cho Serial đã bán: phải HTTP 409.

Evidence W6 đã có:

- Sale: `POS-51430c55-5697-4ae2-996d-415f4a0819dc`.
- Total: VND 5,000,000.
- Payment: `DEMO_CASH` / `DEMO_CONFIRMED`.
- Sau sale, PHONE units trả `[]`; resale trả HTTP 409.

## 4. Checklist trước trình bày

- Chạy `mvnw.cmd clean verify`, `npm.cmd test`, `npm.cmd run build`.
- Không nói webcam PASS; trạng thái là NOT RUN.
- Không nói QR luôn dưới 1 giây; W4 có max 1380.9 ms.
- Không gọi DEMO_CASH là thanh toán thật.
- Chỉ trình bày FR-06/11/12 theo `W6_REQUIREMENTS_TRACEABILITY.md`; cả ba đang
  **PARTIAL**, chưa được PM/BA/QA phê duyệt hoặc UAT.
- Không trình bày VietQR/máy in vật lý như chức năng đã có.
