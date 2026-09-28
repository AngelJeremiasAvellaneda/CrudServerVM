"use client";

import { useEffect, useState, useCallback } from "react";
import { Database, RefreshCw, Wifi, WifiOff } from "lucide-react";

type Status = "checking" | "connected" | "disconnected";

export function StatusBadge() {
  const [status, setStatus] = useState<Status>("checking");
  const [lastChecked, setLastChecked] = useState<string>("");

  const checkStatus = useCallback(async () => {
    setStatus("checking");
    try {
      const res = await fetch("/api/status", { cache: "no-store" });
      const data = await res.json();
      setStatus(data.connected ? "connected" : "disconnected");
    } catch {
      setStatus("disconnected");
    }
    setLastChecked(new Date().toLocaleTimeString("es-MX"));
  }, []);

  useEffect(() => {
    checkStatus();
    // Re-verifica cada 30 segundos
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, [checkStatus]);

  const config = {
    checking: {
      bg: "#f1f5f9",
      border: "#cbd5e1",
      color: "#475569",
      icon: <RefreshCw size={14} strokeWidth={2} style={{ animation: "spin 1s linear infinite" }} />,
      label: "Verificando...",
    },
    connected: {
      bg: "#f0fdf4",
      border: "#86efac",
      color: "#166534",
      icon: <Wifi size={14} strokeWidth={2} />,
      label: "Base de datos conectada",
    },
    disconnected: {
      bg: "#fef2f2",
      border: "#fca5a5",
      color: "#991b1b",
      icon: <WifiOff size={14} strokeWidth={2} />,
      label: "Sin conexión a la base de datos",
    },
  };

  const c = config[status];

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.4rem",
          padding: "0.35rem 0.85rem",
          background: c.bg,
          border: `1px solid ${c.border}`,
          borderRadius: "999px",
          color: c.color,
          fontSize: "0.8rem",
          fontWeight: 600,
        }}
      >
        {c.icon}
        <Database size={13} strokeWidth={2} />
        {c.label}
      </div>

      {lastChecked && status !== "checking" && (
        <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
          Última verificación: {lastChecked}
        </span>
      )}

      {status !== "checking" && (
        <button
          onClick={checkStatus}
          title="Verificar conexión"
          style={{
            background: "none",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            padding: "0.3rem 0.5rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            color: "#64748b",
          }}
        >
          <RefreshCw size={13} strokeWidth={2} />
        </button>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
