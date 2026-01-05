"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { SignalBarChart } from "@/components/signal-chart"
import { SignalBars } from "@/components/signal-bars"
import { SignalSparkline } from "@/components/signal-sparkline"
import { RefreshControl } from "@/components/refresh-control"
import { useCellInfo, useSimInfo, useGatewayInfo } from "@/hooks/use-router-data"
import { getSignalQuality, getSinrQuality, cn } from "@/lib/utils"
import { Radio, Antenna, MapPin, CreditCard, Gauge } from "lucide-react"

const MAX_HISTORY = 30 // Keep last 30 data points

interface SignalHistory {
  rsrp: number[]
  rsrq: number[]
  sinr: number[]
  rssi: number[]
}

export default function CellPage() {
  const { data: cell, isLoading: cellLoading, mutate: mutateCell } = useCellInfo()
  const { data: sim, isLoading: simLoading, mutate: mutateSim } = useSimInfo()
  const { data: gateway } = useGatewayInfo()

  // Track signal history
  const [history, setHistory] = useState<SignalHistory>({
    rsrp: [],
    rsrq: [],
    sinr: [],
    rssi: [],
  })
  const lastValuesRef = useRef<{ rsrp?: number; rsrq?: number; sinr?: number; rssi?: number }>({})

  const handleRefresh = useCallback(() => {
    mutateCell()
    mutateSim()
  }, [mutateCell, mutateSim])

  const [cellTab, setCellTab] = useState<"5g" | "lte">("5g")
  const signal5g = cell?.cell?.["5g"]
  const signal4g = cell?.cell?.["4g"]
  const sector5g = signal5g?.sector
  const sector4g = signal4g?.sector
  const sector = cellTab === "5g" ? sector5g : sector4g
  const gps = cell?.cell?.gps
  const generic = cell?.cell?.generic

  // Update history when sector data changes (use 5G sector for history tracking)
  useEffect(() => {
    if (sector5g) {
      const { rsrp, rsrq, sinr, rssi } = sector5g
      const last = lastValuesRef.current

      // Only add to history if values actually changed
      if (rsrp !== last.rsrp || rsrq !== last.rsrq || sinr !== last.sinr || rssi !== last.rssi) {
        lastValuesRef.current = { rsrp, rsrq, sinr, rssi }

        setHistory((prev) => ({
          rsrp: [...prev.rsrp, rsrp].slice(-MAX_HISTORY),
          rsrq: [...prev.rsrq, rsrq].slice(-MAX_HISTORY),
          sinr: [...prev.sinr, sinr].slice(-MAX_HISTORY),
          rssi: [...prev.rssi, rssi].slice(-MAX_HISTORY),
        }))
      }
    }
  }, [sector5g])

  // Helper to get sparkline color based on quality
  const getRsrpColor = (value: number) => (value >= -90 ? "green" : value >= -100 ? "yellow" : "red")
  const getRsrqColor = (value: number) => (value >= -10 ? "green" : value >= -15 ? "yellow" : "red")
  const getSinrColor = (value: number) => (value >= 13 ? "green" : value >= 0 ? "yellow" : "red")
  const getRssiColor = (value: number) => (value >= -65 ? "green" : value >= -75 ? "yellow" : "red")

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Cell Information</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Detailed cellular network information{signal5g && signal4g ? " (5G + LTE)" : signal5g ? " (5G)" : signal4g ? " (LTE)" : ""}
          </p>
        </div>
        <RefreshControl onRefresh={handleRefresh} isLoading={cellLoading || simLoading} />
      </div>

      {/* Signal Quality Card */}
      <Card className="glass-card border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gauge className="h-5 w-5 text-primary" />
            Signal Quality
            {signal5g && signal4g && (
              <Badge variant="secondary" className="text-xs ml-2">+LTE</Badge>
            )}
          </CardTitle>
          <CardDescription>
            Real-time signal metrics with color-coded quality indicators
          </CardDescription>
        </CardHeader>
        <CardContent>
          {cellLoading ? (
            <div className="space-y-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ))}
            </div>
          ) : (sector5g || sector4g) ? (
            <>
              {/* Tab Toggle - only show if both 5G and LTE available */}
              {signal5g && signal4g && (
                <div className="flex rounded-lg bg-muted/50 p-1 mb-6">
                  <button
                    onClick={() => setCellTab("5g")}
                    className={cn(
                      "flex-1 py-1.5 px-3 text-sm font-medium rounded-md transition-all",
                      cellTab === "5g"
                        ? "bg-background shadow-sm text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    5G NR
                  </button>
                  <button
                    onClick={() => setCellTab("lte")}
                    className={cn(
                      "flex-1 py-1.5 px-3 text-sm font-medium rounded-md transition-all",
                      cellTab === "lte"
                        ? "bg-background shadow-sm text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    LTE
                  </button>
                </div>
              )}
              {sector ? (
            <div className="grid gap-6 lg:grid-cols-2">
              <SignalBarChart
                rsrp={sector.rsrp}
                rsrq={sector.rsrq}
                sinr={sector.sinr}
                rssi={sector.rssi}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="p-3 sm:p-4 rounded-xl bg-muted/30 flex flex-col">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-baseline gap-1 sm:gap-1.5">
                      <span className="text-2xl sm:text-3xl font-bold">{sector.rsrp}</span>
                      <span className="text-xs sm:text-sm text-muted-foreground">RSRP (dBm)</span>
                    </div>
                    <Badge variant={sector.rsrp >= -90 ? "success" : sector.rsrp >= -100 ? "warning" : "destructive"} className="text-xs">
                      {getSignalQuality(sector.rsrp).label}
                    </Badge>
                  </div>
                  <div className="flex-1 mt-2 min-h-[50px] sm:min-h-[60px] w-full">
                    <SignalSparkline
                      data={history.rsrp}
                      color={getRsrpColor(sector.rsrp)}
                      className="w-full"
                    />
                  </div>
                </div>
                <div className="p-3 sm:p-4 rounded-xl bg-muted/30 flex flex-col">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-baseline gap-1 sm:gap-1.5">
                      <span className="text-2xl sm:text-3xl font-bold">{sector.rsrq}</span>
                      <span className="text-xs sm:text-sm text-muted-foreground">RSRQ (dB)</span>
                    </div>
                    <Badge variant={sector.rsrq >= -10 ? "success" : sector.rsrq >= -15 ? "warning" : "destructive"} className="text-xs">
                      {sector.rsrq >= -10 ? "Good" : sector.rsrq >= -15 ? "Fair" : "Poor"}
                    </Badge>
                  </div>
                  <div className="flex-1 mt-2 min-h-[50px] sm:min-h-[60px] w-full">
                    <SignalSparkline
                      data={history.rsrq}
                      color={getRsrqColor(sector.rsrq)}
                      className="w-full"
                    />
                  </div>
                </div>
                <div className="p-3 sm:p-4 rounded-xl bg-muted/30 flex flex-col">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-baseline gap-1 sm:gap-1.5">
                      <span className="text-2xl sm:text-3xl font-bold">{sector.sinr}</span>
                      <span className="text-xs sm:text-sm text-muted-foreground">SINR (dB)</span>
                    </div>
                    <Badge variant={sector.sinr >= 13 ? "success" : sector.sinr >= 0 ? "warning" : "destructive"} className="text-xs">
                      {getSinrQuality(sector.sinr).label}
                    </Badge>
                  </div>
                  <div className="flex-1 mt-2 min-h-[50px] sm:min-h-[60px] w-full">
                    <SignalSparkline
                      data={history.sinr}
                      color={getSinrColor(sector.sinr)}
                      className="w-full"
                    />
                  </div>
                </div>
                <div className="p-3 sm:p-4 rounded-xl bg-muted/30 flex flex-col">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-baseline gap-1 sm:gap-1.5">
                      <span className="text-2xl sm:text-3xl font-bold">{sector.rssi}</span>
                      <span className="text-xs sm:text-sm text-muted-foreground">RSSI (dBm)</span>
                    </div>
                    <Badge variant={sector.rssi >= -65 ? "success" : sector.rssi >= -75 ? "warning" : "destructive"} className="text-xs">
                      {sector.rssi >= -65 ? "Excellent" : sector.rssi >= -75 ? "Good" : "Fair"}
                    </Badge>
                  </div>
                  <div className="flex-1 mt-2 min-h-[50px] sm:min-h-[60px] w-full">
                    <SignalSparkline
                      data={history.rssi}
                      color={getRssiColor(sector.rssi)}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            </div>
              ) : (
                <div className="py-12 text-center text-muted-foreground">
                  No {cellTab === "5g" ? "5G" : "LTE"} signal data available
                </div>
              )}
            </>
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              No cell signal data available
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
        {/* Tower Information */}
        <Card className="glass-card border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Antenna className="h-5 w-5 text-primary" />
              Tower Information
              {signal5g && signal4g && (
                <Badge variant={cellTab === "5g" ? "blue" : "secondary"} className="text-xs ml-2">
                  {cellTab === "5g" ? "5G NR" : "LTE"}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Connected cell tower details
            </CardDescription>
          </CardHeader>
          <CardContent>
            {cellLoading ? (
              <div className="space-y-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="flex justify-between p-3 rounded-xl bg-muted/30">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                ))}
              </div>
            ) : sector ? (
              <div className="space-y-3">
                <div className="flex justify-between p-3 rounded-xl bg-muted/30">
                  <span className="text-muted-foreground">Band{sector.bands.length > 1 ? "s" : ""}</span>
                  <div className="flex flex-wrap gap-1 justify-end">
                    {sector.bands.map((band: string, idx: number) => (
                      <Badge key={idx} variant={cellTab === "5g" ? "blue" : "secondary"} className="text-xs">
                        {band}
                      </Badge>
                    ))}
                  </div>
                </div>
                {cellTab === "lte" && sector.bands.length > 1 && (
                  <div className="flex justify-between p-3 rounded-xl bg-muted/30">
                    <span className="text-muted-foreground">Carrier Aggregation</span>
                    <Badge variant="success" className="text-xs">Active ({sector.bands.length}x CA)</Badge>
                  </div>
                )}
                <div className="flex justify-between p-3 rounded-xl bg-muted/30">
                  <span className="text-muted-foreground">Bandwidth</span>
                  <Badge variant={cellTab === "5g" ? "blue" : "secondary"} className="text-xs">
                    {cellTab === "5g" ? (signal5g?.bandwidth || "N/A") : (signal4g?.bandwidth || "N/A")}
                  </Badge>
                </div>
                <div className="flex justify-between p-3 rounded-xl bg-muted/30">
                  <span className="text-muted-foreground">{cellTab === "5g" ? "gNB ID" : "eNB ID"}</span>
                  <span className="font-mono text-sm font-medium">
                    {cellTab === "5g" ? sector.gNBID : (sector4g?.eNBID || sector.gNBID)}
                  </span>
                </div>
                <div className="flex justify-between p-3 rounded-xl bg-muted/30">
                  <span className="text-muted-foreground">Cell ID</span>
                  <span className="font-mono text-sm font-medium">{sector.cid}</span>
                </div>
                <div className="flex justify-between p-3 rounded-xl bg-muted/30">
                  <span className="text-muted-foreground">PCI</span>
                  <span className="font-mono text-sm font-medium">
                    {cellTab === "5g" ? (signal5g?.pci || "N/A") : (signal4g?.pci || "N/A")}
                  </span>
                </div>
                <div className="flex justify-between p-3 rounded-xl bg-muted/30">
                  <span className="text-muted-foreground">TAC</span>
                  <span className="font-mono text-sm font-medium">
                    {cellTab === "5g" ? (signal5g?.tac || "N/A") : (signal4g?.tac || "N/A")}
                  </span>
                </div>
                <div className="flex justify-between p-3 rounded-xl bg-muted/30">
                  <span className="text-muted-foreground">PLMN</span>
                  <span className="font-mono text-sm font-medium">
                    {cellTab === "5g" ? (signal5g?.plmn || "N/A") : (signal4g?.plmn || "N/A")}
                  </span>
                </div>
                <div className="flex justify-between p-3 rounded-xl bg-muted/30">
                  <span className="text-muted-foreground">ECGI</span>
                  <span className="font-mono text-xs font-medium">
                    {cellTab === "5g" ? (signal5g?.ecgi || "N/A") : (signal4g?.ecgi || "N/A")}
                  </span>
                </div>
                <div className="flex justify-between p-3 rounded-xl bg-muted/30">
                  <span className="text-muted-foreground">CQI</span>
                  <span className="font-medium">
                    {cellTab === "5g" ? (signal5g?.cqi || "N/A") : (signal4g?.cqi || "N/A")}
                  </span>
                </div>
                <div className="flex justify-between p-3 rounded-xl bg-muted/30">
                  <span className="text-muted-foreground">Signal Bars</span>
                  <div className="flex items-center gap-2">
                    <SignalBars bars={Math.round(sector.bars)} size="sm" />
                    <span className="text-sm">{sector.bars}/5</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                No tower data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* SIM Information */}
        <Card className="glass-card border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              SIM Information
            </CardTitle>
            <CardDescription>
              SIM card and subscriber details
            </CardDescription>
          </CardHeader>
          <CardContent>
            {simLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex justify-between p-3 rounded-xl bg-muted/30">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                ))}
              </div>
            ) : sim?.sim ? (
              <div className="space-y-3">
                <div className="flex justify-between p-3 rounded-xl bg-muted/30">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant={sim.sim.status ? "success" : "destructive"}>
                    {sim.sim.status ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="flex justify-between p-3 rounded-xl bg-muted/30">
                  <span className="text-muted-foreground">ICCID</span>
                  <span className="font-mono text-xs font-medium">{sim.sim.iccId}</span>
                </div>
                <div className="flex justify-between p-3 rounded-xl bg-muted/30">
                  <span className="text-muted-foreground">IMEI</span>
                  <span className="font-mono text-xs font-medium">{sim.sim.imei}</span>
                </div>
                <div className="flex justify-between p-3 rounded-xl bg-muted/30">
                  <span className="text-muted-foreground">IMSI</span>
                  <span className="font-mono text-xs font-medium">{sim.sim.imsi}</span>
                </div>
                <div className="flex justify-between p-3 rounded-xl bg-muted/30">
                  <span className="text-muted-foreground">Phone Number</span>
                  <span className="font-medium">{sim.sim.msisdn || "Not available"}</span>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                No SIM data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Connection Details */}
        <Card className="glass-card border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Radio className="h-5 w-5 text-primary" />
              Connection Details
            </CardTitle>
            <CardDescription>
              Network connection information
            </CardDescription>
          </CardHeader>
          <CardContent>
            {cellLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex justify-between p-3 rounded-xl bg-muted/30">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                ))}
              </div>
            ) : generic ? (
              <div className="space-y-3">
                <div className="flex justify-between p-3 rounded-xl bg-muted/30">
                  <span className="text-muted-foreground">Registration</span>
                  <Badge variant={generic.registration === "registered" ? "success" : "secondary"}>
                    {generic.registration}
                  </Badge>
                </div>
                <div className="flex justify-between p-3 rounded-xl bg-muted/30">
                  <span className="text-muted-foreground">Roaming</span>
                  <Badge variant={generic.roaming ? "warning" : "success"}>
                    {generic.roaming ? "Yes" : "No"}
                  </Badge>
                </div>
                <div className="flex justify-between p-3 rounded-xl bg-muted/30">
                  <span className="text-muted-foreground">APN</span>
                  <span className="font-medium">{generic.apn}</span>
                </div>
                <div className="flex justify-between p-3 rounded-xl bg-muted/30">
                  <span className="text-muted-foreground">IPv6</span>
                  <Badge variant={generic.hasIPv6 ? "success" : "secondary"}>
                    {generic.hasIPv6 ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                No connection data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* GPS Location */}
        <Card className="glass-card border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              GPS Location
            </CardTitle>
            <CardDescription>
              Gateway location (if available)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {cellLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-32" />
              </div>
            ) : gps && (gps.latitude !== 0 || gps.longitude !== 0) ? (
              <div className="space-y-3">
                <div className="flex justify-between p-3 rounded-xl bg-muted/30">
                  <span className="text-muted-foreground">Latitude</span>
                  <span className="font-mono font-medium">{gps.latitude.toFixed(6)}</span>
                </div>
                <div className="flex justify-between p-3 rounded-xl bg-muted/30">
                  <span className="text-muted-foreground">Longitude</span>
                  <span className="font-mono font-medium">{gps.longitude.toFixed(6)}</span>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center">
                <div className="h-12 w-12 rounded-xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
                  <MapPin className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">GPS location not available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
