"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { isAuthenticated } from "@/lib/client-auth"

/**
 * Client-side authentication guard
 * Redirects to login if not authenticated
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    // Check auth status on mount and after any storage changes
    const checkAuth = () => {
      if (!isAuthenticated()) {
        router.replace("/login")
      } else {
        setIsChecking(false)
      }
    }

    checkAuth()

    // Listen for storage changes (e.g., logout in another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key?.startsWith("tmo_")) {
        checkAuth()
      }
    }

    window.addEventListener("storage", handleStorageChange)
    return () => window.removeEventListener("storage", handleStorageChange)
  }, [router])

  // Don't render children until auth check is complete
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  return <>{children}</>
}
