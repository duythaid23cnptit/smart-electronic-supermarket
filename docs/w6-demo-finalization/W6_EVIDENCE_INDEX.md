# W6 Evidence Index

Ngày ghi nhận: **2026-10-29**. Không có kết quả nào được backdate.

| Evidence ID | Bằng chứng | Nguồn / định danh |
|---|---|---|
| EV-GIT-01 | Nhánh W6 tại W5 commit | `git branch -vv`, `git log`; HEAD `3798d83` |
| EV-BE-01 | Backend 20/20 PASS | `backend\\mvnw.cmd clean verify`; 0 failure/error/skip |
| EV-FE-01 | Frontend 13/13 PASS | `npm.cmd test` |
| EV-FE-02 | Vite build PASS | `npm.cmd run build`; 355 modules |
| EV-SEC-01 | npm audit findings | 3 high, 1 moderate; exit 1 |
| EV-INV-01 | DRAFT bị chặn | Live POST; HTTP 409 |
| EV-INV-02 | Over-limit bị chặn | Live POST trước/sau flow; HTTP 409 |
| EV-INV-03 | Serial trùng bị chặn | `000020261029W5GOOD`; HTTP 409 |
| EV-INV-04 | Goods Receipt W6 | `GR-e5ccc299-087b-4aa8-844b-a1ba27bbb1cf` |
| EV-INV-05 | Inventory idempotency | Same GR; first HTTP 201, replay HTTP 200 |
| EV-POS-01 | Leading-zero unit in POS | `000020261029W6FLOW01`, GOOD, AVAILABLE |
| EV-POS-02 | Sale W6 | `POS-51430c55-5697-4ae2-996d-415f4a0819dc`; VND 5,000,000 |
| EV-POS-03 | Receipt | GET sale HTTP 200; `DEMO_CASH`, `DEMO_CONFIRMED` |
| EV-POS-04 | SOLD effect | PHONE units endpoint returned `[]` after sale |
| EV-POS-05 | Sale idempotency | Same sale; first HTTP 201, replay HTTP 200 |
| EV-POS-06 | Resale prevention | New key for W6 serial returned HTTP 409 |
| EV-QR-01 | W4 image benchmark | `docs/inventory-qr/W4_PERF_MEASUREMENTS.csv`; n=20, p95 29.1 ms, max 1380.9 ms |
| EV-UI-01 | Module labels | Source, successful Vite build and W6 screenshots `EV-W6-IMG-01/02` |
| EV-REQ-01 | Huy FRS available | `docs/ba-input/FRS_V2 (1)).docx`; revision 2, last modified by Huy Nguyễn on 2026-10-25; trace in `W6_REQUIREMENTS_TRACEABILITY.md` |

## Ảnh kiểm thử W5 tái sử dụng trong hồ sơ W6

Bốn file dưới đây là **ảnh chụp trong đợt kiểm thử W5**, được lưu lại và tái sử
dụng làm evidence tham chiếu trong bộ hồ sơ W6. Chúng không phải ảnh chụp lại
sau các sửa nhãn W6, không thay thế evidence live API W6 và không phải UAT.

| Evidence ID | File | Nội dung nhìn thấy và phạm vi chứng minh |
|---|---|---|
| EV-W5-IMG-01 | [W5_01_POS_Receipt.png](evidence/W5_01_POS_Receipt.png) | Màn hình biên nhận demo hiển thị sale `POS-1c4b42f3-d75d-4fe9-9a28-1bc3d9907a2c`, Serial `000020261029POS02`, tổng 15.000.000 đ và trạng thái `DEMO_CONFIRMED`. Chứng minh UI W5 đã hiển thị receipt sau checkout; ảnh không tự chứng minh backend GET hoặc trạng thái cột `SOLD`. Phần Serial/IMEI bên dưới còn mô tả skeleton Tuần 2, đúng với thời điểm chụp W5 trước khi UI được cập nhật. |
| EV-W5-IMG-02 | [W5_02_POS_Cart.png](evidence/W5_02_POS_Cart.png) | Giỏ POS W5 chứa Smart TV 55 inch Demo, Serial `000020261029POS02`, tạm tính 15.000.000 đ và nút xác nhận thanh toán tiền mặt mô phỏng. Chứng minh trạng thái trước checkout và giá hiển thị từ backend. Header còn ghi `Module 1 — POS`, nên đây không phải ảnh UI W6 sau sửa mapping Module 1/2. |
| EV-W5-IMG-03 | [W5_03_Inventory_Receipt.png](evidence/W5_03_Inventory_Receipt.png) | Kho hiển thị Serial `000020261029POS02`, SKU `TV-55-DEMO`, condition `GOOD`, Goods Receipt `GR-7e86369d-5658-4dcd-84af-fed3e0318efb`, khả dụng 1, hàng lỗi 0, replay `NO` và `API_REQUEST_MS: 152.0 ms`. `CAMERA_SCAN_LATENCY` và `IMAGE_FILE_DECODE` đều `NOT RUN`; ảnh không chứng minh webcam hoặc decode QR. |
| EV-W5-IMG-04 | [W5_04_Inventory_Interface.png](evidence/W5_04_Inventory_Interface.png) | Giao diện Kho W5 có PO `PO-DEMO-APPROVED`, vùng camera/file/manual input, chuỗi số 0 đầu `00001234567890` và condition `GOOD`. Scanner ở `IDLE`; cả camera, image decode và API request đều `NOT RUN`. Chứng minh giao diện và khả năng nhập chuỗi leading-zero, không chứng minh đã quét camera, giải mã ảnh hay tạo receipt. |

