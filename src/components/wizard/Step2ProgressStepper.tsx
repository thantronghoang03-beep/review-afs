"use client";

import { useEffect, useState } from "react";
import { CalculatorIcon, SpellCheckIcon, GridIcon, CheckCircleIcon, AlertTriangleIcon } from "@/components/ui/icons";
import type { Check } from "@/types/check";
import type { Finding } from "@/types/finding";

const STAGES = [
  { label: "Kiểm tra số liệu", icon: CalculatorIcon },
  { label: "Kiểm tra chính tả", icon: SpellCheckIcon },
  { label: "Kiểm tra format", icon: GridIcon },
  { label: "Hoàn tất", icon: CheckCircleIcon },
];

// Simulated animation only paces the UI while we wait — the transition to done/error
// is always gated on the real poll response, never on this timer alone.
const STAGE_INTERVAL_MS = 4000;

interface Step2ProgressStepperProps {
  checkId: string;
  onDone: (check: Check, findings: Finding[]) => void;
  onError: (message: string) => void;
}

export function Step2ProgressStepper({ checkId, onDone, onError }: Step2ProgressStepperProps) {
  const [simulatedStage, setSimulatedStage] = useState(0);
  const [elapsedSec, setElapsedSec] = useState(0);

  useEffect(() => {
    const stageTimer = setInterval(() => {
      setSimulatedStage((s) => Math.min(s + 1, STAGES.length - 2));
    }, STAGE_INTERVAL_MS);
    return () => clearInterval(stageTimer);
  }, []);

  useEffect(() => {
    const startedAt = Date.now();
    const clockTimer = setInterval(() => {
      setElapsedSec(Math.round((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => clearInterval(clockTimer);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch(`/api/checks/${checkId}`);
        const data = await res.json();
        if (cancelled) return;

        if (data.check.status === "done") {
          setSimulatedStage(STAGES.length - 1);
          onDone(data.check, data.findings);
        } else if (data.check.status === "error") {
          onError(data.check.errorMessage ?? "Có lỗi xảy ra trong quá trình kiểm tra.");
        } else {
          timeoutId = setTimeout(poll, 2000);
        }
      } catch {
        if (!cancelled) timeoutId = setTimeout(poll, 3000);
      }
    }

    let timeoutId = setTimeout(poll, 500);
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkId]);

  const activeStage = Math.min(simulatedStage, STAGES.length - 1);
  const percent = Math.round(((activeStage + 1) / STAGES.length) * 100);

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-8">
      <h3 className="mb-6 text-sm font-bold text-blue-700">2. QUY TRÌNH KIỂM TRA</h3>

      <div className="mb-8 flex items-center justify-between px-4">
        {STAGES.map((stage, i) => {
          const Icon = stage.icon;
          const isDone = i < activeStage;
          const isActive = i === activeStage;
          return (
            <div key={stage.label} className="flex flex-1 flex-col items-center">
              <div className="flex w-full items-center">
                <div
                  className={`relative mx-auto flex h-14 w-14 items-center justify-center rounded-full ${
                    isDone
                      ? "bg-blue-100 text-blue-600"
                      : isActive
                        ? "bg-blue-600 text-white"
                        : "bg-zinc-100 text-zinc-400"
                  }`}
                >
                  <Icon size={24} />
                  {isDone && (
                    <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-white">
                      <CheckCircleIcon size={12} />
                    </span>
                  )}
                </div>
                {i < STAGES.length - 1 && <div className="h-0.5 flex-1 bg-zinc-200" />}
              </div>
              <span
                className={`mt-2 text-center text-xs font-medium ${
                  isActive || isDone ? "text-zinc-800" : "text-zinc-400"
                }`}
              >
                {stage.label}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-zinc-100">
        <div
          className="h-full rounded-full bg-blue-600 transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-xs text-zinc-400">
        <span>Đang xử lý bằng AI theo Master Prompt v5.0... ({elapsedSec}s)</span>
        <span>{percent}%</span>
      </div>

      <div className="mt-6 flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm text-blue-700">
        <AlertTriangleIcon size={16} className="shrink-0" />
        Vui lòng không đóng trang này trong khi hệ thống đang kiểm tra.
      </div>
    </div>
  );
}
