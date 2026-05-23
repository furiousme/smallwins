"use client";

import type { ReactNode } from "react";

interface BottomSheetProps {
  title: string;
  children: ReactNode;
  onClose: () => void;
}

export function BottomSheet({ title, children, onClose }: BottomSheetProps) {
  return (
    <div className="sheet-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="bottom-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="sheet-handle" aria-hidden="true" />
        <div className="sheet-heading">
          <h2>{title}</h2>
          <button type="button" onClick={onClose} aria-label="Закрити">
            ×
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}
