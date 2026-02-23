
"use client"

import { useEffect, useState } from "react"
import { X, CheckCircle2, AlertCircle, Info } from "lucide-react"

type ToastType = "success" | "error" | "info"

interface Toast {
  id: number
  message: string
  type: ToastType
}

let toastId = 0
const listeners: ((toast: Toast) => void)[] = []

export function showToast(message: string, type: ToastType = "success") {
  const toast: Toast = { id: toastId++, message, type }
  listeners.forEach(fn => fn(toast))
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    const addToast = (toast: Toast) => {
      setToasts(prev => [...prev, toast])
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== toast.id))
      }, 4000)
    }
    listeners.push(addToast)
    return () => {
      const idx = listeners.indexOf(addToast)
      if (idx > -1) listeners.splice(idx, 1)
    }
  }, [])

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`flex items-start gap-3 p-4 rounded-xl shadow-lg border backdrop-blur-sm animate-slide-in ${
            toast.type === "success"
              ? "bg-green-50 border-green-200 text-green-900"
              : toast.type === "error"
              ? "bg-red-50 border-red-200 text-red-900"
              : "bg-blue-50 border-blue-200 text-blue-900"
          }`}
        >
          {toast.type === "success" && <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-600" />}
          {toast.type === "error" && <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600" />}
          {toast.type === "info" && <Info className="h-5 w-5 flex-shrink-0 text-blue-600" />}
          <p className="text-sm font-medium flex-1">{toast.message}</p>
          <button
            onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
            className="text-current opacity-50 hover:opacity-100 transition-opacity"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}

      <style jsx global>{`
        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}