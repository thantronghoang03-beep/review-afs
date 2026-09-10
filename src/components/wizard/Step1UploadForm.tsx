"use client";

import { useState } from "react";
import { FileDropSlot } from "./FileDropSlot";
import { DateInput } from "@/components/ui/DateInput";
import { PreviousChecksPanel } from "./PreviousChecksPanel";
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
  // v6.1 — Mục 9A (hồ sơ pháp lý mở rộng), tùy chọn: bỏ trống → model tự bỏ qua đúng
  // như prompt mô tả. Mục 15 (đối chiếu phiên bản liền kề) không cần upload thủ công
  // nữa — server tự lấy bản báo cáo gần nhất trước đó đã tải lên cho cùng công ty này.
  const [filesLegalDossier, setFilesLegalDossier] = useState<File[]>([]);
  const [showExtraInputs, setShowExtraInputs] = useState(false);
  // Per master prompt §"Logic xử lý ghi chú ERC/IRC": N/A → no warning needed;
  // "changed" without an original to compare against → AI must record a Warning.
  const [ircChanged, setIrcChanged] = useState<"na" | "yes">("na");
  const [ercChanged, setErcChanged] = useState<"na" | "yes">("na");
  // Người dùng chọn chạy tác vụ nào — phải chọn ít nhất 1 trong 2.
  const [runAuditReview, setRunAuditReview] = useState(true);
  const [runRiskAnalysis, setRunRiskAnalysis] = useState(false);

  const selectedCompany = companies.find((c) => c.id === selectedCompanyId) ?? null;

  const canSubmit =
    selectedCompany &&
    periodCurrentStart &&
    periodCurrentEnd &&
    fileVn &&
    fileEn &&
    (isFirstPeriod || (periodPriorStart && periodPriorEnd)) &&
    (runAuditReview || runRiskAnalysis) &&
    !submitting;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || !selectedCompany) return;

    const formData = new FormData();
    formData.set("companyId", selectedCompany.id);
    formData.set("clientName", selectedCompany.name);
    formData.set("createdBy", user?.name ?? "");
    // Năm tài chính không còn nhập tay — lấy theo năm kết thúc kỳ kế toán năm nay.
    formData.set("fiscalYear", periodCurrentEnd.slice(0, 4));
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
    formData.set("ercChanged", fileErcLatest ? ercChanged : "na");
    formData.set("ircChanged", fileIrcLatest ? ircChanged : "na");
    formData.set("runAuditReview", runAuditReview ? "true" : "false");
    formData.set("runRiskAnalysis", runRiskAnalysis ? "true" : "false");
    filesLegalDossier.forEach((f) => formData.append("fileLegalDossier", f));

    onSubmit(formData);
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="rounded-2xl border border-zinc-200 bg-white p-5">
        <h3 className="mb-4 text-sm font-bold text-jpa-700">1. CUNG CẤP DỮ LIỆU ĐẦU VÀO</h3>

        <div className="space-y-4">
          <div>
            <div className="mb-3 text-sm font-semibold text-zinc-700">Thông tin chung</div>
            <label className="mb-1 block text-xs text-zinc-500">Khách hàng (công ty)</label>
            <select
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-jpa-400 focus:outline-none"
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
                className="mt-1.5 text-xs font-medium text-jpa-600 hover:underline"
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
                  className="min-w-0 grow rounded-lg border border-zinc-200 px-2 py-1.5 text-sm focus:border-jpa-400 focus:outline-none"
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
                  className="shrink-0 rounded-lg bg-jpa-600 px-2.5 py-1.5 text-xs font-medium text-white disabled:bg-zinc-300"
                >
                  Tạo
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="mb-1 block text-xs text-zinc-500">Kỳ kế toán năm nay</label>
            <div className="flex items-center gap-2">
              <DateInput
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-jpa-400 focus:outline-none"
                value={periodCurrentStart}
                onChange={setPeriodCurrentStart}
              />
              <span className="text-zinc-400">—</span>
              <DateInput
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-jpa-400 focus:outline-none"
                value={periodCurrentEnd}
                onChange={setPeriodCurrentEnd}
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
                  <DateInput
                    className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-jpa-400 focus:outline-none"
                    value={periodPriorStart}
                    onChange={setPeriodPriorStart}
                  />
                  <span className="text-zinc-400">—</span>
                  <DateInput
                    className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-jpa-400 focus:outline-none"
                    value={periodPriorEnd}
                    onChange={setPeriodPriorEnd}
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
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
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
            className="text-xs font-medium text-jpa-600 hover:underline"
          >
            {showErcIrc ? "Ẩn" : "+ Thêm"} ERC / IRC (tùy chọn — để đối chiếu mục 9 master prompt)
          </button>
          {showErcIrc && (
            <div className="mt-3 space-y-4">
              <div>
                <FileDropSlot label="IRC (mới nhất)" file={fileIrcLatest} onChange={setFileIrcLatest} />
                {fileIrcLatest && (
                  <div className="mt-2 pl-1">
                    <label className="mb-1 block text-xs text-zinc-500">
                      IRC có thay đổi so với bản gốc không?
                    </label>
                    <div className="flex gap-3 text-xs text-zinc-600">
                      <label className="flex items-center gap-1.5">
                        <input
                          type="radio"
                          name="ircChanged"
                          checked={ircChanged === "na"}
                          onChange={() => setIrcChanged("na")}
                        />
                        Không (N/A)
                      </label>
                      <label className="flex items-center gap-1.5">
                        <input
                          type="radio"
                          name="ircChanged"
                          checked={ircChanged === "yes"}
                          onChange={() => setIrcChanged("yes")}
                        />
                        Có thay đổi
                      </label>
                    </div>
                    {ircChanged === "yes" && (
                      <div className="mt-2">
                        <FileDropSlot label="IRC (bản gốc)" file={fileIrcOriginal} onChange={setFileIrcOriginal} />
                        {!fileIrcOriginal && (
                          <p className="mt-1 text-xs text-orange-600">
                            Chưa upload bản gốc — AI sẽ ghi Warning &quot;chưa xác minh được so với bản gốc&quot;.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <FileDropSlot label="ERC (mới nhất)" file={fileErcLatest} onChange={setFileErcLatest} />
                {fileErcLatest && (
                  <div className="mt-2 pl-1">
                    <label className="mb-1 block text-xs text-zinc-500">
                      ERC có thay đổi so với bản gốc không?
                    </label>
                    <div className="flex gap-3 text-xs text-zinc-600">
                      <label className="flex items-center gap-1.5">
                        <input
                          type="radio"
                          name="ercChanged"
                          checked={ercChanged === "na"}
                          onChange={() => setErcChanged("na")}
                        />
                        Không (N/A)
                      </label>
                      <label className="flex items-center gap-1.5">
                        <input
                          type="radio"
                          name="ercChanged"
                          checked={ercChanged === "yes"}
                          onChange={() => setErcChanged("yes")}
                        />
                        Có thay đổi
                      </label>
                    </div>
                    {ercChanged === "yes" && (
                      <div className="mt-2">
                        <FileDropSlot label="ERC (bản gốc)" file={fileErcOriginal} onChange={setFileErcOriginal} />
                        {!fileErcOriginal && (
                          <p className="mt-1 text-xs text-orange-600">
                            Chưa upload bản gốc — AI sẽ ghi Warning &quot;chưa xác minh được so với bản gốc&quot;.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="mt-4">
          <button
            type="button"
            onClick={() => setShowExtraInputs((v) => !v)}
            className="text-xs font-medium text-jpa-600 hover:underline"
          >
            {showExtraInputs ? "Ẩn" : "+ Thêm"} Hồ sơ pháp lý mở rộng (tùy chọn — Mục 9A master prompt v6.1)
          </button>
          {showExtraInputs && (
            <div className="mt-3 space-y-4">
              <div>
                <div className="mb-1.5 text-xs text-zinc-500">
                  Hồ sơ pháp lý mở rộng (giấy phép con, quyết định ưu đãi thuế, hợp đồng thuê đất...) — có thể
                  chọn nhiều file, bỏ trống nếu không có
                </div>
                <label className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50/50 px-3 py-5 text-center hover:border-jpa-300 hover:bg-jpa-50/30">
                  <span className="text-sm font-medium text-zinc-700">+ Chọn file hồ sơ pháp lý</span>
                  <input
                    type="file"
                    accept="application/pdf"
                    multiple
                    className="hidden"
                    onChange={(e) => setFilesLegalDossier(Array.from(e.target.files ?? []))}
                  />
                </label>
                {filesLegalDossier.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {filesLegalDossier.map((f, i) => (
                      <li
                        key={`${f.name}-${i}`}
                        className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-600"
                      >
                        <span className="truncate">{f.name}</span>
                        <button
                          type="button"
                          onClick={() => setFilesLegalDossier((prev) => prev.filter((_, idx) => idx !== i))}
                          className="ml-2 shrink-0 text-zinc-400 hover:text-red-500"
                          aria-label={`Xóa ${f.name}`}
                        >
                          ✕
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>

        <p className="mt-3 text-xs text-zinc-400">Định dạng hỗ trợ: PDF. Dung lượng tối đa: 50MB/file.</p>

        <div className="mt-4 space-y-2 rounded-xl border border-zinc-200 bg-zinc-50/60 p-3">
          <div className="mb-1 text-xs font-semibold text-zinc-700">Chọn loại kiểm tra (chọn ít nhất 1)</div>
          <label className="flex items-center gap-2 text-sm text-zinc-700">
            <input
              type="checkbox"
              checked={runAuditReview}
              onChange={(e) => setRunAuditReview(e.target.checked)}
            />
            Kiểm tra báo cáo kiểm toán
          </label>
          <label className="flex items-center gap-2 text-sm text-zinc-700">
            <input
              type="checkbox"
              checked={runRiskAnalysis}
              onChange={(e) => setRunRiskAnalysis(e.target.checked)}
            />
            Phân tích rủi ro báo cáo tài chính
          </label>
          {!runAuditReview && !runRiskAnalysis && (
            <p className="text-xs text-red-600">Chưa chọn loại kiểm tra nào.</p>
          )}
        </div>

        {submitError && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertTriangleIcon size={16} className="mt-0.5 shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          className="mt-5 w-full rounded-lg bg-jpa-teal py-2.5 text-sm font-semibold text-white transition-colors hover:bg-jpa-teal/90 disabled:cursor-not-allowed disabled:bg-zinc-300"
        >
          {submitting ? "Đang gửi..." : "▶ Bắt đầu kiểm tra"}
        </button>
      </div>

      <div className="flex flex-col gap-6">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <h3 className="mb-4 text-sm font-bold text-jpa-700">2. QUY TRÌNH KIỂM TRA</h3>
          <div className="space-y-3 text-sm text-zinc-600">
            {runAuditReview && (
              <>
                <p>
                  <strong>Kiểm tra báo cáo kiểm toán</strong> — AI tự động review theo quy trình chuẩn JPA
                  Vietvalues (Master Prompt v6.1):
                </p>
                <ul className="list-inside list-disc space-y-1.5 text-zinc-600">
                  <li>Nhận diện loại kỳ kiểm toán (đầu tiên / giai đoạn / bình thường / giải thể)</li>
                  <li>Kiểm tra theo 6 bước: bìa → mục lục → các mục → số trang → đối chiếu Thuyết minh hai chiều → tính toán lại</li>
                  <li>Đối chiếu VN ↔ EN: chính tả, ngữ pháp, số liệu, format, thuật ngữ chuẩn JPA</li>
                  <li>Đối chiếu ERC/IRC và hồ sơ pháp lý mở rộng (nếu có cung cấp)</li>
                  <li>Tra cứu online hiệu lực Luật/Nghị định/Thông tư được trích dẫn</li>
                  <li>Tự động đối chiếu với báo cáo gần nhất đã tải lên trước đó cho cùng công ty này (nếu có)</li>
                </ul>
              </>
            )}
            {runRiskAnalysis && (
              <p>
                <strong>Phân tích rủi ro báo cáo tài chính</strong> — AI tính các tỷ số tài chính (thanh khoản,
                đòn bẩy, khả năng sinh lời, hiệu quả hoạt động) so sánh năm nay/năm trước, và nêu cảnh báo rủi
                ro dựa trên số liệu.
              </p>
            )}
            {!runAuditReview && !runRiskAnalysis && (
              <p className="text-zinc-400">Chọn ít nhất 1 loại kiểm tra bên trái để xem mô tả quy trình.</p>
            )}
            <p className="text-zinc-400">Thời gian xử lý tùy theo độ dài báo cáo, thường từ 1-3 phút.</p>
          </div>
        </div>

        {selectedCompany && (
          <PreviousChecksPanel companyId={selectedCompany.id} companyName={selectedCompany.name} />
        )}
      </div>
    </form>
  );
}
