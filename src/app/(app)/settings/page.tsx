export default function SettingsPage() {
  const hasApiKey = Boolean(process.env.ANTHROPIC_API_KEY);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">Cài đặt</h1>
        <p className="text-sm text-zinc-400">Thông tin gói dịch vụ và cấu hình hệ thống</p>
      </div>

      <div className="space-y-4">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <h2 className="mb-3 text-sm font-bold text-zinc-800">Gói dịch vụ</h2>
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-500">Gói hiện tại</span>
            <span className="font-medium text-blue-700">Professional</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-sm">
            <span className="text-zinc-500">Hạn sử dụng</span>
            <span className="font-medium text-zinc-700">31/12/2025</span>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <h2 className="mb-3 text-sm font-bold text-zinc-800">Cấu hình AI</h2>
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-500">Model</span>
            <span className="font-medium text-zinc-700">claude-sonnet-5</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-sm">
            <span className="text-zinc-500">Anthropic API Key</span>
            <span className={`font-medium ${hasApiKey ? "text-green-600" : "text-red-600"}`}>
              {hasApiKey ? "Đã cấu hình" : "Chưa cấu hình"}
            </span>
          </div>
          <p className="mt-3 text-xs text-zinc-400">
            Cấu hình trong file .env.local ở thư mục gốc dự án (biến ANTHROPIC_API_KEY).
          </p>
        </div>
      </div>
    </div>
  );
}
