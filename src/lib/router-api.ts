import { headers } from "next/headers"

const DEFAULT_ROUTER_IP = "192.168.12.1"

/**
 * Get router IP from request headers (passed from client)
 * Falls back to default if not provided
 */
export async function getRouterIp(): Promise<string> {
  try {
    const headersList = await headers()
    const routerIp = headersList.get("X-Gateway-IP")
    return routerIp || DEFAULT_ROUTER_IP
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
 */
export async function routerFetch<T>(
  endpoint: string,
  options: { auth?: boolean; method?: string; body?: unknown } = {}
): Promise<T> {
  const { auth = false, method = "GET", body } = options

  const requestHeaders: Record<string, string> = {
    "Content-Type": "application/json",
  }

  if (auth) {
    const token = await getAuthToken()
    requestHeaders["Authorization"] = `Bearer ${token}`
  }

  const routerIp = await getRouterIp()
  const response = await fetch(`http://${routerIp}${endpoint}`, {
    method,
    headers: requestHeaders,
    body: body ? JSON.stringify(body) : undefined,
  })

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
