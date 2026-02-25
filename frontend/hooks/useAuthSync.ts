"use client"

import { useSession } from "next-auth/react"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

export function useAuthSync() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "authenticated" && session?.accessToken) {
      // Sync token to localStorage
      localStorage.setItem("token", session.accessToken)
      localStorage.setItem("userName", session.user?.name || session.user?.email?.split("@")[0] || "")
      localStorage.setItem("userEmail", session.user?.email || "")
      
      console.log("Token synced to localStorage")
      
      // Check current path and redirect if on login page
      if (window.location.pathname === "/login") {
        router.push("/dashboard")
      }
    }
  }, [session, status, router])

  return { session, status }
}
