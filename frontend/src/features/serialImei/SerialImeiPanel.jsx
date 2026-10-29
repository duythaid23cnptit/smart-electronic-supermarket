export default function SerialImeiPanel() {
  return (
    <section>
      <div className="section-heading">
        <div>
          <p className="eyebrow">W5 · KẾT NỐI MODULE KHO</p>
          <h2>Serial / IMEI trong luồng POS</h2>
        </div>
      </div>

      <p>
        POS đọc ProductUnit thật từ Module 1 — Kho QR/Serial-IMEI. Chỉ thiết bị
        GOOD và AVAILABLE được chọn; checkout thành công chuyển đúng thiết bị
        sang SOLD trong cùng transaction và giữ nguyên chuỗi Serial/IMEI.
      </p>
      <p>
        Thanh toán hiện là DEMO_CASH. Các quy tắc giữ hàng, hoàn/đổi và vòng đời
        sau bán vẫn cần đặc tả được BA/PM/Architect phê duyệt.
      </p>
    </section>
  )
}
