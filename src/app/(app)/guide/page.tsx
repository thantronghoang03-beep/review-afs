const STEPS = [
  {
    title: "1. Chuẩn bị dữ liệu",
    desc: "Chuẩn bị bản BCTC Tiếng Việt và Tiếng Anh (PDF). Nếu cần đối chiếu ERC/IRC, chuẩn bị thêm bản mới nhất (và bản gốc nếu có thay đổi).",
  },
  {
    title: "2. Tạo kiểm tra mới",
    desc: "Vào mục \"Tạo kiểm tra mới\", điền thông tin khách hàng, kỳ kế toán năm nay/năm trước, tải lên các file PDF, rồi bấm \"Bắt đầu kiểm tra\".",
  },
  {
    title: "3. Chờ AI xử lý",
    desc: "Hệ thống trích xuất nội dung PDF và gửi cho AI review theo đúng Master Prompt v5.0 của JPA Vietvalues — kiểm tra số liệu, chính tả, format và đối chiếu VN/EN.",
  },
  {
    title: "4. Xem kết quả",
    desc: "Xem thống kê lỗi theo mức độ, phân loại lỗi theo biểu đồ, bảng chi tiết có thể lọc theo trạng thái (Match/Difference/Warning/Missing in EN/Cần bổ sung).",
  },
  {
    title: "5. Xuất báo cáo",
    desc: "Xuất báo cáo lỗi dạng PDF hoặc file chi tiết Excel để gửi cho nhóm kiểm toán xử lý.",
  },
];

export default function GuidePage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">Hướng dẫn sử dụng</h1>
        <p className="text-sm text-zinc-400">Quy trình sử dụng Review AFS để kiểm tra báo cáo kiểm toán</p>
      </div>

      <div className="space-y-4">
        {STEPS.map((s) => (
          <div key={s.title} className="rounded-2xl border border-zinc-200 bg-white p-5">
            <div className="text-sm font-bold text-blue-700">{s.title}</div>
            <p className="mt-1 text-sm text-zinc-600">{s.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
