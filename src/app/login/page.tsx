"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Eye, EyeOff, Globe, User, Lock } from "lucide-react"
import Image from "next/image"

/**
 * Validate that an IP address is a safe private IP
 * Only allows private IP ranges (RFC 1918)
 */
function isValidPrivateIP(ip: string): boolean {
  // Basic IP format validation
  const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/
  const match = ip.match(ipv4Regex)

  if (!match) {
    return false
  }

  const octets = match.slice(1, 5).map(Number)

  // Check each octet is valid (0-255)
  if (octets.some(octet => octet < 0 || octet > 255)) {
    return false
  }

  // Block dangerous addresses
  const blocklist = [
    /^127\./,           // localhost
    /^169\.254\./,      // link-local
    /^0\./,             // invalid
    /^224\./,           // multicast
    /^240\./,           // reserved
    /^255\.255\.255\.255$/, // broadcast
  ]

  if (blocklist.some(pattern => pattern.test(ip))) {
    return false
  }

  // Only allow private IP ranges (RFC 1918)
  const allowlist = [
    /^192\.168\./,                        // Private class C (192.168.0.0/16)
    /^10\./,                               // Private class A (10.0.0.0/8)
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./,    // Private class B (172.16.0.0/12)
  ]

  return allowlist.some(pattern => pattern.test(ip))
}

export default function LoginPage() {
  const router = useRouter()
  const [routerIp, setRouterIp] = useState("192.168.12.1")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberUsername, setRememberUsername] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Load saved settings on mount
  useEffect(() => {
    const savedIp = localStorage.getItem("router_ip")
    if (savedIp) {
      setRouterIp(savedIp)
    }

    const savedUsername = localStorage.getItem("remembered_username")
    if (savedUsername) {
      setUsername(savedUsername)
      setRememberUsername(true)
    } else {
      setUsername("admin") // Default username
    }
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    // Validate router IP before submitting
    if (!isValidPrivateIP(routerIp)) {
      setError("Invalid IP address. Please use a valid private IP (e.g., 192.168.x.x, 10.x.x.x, 172.16-31.x.x)")
      setLoading(false)
      return
    }

    try {
      const response = await fetch("/api/router/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, routerIp }),
      })

      const data = await response.json()

      if (data.success && data.token) {
        // Store auth token and config in localStorage (client-side)
        localStorage.setItem("tmo_auth_token", data.token)
        localStorage.setItem("tmo_router_ip", data.routerIp)
        localStorage.setItem("tmo_username", data.username)

        // Save or clear remembered username
        if (rememberUsername) {
          localStorage.setItem("remembered_username", username)
        } else {
          localStorage.removeItem("remembered_username")
        }
        
        router.push("/")
      } else {
        setError(data.error || "Login failed")
      }
    } catch (err) {
      setError("Connection failed. Is the gateway reachable?")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      {/* Login card */}
      <div className="w-full max-w-md">
        <div className="bg-card border border-border/50 rounded-3xl p-8 space-y-6 shadow-lg">
          {/* Header */}
          <div className="flex items-center justify-center gap-4">
            <Image
              src="/logo.svg"
              alt="5G Gateway"
              width={56}
              height={48}
            />
            <div>
              <h1 className="text-2xl font-bold">Gx Portal</h1>
              <p className="text-muted-foreground">T-Mobile Gateway Administration</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="routerIp">Gateway IP</Label>
              <div className="relative">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="routerIp"
                  type="text"
                  value={routerIp}
                  onChange={(e) => setRouterIp(e.target.value)}
                  placeholder="192.168.12.1"
                  className="h-12 pl-12 rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  className="h-12 pl-12 rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="h-12 pl-12 pr-12 rounded-xl"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="remember"
                checked={rememberUsername}
                onChange={(e) => setRememberUsername(e.target.checked)}
                className="w-4 h-4 rounded border-border bg-input text-primary focus:ring-primary/50"
              />
              <Label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer">
                Remember username
              </Label>
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 transition-colors text-primary-foreground font-medium"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          {/* Footer */}
          <p className="text-center text-xs text-muted-foreground">
            Default credentials are on your gateway label
          </p>
        </div>
      </div>
    </div>
  )
}
