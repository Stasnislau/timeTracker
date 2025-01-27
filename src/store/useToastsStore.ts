import { create } from "zustand";
import { ErrorToastProps } from "../components/ErrorToast";

interface ToastsStore {
  toasts: ErrorToastProps[];
  addToast: (toast: {
    message: string;
    onClose: () => void;
  }) => void;
  removeToast: (id: string) => void;
}

export const useToastsStore = create<ToastsStore>((set) => ({
  toasts: [],
  addToast: (toast) =>
    set((state) => ({
      toasts: [
        ...state.toasts,
        {
          ...toast,
          open: true,
          id: Date.now().toString(),
        },
      ],
    })),
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    })),
}));
