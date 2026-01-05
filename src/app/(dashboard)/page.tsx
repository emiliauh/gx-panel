"use client"

import { useCallback, useMemo, useState } from "react"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { SignalBars } from "@/components/signal-bars"
import { SignalBarChart } from "@/components/signal-chart"
import { RefreshControl } from "@/components/refresh-control"
import { useGatewayInfo, useClients, useCellInfo } from "@/hooks/use-router-data"
import { formatUptime } from "@/lib/utils"
import { cn } from "@/lib/utils"
import {
  Wifi,
  Radio,
  Clock,
  Smartphone,
  Activity,
  Router,
} from "lucide-react"

// Gateway model to image mapping
interface GatewayImageInfo {
  src: string
  alt: string
  fallbackIcon: boolean
}

function getGatewayImageInfo(model?: string, manufacturer?: string): GatewayImageInfo {
  const modelLower = model?.toLowerCase() || ""
  const manufacturerLower = manufacturer?.toLowerCase() || ""

  // Arcadyan G5AR (latest)
  if (modelLower.includes("g5ar") || modelLower.includes("tmog5ar")) {
    return { src: "/g5ar.png", alt: "Arcadyan G5AR Gateway", fallbackIcon: false }
  }

  // Arcadyan G4AR
  if (modelLower.includes("g4ar") || modelLower.includes("tmog4ar")) {
    return { src: "/g4ar.png", alt: "Arcadyan G4AR Gateway", fallbackIcon: false }
  }

  // Sercomm G4SE - check multiple patterns since model string may vary
  if (modelLower.includes("g4se") || modelLower.includes("tmog4se") ||
      manufacturerLower.includes("sercomm") || modelLower.includes("ser")) {
    return { src: "/g4se.png", alt: "Sercomm G4SE Gateway", fallbackIcon: false }
  }

  // Sagemcom Fast 5688W
  if (modelLower.includes("5688") || modelLower.includes("fast") || manufacturerLower.includes("sagemcom")) {
    return { src: "/sagemcom.png", alt: "Sagemcom Fast 5688W Gateway", fallbackIcon: false }
  }

  // Nokia 5G21
  if (modelLower.includes("5g21") || manufacturerLower.includes("nokia")) {
    return { src: "/nokia.png", alt: "Nokia 5G21 Gateway", fallbackIcon: false }
  }

  // Arcadyan KVD21
  if (modelLower.includes("kvd21")) {
    return { src: "/kvd21.png", alt: "Arcadyan KVD21 Gateway", fallbackIcon: false }
  }

  // Default to G5AR for unknown Arcadyan devices
  if (manufacturerLower.includes("arcadyan")) {
    return { src: "/g5ar.png", alt: "Arcadyan Gateway", fallbackIcon: false }
  }

  // Unknown gateway - use fallback icon
  return { src: "", alt: "T-Mobile Gateway", fallbackIcon: true }
}

