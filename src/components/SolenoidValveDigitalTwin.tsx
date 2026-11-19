import React, { useState, useEffect } from "react";
import {
  Droplets,
  Activity,
  Gauge,
  Lock,
  Unlock,
  Power,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Terminal,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ZoneValve {
  id: string;
  name: string;
  type: string;
  areaAcres: number;
  nominalFlowLpm: number;
  isOpen: boolean;
  pressureBar: number;
}

interface SolenoidValveDigitalTwinProps {
  currentMoisture: number;
  rainfallMm24h: number;
  isHoldOffRecommended: boolean;
  className?: string;
}

export function SolenoidValveDigitalTwin({
  currentMoisture,
  rainfallMm24h,
  isHoldOffRecommended,
  className = "",
}: SolenoidValveDigitalTwinProps) {
  // 3-Zone Agrarian Solenoid Manifold
  const [zones, setZones] = useState<ZoneValve[]>([
    {
      id: "zone-1",
      name: "Zone 1: Primary Root Drip Lateral",
      type: "Inline Pressure-Compensated Drip (16mm)",
      areaAcres: 1.8,
      nominalFlowLpm: 38,
      isOpen: false,
      pressureBar: 1.65,
    },
    {
      id: "zone-2",
      name: "Zone 2: Sub-Surface Furrow Drip",
      type: "Sub-surface Heavy-Wall Drip Tape",
      areaAcres: 1.2,
      nominalFlowLpm: 26,
      isOpen: false,
      pressureBar: 1.60,
    },
    {
      id: "zone-3",
      name: "Zone 3: Micro-Sprinkler & Misting",
      type: "Overhead Micro-Sprinkler Sprayers",
      areaAcres: 0.8,
      nominalFlowLpm: 18,
      isOpen: false,
      pressureBar: 2.10,
    },
  ]);

  const [safetyOverride, setSafetyOverride] = useState(false);
  const [sessionLiters, setSessionLiters] = useState(340);
  const [showPayload, setShowPayload] = useState(false);

  const isSafetyInterlockActive =
    (currentMoisture >= 32 || rainfallMm24h >= 8 || isHoldOffRecommended) && !safetyOverride;

  const anyZoneOpen = zones.some((z) => z.isOpen);
  const totalFlowLpm = zones.reduce((sum, z) => (z.isOpen ? sum + z.nominalFlowLpm : sum), 0);
  const activePressure = anyZoneOpen ? 1.68 : 0;
  const powerDrawKw = anyZoneOpen ? (0.75 + totalFlowLpm * 0.009).toFixed(2) : "0.00";

  // Simulate real-time water accumulation when valves are flowing
  useEffect(() => {
    if (!anyZoneOpen) return;
    const interval = window.setInterval(() => {
      setSessionLiters((prev) => prev + Math.round(totalFlowLpm / 60));
    }, 1000);
    return () => clearInterval(interval);
  }, [anyZoneOpen, totalFlowLpm]);

  function handleToggleZone(zoneId: string) {
    if (isSafetyInterlockActive) {
      return;
    }
    setZones((prev) =>
      prev.map((z) => (z.id === zoneId ? { ...z, isOpen: !z.isOpen } : z))
    );
  }

  function handleOpenAllSafe() {
    if (isSafetyInterlockActive) return;
    setZones((prev) => prev.map((z) => ({ ...z, isOpen: true })));
  }

  function handleEmergencyShutdown() {
    setZones((prev) => prev.map((z) => ({ ...z, isOpen: false })));
  }

  return (
    <div className={`p-5 rounded-xl bg-white/5 border border-white/10 ${className}`}>
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <Droplets size={18} />
          </div>
          <div>
            <div className="text-sm font-semibold text-white/95 flex items-center gap-2">
              Solenoid Valve Digital Twin &amp; Automated Manifold
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-medium">
                Phase C · IoT Actuation
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              Hardware twin for 12V DC latching solenoid valves with animated water flow telemetry
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-[11px] font-mono text-cyan-400 bg-white/5 px-2.5 py-1 rounded border border-white/10 flex items-center gap-1.5">
            <Activity size={12} className={anyZoneOpen ? "animate-spin text-cyan-400" : "text-white/40"} />
            {anyZoneOpen ? `FLOWING: ${totalFlowLpm} L/min` : "STANDBY (Valves Closed)"}
          </span>
        </div>
      </div>

      {/* Safety Interlock Guard Warning */}
      {isSafetyInterlockActive && (
        <div className="mt-4 p-3 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle size={15} className="text-amber-400 flex-shrink-0" />
            <span>
              <b>Hydraulic Safety Interlock Active:</b> Soil moisture ({currentMoisture}%) is above deficit threshold or rain ({rainfallMm24h} mm) is forecast. Solenoids are locked to prevent root drowning.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSafetyOverride(true)}
            className="text-[11px] px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition-colors cursor-pointer flex items-center gap-1"
          >
            <Unlock size={11} /> Manual Test Override
          </button>
        </div>
      )}

      {safetyOverride && (
        <div className="mt-4 p-2.5 rounded-lg bg-purple-500/15 border border-purple-500/30 text-purple-200 text-xs flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Unlock size={13} className="text-purple-400" />
            <b>Manual Override Engaged:</b> Safety interlocks bypassed for testing and valve verification.
          </span>
          <button
            type="button"
            onClick={() => {
              setSafetyOverride(false);
              handleEmergencyShutdown();
            }}
            className="text-[11px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40 hover:bg-purple-500/30"
          >
            Re-engage Safety Interlock
          </button>
        </div>
      )}

      {/* Hydraulic Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
        <div className="p-3 rounded-lg bg-black/30 border border-white/5">
          <div className="text-white/60 text-[11px] flex items-center gap-1">
            <Droplets size={12} className="text-cyan-400" /> Total Water Flow
          </div>
          <div className="text-lg font-bold text-white/95 mt-1 font-mono">
            {totalFlowLpm} <span className="text-xs font-normal text-white/60">L/min</span>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-black/30 border border-white/5">
          <div className="text-white/60 text-[11px] flex items-center gap-1">
            <Gauge size={12} className="text-emerald-400" /> Line Pressure
          </div>
          <div className="text-lg font-bold text-white/95 mt-1 font-mono">
            {activePressure.toFixed(2)} <span className="text-xs font-normal text-white/60">bar</span>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-black/30 border border-white/5">
          <div className="text-white/60 text-[11px] flex items-center gap-1">
            <RotateCcw size={12} className="text-blue-400" /> Session Delivered
          </div>
          <div className="text-lg font-bold text-white/95 mt-1 font-mono">
            {sessionLiters.toLocaleString()} <span className="text-xs font-normal text-white/60">L</span>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-black/30 border border-white/5">
          <div className="text-white/60 text-[11px] flex items-center gap-1">
            <Zap size={12} className="text-amber-400" /> Pump Contactor
          </div>
          <div className="text-lg font-bold text-white/95 mt-1 font-mono">
            {powerDrawKw} <span className="text-xs font-normal text-white/60">kW</span>
          </div>
        </div>
      </div>

      {/* Animated SVG Pipe & Manifold Schematic */}
      <div className="p-4 rounded-xl bg-black/40 border border-white/10 relative overflow-hidden">
        <div className="flex items-center justify-between text-xs text-white/70 mb-2 font-mono">
          <span>HYDRAULIC MANIFOLD SCHEMATIC</span>
          <span className="text-[11px] text-cyan-400">
            {anyZoneOpen ? "💧 ACTIVE WATER FLOWING" : "⏸️ ZERO HYDRAULIC PRESSURE"}
          </span>
        </div>

        <svg viewBox="0 0 680 180" className="w-full h-36 select-none" aria-hidden="true">
          <defs>
            <linearGradient id="waterGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
            <linearGradient id="pipeOff" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#334155" />
              <stop offset="100%" stopColor="#1e293b" />
            </linearGradient>
          </defs>

          {/* Main Supply Line from Pump */}
          <path
            d="M 20 90 L 140 90"
            stroke={anyZoneOpen ? "url(#waterGrad)" : "#334155"}
            strokeWidth="7"
            strokeLinecap="round"
            className={anyZoneOpen ? "pipe-active" : ""}
          />

          {/* Main 3-HP Submersible Pump Icon Container */}
          <rect x="20" y="70" width="40" height="40" rx="6" fill="#1e293b" stroke={anyZoneOpen ? "#10b981" : "#475569"} strokeWidth="2" />
          <text x="40" y="94" fill="#94a3b8" fontSize="10" textAnchor="middle" fontWeight="bold">PUMP</text>

          {/* Manifold Header Trunk */}
          <path
            d="M 140 30 L 140 150"
            stroke={anyZoneOpen ? "url(#waterGrad)" : "#334155"}
            strokeWidth="7"
            strokeLinecap="round"
            className={anyZoneOpen ? "pipe-active" : ""}
          />

          {/* Branch Line 1 -> Zone 1 */}
          <path
            d="M 140 40 L 260 40"
            stroke={zones[0]!.isOpen ? "url(#waterGrad)" : "#334155"}
            strokeWidth="5"
            strokeLinecap="round"
            className={zones[0]!.isOpen ? "pipe-active" : ""}
          />
          {/* Solenoid Valve 1 */}
          <polygon
            points="260,32 278,48 260,48 278,32"
            fill={zones[0]!.isOpen ? "#10b981" : "#ef4444"}
            stroke="#ffffff"
            strokeWidth="1.2"
          />
          <circle cx="269" cy="40" r="3" fill="#ffffff" />
          <path
            d="M 278 40 L 660 40"
            stroke={zones[0]!.isOpen ? "url(#waterGrad)" : "#1e293b"}
            strokeWidth="4"
            strokeLinecap="round"
            className={zones[0]!.isOpen ? "pipe-active" : ""}
          />
          <text x="310" y="32" fill={zones[0]!.isOpen ? "#34d399" : "#64748b"} fontSize="11" fontWeight="600">
            Zone 1: Lateral Drip (38 L/min) {zones[0]!.isOpen ? "— 💧 DISPENSING" : "— CLOSED"}
          </text>

          {/* Branch Line 2 -> Zone 2 */}
          <path
            d="M 140 90 L 260 90"
            stroke={zones[1]!.isOpen ? "url(#waterGrad)" : "#334155"}
            strokeWidth="5"
            strokeLinecap="round"
            className={zones[1]!.isOpen ? "pipe-active" : ""}
          />
          {/* Solenoid Valve 2 */}
          <polygon
            points="260,82 278,98 260,98 278,82"
            fill={zones[1]!.isOpen ? "#10b981" : "#ef4444"}
            stroke="#ffffff"
            strokeWidth="1.2"
          />
          <circle cx="269" cy="90" r="3" fill="#ffffff" />
          <path
            d="M 278 90 L 660 90"
            stroke={zones[1]!.isOpen ? "url(#waterGrad)" : "#1e293b"}
            strokeWidth="4"
            strokeLinecap="round"
            className={zones[1]!.isOpen ? "pipe-active" : ""}
          />
          <text x="310" y="82" fill={zones[1]!.isOpen ? "#34d399" : "#64748b"} fontSize="11" fontWeight="600">
            Zone 2: Furrow Bund Drip (26 L/min) {zones[1]!.isOpen ? "— 💧 DISPENSING" : "— CLOSED"}
          </text>

          {/* Branch Line 3 -> Zone 3 */}
          <path
            d="M 140 140 L 260 140"
            stroke={zones[2]!.isOpen ? "url(#waterGrad)" : "#334155"}
            strokeWidth="5"
            strokeLinecap="round"
            className={zones[2]!.isOpen ? "pipe-active" : ""}
          />
          {/* Solenoid Valve 3 */}
          <polygon
            points="260,132 278,148 260,148 278,132"
            fill={zones[2]!.isOpen ? "#10b981" : "#ef4444"}
            stroke="#ffffff"
            strokeWidth="1.2"
          />
          <circle cx="269" cy="140" r="3" fill="#ffffff" />
          <path
            d="M 278 140 L 660 140"
            stroke={zones[2]!.isOpen ? "url(#waterGrad)" : "#1e293b"}
            strokeWidth="4"
            strokeLinecap="round"
            className={zones[2]!.isOpen ? "pipe-active" : ""}
          />
          <text x="310" y="132" fill={zones[2]!.isOpen ? "#34d399" : "#64748b"} fontSize="11" fontWeight="600">
            Zone 3: Canopy Micro-Sprinkler (18 L/min) {zones[2]!.isOpen ? "— 💧 DISPENSING" : "— CLOSED"}
          </text>
        </svg>
      </div>

      {/* Individual Valve Zone Control Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
        {zones.map((zone) => (
          <div
            key={zone.id}
            className={`p-3.5 rounded-lg border transition-all ${
              zone.isOpen
                ? "bg-emerald-500/10 border-emerald-500/40 shadow-lg shadow-emerald-500/5"
                : "bg-black/30 border-white/5"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-xs text-white/95">{zone.name.split(":")[0]}</span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                  zone.isOpen ? "bg-emerald-500/20 text-emerald-300" : "bg-red-500/20 text-red-300"
                }`}
              >
                {zone.isOpen ? "VALVE OPEN" : "CLOSED"}
              </span>
            </div>

            <div className="text-[11px] text-white/70 line-clamp-1">{zone.type}</div>

            <div className="flex items-center justify-between text-xs text-white/60 my-2 pt-2 border-t border-white/5">
              <span>Coverage: {zone.areaAcres} ac</span>
              <span className="font-mono text-cyan-300">{zone.nominalFlowLpm} L/min</span>
            </div>

            <Button
              type="button"
              variant={zone.isOpen ? "destructive" : "secondary"}
              size="sm"
              disabled={isSafetyInterlockActive}
              onClick={() => handleToggleZone(zone.id)}
              className="w-full text-xs cursor-pointer mt-1"
            >
              <Power size={12} className="mr-1.5" />
              {zone.isOpen ? "Close Solenoid" : "Actuate Open"}
            </Button>
          </div>
        ))}
      </div>

      {/* Master Actuation Actions & MQTT Terminal */}
      <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-white/10 text-xs">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isSafetyInterlockActive}
            onClick={handleOpenAllSafe}
            className="text-xs text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
          >
            Open All Safe Valves
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleEmergencyShutdown}
            className="text-xs"
          >
            Emergency Shutoff
          </Button>
        </div>

        <button
          type="button"
          onClick={() => setShowPayload(!showPayload)}
          className="text-white/60 hover:text-white flex items-center gap-1.5 cursor-pointer text-[11px]"
        >
          <Terminal size={12} />
          <span>{showPayload ? "Hide MQTT Telemetry Packet" : "Inspect MQTT Actuator Packet"}</span>
        </button>
      </div>

      {/* Collapsible MQTT Packet Preview */}
      {showPayload && (
        <div className="mt-3 p-3 rounded-lg bg-black/60 border border-white/10 font-mono text-[11px] text-emerald-400 leading-relaxed overflow-x-auto">
          <div className="text-white/40 text-[10px] uppercase mb-1">// Topic: mitti/hardware/actuator/esp32-relay-01</div>
          {JSON.stringify(
            {
              timestamp: new Date().toISOString(),
              deviceId: "MITTI-ESP32-ACT-01",
              command: "SET_MANIFOLD_STATE",
              interlockSafety: !isSafetyInterlockActive,
              valves: zones.map((z) => ({ id: z.id, state: z.isOpen ? 1 : 0, flowLpm: z.isOpen ? z.nominalFlowLpm : 0 })),
              totalFlowLpm,
              pressureBar: activePressure,
              token: "SHA256_HMAC_GATED_CONFIRMATION",
            },
            null,
            2
          )}
        </div>
      )}
    </div>
  );
}
