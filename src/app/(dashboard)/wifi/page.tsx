"use client"

import { useState, useCallback, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { RefreshControl } from "@/components/refresh-control"
import { useApConfig } from "@/hooks/use-router-data"
import { getAuthHeaders } from "@/lib/client-auth"
import { Wifi, Eye, EyeOff, Save, Radio, Shield, Antenna, AlertCircle, AlertTriangle } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import type { ApConfig } from "@/lib/router-api"

export default function WifiPage() {
  const { data, isLoading, mutate } = useApConfig()
  const [showPassword, setShowPassword] = useState(false)
  const [saving, setSaving] = useState(false)
  const [localConfig, setLocalConfig] = useState<ApConfig | null>(null)
  const [hasChanges, setHasChanges] = useState(false)
  const [show5GHzWarning, setShow5GHzWarning] = useState(false)
  const [warningConfirmed, setWarningConfirmed] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Sync local config with fetched data
  useEffect(() => {
    if (data && !localConfig) {
      setLocalConfig(data)
    }
  }, [data, localConfig])

  // Reset local config when data changes (after save or refresh)
  useEffect(() => {
    if (data) {
      setLocalConfig(data)
      setHasChanges(false)
    }
  }, [data])

  const ssid = localConfig?.ssids?.[0]

  const handleRefresh = useCallback(() => {
    setLocalConfig(null)
    setHasChanges(false)
    mutate()
  }, [mutate])

  // Count enabled bands for SSID
  const countEnabledSsidBands = () => {
    if (!ssid) return 0
    let count = 0
    if (ssid["2.4ghzSsid"]) count++
    if (ssid["5.0ghzSsid"]) count++
    if (ssid["6.0ghzSsid"]) count++
    return count
  }

  // Toggle SSID band with validation (at least one must be enabled)
  const toggleSsidBand = (band: "2.4ghzSsid" | "5.0ghzSsid" | "6.0ghzSsid") => {
    if (!localConfig || !ssid) return

    const currentValue = ssid[band]
    // If trying to disable and this is the last enabled band, don't allow
    if (currentValue && countEnabledSsidBands() <= 1) {
      return
    }

    const updatedSsids = [...localConfig.ssids]
    updatedSsids[0] = {
      ...updatedSsids[0],
      [band]: !currentValue,
    }

    setLocalConfig({
      ...localConfig,
      ssids: updatedSsids,
    })
    setHasChanges(true)
  }

  // Toggle radio band
  const toggleRadioBand = (band: "2.4ghz" | "5.0ghz" | "6.0ghz") => {
    if (!localConfig) return

    const currentValue = localConfig[band]?.isRadioEnabled

    // Show warning if trying to disable 5 GHz
    if (band === "5.0ghz" && currentValue === true) {
      setShow5GHzWarning(true)
      setWarningConfirmed(false)
      return
    }

    applyRadioBandToggle(band)
  }

  // Actually apply the radio band toggle
  const applyRadioBandToggle = (band: "2.4ghz" | "5.0ghz" | "6.0ghz") => {
    if (!localConfig) return

    const currentValue = localConfig[band]?.isRadioEnabled

    setLocalConfig({
      ...localConfig,
      [band]: {
        ...localConfig[band],
        isRadioEnabled: !currentValue,
      },
    })
    setHasChanges(true)
  }

  // Confirm 5 GHz disable
  const confirm5GHzDisable = () => {
    setShow5GHzWarning(false)
    setWarningConfirmed(false)
    applyRadioBandToggle("5.0ghz")
  }

  // Cancel 5 GHz disable
  const cancel5GHzDisable = () => {
    setShow5GHzWarning(false)
    setWarningConfirmed(false)
  }

  // Toggle broadcast SSID
  const toggleBroadcast = () => {
    if (!localConfig || !ssid) return

    const updatedSsids = [...localConfig.ssids]
    updatedSsids[0] = {
      ...updatedSsids[0],
      isBroadcastEnabled: !ssid.isBroadcastEnabled,
    }

    setLocalConfig({
      ...localConfig,
      ssids: updatedSsids,
    })
    setHasChanges(true)
  }

  // Update SSID name
  const updateSsidName = (name: string) => {
    if (!localConfig || !ssid) return

    const updatedSsids = [...localConfig.ssids]
    updatedSsids[0] = {
      ...updatedSsids[0],
      ssidName: name,
    }

    setLocalConfig({
      ...localConfig,
      ssids: updatedSsids,
    })
    setHasChanges(true)
  }

  // Update password
  const updatePassword = (password: string) => {
    if (!localConfig || !ssid) return

    const updatedSsids = [...localConfig.ssids]
    updatedSsids[0] = {
      ...updatedSsids[0],
      wpaKey: password,
    }

    setLocalConfig({
      ...localConfig,
      ssids: updatedSsids,
    })
    setHasChanges(true)
  }

  const handleSave = async () => {
    if (!localConfig || !hasChanges) return

    setSaving(true)
    setSaveError(null)
    try {
      const response = await fetch("/api/router/ap", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify(localConfig),
      })

      if (response.ok) {
        setHasChanges(false)
        setSaveError(null)
        // Wait a bit for the gateway to apply changes
        await new Promise((resolve) => setTimeout(resolve, 2000))
        mutate()
      } else {
        // Try to parse error response
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error || errorData.message || `Failed to save (${response.status})`

        // Check for common gateway errors and provide user-friendly messages
        if (errorMessage.toLowerCase().includes("wifi driver is busy") ||
            errorMessage.toLowerCase().includes("driver is busy")) {
          setSaveError("The gateway's WiFi driver is currently busy processing another request. Please wait a few seconds and try again.")
        } else if (errorMessage.toLowerCase().includes("not authenticated")) {
          setSaveError("Session expired. Please log in again.")
        } else {
          setSaveError(errorMessage)
        }
      }
    } catch (error) {
      console.error("Error saving WiFi config:", error)
      setSaveError("Unable to connect to the gateway. Please check your connection and try again.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">WiFi Settings</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Manage your wireless network configuration
          </p>
        </div>
        <div className="flex gap-2 sm:gap-3">
          <RefreshControl onRefresh={handleRefresh} isLoading={isLoading} />
          <Button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="gradient-bg border-0 text-white h-9 flex-1 sm:flex-none"
          >
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      {hasChanges && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0" />
          <span className="text-xs sm:text-sm text-amber-600 dark:text-amber-400">
            You have unsaved changes. Click Save to apply them.
          </span>
        </div>
      )}

      {saveError && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/30">
          <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-destructive text-sm sm:text-base">Failed to save settings</h4>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">{saveError}</p>
          </div>
          <button
            onClick={() => setSaveError(null)}
            className="text-muted-foreground hover:text-foreground transition-colors p-1"
          >
            <span className="sr-only">Dismiss</span>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
        {/* Radio Status */}
        <Card className="glass-card border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Radio className="h-5 w-5 text-primary" />
              Radio Status
            </CardTitle>
            <CardDescription>
              Enable or disable WiFi frequency bands
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-muted/30">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-6 w-11" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4 p-3 sm:p-4 rounded-xl bg-muted/30">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                      <Antenna className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />
                    </div>
                    <div className="min-w-0">
                      <Label className="font-medium text-sm sm:text-base">2.4 GHz</Label>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">
                        Better range
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={localConfig?.["2.4ghz"]?.isRadioEnabled ?? false}
                    onCheckedChange={() => toggleRadioBand("2.4ghz")}
                  />
                </div>
                <div className="flex items-center justify-between gap-4 p-3 sm:p-4 rounded-xl bg-muted/30">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                      <Antenna className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                    </div>
                    <div className="min-w-0">
                      <Label className="font-medium text-sm sm:text-base">5 GHz</Label>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">
                        Faster speeds
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={localConfig?.["5.0ghz"]?.isRadioEnabled ?? false}
                    onCheckedChange={() => toggleRadioBand("5.0ghz")}
                  />
                </div>
                {localConfig?.["6.0ghz"] && (
                  <div className="flex items-center justify-between gap-4 p-3 sm:p-4 rounded-xl bg-muted/30">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                        <Antenna className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
                      </div>
                      <div className="min-w-0">
                        <Label className="font-medium text-sm sm:text-base">6 GHz</Label>
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">
                          Ultra fast
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={localConfig?.["6.0ghz"]?.isRadioEnabled ?? false}
                      onCheckedChange={() => toggleRadioBand("6.0ghz")}
                    />
                  </div>
                )}

                {/* 5 GHz Warning Dialog */}
                {show5GHzWarning && (
                  <div className="mt-4 p-4 rounded-xl bg-destructive/10 border border-destructive/30 space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-lg bg-destructive/20 flex items-center justify-center flex-shrink-0">
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-semibold text-destructive text-sm sm:text-base">
                          Warning: Disabling 5 GHz Radio
                        </h4>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          Disabling the 5 GHz radio may cause connectivity issues and could prevent the gateway from booting properly in some cases. Most modern devices rely on 5 GHz for optimal performance.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 pl-1">
                      <Checkbox
                        id="confirm-5ghz-disable"
                        checked={warningConfirmed}
                        onCheckedChange={(checked) => setWarningConfirmed(checked)}
                      />
                      <label
                        htmlFor="confirm-5ghz-disable"
                        className="text-xs sm:text-sm text-muted-foreground cursor-pointer leading-tight"
                      >
                        I understand the risks and want to disable the 5 GHz radio anyway
                      </label>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 pt-2">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={confirm5GHzDisable}
                        disabled={!warningConfirmed}
                        className="w-full sm:w-auto"
                      >
                        Disable 5 GHz
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={cancel5GHzDisable}
                        className="w-full sm:w-auto"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Network Configuration */}
        <Card className="glass-card border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wifi className="h-5 w-5 text-primary" />
              Network Configuration
            </CardTitle>
            <CardDescription>
              Configure your WiFi network name and password
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full rounded-xl" />
                <Skeleton className="h-12 w-full rounded-xl" />
              </div>
            ) : ssid ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="ssid">Network Name (SSID)</Label>
                  <Input
                    id="ssid"
                    value={ssid.ssidName}
                    onChange={(e) => updateSsidName(e.target.value)}
                    placeholder="Enter network name"
                    className="h-12 rounded-xl bg-muted/30 border-border/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={ssid.wpaKey}
                      onChange={(e) => updatePassword(e.target.value)}
                      placeholder="Enter password"
                      className="h-12 rounded-xl bg-muted/30 border-border/50 pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-4 p-3 sm:p-4 rounded-xl bg-muted/30">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Wifi className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <Label className="font-medium text-sm sm:text-base">Broadcast SSID</Label>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">
                        Network visible
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={ssid.isBroadcastEnabled}
                    onCheckedChange={toggleBroadcast}
                  />
                </div>
              </>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                No network configuration found
              </div>
            )}
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card className="glass-card border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Security Settings
            </CardTitle>
            <CardDescription>
              View your network security configuration
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex justify-between p-3 rounded-xl bg-muted/30">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                ))}
              </div>
            ) : ssid ? (
              <div className="space-y-3">
                <div className="flex justify-between p-3 rounded-xl bg-muted/30">
                  <span className="text-muted-foreground">Encryption</span>
                  <Badge variant="blue">{ssid.encryptionVersion}</Badge>
                </div>
                <div className="flex justify-between p-3 rounded-xl bg-muted/30">
                  <span className="text-muted-foreground">Encryption Mode</span>
                  <span className="font-medium">{ssid.encryptionMode}</span>
                </div>
                <div className="flex justify-between p-3 rounded-xl bg-muted/30">
                  <span className="text-muted-foreground">Guest Network</span>
                  <Badge variant={ssid.guest ? "success" : "secondary"}>
                    {ssid.guest ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* Advanced Settings */}
        <Card className="glass-card border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Antenna className="h-5 w-5 text-primary" />
              Advanced Settings
            </CardTitle>
            <CardDescription>
              WiFi performance and channel configuration
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex justify-between p-3 rounded-xl bg-muted/30">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                ))}
              </div>
            ) : localConfig ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex justify-between p-3 rounded-xl bg-muted/30">
                  <span className="text-muted-foreground text-sm">2.4 GHz Channel</span>
                  <span className="font-medium text-sm">{localConfig["2.4ghz"]?.channel || "Auto"}</span>
                </div>
                <div className="flex justify-between p-3 rounded-xl bg-muted/30">
                  <span className="text-muted-foreground text-sm">2.4 GHz Power</span>
                  <Badge variant="secondary">{localConfig["2.4ghz"]?.transmissionPower || "100%"}</Badge>
                </div>
                <div className="flex justify-between p-3 rounded-xl bg-muted/30">
                  <span className="text-muted-foreground text-sm">5 GHz Channel</span>
                  <span className="font-medium text-sm">{localConfig["5.0ghz"]?.channel || "Auto"}</span>
                </div>
                <div className="flex justify-between p-3 rounded-xl bg-muted/30">
                  <span className="text-muted-foreground text-sm">5 GHz Power</span>
                  <Badge variant="secondary">{localConfig["5.0ghz"]?.transmissionPower || "100%"}</Badge>
                </div>
                <div className="flex justify-between p-3 rounded-xl bg-muted/30">
                  <span className="text-muted-foreground text-sm">Band Steering</span>
                  <Badge variant={localConfig.bandSteering?.isEnabled ? "success" : "secondary"}>
                    {localConfig.bandSteering?.isEnabled ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
                <div className="flex justify-between p-3 rounded-xl bg-muted/30">
                  <span className="text-muted-foreground text-sm">Max Clients</span>
                  <span className="font-medium text-sm">{localConfig["2.4ghz"]?.maxClients || 128}</span>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* Band Configuration */}
        <Card className="glass-card border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Antenna className="h-5 w-5 text-primary" />
              Band Configuration
            </CardTitle>
            <CardDescription>
              Configure which bands your SSID broadcasts on
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-muted/30">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-6 w-11" />
                  </div>
                ))}
              </div>
            ) : ssid ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4 p-3 sm:p-4 rounded-xl bg-muted/30">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                      <Antenna className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />
                    </div>
                    <Label className="font-medium text-sm sm:text-base">2.4 GHz SSID</Label>
                  </div>
                  <Switch
                    checked={ssid["2.4ghzSsid"]}
                    onCheckedChange={() => toggleSsidBand("2.4ghzSsid")}
                    disabled={ssid["2.4ghzSsid"] && countEnabledSsidBands() <= 1}
                  />
                </div>
                <div className="flex items-center justify-between gap-4 p-3 sm:p-4 rounded-xl bg-muted/30">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                      <Antenna className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                    </div>
                    <Label className="font-medium text-sm sm:text-base">5 GHz SSID</Label>
                  </div>
                  <Switch
                    checked={ssid["5.0ghzSsid"]}
                    onCheckedChange={() => toggleSsidBand("5.0ghzSsid")}
                    disabled={ssid["5.0ghzSsid"] && countEnabledSsidBands() <= 1}
                  />
                </div>
                {ssid["6.0ghzSsid"] !== undefined && (
                  <div className="flex items-center justify-between gap-4 p-3 sm:p-4 rounded-xl bg-muted/30">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                        <Antenna className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
                      </div>
                      <Label className="font-medium text-sm sm:text-base">6 GHz SSID</Label>
                    </div>
                    <Switch
                      checked={ssid["6.0ghzSsid"]}
                      onCheckedChange={() => toggleSsidBand("6.0ghzSsid")}
                      disabled={ssid["6.0ghzSsid"] && countEnabledSsidBands() <= 1}
                    />
                  </div>
                )}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
