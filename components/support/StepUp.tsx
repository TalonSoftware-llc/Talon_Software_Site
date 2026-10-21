"use client";

import { FormEvent } from "react";

export function StepUp({
  title,
  detail,
  onConfirm,
  onCancel,
}: {
  title: string;
  detail: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  function confirm(event: FormEvent) {
    event.preventDefault();
    onConfirm();
  }

  return (
    <form onSubmit={confirm} autoComplete="off" className="rounded-xl border border-[#e1e6ec] bg-white p-4">
      <p className="text-sm font-semibold text-ink">{title}</p>
      <p className="mt-1 text-sm text-ink/70">{detail}</p>
      <div className="mt-3 flex gap-2" aria-hidden="true">
        {["a", "b", "c", "d", "e", "f"].map((slot) => (
          <input key={slot} inputMode="numeric" maxLength={1} autoComplete="off" className="h-11 w-10 rounded-md border border-[#d5dde6] text-center" aria-label="Code box" />
        ))}
      </div>
      <p className="mt-2 text-xs text-ink/50">This preview does not read or store the code.</p>
      <div className="mt-4 flex gap-2">
        <button type="submit" className="rounded-md bg-pine px-3 py-2 text-sm font-semibold text-white">
          Confirm
        </button>
        <button type="button" className="rounded-md border border-[#d5dde6] px-3 py-2 text-sm font-semibold" onClick={onCancel}>
          Back
        </button>
      </div>
    </form>
  );
}
