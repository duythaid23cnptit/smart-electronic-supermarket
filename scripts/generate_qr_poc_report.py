from __future__ import annotations

import os
from pathlib import Path
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    Image,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "output" / "pdf" / "Bao_cao_PoC_QR_Scanner.pdf"
SAMPLE_DIR = ROOT / "frontend" / "public" / "qr-samples"


def register_fonts() -> tuple[str, str]:
    windows_fonts = Path(os.environ.get("WINDIR", "C:/Windows")) / "Fonts"
    candidates = [
        (windows_fonts / "arial.ttf", windows_fonts / "arialbd.ttf"),
        (Path("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"), Path("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf")),
    ]
    for regular, bold in candidates:
        if regular.exists() and bold.exists():
            pdfmetrics.registerFont(TTFont("ReportRegular", str(regular)))
            pdfmetrics.registerFont(TTFont("ReportBold", str(bold)))
            return "ReportRegular", "ReportBold"
    raise FileNotFoundError("No Unicode font pair found for the PDF report.")


REGULAR, BOLD = register_fonts()
NAVY = colors.HexColor("#0B1220")
BLUE = colors.HexColor("#0284C7")
CYAN = colors.HexColor("#E0F2FE")
GREEN = colors.HexColor("#15803D")
AMBER = colors.HexColor("#B45309")
SLATE = colors.HexColor("#475569")
LIGHT = colors.HexColor("#F8FAFC")
BORDER = colors.HexColor("#CBD5E1")


styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name="CoverKicker", fontName=BOLD, fontSize=9, textColor=BLUE, leading=12, spaceAfter=8, tracking=1.2))
styles.add(ParagraphStyle(name="CoverTitle", fontName=BOLD, fontSize=27, textColor=NAVY, leading=32, spaceAfter=14))
styles.add(ParagraphStyle(name="CoverSub", fontName=REGULAR, fontSize=11, textColor=SLATE, leading=17, spaceAfter=10))
styles.add(ParagraphStyle(name="H1x", fontName=BOLD, fontSize=17, textColor=NAVY, leading=22, spaceBefore=8, spaceAfter=10))
styles.add(ParagraphStyle(name="H2x", fontName=BOLD, fontSize=12, textColor=BLUE, leading=16, spaceBefore=8, spaceAfter=6))
styles.add(ParagraphStyle(name="Bodyx", fontName=REGULAR, fontSize=9.5, textColor=NAVY, leading=14, spaceAfter=7))
styles.add(ParagraphStyle(name="Smallx", fontName=REGULAR, fontSize=7.5, textColor=SLATE, leading=10))
styles.add(ParagraphStyle(name="TableHead", fontName=BOLD, fontSize=7.2, textColor=colors.white, leading=9, alignment=TA_CENTER))
styles.add(ParagraphStyle(name="TableCell", fontName=REGULAR, fontSize=7.2, textColor=NAVY, leading=9, alignment=TA_LEFT))
styles.add(ParagraphStyle(name="Status", fontName=BOLD, fontSize=9, textColor=AMBER, leading=13, borderColor=colors.HexColor("#F59E0B"), borderWidth=0.6, borderPadding=8, backColor=colors.HexColor("#FFFBEB"), spaceAfter=12))


def paragraph(text: str, style: str = "Bodyx") -> Paragraph:
    return Paragraph(escape(text).replace("\n", "<br/>"), styles[style])


def rich(text: str, style: str = "Bodyx") -> Paragraph:
    return Paragraph(text, styles[style])


def bullet(text: str) -> Paragraph:
    return Paragraph(escape(text), styles["Bodyx"], bulletText="•")


def styled_table(rows, widths, header=True, font_size=7.2):
    converted = []
    for row_index, row in enumerate(rows):
        style_name = "TableHead" if header and row_index == 0 else "TableCell"
        converted.append([Paragraph(escape(str(cell)), styles[style_name]) for cell in row])
    table = Table(converted, colWidths=widths, repeatRows=1 if header else 0, hAlign="LEFT")
    commands = [
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("GRID", (0, 0), (-1, -1), 0.45, BORDER),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]
    if header:
        commands += [("BACKGROUND", (0, 0), (-1, 0), NAVY)]
    for row_index in range(1 if header else 0, len(rows)):
        if row_index % 2 == 0:
            commands.append(("BACKGROUND", (0, row_index), (-1, row_index), LIGHT))
    table.setStyle(TableStyle(commands))
    return table


def draw_page(canvas, document):
    canvas.saveState()
    width, height = A4
    canvas.setStrokeColor(BORDER)
    canvas.setLineWidth(0.5)
    canvas.line(18 * mm, 15 * mm, width - 18 * mm, 15 * mm)
    canvas.setFont(REGULAR, 7.5)
    canvas.setFillColor(SLATE)
    canvas.drawString(18 * mm, 9 * mm, "SASMS - TV4 - QR Scanner PoC")
    canvas.drawRightString(width - 18 * mm, 9 * mm, f"Trang {document.page}")
    canvas.restoreState()


