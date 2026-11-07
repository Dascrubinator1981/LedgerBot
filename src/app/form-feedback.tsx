"use client";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
export function FormFeedback({
  form,
  message,
}: {
  form: HTMLFormElement | null;
  message: string;
}) {
  const feedback = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (form && message) {
      feedback.current?.focus();
      feedback.current?.scrollIntoView?.({
        block: "nearest",
        behavior: "smooth",
      });
    }
  }, [form, message]);
  return form?.isConnected && message
    ? createPortal(
        <p ref={feedback} tabIndex={-1} className="notice error" role="alert">
          {message}
        </p>,
        form,
      )
    : null;
}
