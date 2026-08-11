"use client";

import { useState } from "react";
import { FileDropSlot } from "./FileDropSlot";
import { AlertTriangleIcon, BuildingPlusIcon } from "@/components/ui/icons";
import { useCompany } from "@/lib/context/CompanyContext";
import { useAuth } from "@/lib/context/AuthContext";

interface Step1UploadFormProps {
  onSubmit: (formData: FormData) => void;
  submitting: boolean;
  submitError: string | null;
}

export function Step1UploadForm({ onSubmit, submitting, submitError }: Step1UploadFormProps) {
  const { companies, selectedCompanyId, setSelectedCompanyId, createCompany } = useCompany();
  const { user } = useAuth();
  const [showNewCompany, setShowNewCompany] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState("");
  const [creatingCompany, setCreatingCompany] = useState(false);
  const [fiscalYear, setFiscalYear] = useState(String(new Date().getFullYear()));
  const [periodCurrentStart, setPeriodCurrentStart] = useState("");
  const [periodCurrentEnd, setPeriodCurrentEnd] = useState("");
  const [isFirstPeriod, setIsFirstPeriod] = useState(false);
  const [periodPriorStart, setPeriodPriorStart] = useState("");
  const [periodPriorEnd, setPeriodPriorEnd] = useState("");
  const [isDissolution, setIsDissolution] = useState(false);
  const [showErcIrc, setShowErcIrc] = useState(false);

  const [fileVn, setFileVn] = useState<File | null>(null);
  const [fileEn, setFileEn] = useState<File | null>(null);
  const [fileErcLatest, setFileErcLatest] = useState<File | null>(null);
  const [fileErcOriginal, setFileErcOriginal] = useState<File | null>(null);
  const [fileIrcLatest, setFileIrcLatest] = useState<File | null>(null);
  const [fileIrcOriginal, setFileIrcOriginal] = useState<File | null>(null);

  const selectedCompany = companies.find((c) => c.id === selectedCompanyId) ?? null;

  const canSubmit =
    selectedCompany &&
    fiscalYear.trim() &&
    periodCurrentStart &&
    periodCurrentEnd &&
    fileVn &&
    fileEn &&
    (isFirstPeriod || (periodPriorStart && periodPriorEnd)) &&
    !submitting;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || !selectedCompany) return;

    const formData = new FormData();
    formData.set("companyId", selectedCompany.id);
    formData.set("clientName", selectedCompany.name);
    formData.set("createdBy", user?.name ?? "");
    formData.set("fiscalYear", fiscalYear.trim());
    formData.set("periodCurrentStart", periodCurrentStart);
    formData.set("periodCurrentEnd", periodCurrentEnd);
    formData.set("periodPriorStart", isFirstPeriod ? "" : periodPriorStart);
    formData.set("periodPriorEnd", isFirstPeriod ? "" : periodPriorEnd);
    formData.set("isDissolution", isDissolution ? "true" : "false");
    formData.set("fileVn", fileVn as File);
    formData.set("fileEn", fileEn as File);
    if (fileErcLatest) formData.set("fileErcLatest", fileErcLatest);
    if (fileErcOriginal) formData.set("fileErcOriginal", fileErcOriginal);
    if (fileIrcLatest) formData.set("fileIrcLatest", fileIrcLatest);
    if (fileIrcOriginal) formData.set("fileIrcOriginal", fileIrcOriginal);

    onSubmit(formData);
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="rounded-2xl border border-zinc-200 bg-white p-5">
        <h3 className="mb-4 text-sm font-bold text-blue-700">1. CUNG CẤP DỮ LIỆU ĐẦU VÀO</h3>

        <div className="space-y-4">
          <div>
            <div className="mb-3 text-sm font-semibold text-zinc-700">Thông tin chung</div>
            <label className="mb-1 block text-xs text-zinc-500">Khách hàng (công ty)</label>
            <select
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
              value={selectedCompanyId ?? ""}
              onChange={(e) => setSelectedCompanyId(e.target.value || null)}
            >
              <option value="" disabled>
                {companies.length === 0 ? "Chưa có công ty — thêm mới bên dưới" : "Chọn công ty..."}
              </option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            {!showNewCompany ? (
              <button
                type="button"
                onClick={() => setShowNewCompany(true)}
                className="mt-1.5 text-xs font-medium text-blue-600 hover:underline"
              >
                + Thêm công ty mới
              </button>
            ) : (
              <div className="mt-2 flex items-center gap-2">
                <BuildingPlusIcon size={16} className="shrink-0 text-zinc-400" />
                <input
                  autoFocus
                  value={newCompanyName}
                  onChange={(e) => setNewCompanyName(e.target.value)}
                  placeholder="Tên công ty mới..."
                  className="min-w-0 grow rounded-lg border border-zinc-200 px-2 py-1.5 text-sm focus:border-blue-400 focus:outline-none"
                />
                <button
                  type="button"
                  disabled={!newCompanyName.trim() || creatingCompany}
                  onClick={async () => {
                    setCreatingCompany(true);
                    try {
                      await createCompany(newCompanyName.trim());
                      setNewCompanyName("");
                      setShowNewCompany(false);
                    } finally {
                      setCreatingCompany(false);
                    }
                  }}
                  className="shrink-0 rounded-lg bg-blue-600 px-2.5 py-1.5 text-xs font-medium text-white disabled:bg-zinc-300"
                >
                  Tạo
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-zinc-500">Năm tài chính</label>
              <input
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                value={fiscalYear}
                onChange={(e) => setFiscalYear(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs text-zinc-500">Kỳ kế toán năm nay</label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                value={periodCurrentStart}
                onChange={(e) => setPeriodCurrentStart(e.target.value)}
              />
              <span className="text-zinc-400">—</span>
              <input
                type="date"
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                value={periodCurrentEnd}
                onChange={(e) => setPeriodCurrentEnd(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="mb-1 flex items-center gap-2 text-xs text-zinc-500">
              <input
                type="checkbox"
                checked={isFirstPeriod}
                onChange={(e) => setIsFirstPeriod(e.target.checked)}
              />
              Đây là kỳ kiểm toán đầu tiên (không có năm trước — N/A)
            </label>
            {!isFirstPeriod && (
              <>
                <label className="mb-1 mt-2 block text-xs text-zinc-500">Kỳ kế toán năm trước</label>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                    value={periodPriorStart}
                    onChange={(e) => setPeriodPriorStart(e.target.value)}
                  />
                  <span className="text-zinc-400">—</span>
                  <input
                    type="date"
                    className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                    value={periodPriorEnd}
                    onChange={(e) => setPeriodPriorEnd(e.target.value)}
                  />
                </div>
              </>
            )}
          </div>

          <label className="flex items-center gap-2 text-xs text-zinc-500">
            <input
              type="checkbox"
              checked={isDissolution}
              onChange={(e) => setIsDissolution(e.target.checked)}
            />
            Công ty đang giải thể / thanh lý
          </label>
        </div>

        <div className="mt-5">
          <div className="mb-2 flex items-center gap-1 text-sm font-semibold text-zinc-700">
            Tải lên báo cáo tài chính
          </div>
          <div className="space-y-2">
            <FileDropSlot
              label="BCTC - Tiếng Anh (EN)"
              sublabel="Financial Statements (EN)"
              file={fileEn}
              onChange={setFileEn}
              required
            />
            <FileDropSlot
              label="BCTC - Tiếng Việt (VN)"
              sublabel="Báo cáo tài chính (VN)"
              file={fileVn}
              onChange={setFileVn}
              required
            />
          </div>
        </div>

        <div className="mt-4">
          <button
            type="button"
            onClick={() => setShowErcIrc((v) => !v)}
            className="text-xs font-medium text-blue-600 hover:underline"
          >
            {showErcIrc ? "Ẩn" : "+ Thêm"} ERC / IRC (tùy chọn — để đối chiếu mục 9 master prompt)
          </button>
          {showErcIrc && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <FileDropSlot label="ERC (mới nhất)" file={fileErcLatest} onChange={setFileErcLatest} />
              <FileDropSlot label="ERC (bản gốc)" file={fileErcOriginal} onChange={setFileErcOriginal} />
              <FileDropSlot label="IRC (mới nhất)" file={fileIrcLatest} onChange={setFileIrcLatest} />
              <FileDropSlot label="IRC (bản gốc)" file={fileIrcOriginal} onChange={setFileIrcOriginal} />
            </div>
          )}
        </div>

        <p className="mt-3 text-xs text-zinc-400">Định dạng hỗ trợ: PDF. Dung lượng tối đa: 50MB/file.</p>

        {submitError && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertTriangleIcon size={16} className="mt-0.5 shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          className="mt-5 w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-zinc-300"
        >
          {submitting ? "Đang gửi..." : "▶ Bắt đầu kiểm tra"}
        </button>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-5">
        <h3 className="mb-4 text-sm font-bold text-blue-700">2. QUY TRÌNH KIỂM TRA</h3>
        <div className="space-y-3 text-sm text-zinc-600">
          <p>Sau khi bấm &quot;Bắt đầu kiểm tra&quot;, AI sẽ tự động thực hiện review theo quy trình chuẩn JPA Vietvalues (Master Prompt v5.0):</p>
          <ul className="list-inside list-disc space-y-1.5 text-zinc-600">
            <li>Nhận diện loại kỳ kiểm toán (đầu tiên / giai đoạn / bình thường / giải thể)</li>
            <li>Kiểm tra theo 6 bước: bìa → mục lục → các mục → số trang → đối chiếu Thuyết minh hai chiều → tính toán lại</li>
            <li>Đối chiếu VN ↔ EN: chính tả, ngữ pháp, số liệu, format</li>
            <li>Đối chiếu ERC/IRC (nếu có cung cấp)</li>
          </ul>
          <p className="text-zinc-400">Thời gian xử lý tùy theo độ dài báo cáo, thường từ 1-3 phút.</p>
        </div>
      </div>
    </form>
  );
}
