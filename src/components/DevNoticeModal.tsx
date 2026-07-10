"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type DevNoticeModalProps = {
  message: string;
};

export default function DevNoticeModal({ message }: DevNoticeModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-[300] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[3px]" aria-hidden />

      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="dev-notice-title"
        className="glass-dev-notice-modal pointer-events-auto relative w-full max-w-md"
      >
        <div className="glass-dev-notice-modal-inner">
          <p id="dev-notice-title" className="glass-dev-notice-modal-text">
            {message}
          </p>
        </div>
      </div>
    </div>,
    document.body,
  );
}
