"use client"

import { useSession } from "next-auth/react"
import { useEffect } from "react"

export function useAuthSync() {
  const { data: session, status } = useSession()

  useEffect(() => {
    if (status === "authenticated" && session?.accessToken) {
      // Sync token to localStorage
      localStorage.setItem("token", session.accessToken)
      localStorage.setItem("userName", session.user?.name || session.user?.email?.split("@")[0] || "")
      localStorage.setItem("userEmail", session.user?.email || "")
      
      console.log("Token synced to localStorage")
      
      // Don't auto-redirect - let the login page handle it
    }
  }, [session, status])

  return { session, status }
}
