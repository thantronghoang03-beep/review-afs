"use client";

import { useState } from "react";
import { StepHeader } from "@/components/wizard/StepHeader";
import { Step1UploadForm } from "@/components/wizard/Step1UploadForm";
import { Step2ProgressStepper } from "@/components/wizard/Step2ProgressStepper";
import { Step3Results } from "@/components/wizard/Step3Results";
import type { Check } from "@/types/check";
import type { Finding } from "@/types/finding";
import { useNotifications } from "@/lib/context/NotificationsContext";

type WizardState =
  | { step: 1 }
  | { step: 2; checkId: string }
  | { step: 3; check: Check; findings: Finding[] };

export default function NewCheckPage() {
  const [state, setState] = useState<WizardState>({ step: 1 });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { trackProcessing } = useNotifications();

  async function handleSubmit(formData: FormData) {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/checks", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error ?? "Có lỗi xảy ra khi tạo kiểm tra.");
        return;
      }
      trackProcessing(data.checkId, String(formData.get("clientName") ?? "Kiểm tra mới"));
      setState({ step: 2, checkId: data.checkId });
    } catch {
      setSubmitError("Không thể kết nối tới server. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">Check báo cáo kiểm toán</h1>
        <p className="text-sm text-zinc-400">Tải lên báo cáo tài chính và thực hiện kiểm tra</p>
      </div>

      <StepHeader current={state.step} />

      {state.step === 1 && (
        <Step1UploadForm onSubmit={handleSubmit} submitting={submitting} submitError={submitError} />
      )}

      {state.step === 2 && (
        <Step2ProgressStepper
          checkId={state.checkId}
          onDone={(check, findings) => setState({ step: 3, check, findings })}
          onError={(message) => {
            setSubmitError(message);
            setState({ step: 1 });
          }}
        />
      )}

      {state.step === 3 && <Step3Results check={state.check} findings={state.findings} />}
    </div>
  );
}
