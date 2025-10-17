import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, InfoIcon, Loader2, XCircle } from "lucide-react";

type Toast = {
  message: string;
  type: "success" | "error" | "info" | "loading";
  timeout?: number;
};

type ToastInternals = Omit<Toast, "timeout"> & {
  id: string;
  dismiss: number;
};

type ToastResult = {
  dismiss: () => void;
};

const maxToasts = 5;
const toastFadeoutTimeout = 10_000;

class Toasts {
  toasts: ToastInternals[] = [];
  listeners: ((toasts: ToastInternals[]) => void)[] = [];

  add(toast: Toast) {
    if (this.toasts.length >= maxToasts) {
      this.toasts.shift();
    }
    const toastInternal = {
      ...toast,
      id: crypto.randomUUID(),
      dismiss: new Date().getTime() + (toast.timeout ?? toastFadeoutTimeout),
    };
    this.toasts.push(toastInternal);
    this.notifyListeners();
    return {
      dismiss: () => this.remove(toastInternal.id),
    };
  }

  remove(id: string) {
    this.toasts = this.toasts.filter((toast) => toast.id !== id);
    this.notifyListeners();
  }

  subscribe(listener: (toasts: ToastInternals[]) => void) {
    this.listeners.push(listener);
    listener([...this.toasts]);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener([...this.toasts]));
  }

  watch() {
    const interval = setInterval(() => {
      const now = new Date();
      const hasChanged = this.toasts.some(
        (toast) => now.getTime() > toast.dismiss,
      );
      if (hasChanged) {
        this.toasts = this.toasts.filter(
          (toast) => now.getTime() < toast.dismiss,
        );
        this.notifyListeners();
      }
    }, 100);
    return () => clearInterval(interval);
  }
}

type GlobalThis = typeof globalThis & {
  _toasts_singleton_?: Toasts;
};

const toasts = (globalThis as GlobalThis)._toasts_singleton_ ?? new Toasts();
(globalThis as GlobalThis)._toasts_singleton_ = toasts;

export const toast = {
  error: (message: string): ToastResult =>
    toasts.add({ type: "error", message }),
  success: (message: string): ToastResult =>
    toasts.add({ type: "success", message }),
  info: (message: string): ToastResult => toasts.add({ type: "info", message }),
  loading: (message: string): ToastResult =>
    toasts.add({ type: "loading", message, timeout: Infinity }),
};

export function ToastComponent(toast: ToastInternals) {
  return (
    <motion.div
      layoutId={toast.id}
      initial={{ marginBottom: -64, opacity: 0 }}
      animate={{ marginBottom: 0, opacity: 1 }}
      exit={{ marginBottom: -64, opacity: 0, transition: { delay: 0.15 } }}
      transition={{ type: "spring", bounce: 0.4, duration: 0.4 }}
      className="backdrop-blur-lg p-1.5 pr-3 flex w-fit items-center rounded-full border border-border bg-secondary/30 text-foreground"
    >
      {toast.type === "success" && (
        <CheckCircle2 className="text-green-500 size-5" />
      )}
      {toast.type === "error" && <XCircle className="text-red-500 size-5" />}
      {toast.type === "info" && <InfoIcon className="text-blue-500 size-5" />}
      {toast.type === "loading" && (
        <Loader2 className="animate-spin size-5 text-muted-foreground" />
      )}
      <motion.div
        initial={{ width: 0, marginLeft: 0 }}
        animate={{ width: "auto", marginLeft: 6 }}
        exit={{ width: 0, marginLeft: 0 }}
        transition={{ type: "spring", bounce: 0.2, duration: 0.4, delay: 0.05 }}
        className="text-sm font-medium overflow-hidden whitespace-pre"
      >
        {toast.message}
      </motion.div>
    </motion.div>
  );
}

export function Toaster() {
  const [currentToasts, setCurrentToasts] = useState<ToastInternals[]>([]);

  useEffect(() => {
    const unsubscribe = toasts.subscribe((updatedToasts) => {
      setCurrentToasts(updatedToasts);
    });

    const stopWatching = toasts.watch();

    return () => {
      unsubscribe();
      stopWatching();
    };
  }, []);

  return (
    <div className="bottom-2 left-0 right-0 gap-1.5 fixed z-[2147483647] m-auto flex w-fit flex-col items-center">
      <AnimatePresence>
        {currentToasts.map((toast) => (
          <ToastComponent key={toast.id} {...toast} />
        ))}
      </AnimatePresence>
    </div>
  );
}
