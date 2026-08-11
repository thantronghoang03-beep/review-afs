import { CheckCircleIcon } from "@/components/ui/icons";

const STEPS = [
  { n: 1, title: "CUNG CẤP DỮ LIỆU", subtitle: "Tải lên báo cáo tài chính" },
  { n: 2, title: "KIỂM TRA", subtitle: "Kiểm tra số liệu, chính tả, format..." },
  { n: 3, title: "KẾT QUẢ", subtitle: "Xuất báo cáo và note lỗi sai" },
];

export function StepHeader({ current }: { current: 1 | 2 | 3 }) {
  return (
    <div className="mb-6 flex items-center rounded-2xl border border-zinc-200 bg-white px-6 py-5">
      {STEPS.map((step, i) => {
        const isActive = step.n === current;
        const isDone = step.n < current;
        return (
          <div key={step.n} className="flex flex-1 items-center">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                  isDone
                    ? "bg-green-500 text-white"
                    : isActive
                      ? "bg-blue-600 text-white"
                      : "bg-zinc-100 text-zinc-400"
                }`}
              >
                {isDone ? <CheckCircleIcon size={20} /> : step.n}
              </div>
              <div>
                <div
                  className={`text-sm font-bold ${isActive || isDone ? "text-zinc-900" : "text-zinc-400"}`}
                >
                  {step.title}
                </div>
                <div className="text-xs text-zinc-400">{step.subtitle}</div>
              </div>
            </div>
            {i < STEPS.length - 1 && <div className="mx-4 h-px flex-1 bg-zinc-200" />}
          </div>
        );
      })}
    </div>
  );
}
