import { headers } from "next/headers"

const DEFAULT_ROUTER_IP = process.env.DEFAULT_ROUTER_IP || "192.168.12.1"

/**
 * Validate that an IP address is a safe private IP (SSRF protection)
 * Blocks localhost, link-local, and other dangerous addresses
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
    /^127\./,           // localhost (127.0.0.0/8)
    /^169\.254\./,      // link-local (169.254.0.0/16)
    /^0\./,             // invalid (0.0.0.0/8)
    /^224\./,           // multicast (224.0.0.0/4)
    /^240\./,           // reserved (240.0.0.0/4)
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

/**
 * Get router IP from request headers (passed from client)
 * Falls back to default if not provided
 * Validates IP to prevent SSRF attacks
 */
export async function getRouterIp(): Promise<string> {
  try {
    const headersList = await headers()
    const routerIp = headersList.get("X-Gateway-IP")
    const ipToUse = routerIp || DEFAULT_ROUTER_IP

    // Validate IP to prevent SSRF
    if (!isValidPrivateIP(ipToUse)) {
      console.warn(`Invalid or unsafe IP address blocked: ${ipToUse}`)
      return DEFAULT_ROUTER_IP
    }

    return ipToUse
  } catch {
    return DEFAULT_ROUTER_IP
  }
}

/**
 * Get auth token from request headers (passed from client)
 */
export async function getAuthToken(): Promise<string> {
  try {
    const headersList = await headers()
    const token = headersList.get("X-Auth-Token")

    if (!token) {
      throw new Error("Not authenticated")
    }

    return token
  } catch (error) {
    throw new Error("Not authenticated")
  }
}

/**
 * Server-side fetch to gateway - acts as CORS proxy
 * Auth token and router IP are passed via headers from client
 * Includes 10-second timeout to prevent hanging requests
 */
export async function routerFetch<T>(
  endpoint: string,
  options: { auth?: boolean; method?: string; body?: unknown; timeout?: number } = {}
): Promise<T> {
  const { auth = false, method = "GET", body, timeout = 10000 } = options

  const requestHeaders: Record<string, string> = {
    "Content-Type": "application/json",
  }

  if (auth) {
    const token = await getAuthToken()
    requestHeaders["Authorization"] = `Bearer ${token}`
  }

  const routerIp = await getRouterIp()

  // Add timeout protection
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(`http://${routerIp}${endpoint}`, {
      method,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      // Handle authentication errors from the gateway
      if (response.status === 401 || response.status === 403) {
        throw new Error("Not authenticated")
      }
      const error = await response.json().catch(() => ({}))
      throw new Error(error.result?.message || `Request failed: ${response.status}`)
    }

    // Handle empty responses (common for POST requests)
    const text = await response.text()
    if (!text) {
      return {} as T
    }

    return JSON.parse(text)
  } catch (error) {
    clearTimeout(timeoutId)

    // Handle timeout errors
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout - gateway not responding')
    }

    throw error
  }
}

// API Types
export interface GatewayInfo {
  device: {
    hardwareVersion: string
    macId: string
    manufacturer: string
    model: string
    role: string
    serial: string
    softwareVersion: string
  }
  signal: {
    "5g": {
      antennaUsed: string
      bands: string[]
      bars: number
      cid: number
      gNBID: number
      rsrp: number
      rsrq: number
      rssi: number
      sinr: number
    }
    "4g"?: {
      antennaUsed: string
      bands: string[]
      bars: number
      cid: number
      eNBID: number
      rsrp: number
      rsrq: number
      rssi: number
      sinr: number
    }
    generic: {
      apn: string
      hasIPv6: boolean
      registration: string
    }
  }
  time: {
    localTime: number
    localTimeZone: string
    upTime: number
  }
}

export interface SignalInfo {
  signal: {
    "5g": {
      antennaUsed: string
      bands: string[]
      bars: number
      cid: number
      gNBID: number
      rsrp: number
      rsrq: number
      rssi: number
      sinr: number
    }
    generic: {
      apn: string
      hasIPv6: boolean
      registration: string
    }
  }
}

export interface CellInfo {
  cell: {
    "5g": {
      bandwidth: string
      cqi: number
      earfcn: string
      ecgi: string
      mcc: string
      mnc: string
      pci: string
      plmn: string
      sector: {
        antennaUsed: string
        bands: string[]
        bars: number
        cid: number
        gNBID: number
        rsrp: number
        rsrq: number
        rssi: number
        sinr: number
      }
      status: boolean
      supportedBands: string[]
      tac: string
    }
    "4g"?: {
      bandwidth: string
      cqi: number
      earfcn: string
      ecgi: string
      mcc: string
      mnc: string
      pci: string
      plmn: string
      sector: {
        antennaUsed: string
        bands: string[]
        bars: number
        cid: number
        eNBID: number
        rsrp: number
        rsrq: number
        rssi: number
        sinr: number
      }
      status: boolean
      supportedBands: string[]
      tac: string
    }
    generic: {
      apn: string
      hasIPv6: boolean
      registration: string
      roaming: boolean
    }
    gps: {
      latitude: number
      longitude: number
    }
  }
}

