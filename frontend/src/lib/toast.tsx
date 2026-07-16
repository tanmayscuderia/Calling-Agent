'use client';

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react';
import { AnimatePresence, m } from 'framer-motion';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextValue {
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let toastIdCounter = 0;

const ICONS: Record<ToastType, string> = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
};

const COLORS: Record<ToastType, { bg: string; border: string; text: string; iconBg: string }> = {
  success: { bg: '#f0fdf4', border: '#bbf7d0', text: '#166534', iconBg: '#22c55e' },
  error: { bg: '#fef2f2', border: '#fecaca', text: '#991b1b', iconBg: '#ef4444' },
  info: { bg: '#eff6ff', border: '#bfdbfe', text: '#1e40af', iconBg: '#3b82f6' },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (type: ToastType, message: string, duration = 4000) => {
      const id = ++toastIdCounter;
      setToasts((prev) => [{ id, type, message, duration }, ...prev]);
      if (duration > 0) {
        setTimeout(() => removeToast(id), duration);
      }
    },
    [removeToast]
  );

  const success = useCallback((msg: string, dur?: number) => addToast('success', msg, dur), [addToast]);
  const error = useCallback((msg: string, dur?: number) => addToast('error', msg, dur ?? 6000), [addToast]);
  const info = useCallback((msg: string, dur?: number) => addToast('info', msg, dur), [addToast]);

  return (
    <ToastContext.Provider value={{ success, error, info }}>
      {children}
      {/* Toast container — fixed top-right, always on top, newest slides in at top */}
      <div
        style={{
          position: 'fixed',
          top: 16,
          right: 16,
          zIndex: 99999,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          pointerEvents: 'none',
          maxWidth: 380,
        }}
      >
        <AnimatePresence initial={false}>
          {toasts.map((toast) => {
            const colors = COLORS[toast.type];
            return (
              <m.div
                key={toast.id}
                layout
                initial={{ opacity: 0, x: 60, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 60, scale: 0.85 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                onClick={() => removeToast(toast.id)}
                style={{
                  pointerEvents: 'auto',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  padding: '12px 14px',
                  borderRadius: 10,
                  background: colors.bg,
                  border: `1px solid ${colors.border}`,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)',
                  cursor: 'pointer',
                  fontSize: 13,
                  lineHeight: 1.45,
                  color: colors.text,
                  fontWeight: 500,
                  minHeight: 44,
                }}
              >
                {/* Icon circle */}
                <div
                  style={{
                    flexShrink: 0,
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    background: colors.iconBg,
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 11,
                    fontWeight: 700,
                    marginTop: 1,
                  }}
                >
                  {ICONS[toast.type]}
                </div>
                {/* Message */}
                <div style={{ flex: 1, wordBreak: 'break-word' }}>{toast.message}</div>
                {/* Close */}
                <div
                  style={{
                    flexShrink: 0,
                    fontSize: 14,
                    color: colors.text,
                    opacity: 0.4,
                    lineHeight: 1,
                    fontWeight: 400,
                    marginTop: -1,
                  }}
                >
                  ×
                </div>
              </m.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
}