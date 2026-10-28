"use client";

import { cloneElement, isValidElement, useId, type ReactElement, type ReactNode } from "react";

interface FieldProps {
  label: string;
  description?: string;
  error?: string;
  /** A single form control element (input/select/textarea/custom). When the control is the
   * direct child, its id/aria-describedby are injected automatically — do not set id yourself
   * in that case. If the control is nested inside a wrapper (e.g. a positioned icon overlay),
   * pass `htmlFor` with the id you've set on the actual control instead; auto-injection is
   * skipped so it doesn't land on the wrapper by mistake. */
  htmlFor?: string;
  children: ReactNode;
}

// Shared across raw-HTML form fields that aren't going through a NextUI Input/Select (which
// already link their own label correctly) — found during the UX/accessibility audit that the
// label text was rendered as a plain sibling, never connected to its input via htmlFor/id, so
// a screenreader only ever announced the placeholder, and clicking the label text didn't focus
// the field. One definition, reused everywhere, means one fix covers every form on the site.
export function Field({ label, description, error, htmlFor, children }: FieldProps) {
  const generatedId = useId();
  const id = htmlFor ?? generatedId;
  const descId = description ? `${id}-desc` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [descId, errorId].filter(Boolean).join(" ") || undefined;

  const child = (!htmlFor && isValidElement(children))
    ? cloneElement(children as ReactElement<any>, {
        id,
        "aria-describedby": describedBy,
        "aria-invalid": error ? true : undefined,
      })
    : children;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-semibold text-[#6B7280]">{label}</label>
      {child}
      {description && <p id={descId} className="text-[10px] text-gb-textMuted leading-snug">{description}</p>}
      {error && <p id={errorId} className="text-[10px] text-[#D64550] leading-snug">{error}</p>}
    </div>
  );
}