story = []
story += [
    Spacer(1, 18 * mm),
    paragraph("SMART ELECTRONIC SUPERMARKET MANAGEMENT SYSTEM", "CoverKicker"),
    paragraph("BÁO CÁO POC QR SCANNER", "CoverTitle"),
    paragraph("So sánh html5-qrcode và @zxing/browser trên trang React độc lập", "CoverSub"),
    Spacer(1, 7 * mm),
]

meta = [
    ["Thành viên", "Vũ Duy Thái"],
    ["Vai trò", "TV4 - Dev Lead"],
    ["Nhiệm vụ", "W1 - PoC thư viện quét QR trên điện thoại"],
    ["Ngày lập", "18/10/2026"],
    ["Deliverable", "PDF báo cáo và mã PoC"],
]
story.append(styled_table(meta, [42 * mm, 115 * mm], header=False))
story += [Spacer(1, 10 * mm), paragraph("TRẠNG THÁI: Chưa thử camera trên điện thoại. Không có số liệu độ chính xác hoặc thời gian được suy đoán.", "Status")]
story += [paragraph("Phạm vi", "H1x"), paragraph("PoC chỉ kiểm tra khả năng tích hợp hai thư viện QR trong frontend. Không thay đổi backend API, database hoặc nghiệp vụ POS.")]
story.append(PageBreak())

story += [paragraph("1. Mục tiêu", "H1x")]
for item in [
    "Thử quyền camera và camera sau của điện thoại qua HTTPS.",
    "Đọc đúng exact string, gồm số 0 đầu, Unicode và whitespace.",
    "Chặn callback trùng khi một QR nằm lâu trong khung hình.",
    "Hỗ trợ nhập tay để đối chiếu dữ liệu.",
    "Không tự mở URL và không gửi dữ liệu tới backend.",
]:
    story.append(bullet(item))

story += [paragraph("2. Phương pháp", "H1x")]
for index, item in enumerate([
    "Tạo entry page /qr-poc.html tách khỏi POS hiện tại.",
    "Dùng cùng bốn QR samples và cùng duplicate guard cho hai thư viện.",
    "Chạy unit test cho xử lý string, leading zero, URL detection và duplicate guard.",
    "Chạy production build để kiểm tra bundling.",
    "Thử camera trên điện thoại qua HTTPS, ghi thiết bị, browser, ánh sáng, thời gian và evidence.",
    "Chỉ chọn thư viện sau khi có dữ liệu thực nghiệm.",
], start=1):
    story.append(paragraph(f"{index}. {item}"))

story += [paragraph("3. Môi trường đã xác minh", "H1x")]
env_rows = [
    ["Thành phần", "Giá trị", "Trạng thái"],
    ["Node.js", "22.23.1", "VERIFIED"],
    ["npm", "10.9.8", "VERIFIED"],
    ["React", "18.3.1", "CONFIGURED"],
    ["Vite", "5.4.x", "CONFIGURED"],
    ["html5-qrcode", "2.3.8", "CONFIGURED"],
    ["@zxing/browser", "0.1.5", "CONFIGURED"],
    ["Điện thoại / mobile browser", "Chưa ghi", "NOT RUN"],
]
story.append(styled_table(env_rows, [52 * mm, 65 * mm, 40 * mm]))

story += [paragraph("3.1. Kết quả kiểm chứng kỹ thuật", "H2x")]
verification_rows = [
    ["Kiểm tra", "Kết quả", "Ghi chú"],
    ["Unit test QR utilities", "PASS", "3/3 test pass"],
    ["Vite production build", "PASS", "Có cảnh báo chunk PoC > 500 kB"],
    ["HTTPS page smoke test", "PASS", "/qr-poc.html trả HTTP 200"],
    ["npm audit", "ATTENTION", "3 cảnh báo: 1 moderate, 2 high"],
    ["Camera trên điện thoại", "NOT RUN", "Cần thiết bị thật và HTTPS tin cậy"],
]
story.append(styled_table(verification_rows, [55 * mm, 30 * mm, 72 * mm]))

story += [paragraph("4. Kiểm soát dữ liệu và an toàn URL", "H1x")]
for item in [
    "Mọi kết quả được giữ dưới dạng string; không chuyển thành number.",
    "Không trim dữ liệu QR.",
    "Duplicate guard so sánh exact string và chỉ reset theo thao tác người dùng.",
    "URL chỉ tạo cảnh báo; không dùng window.open, redirect hoặc link tự động.",
    "Không gọi backend và không lưu lịch sử quét.",
]:
    story.append(bullet(item))

story += [paragraph("5. QR test samples", "H1x"), paragraph("Các ảnh dưới đây được sinh cục bộ từ chuỗi kỳ vọng, không lấy từ dịch vụ bên ngoài.")]

sample_specs = [
    ("01-leading-zeroes.png", "Leading zeroes", "00001234567890"),
    ("02-sasms-code.png", "SASMS code", "SASMS-TV4-W1-QR-001"),
    ("03-unicode-vietnamese.png", "Unicode", "SASMS|Ghi chú: Kiểm thử QR tiếng Việt"),
    ("04-url-display-only.png", "URL display only", "https://example.com/qr-test?code=000123"),
]
sample_cells = []
for filename, label, expected in sample_specs:
    image = Image(str(SAMPLE_DIR / filename), width=42 * mm, height=42 * mm)
    sample_cells.append([image, Spacer(1, 2 * mm), rich(f"<b>{escape(label)}</b>", "Smallx"), paragraph(expected, "Smallx")])
