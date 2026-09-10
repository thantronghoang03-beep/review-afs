"use client";

import { useState } from "react";

// Native <input type="date"> renders its typed/placeholder text according to the
// browser's own OS/UI locale, not the page's `lang` attribute — so it can't be forced
// to dd/mm/yyyy reliably (e.g. it shows mm/dd/yyyy on an en-US Windows machine even
// though the whole app is in Vietnamese). This component is a plain masked text input
// that always displays/accepts dd/mm/yyyy, while still exchanging ISO "yyyy-mm-dd"
// with the rest of the app (form submission, date-string comparisons) so nothing
// downstream needs to change.

function isoToDmy(iso: string): string {
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return "";
  const [, y, m, d] = match;
  return `${d}/${m}/${y}`;
}

function dmyToIso(dmy: string): string | null {
  const match = dmy.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;
  const [, d, m, y] = match;
  const day = Number(d);
  const month = Number(m);
  const year = Number(y);
  if (month < 1 || month > 12 || day < 1 || day > 31 || year < 1) return null;
  return `${y}-${m}-${d}`;
}

function formatAsTyped(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length > 4) return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
  if (digits.length > 2) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return digits;
}

interface DateInputProps {
  value: string; // ISO "yyyy-mm-dd", or "" if empty
  onChange: (isoValue: string) => void;
  className?: string;
}

export function DateInput({ value, onChange, className }: DateInputProps) {
  const [text, setText] = useState(() => isoToDmy(value));
  // Tracks the last `value` we derived `text` from, so we can tell whether the parent
  // changed it externally (e.g. clearing filters) — adjusting state during render per
  // React's guidance, instead of an effect (which would re-render an extra time and
  // trip the project's no-setState-in-effect lint rule).
  const [syncedValue, setSyncedValue] = useState(value);
  if (value !== syncedValue) {
    setSyncedValue(value);
    setText(isoToDmy(value));
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const formatted = formatAsTyped(e.target.value);
    setText(formatted);
    if (formatted === "") {
      onChange("");
      return;
    }
    const iso = dmyToIso(formatted);
    if (iso) onChange(iso);
  }

  return (
    <input
      type="text"
      inputMode="numeric"
      placeholder="dd/mm/yyyy"
      maxLength={10}
      value={text}
      onChange={handleChange}
      className={className}
    />
  );
}