export interface ClientInfo {
  clients: {
    "2.4ghz": Client[]
    "5.0ghz": Client[]
    "6.0ghz"?: Client[]
    ethernet: Client[]
    wifi: Client[]
  }
}

export interface Client {
  connected: boolean
  ipv4: string
  ipv6: string[]
  mac: string
  name: string
  signal?: number
}

export interface SimInfo {
  sim: {
    iccId: string
    imei: string
    imsi: string
    msisdn: string
    status: boolean
  }
}

export interface ApConfig {
  "2.4ghz": {
    airtimeFairness: boolean
    channel: string
    channelBandwidth: string
    isMUMIMOEnabled: boolean
    isRadioEnabled: boolean
    isWMMEnabled: boolean
    maxClients: number
    mode: string
    transmissionPower: string
  }
  "5.0ghz": {
    airtimeFairness: boolean
    channel: string
    channelBandwidth: string
    isMUMIMOEnabled: boolean
    isRadioEnabled: boolean
    isWMMEnabled: boolean
    maxClients: number
    mode: string
    transmissionPower: string
  }
  "6.0ghz"?: {
    airtimeFairness: boolean
    channel: string
    channelBandwidth: string
    isMUMIMOEnabled: boolean
    isRadioEnabled: boolean
    isWMMEnabled: boolean
    maxClients: number
    mode: string
    transmissionPower: string
  }
  bandSteering?: {
    isEnabled: boolean
  }
  ssids: {
    "2.4ghzSsid": boolean
    "5.0ghzSsid": boolean
    "6.0ghzSsid"?: boolean
    encryptionMode: string
    encryptionVersion: string
    guest: boolean
    isBroadcastEnabled: boolean
    ssidName: string
    wpaKey: string
  }[]
}

export interface VersionInfo {
  version: number
}

// Combined telemetry response (cell + clients + sim in one call)
export interface TelemetryAll {
  cell: {
    "5g": {
      bandwidth: string
      cqi: number
      earfcn: string
      ecgi: string
      mcc: string
      mnc: string
      pci: string
      plmn: string
      sector: {
        antennaUsed: string
        bands: string[]
        bars: number
        cid: number
        gNBID: number
        rsrp: number
        rsrq: number
        rssi: number
        sinr: number
      }
      status: boolean
      supportedBands: string[]
      tac: string
    }
    "4g"?: {
      bandwidth: string
      cqi: number
      earfcn: string
      ecgi: string
      mcc: string
      mnc: string
      pci: string
      plmn: string
      sector: {
        antennaUsed: string
        bands: string[]
        bars: number
        cid: number
        eNBID: number
        rsrp: number
        rsrq: number
        rssi: number
        sinr: number
      }
      status: boolean
      supportedBands: string[]
      tac: string
    }
    generic: {
      apn: string
      hasIPv6: boolean
      registration: string
      roaming: boolean
    }
    gps: {
      latitude: number
      longitude: number
    }
  }
  clients: {
    "2.4ghz": Client[]
    "5.0ghz": Client[]
    "6.0ghz"?: Client[]
    ethernet: Client[]
    wifi: Client[]
  }
  sim: {
    iccId: string
    imei: string
    imsi: string
    msisdn: string
    status: boolean
  }
}

// API Functions
export async function getGatewayInfo(): Promise<GatewayInfo> {
  return routerFetch<GatewayInfo>("/TMI/v1/gateway?get=all")
}

export async function getSignalInfo(): Promise<SignalInfo> {
  return routerFetch<SignalInfo>("/TMI/v1/gateway?get=signal")
}

export async function getCellInfo(): Promise<CellInfo> {
  return routerFetch<CellInfo>("/TMI/v1/network/telemetry?get=cell", { auth: true })
}

export async function getClients(): Promise<ClientInfo> {
  return routerFetch<ClientInfo>("/TMI/v1/network/telemetry?get=clients", { auth: true })
}

export async function getSimInfo(): Promise<SimInfo> {
  return routerFetch<SimInfo>("/TMI/v1/network/telemetry?get=sim", { auth: true })
}

export async function getApConfig(): Promise<ApConfig> {
  return routerFetch<ApConfig>("/TMI/v1/network/configuration/v2?get=ap", { auth: true })
}

export async function setApConfig(config: Partial<ApConfig>): Promise<void> {
  return routerFetch("/TMI/v1/network/configuration/v2?set=ap", {
    auth: true,
    method: "POST",
    body: config,
  })
}

export async function rebootGateway(): Promise<void> {
  return routerFetch("/TMI/v1/gateway/reset?set=reboot", {
    auth: true,
    method: "POST",
  })
}

export async function getVersion(): Promise<VersionInfo> {
  return routerFetch<VersionInfo>("/TMI/v1/version")
}

export async function getTelemetryAll(): Promise<TelemetryAll> {
  return routerFetch<TelemetryAll>("/TMI/v1/network/telemetry?get=all", { auth: true })
}
