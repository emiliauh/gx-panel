"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { SWRConfig } from "swr"
import { Sidebar, MobileMenuButton } from "@/components/sidebar"
import { AuthGuard } from "@/components/auth-guard"
import { PrefetchData } from "@/components/prefetch-data"
import { Github } from "lucide-react"
import { swrConfig } from "@/lib/swr-config"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const savedCollapsed = localStorage.getItem("sidebar-collapsed")
    if (savedCollapsed !== null) {
      setSidebarCollapsed(savedCollapsed === "true")
    }
  }, [])

  const handleMobileMenuChange = useCallback((open: boolean) => {
    setMobileMenuOpen(open)
  }, [])

  return (
    <AuthGuard>
      <SWRConfig value={swrConfig}>
        {/* Prefetch critical data in background for instant navigation */}
        <PrefetchData />
        <div className="min-h-screen bg-background flex flex-col">
          <Sidebar
            collapsed={sidebarCollapsed}
            onCollapsedChange={setSidebarCollapsed}
            mobileOpen={mobileMenuOpen}
            onMobileOpenChange={handleMobileMenuChange}
          />

          {/* Mobile header */}
          <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-background/95 backdrop-blur border-b border-border/50 md:hidden">
            <div className="flex items-center gap-3">
              <MobileMenuButton onClick={() => setMobileMenuOpen(true)} />
              <div className="flex items-center gap-2">
                <Image
                  src="/logo.svg"
                  alt="5G Gateway"
                  width={28}
                  height={28}
                  className="flex-shrink-0"
                />
                <span className="font-semibold text-sm">Gx Portal</span>
              </div>
            </div>
          </header>

          <main className={`transition-all duration-150 flex-1 ${sidebarCollapsed ? "md:pl-[72px]" : "md:pl-52"}`}>
            <div className="p-4 sm:p-6 max-w-7xl mx-auto pb-safe">
              {children}
            </div>
          </main>
          <footer className={`transition-all duration-150 border-t border-border/50 py-4 px-4 sm:px-6 ${sidebarCollapsed ? "md:pl-[calc(72px+1.5rem)]" : "md:pl-[calc(13rem+1.5rem)]"}`}>
            <div className="flex flex-col items-center gap-3 text-xs text-muted-foreground text-center md:text-left md:flex-row md:justify-between">
              <div className="flex flex-col items-center gap-2 md:flex-row md:gap-4">
                <p>This project is open source and licensed under MIT.</p>
                <a
                  href="https://github.com/rchen14b/TMO-G5AR-Portal"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors"
                >
                  <Github className="h-4 w-4" />
                  <span>View on GitHub</span>
                </a>
              </div>
              <p className="text-xs text-muted-foreground/70">
                Not affiliated with T-Mobile or Arcadyan. All trademarks belong to their respective owners.
              </p>
            </div>
          </footer>
        </div>
      </SWRConfig>
    </AuthGuard>
  )
}