export default function Dashboard() {
  const { data: gateway, isLoading: gatewayLoading, mutate: mutateGateway } = useGatewayInfo()
  const { data: clients, isLoading: clientsLoading, mutate: mutateClients } = useClients()
  const { data: cellInfo, mutate: mutateCellInfo } = useCellInfo()
  const [imageError, setImageError] = useState(false)
  const [connectionTab, setConnectionTab] = useState<"5g" | "lte">("5g")

  const handleRefresh = useCallback(() => {
    mutateGateway()
    mutateClients()
    mutateCellInfo()
  }, [mutateGateway, mutateClients, mutateCellInfo])

  // Memoize derived data to prevent unnecessary re-renders
  const signal5g = useMemo(() => gateway?.signal?.["5g"], [gateway?.signal])
  const signal4g = useMemo(() => gateway?.signal?.["4g"], [gateway?.signal])
  const device = useMemo(() => gateway?.device, [gateway?.device])
  const time = useMemo(() => gateway?.time, [gateway?.time])
  const generic = useMemo(() => gateway?.signal?.generic, [gateway?.signal?.generic])

  // Determine primary connection type (5G preferred, fallback to LTE)
  const primarySignal = useMemo(() => {
    if (signal5g) return { type: "5G", signal: signal5g }
    if (signal4g) return { type: "LTE", signal: signal4g }
    return null
  }, [signal5g, signal4g])

  // Check if device has LTE capability (shown when both 5G and LTE are present)
  const hasLteCapability = useMemo(() => !!signal4g, [signal4g])

  // Get gateway image info based on detected model/manufacturer
  const gatewayImage = useMemo(
    () => getGatewayImageInfo(device?.model, device?.manufacturer),
    [device?.model, device?.manufacturer]
  )

  const totalClients = useMemo(() => {
    if (!clients?.clients) return 0
    return (clients.clients.wifi?.length || 0) + (clients.clients.ethernet?.length || 0)
  }, [clients?.clients])

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header with Refresh Control */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Monitor your T-Mobile 5G Gateway in real-time
          </p>
        </div>
        <RefreshControl onRefresh={handleRefresh} isLoading={gatewayLoading || clientsLoading} />
      </div>

      {/* Hero Section with Gateway Image */}
      <div className="glass-card border-0 rounded-2xl p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row items-center gap-6 lg:gap-8">
          {/* Gateway Image */}
          <div className="relative w-32 h-32 sm:w-40 sm:h-40 lg:w-56 lg:h-56 flex-shrink-0">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-blue-500/20 rounded-2xl blur-xl" />
            <div className="relative h-full w-full flex items-center justify-center">
              {gatewayImage.fallbackIcon || imageError ? (
                <div className="flex items-center justify-center w-full h-full bg-muted/30 rounded-2xl">
                  <Router className="w-16 h-16 sm:w-20 sm:h-20 lg:w-28 lg:h-28 text-primary/70" />
                </div>
              ) : (
                <Image
                  src={gatewayImage.src}
                  alt={gatewayImage.alt}
                  width={200}
                  height={200}
                  className="object-contain drop-shadow-2xl w-full h-full"
                  priority
                  onError={() => setImageError(true)}
                />
              )}
            </div>
          </div>

          {/* Gateway Info */}
          <div className="flex-1 text-center lg:text-left w-full">
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-2 sm:gap-3 mb-2">
              <h1 className="text-xl sm:text-2xl lg:text-4xl font-bold tracking-tight">
                {device?.model || "T-Mobile Gateway"}
              </h1>
              {generic?.registration && (
                <Badge
                  variant={generic.registration === "registered" ? "success" : "destructive"}
                  className="px-2 sm:px-3 py-1 text-xs"
                >
                  <span className="relative flex h-2 w-2 mr-1.5 sm:mr-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-current"></span>
                  </span>
                  {generic.registration === "registered" ? "Connected" : "Disconnected"}
                </Badge>
              )}
            </div>
            <p className="text-sm sm:text-base text-muted-foreground mb-4">
              {device?.manufacturer || "Arcadyan"} • v{device?.softwareVersion || "---"}
            </p>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap justify-center lg:justify-start gap-4 sm:gap-6 mt-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Radio className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-1 sm:gap-2">
                    <SignalBars bars={Math.round(signal5g?.bars || 0)} size="sm" />
                    <span className="font-bold text-sm sm:text-base">{signal5g?.bars || 0}/5</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Signal</p>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <Smartphone className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                </div>
                <div>
                  <div className="font-bold text-sm sm:text-base">{totalClients}</div>
                  <p className="text-xs text-muted-foreground">Devices</p>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                </div>
                <div>
                  <div className="font-bold text-sm sm:text-base">{time ? formatUptime(time.upTime) : "---"}</div>
                  <p className="text-xs text-muted-foreground">Uptime</p>
                </div>
              </div>

              {(signal5g || signal4g) && (
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                    <Wifi className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
                  </div>
                  <div>
                    <div className="flex flex-wrap gap-1">
                      {signal5g && (
                        <Badge variant="blue" className="text-xs">{signal5g.bands.join(", ")}</Badge>
                      )}
                      {signal4g && (
                        <Badge variant="secondary" className="text-xs">{signal4g.bands.join(", ")}</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {signal5g && signal4g ? "5G + LTE" : signal5g ? "5G" : "LTE"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Signal Metrics */}
      <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
        <Card className="glass-card border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              {primarySignal?.type || "Cellular"} Signal Metrics
            </CardTitle>
            <CardDescription>
              Real-time signal quality with color-coded indicators
            </CardDescription>
          </CardHeader>
          <CardContent>
            {gatewayLoading ? (
              <div className="space-y-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                ))}
              </div>
            ) : primarySignal ? (
              <SignalBarChart
                rsrp={primarySignal.signal.rsrp}
                rsrq={primarySignal.signal.rsrq}
                sinr={primarySignal.signal.sinr}
                rssi={primarySignal.signal.rssi}
              />
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                No cellular signal data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wifi className="h-5 w-5 text-primary" />
              Connection Details
            </CardTitle>
            <CardDescription>
              Network and tower information
            </CardDescription>
          </CardHeader>
          <CardContent>
            {gatewayLoading ? (
              <div className="space-y-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="flex justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                ))}
              </div>
            ) : (signal5g || signal4g) ? (
              <div className="space-y-4">
                {/* Tab Toggle - only show if both 5G and LTE available */}
                {signal5g && signal4g && (
                  <div className="flex rounded-lg bg-muted/50 p-1">
                    <button
                      onClick={() => setConnectionTab("5g")}
                      className={cn(
                        "flex-1 py-1.5 px-3 text-sm font-medium rounded-md transition-all",
                        connectionTab === "5g"
                          ? "bg-background shadow-sm text-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      5G NR
                    </button>
                    <button
                      onClick={() => setConnectionTab("lte")}
                      className={cn(
                        "flex-1 py-1.5 px-3 text-sm font-medium rounded-md transition-all",
                        connectionTab === "lte"
                          ? "bg-background shadow-sm text-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      LTE
                    </button>
                  </div>
                )}

                {/* 5G Section */}
                {(connectionTab === "5g" && signal5g) || (!signal4g && signal5g) ? (
                  <div className="space-y-1">
                    {!signal4g && (
                      <div className="flex items-center gap-2 pb-2">
                        <Badge variant="blue" className="text-xs">5G NR</Badge>
                        <span className="text-xs text-muted-foreground">Primary</span>
                      </div>
                    )}
                    <div className="flex justify-between py-2 border-b border-border/50">
                      <span className="text-muted-foreground text-sm">Band{signal5g?.bands.length > 1 ? "s" : ""}</span>
                      <div className="flex flex-wrap gap-1 justify-end">
                        {signal5g?.bands.map((band: string, idx: number) => (
                          <Badge key={idx} variant="blue" className="text-xs">{band}</Badge>
                        ))}
                      </div>
                    </div>
                    {signal5g?.bands.length > 1 && (
                      <div className="flex justify-between py-2 border-b border-border/50">
                        <span className="text-muted-foreground text-sm">Carrier Aggregation</span>
                        <Badge variant="success" className="text-xs">Active ({signal5g.bands.length}x CA)</Badge>
                      </div>
                    )}
                    {cellInfo?.cell?.["5g"]?.bandwidth && (
                      <div className="flex justify-between py-2 border-b border-border/50">
                        <span className="text-muted-foreground text-sm">Bandwidth</span>
                        <Badge variant="blue" className="text-xs">{cellInfo.cell["5g"].bandwidth}</Badge>
                      </div>
                    )}
                    <div className="flex justify-between py-2 border-b border-border/50">
                      <span className="text-muted-foreground text-sm">gNB ID</span>
                      <span className="font-mono text-xs font-medium">{signal5g?.gNBID}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-border/50">
                      <span className="text-muted-foreground text-sm">Cell ID</span>
                      <span className="font-mono text-xs font-medium">{signal5g?.cid}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-muted-foreground text-sm">RSRP / SINR</span>
                      <span className="font-medium text-sm">{signal5g?.rsrp} / {signal5g?.sinr} dB</span>
                    </div>
                  </div>
                ) : null}

                {/* LTE Section */}
                {(connectionTab === "lte" && signal4g) || (!signal5g && signal4g) ? (
                  <div className="space-y-1">
                    {!signal5g && (
                      <div className="flex items-center gap-2 pb-2">
                        <Badge variant="secondary" className="text-xs">LTE</Badge>
                        <span className="text-xs text-muted-foreground">Primary</span>
                      </div>
                    )}
                    <div className="flex justify-between py-2 border-b border-border/50">
                      <span className="text-muted-foreground text-sm">Band{signal4g?.bands.length > 1 ? "s" : ""}</span>
                      <div className="flex flex-wrap gap-1 justify-end">
                        {signal4g?.bands.map((band: string, idx: number) => (
                          <Badge key={idx} variant="secondary" className="text-xs">{band}</Badge>
                        ))}
                      </div>
                    </div>
                    {signal4g?.bands.length > 1 && (
                      <div className="flex justify-between py-2 border-b border-border/50">
                        <span className="text-muted-foreground text-sm">Carrier Aggregation</span>
                        <Badge variant="success" className="text-xs">Active ({signal4g.bands.length}x CA)</Badge>
                      </div>
                    )}
                    {cellInfo?.cell?.["4g"]?.bandwidth && (
                      <div className="flex justify-between py-2 border-b border-border/50">
                        <span className="text-muted-foreground text-sm">Bandwidth</span>
                        <Badge variant="secondary" className="text-xs">{cellInfo.cell["4g"].bandwidth}</Badge>
                      </div>
                    )}
                    <div className="flex justify-between py-2 border-b border-border/50">
                      <span className="text-muted-foreground text-sm">eNB ID</span>
                      <span className="font-mono text-xs font-medium">{signal4g?.eNBID}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-border/50">
                      <span className="text-muted-foreground text-sm">Cell ID</span>
                      <span className="font-mono text-xs font-medium">{signal4g?.cid}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-muted-foreground text-sm">RSRP / SINR</span>
                      <span className="font-medium text-sm">{signal4g?.rsrp} / {signal4g?.sinr} dB</span>
                    </div>
                  </div>
                ) : null}

                {/* Common info */}
                <div className="pt-3 border-t border-border/50">
                  <div className="flex justify-between py-2">
                    <span className="text-muted-foreground text-sm">Antenna</span>
                    <span className="font-medium text-sm">
                      {(connectionTab === "5g" ? signal5g : signal4g)?.antennaUsed?.replace(/_/g, " ") ||
                       (signal5g || signal4g)?.antennaUsed?.replace(/_/g, " ")}
                    </span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-muted-foreground text-sm">APN</span>
                    <span className="font-medium text-sm">{generic?.apn || "N/A"}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                No connection data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
