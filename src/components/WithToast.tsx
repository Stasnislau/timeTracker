import ErrorToast from "./ErrorToast";
import { useToastsStore } from "../store/useToastsStore";
import { ReactNode } from "react";
import React from "react";
interface ToastProviderProps {
  children: ReactNode;
}

export function WithToasts({ children }: ToastProviderProps) {
  const { toasts, removeToast } = useToastsStore();

  return (
    <>
      {children}
      {toasts.map((toast) => (
        <ErrorToast
          key={toast.id}
          id={toast.id}
          message={toast.message}
          onClose={() => {
            removeToast(toast.id);
          }}
        />
      ))}
    </>
  );
}