Thông tin kiểm tra file ngày 2026-10-29:

- `W5_01_POS_Receipt.png`: 1348×800, 61.934 bytes, SHA-256
  `E00D3DC141388A6FEC61AF120849D11E20096A9C91293DFDD9E27659E835150C`.
- `W5_02_POS_Cart.png`: 1252×797, 75.852 bytes, SHA-256
  `C5160E0F00800FAABEFEF07A33C903D9722CB0381E5B0BA6EB0DF384D619FAFE`.
- `W5_03_Inventory_Receipt.png`: 1052×717, 60.949 bytes, SHA-256
  `366DA6163371F4015F0AA418D3E12B3314BDE17389EBE2D3BE87139557B0ACBE`.
- `W5_04_Inventory_Interface.png`: 1117×852, 130.929 bytes, SHA-256
  `325393AC489EF533D13F165EF75773642480387B3407D3C1208D52827A34C4AB`.

## Ảnh giao diện W6

Hai file sau là **ảnh giao diện được chụp ở W6**. Chúng được tách khỏi bốn ảnh
kiểm thử W5 ở trên và chỉ chứng minh những nội dung nhìn thấy trong từng khung
hình.

| Evidence ID | File | Nội dung nhìn thấy và phạm vi chứng minh |
|---|---|---|
| EV-W6-IMG-01 | [W6_01_Inventory_Interface.png](evidence/W6_01_Inventory_Interface.png) | Giao diện Kho hiển thị đúng tiêu đề `Module 1 — Kho QR Code & Serial/IMEI`, kicker `SASMS · MODULE 1 · W6 DEMO`, PO `PO-DEMO-APPROVED` và vùng camera/file QR. Các chỉ số `CAMERA_SCAN_LATENCY`, `IMAGE_FILE_DECODE` và `API_REQUEST_MS` đều là `NOT RUN`; ảnh không chứng minh camera, decode ảnh, API nhận kho hoặc mục tiêu hiệu năng. Chuỗi `TV4 · W6 · DESKTOP DEMO` không xuất hiện trong khung ảnh này. |
| EV-W6-IMG-02 | [W6_02_POS_Interface.png](evidence/W6_02_POS_Interface.png) | Giao diện POS hiển thị đúng tiêu đề `Module 2 — POS bán hàng tại quầy`, kicker trang `SASMS · MODULE 2 · W6 DEMO` và nhãn `TV4 · W6 · DESKTOP DEMO`. Ảnh cho thấy trạng thái giỏ rỗng trước giao dịch; không chứng minh checkout, receipt, `SOLD`, idempotency hoặc thanh toán thực. |

Thông tin đo trực tiếp từ file ngày 2026-10-29:

- `W6_01_Inventory_Interface.png`: 1896×865, 266.881 bytes, SHA-256
  `D6C6C475589B4D418C80AAFDA2E655D33E5DA30230154FC3CD5A267691E22145`.
- `W6_02_POS_Interface.png`: 1170×832, 68.684 bytes, SHA-256
  `EC8151C7721A4B9EAA932EBC8626F4B2E6E936284AF8EA4A86B837B8ED404650`.

## Evidence chưa có

- Webcam/video evidence: **NOT RUN**.
- QR dưới 1 giây ổn định: **NOT ACHIEVED**; ảnh không thay đổi kết luận W4.
- UAT/biên bản nghiệm thu: **NOT PROVIDED / NOT PASS CLAIMED**.
- PM/BA/Architect/QA approval signatures: **NOT PROVIDED**.
- Direct production-like database migration evidence: **NOT RUN**.

API responses were observed in the terminal during the W6 regression run. This
index records their identifiers and statuses. The four W5 images and two W6
images support only the facts explicitly described; they do not establish
webcam results, latency acceptance, UAT or external approval.
