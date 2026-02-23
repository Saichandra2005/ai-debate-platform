"use client"

import { SessionProvider } from "next-auth/react"
import TokenSync from "./components/TokenSync"
import ToastContainer from "./components/Toast"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <TokenSync />
      <ToastContainer />
      {children}
    </SessionProvider>
  )
}