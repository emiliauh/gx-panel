"use client"

import { useState, useCallback, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { RefreshControl } from "@/components/refresh-control"
import { useGatewayInfo, useCellInfo, useSimInfo, useTelemetryAll } from "@/hooks/use-router-data"
import {
  Bug,
  Database,
  Satellite,
  CreditCard,
  Smartphone,
  MapPin,
  Radio,
  Wifi,
  Copy,
  CheckCircle2,
  Activity,
  Clock,
} from "lucide-react"

export default function DiagnosticPage() {
  const { data: gateway, isLoading: gatewayLoading, mutate: mutateGateway } = useGatewayInfo()
  const { data: cell, isLoading: cellLoading, mutate: mutateCell } = useCellInfo()
  const { data: sim, isLoading: simLoading, mutate: mutateSim } = useSimInfo()
  const { data: telemetry, isLoading: telemetryLoading, mutate: mutateTelemetry } = useTelemetryAll()
  
  const [copied, setCopied] = useState<string | null>(null)
  const [authInfo, setAuthInfo] = useState<{token: string, expiration: number | null, ip: string} | null>(null)

  useEffect(() => {
    // Get auth info from localStorage
    const token = localStorage.getItem("tmo_auth_token") || ""
    const ip = localStorage.getItem("tmo_router_ip") || ""
    setAuthInfo({ token, expiration: null, ip })
  }, [])

  const handleRefresh = useCallback(() => {
    mutateGateway()
    mutateCell()
    mutateSim()
    mutateTelemetry()
  }, [mutateGateway, mutateCell, mutateSim, mutateTelemetry])

  const copyToClipboard = async (text: string, id: string) => {
    try {
      // Try modern clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text)
      } else {
        // Fallback for older browsers or non-secure contexts
        const textArea = document.createElement("textarea")
        textArea.value = text
        textArea.style.position = "fixed"
        textArea.style.left = "-999999px"
        textArea.style.top = "-999999px"
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        document.execCommand('copy')
        textArea.remove()
      }
      setCopied(id)
      setTimeout(() => setCopied(null), 2000)
    } catch (err) {
      console.error('Failed to copy text:', err)
    }
  }

  const formatJson = (data: any) => {
    return JSON.stringify(data, null, 2)
  }

  const isLoading = gatewayLoading || cellLoading || simLoading || telemetryLoading

  // Extract GPS coordinates
  const gps = cell?.cell?.gps || telemetry?.cell?.gps
  
  // Extract CQI (Channel Quality Indicator)
  const cqi = cell?.cell?.["5g"]?.cqi || telemetry?.cell?.["5g"]?.cqi
  
  // Extract ECGI
  const ecgi = cell?.cell?.["5g"]?.ecgi || telemetry?.cell?.["5g"]?.ecgi

  // Extract SIM info
  const simInfo = sim?.sim || telemetry?.sim

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
            <Bug className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            Diagnostic & Debug
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Advanced engineering data and raw API responses
          </p>
        </div>
        <RefreshControl onRefresh={handleRefresh} isLoading={isLoading} />
      </div>

      {/* Engineering Metrics */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {/* GPS Location */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              GPS Location
            </CardTitle>
          </CardHeader>
          <CardContent>
            {cellLoading || telemetryLoading ? (
              <Skeleton className="h-16 w-full" />
            ) : gps ? (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Latitude</span>
                  <span className="font-mono">{gps.latitude?.toFixed(6) || "N/A"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Longitude</span>
                  <span className="font-mono">{gps.longitude?.toFixed(6) || "N/A"}</span>
                </div>
                {gps.latitude && gps.longitude && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => window.open(`https://www.google.com/maps?q=${gps.latitude},${gps.longitude}`, '_blank')}
                  >
                    View on Map
                  </Button>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No GPS data available</p>
            )}
          </CardContent>
        </Card>

        {/* CQI */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Channel Quality (CQI)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {cellLoading || telemetryLoading ? (
              <Skeleton className="h-16 w-full" />
            ) : cqi !== undefined ? (
              <div className="space-y-2">
                <div className="text-3xl font-bold">{cqi}</div>
                <p className="text-xs text-muted-foreground">0-15 scale (higher is better)</p>
                <Badge variant={cqi >= 10 ? "success" : cqi >= 7 ? "warning" : "destructive"}>
                  {cqi >= 10 ? "Excellent" : cqi >= 7 ? "Good" : "Poor"}
                </Badge>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No CQI data available</p>
            )}
          </CardContent>
        </Card>

        {/* ECGI */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Radio className="h-4 w-4" />
              Cell Global ID (ECGI)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {cellLoading || telemetryLoading ? (
              <Skeleton className="h-16 w-full" />
            ) : ecgi ? (
              <div className="space-y-2">
                <div className="font-mono text-sm break-all">{ecgi}</div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={() => copyToClipboard(ecgi, 'ecgi')}
                >
                  {copied === 'ecgi' ? (
                    <>
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3 mr-1" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No ECGI data available</p>
            )}
          </CardContent>
        </Card>

        {/* SIM ICCID */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              SIM ICCID
            </CardTitle>
          </CardHeader>
          <CardContent>
            {simLoading || telemetryLoading ? (
              <Skeleton className="h-16 w-full" />
            ) : simInfo?.iccId ? (
              <div className="space-y-2">
                <div className="font-mono text-xs break-all">{simInfo.iccId}</div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={() => copyToClipboard(simInfo.iccId, 'iccid')}
                >
                  {copied === 'iccid' ? (
                    <>
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3 mr-1" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No SIM data available</p>
            )}
          </CardContent>
        </Card>

        {/* IMEI */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              IMEI
            </CardTitle>
          </CardHeader>
          <CardContent>
            {simLoading || telemetryLoading ? (
              <Skeleton className="h-16 w-full" />
            ) : simInfo?.imei ? (
              <div className="space-y-2">
                <div className="font-mono text-sm">{simInfo.imei}</div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={() => copyToClipboard(simInfo.imei, 'imei')}
                >
                  {copied === 'imei' ? (
                    <>
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3 mr-1" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No IMEI data available</p>
            )}
          </CardContent>
        </Card>

        {/* IMSI */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              IMSI
            </CardTitle>
          </CardHeader>
          <CardContent>
            {simLoading || telemetryLoading ? (
              <Skeleton className="h-16 w-full" />
            ) : simInfo?.imsi ? (
              <div className="space-y-2">
                <div className="font-mono text-sm">{simInfo.imsi}</div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={() => copyToClipboard(simInfo.imsi, 'imsi')}
                >
                  {copied === 'imsi' ? (
                    <>
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3 mr-1" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No IMSI data available</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Auth Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Authentication Info
          </CardTitle>
          <CardDescription>Current session details</CardDescription>
        </CardHeader>
        <CardContent>
          {authInfo ? (
            <div className="space-y-3">
              <div className="flex justify-between items-start py-2 border-b border-border/50">
                <span className="text-sm text-muted-foreground">Router IP</span>
                <span className="font-mono text-sm font-medium">{authInfo.ip}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 py-2 border-b border-border/50">
                <span className="text-sm text-muted-foreground">Token</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs truncate max-w-[150px] sm:max-w-[200px]">{authInfo.token.substring(0, 20)}...</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(authInfo.token, 'token')}
                  >
                    {copied === 'token' ? <CheckCircle2 className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <Skeleton className="h-24 w-full" />
          )}
        </CardContent>
      </Card>

      {/* Raw API Responses */}
      <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
        {/* Gateway Response */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Satellite className="h-4 w-4" />
              Gateway API Response
            </CardTitle>
          </CardHeader>
          <CardContent>
            {gatewayLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : gateway ? (
              <div className="space-y-2">
                <div className="relative">
                  <pre className="text-[10px] sm:text-xs bg-muted p-2 sm:p-4 rounded-lg overflow-auto max-h-64 sm:max-h-96 font-mono">
                    {formatJson(gateway)}
                  </pre>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard(formatJson(gateway), 'gateway')}
                  >
                    {copied === 'gateway' ? (
                      <>
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3 mr-1" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No data available</p>
            )}
          </CardContent>
        </Card>

        {/* Telemetry Response */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-4 w-4" />
              Telemetry API Response
            </CardTitle>
          </CardHeader>
          <CardContent>
            {telemetryLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : telemetry ? (
              <div className="space-y-2">
                <div className="relative">
                  <pre className="text-[10px] sm:text-xs bg-muted p-2 sm:p-4 rounded-lg overflow-auto max-h-64 sm:max-h-96 font-mono">
                    {formatJson(telemetry)}
                  </pre>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard(formatJson(telemetry), 'telemetry')}
                  >
                    {copied === 'telemetry' ? (
                      <>
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3 mr-1" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No data available</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
