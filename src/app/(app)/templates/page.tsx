import { FileTextIcon } from "@/components/ui/icons";

const TEMPLATES = [
  { name: "Mẫu Báo cáo tài chính đầy đủ (VN/EN)", desc: "Áp dụng cho kỳ kiểm toán bình thường" },
  { name: "Mẫu Note 1.6 & 2.1 — Kỳ đầu tiên", desc: "Tuyên bố so sánh thông tin cho kỳ hoạt động đầu tiên" },
  { name: "Mẫu Note 1.6 — Năm trước là giai đoạn", desc: "Áp dụng khi kỳ trước ngắn hơn 12 tháng" },
  { name: "Checklist kiểm tra trước khi phát hành", desc: "Theo Mục 13 Master Prompt v5.0" },
];

export default function TemplatesPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">Mẫu báo cáo</h1>
        <p className="text-sm text-zinc-400">Các mẫu tham khảo theo chuẩn JPA Vietvalues</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {TEMPLATES.map((t) => (
          <div key={t.name} className="flex items-start gap-3 rounded-2xl border border-zinc-200 bg-white p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <FileTextIcon size={20} />
            </div>
            <div>
              <div className="text-sm font-semibold text-zinc-800">{t.name}</div>
              <div className="text-xs text-zinc-400">{t.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
