"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Wifi,
  Smartphone,
  Radio,
  Settings,
  Bug,
  LogOut,
  Moon,
  Sun,
  PanelLeftClose,
  PanelLeft,
  Menu,
  X,
  Pin,
  PinOff,
} from "lucide-react"
import { useState, useEffect } from "react"

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/devices", label: "Devices", icon: Smartphone },
  { href: "/wifi", label: "WiFi", icon: Wifi },
  { href: "/cell", label: "Cell Info", icon: Radio },
  { href: "/diagnostic", label: "Diagnostic", icon: Bug },
  { href: "/system", label: "System", icon: Settings },
]

interface SidebarProps {
  collapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
  mobileOpen?: boolean
  onMobileOpenChange?: (open: boolean) => void
}

export function Sidebar({ collapsed = false, onCollapsedChange, mobileOpen = false, onMobileOpenChange }: SidebarProps) {
  const pathname = usePathname()
  const [isDark, setIsDark] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(collapsed)
  const [isPinned, setIsPinned] = useState(false)
  const [isHovering, setIsHovering] = useState(false)

  useEffect(() => {
    const isDarkMode = document.documentElement.classList.contains("dark")
    setIsDark(isDarkMode)

    // Load pinned state from localStorage (desktop only)
    const savedPinned = localStorage.getItem("sidebar-pinned")
    if (savedPinned !== null) {
      setIsPinned(savedPinned === "true")
    }
  }, [])

  // Close mobile menu when route changes
  useEffect(() => {
    onMobileOpenChange?.(false)
  }, [pathname, onMobileOpenChange])

  // Update collapsed state based on pinned and hover (desktop only)
  useEffect(() => {
    const newCollapsed = !isPinned && !isHovering
    setIsCollapsed(newCollapsed)
    onCollapsedChange?.(newCollapsed)
  }, [isPinned, isHovering, onCollapsedChange])

  const toggleDarkMode = () => {
    const newIsDark = !isDark
    if (newIsDark) {
      document.documentElement.classList.add("dark")
      localStorage.setItem("theme", "dark")
    } else {
      document.documentElement.classList.remove("dark")
      localStorage.setItem("theme", "light")
    }
    setIsDark(newIsDark)
  }

  const togglePinned = () => {
    const newPinned = !isPinned
    setIsPinned(newPinned)
    localStorage.setItem("sidebar-pinned", String(newPinned))
  }

  const handleLogout = () => {
    // Clear client-side auth from localStorage
    localStorage.removeItem("tmo_auth_token")
    localStorage.removeItem("tmo_router_ip")
    localStorage.removeItem("tmo_username")

    // Redirect to login
    window.location.replace("/login")
  }

  const handleNavClick = () => {
    // Close mobile menu on navigation
    onMobileOpenChange?.(false)
  }

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => onMobileOpenChange?.(false)}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-dvh sidebar flex flex-col transition-all duration-150 overflow-hidden",
          // Desktop: show based on collapsed state
          "hidden md:flex",
          isCollapsed ? "md:w-[72px]" : "md:w-52"
        )}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
      {/* Logo */}
      <div
        className={cn(
          "flex items-center border-b border-border/50",
          isCollapsed ? "justify-center px-3 py-5" : "justify-between px-5 py-5"
        )}
      >
        <div className="flex items-center gap-3">
          <Image
            src="/logo.svg"
            alt="5G Gateway"
            width={36}
            height={36}
            className="flex-shrink-0"
          />
          <h1
            className={cn(
              "font-semibold text-base text-foreground whitespace-nowrap transition-opacity duration-150",
              isCollapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
            )}
          >
            Gx Portal
          </h1>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto overflow-x-hidden">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={false}
              onClick={handleNavClick}
              className={cn(
                "sidebar-item group relative",
                isActive && "sidebar-item-active",
                isCollapsed && "justify-center px-0 gap-0"
              )}
              title={isCollapsed ? item.label : undefined}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              <span
                className={cn(
                  "font-medium whitespace-nowrap transition-opacity duration-150",
                  isCollapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
                )}
              >
                {item.label}
              </span>
              {/* Tooltip for collapsed mode */}
              {isCollapsed && (
                <div className="absolute left-full ml-2 px-3 py-2 bg-popover border border-border text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 shadow-lg">
                  {item.label}
                  <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 border-4 border-transparent border-r-popover" />
                </div>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-3 border-t border-border/50 space-y-0.5">
        {/* Dark mode toggle */}
        <button
          onClick={toggleDarkMode}
          className={cn(
            "sidebar-item w-full group relative",
            isCollapsed && "justify-center px-0 gap-0"
          )}
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {isDark ? (
            <Sun className="h-5 w-5 flex-shrink-0" />
          ) : (
            <Moon className="h-5 w-5 flex-shrink-0" />
          )}
          <span
            className={cn(
              "font-medium whitespace-nowrap transition-opacity duration-150",
              isCollapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
            )}
          >
            {isDark ? "Light Mode" : "Dark Mode"}
          </span>
          {isCollapsed && (
            <div className="absolute left-full ml-2 px-3 py-2 bg-popover border border-border rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 shadow-lg">
              {isDark ? "Light Mode" : "Dark Mode"}
              <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 border-4 border-transparent border-r-popover" />
            </div>
          )}
        </button>

        {/* Pin/Unpin toggle */}
        <button
          onClick={togglePinned}
          className={cn(
            "sidebar-item w-full group relative",
            isCollapsed && "justify-center px-0 gap-0"
          )}
          title={isPinned ? "Unpin Sidebar" : "Pin Sidebar Open"}
        >
          {isPinned ? (
            <PinOff className="h-5 w-5 flex-shrink-0" />
          ) : (
            <Pin className="h-5 w-5 flex-shrink-0" />
          )}
          <span
            className={cn(
              "font-medium whitespace-nowrap transition-opacity duration-150",
              isCollapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
            )}
          >
            {isPinned ? "Unpin" : "Pin Open"}
          </span>
          {isCollapsed && (
            <div className="absolute left-full ml-2 px-3 py-2 bg-popover border border-border rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 shadow-lg">
              {isPinned ? "Unpin Sidebar" : "Pin Sidebar Open"}
              <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 border-4 border-transparent border-r-popover" />
            </div>
          )}
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className={cn(
            "sidebar-item w-full group relative",
            isCollapsed && "justify-center px-0 gap-0"
          )}
          title={isCollapsed ? "Logout" : undefined}
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          <span
            className={cn(
              "font-medium whitespace-nowrap transition-opacity duration-150",
              isCollapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
            )}
          >
            Logout
          </span>
          {isCollapsed && (
            <div className="absolute left-full ml-2 px-3 py-2 bg-popover border border-border rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 shadow-lg">
              Logout
              <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 border-4 border-transparent border-r-popover" />
            </div>
          )}
        </button>
      </div>
    </aside>

      {/* Mobile sidebar drawer */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-dvh w-64 sidebar flex flex-col transition-transform duration-300 md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Mobile Logo with close button */}
        <div className="flex items-center justify-between px-4 py-5 border-b border-border/50">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.svg"
              alt="5G Gateway"
              width={36}
              height={36}
              className="flex-shrink-0"
            />
            <h1 className="font-semibold text-base text-foreground">Gx Portal</h1>
          </div>
          <button
            onClick={() => onMobileOpenChange?.(false)}
            className="p-2 rounded-lg hover:bg-accent transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Mobile Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={false}
                onClick={handleNavClick}
                className={cn(
                  "sidebar-item",
                  isActive && "sidebar-item-active"
                )}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                <span className="font-medium">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Mobile Footer */}
        <div className="px-3 py-3 border-t border-border/50 space-y-0.5">
          <button
            onClick={toggleDarkMode}
            className="sidebar-item w-full"
          >
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            <span className="font-medium">{isDark ? "Light Mode" : "Dark Mode"}</span>
          </button>
          <button
            onClick={handleLogout}
            className="sidebar-item w-full"
          >
            <LogOut className="h-5 w-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>
    </>
  )
}

// Mobile menu button component
export function MobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="md:hidden p-2 rounded-lg hover:bg-accent transition-colors"
      aria-label="Open menu"
    >
      <Menu className="h-6 w-6" />
    </button>
  )
}
