# SASMS TV4 — Planned vs Actual W1–W6

Ngày tổng hợp: **2026-10-29**. Ngày dưới đây là ngày commit Git hoặc ngày kiểm
thử thực tế, không phải lịch kế hoạch được suy đoán.

| Tuần | Planned | Actual có bằng chứng | Gap / trạng thái |
|---|---|---|---|
| W1 | PoC hai thư viện QR trên điện thoại | Commit `333797c` ngày 2026-10-18; PoC html5-qrcode/@zxing, sample, manual input và report | Camera/mobile thực tế chưa có evidence; webcam NOT RUN |
| W2 | React + Spring Boot POS skeleton | Commit `84a4558` ngày 2026-09-29; merge `e3a83f8` ngày 2026-10-01 | Chỉ skeleton tại thời điểm đó; tên Module 1 POS là lịch sử, không phải mapping cuối |
| W3 | Inventory QR receiving | Commit `61cbe94` ngày 2026-10-18; Product/PO/Warehouse/ProductUnit/GR, H2 demo, UI/API/tests | Dữ liệu demo và SRS approval vẫn là giới hạn |
| W4 | Fix QR và RC1 Kho | Commit `930c79f` ngày 2026-10-23; image decode, lifecycle/submit guards, đo n=20, regression | p95 dưới 1 giây nhưng max 1380.9 ms; camera NOT RUN; audit còn findings |
| W5 | POS checkout tích hợp Kho | Commit `3798d83` ngày 2026-10-29; PR #5 theo thông tin người dùng; sale/receipt/SOLD/idempotency/concurrency và Chrome demo | DEMO_CASH, giá demo và H2 migration chưa phải production/approved policy |
| W6 | Finalize đúng hai module và hồ sơ quản lý dự án | Audit, regression, live flow mới, 6 ảnh evidence và truy vết FRS thực hiện ngày 2026-10-29 trên nhánh W6 | Chưa commit; FR-06/11/12 chỉ PARTIAL; webcam/UAT/approvals chưa có; không mở rộng chức năng |

## Tiến độ thực tế

- Hai phần demo yêu cầu hiện có source và evidence kiểm thử: Kho và POS.
- Automated regression: backend 20/20; frontend 13/13; build PASS.
- Live W6 integration flow đã đi từ PO → Goods Receipt → POS → receipt → SOLD
  và resale rejection.
- Công việc W6 chủ yếu là kiểm chứng, sửa nhãn nhỏ và hoàn thiện hồ sơ; không có
  module mới.
- Không thể tuyên bố hoàn thành toàn bộ nghiệp vụ SASMS hoặc nghiệm thu khi FRS,
  stakeholder approvals, security remediation và production architecture còn mở.
