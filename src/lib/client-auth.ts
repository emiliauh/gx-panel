"use client"

/**
 * Client-side authentication and gateway configuration management
 * Stores credentials in localStorage so each visitor can connect to their own gateway
 */

const AUTH_TOKEN_KEY = "tmo_auth_token"
const ROUTER_IP_KEY = "tmo_router_ip"
const USERNAME_KEY = "tmo_username"

export interface AuthConfig {
  token: string
  routerIp: string
  username?: string
  expiration?: number
}

/**
 * Get the current authentication configuration from localStorage
 */
export function getAuthConfig(): AuthConfig | null {
  if (typeof window === "undefined") return null

  const token = localStorage.getItem(AUTH_TOKEN_KEY)
  const routerIp = localStorage.getItem(ROUTER_IP_KEY)

  if (!token || !routerIp) {
    return null
  }

  return {
    token,
    routerIp,
    username: localStorage.getItem(USERNAME_KEY) || undefined,
  }
}

/**
 * Set the authentication configuration in localStorage
 */
export function setAuthConfig(config: AuthConfig): void {
  if (typeof window === "undefined") return

  localStorage.setItem(AUTH_TOKEN_KEY, config.token)
  localStorage.setItem(ROUTER_IP_KEY, config.routerIp)
  
  if (config.username) {
    localStorage.setItem(USERNAME_KEY, config.username)
  }
}

/**
 * Clear the authentication configuration from localStorage
 */
export function clearAuthConfig(): void {
  if (typeof window === "undefined") return

  localStorage.removeItem(AUTH_TOKEN_KEY)
  localStorage.removeItem(ROUTER_IP_KEY)
  localStorage.removeItem(USERNAME_KEY)
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return getAuthConfig() !== null
}

/**
 * Get headers for authenticated requests
 */
export function getAuthHeaders(): HeadersInit {
  const config = getAuthConfig()
  
  if (!config) {
    return {}
  }

  return {
    "X-Gateway-IP": config.routerIp,
    "X-Auth-Token": config.token,
  }
}
