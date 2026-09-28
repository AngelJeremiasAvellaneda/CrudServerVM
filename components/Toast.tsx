"use client";

import { useEffect, useState } from "react";
import { CheckCircle, XCircle, AlertCircle, X } from "lucide-react";

export type ToastType = "success" | "error" | "warning";

export interface ToastData {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastProps {
  toast: ToastData;
  onRemove: (id: number) => void;
}

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
};

const styles = {
  success: {
    bg: "#f0fdf4",
    border: "#86efac",
    color: "#166534",
    iconColor: "#16a34a",
  },
  error: {
    bg: "#fef2f2",
    border: "#fca5a5",
    color: "#991b1b",
    iconColor: "#dc2626",
  },
  warning: {
    bg: "#fffbeb",
    border: "#fcd34d",
    color: "#92400e",
    iconColor: "#d97706",
  },
};

export function Toast({ toast, onRemove }: ToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Entrada
    const t1 = setTimeout(() => setVisible(true), 10);
    // Salida
    const t2 = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onRemove(toast.id), 300);
    }, 3700);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [toast.id, onRemove]);

  const Icon = icons[toast.type];
  const s = styles[toast.type];

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        padding: "0.875rem 1rem",
        background: s.bg,
        border: `1px solid ${s.border}`,
        borderRadius: "10px",
        boxShadow: "0 4px 16px rgba(0,0,0,0.10)",
        color: s.color,
        fontSize: "0.9rem",
        fontWeight: 500,
        minWidth: "280px",
        maxWidth: "380px",
        transform: visible ? "translateX(0)" : "translateX(110%)",
        opacity: visible ? 1 : 0,
        transition: "transform 0.3s ease, opacity 0.3s ease",
        pointerEvents: "auto",
      }}
    >
      <Icon size={20} color={s.iconColor} strokeWidth={2} />
      <span style={{ flex: 1 }}>{toast.message}</span>
      <button
        onClick={() => onRemove(toast.id)}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "2px",
          display: "flex",
          color: s.color,
          opacity: 0.6,
        }}
      >
        <X size={16} />
      </button>
    </div>
  );
}

interface ToastContainerProps {
  toasts: ToastData[];
  onRemove: (id: number) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div
      style={{
        position: "fixed",
        top: "1.25rem",
        right: "1.25rem",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
        pointerEvents: "none",
      }}
    >
      {toasts.map((t) => (
        <Toast key={t.id} toast={t} onRemove={onRemove} />
      ))}
    </div>
  );
}
