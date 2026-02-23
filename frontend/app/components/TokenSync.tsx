"use client"





import { useEffect } from "react"
import { useSession } from "next-auth/react"

export default function TokenSync() {
  const { data: session, status } = useSession()

  useEffect(() => {
    if (status === "authenticated" && session) {
      const token = (session as any)?.accessToken
      if (token) {
        localStorage.setItem("token", token)
        
        if (session.user?.name) localStorage.setItem("userName", session.user.name)
        if (session.user?.email) localStorage.setItem("userEmail", session.user.email)
      }
    }

    if (status === "unauthenticated") {
      
      localStorage.removeItem("token")
      localStorage.removeItem("userName")
      localStorage.removeItem("userEmail")
    }
  }, [status, session])

  
  return null
}