story.append(Table([sample_cells[:2], sample_cells[2:]], colWidths=[80 * mm, 80 * mm], rowHeights=[64 * mm, 64 * mm], hAlign="LEFT", style=TableStyle([
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("BOX", (0, 0), (-1, -1), 0.45, BORDER),
    ("INNERGRID", (0, 0), (-1, -1), 0.45, BORDER),
    ("LEFTPADDING", (0, 0), (-1, -1), 8),
    ("TOPPADDING", (0, 0), (-1, -1), 8),
])))

story += [Spacer(1, 5 * mm), paragraph("6. Bảng kết quả thực nghiệm", "H1x"), paragraph("Chưa chạy camera trên điện thoại. Các ô đo lường phải giữ nguyên cho tới khi có phép thử thật.", "Status")]
result_rows = [
    ["Library", "Thiết bị / browser", "Ánh sáng", "Exact match", "Thời gian", "Camera", "Status"],
    ["html5-qrcode", "Chưa ghi", "Chưa thử", "Chưa thử", "Chưa đo", "Chưa thử", "NOT RUN"],
    ["@zxing/browser", "Chưa ghi", "Chưa thử", "Chưa thử", "Chưa đo", "Chưa thử", "NOT RUN"],
]
story.append(styled_table(result_rows, [28 * mm, 33 * mm, 23 * mm, 23 * mm, 20 * mm, 22 * mm, 18 * mm]))

story.append(PageBreak())
story += [paragraph("7. So sánh sơ bộ", "H1x"), paragraph("Bảng này chỉ mô tả cấu trúc tích hợp. Không phải kết quả benchmark.")]
comparison_rows = [
    ["Tiêu chí", "html5-qrcode", "@zxing/browser"],
    ["Camera UI", "Reader trong DOM container", "Video element và scanner controls"],
    ["Cấu hình PoC", "QR_CODE, fps, qrbox", "QR reader, callback delays"],
    ["Duplicate handling", "Guard dùng chung", "Guard dùng chung"],
    ["Độ chính xác", "Chưa đo", "Chưa đo"],
    ["Tốc độ", "Chưa đo", "Chưa đo"],
    ["Quyền camera mobile", "Chưa thử", "Chưa thử"],
]
story.append(styled_table(comparison_rows, [44 * mm, 58 * mm, 58 * mm]))

story += [paragraph("8. Kết luận hiện tại", "H1x")]
story.append(paragraph("Hai thư viện đã được tích hợp vào cùng một PoC và dùng chung quy tắc bảo toàn chuỗi, chống callback trùng và không tự mở URL. Chưa có đủ bằng chứng để chọn thư viện tốt hơn. Kết luận cuối cùng bị chặn cho tới khi thử camera thật trên ít nhất một điện thoại qua HTTPS."))

story += [paragraph("9. Ảnh minh chứng cần chụp", "H1x")]
for item in [
    "Trang PoC trên điện thoại với HTTPS URL.",
    "Prompt hoặc lỗi quyền camera.",
    "Leading-zero và Unicode với từng thư viện.",
    "URL được hiển thị kèm cảnh báo không điều hướng.",
    "Duplicate counter.",
    "Điều kiện đủ sáng, thiếu sáng và góc nghiêng.",
]:
    story.append(bullet(item))

story += [paragraph("10. Hướng dẫn kiểm tra trên điện thoại", "H1x")]
for index, item in enumerate([
    "Chạy npm run dev:qr:https và mở https://<PC-LAN-IP>:5173/qr-poc.html.",
    "Nếu chứng thư tự ký không được điện thoại tin cậy, dùng HTTPS tunnel được phê duyệt trỏ tới npm run dev:qr.",
    "Cấp quyền camera, chọn từng thư viện và quét đủ bốn samples.",
    "Ghi số liệu và screenshot ngay sau mỗi phép thử.",
    "Dừng server và tunnel sau khi hoàn tất.",
], start=1):
    story.append(paragraph(f"{index}. {item}"))

story += [Spacer(1, 4 * mm), paragraph("Tiêu chí kết thúc: build/test PASS; hai thư viện được thử trên thiết bị thật; bảng có dữ liệu và evidence; kết luận dựa trên kết quả quan sát.", "Status")]

OUTPUT.parent.mkdir(parents=True, exist_ok=True)
document = SimpleDocTemplate(
    str(OUTPUT),
    pagesize=A4,
    rightMargin=18 * mm,
    leftMargin=18 * mm,
    topMargin=17 * mm,
    bottomMargin=20 * mm,
    title="Báo cáo PoC QR Scanner",
    author="Vũ Duy Thái - TV4 Dev Lead",
    subject="SASMS W1 QR Scanner Library PoC",
)
document.build(story, onFirstPage=draw_page, onLaterPages=draw_page)
print(f"Created {OUTPUT}")
