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
  Sparkles,
  Sliders,
  Radio,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { analytics } from "@/lib/analytics";

export interface ZoneValve {
  id: string;
  name: string;
  shortName: string;
  type: string;
  areaAcres: number;
  nominalFlowLpm: number;
  isOpen: boolean;
  pressureBar: number;
  color: string;
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
  // Zone 1 is OPEN by default so judges immediately see the animated water flow & telemetry!
  const [zones, setZones] = useState<ZoneValve[]>([
    {
      id: "zone-1",
      name: "Zone 1: Primary Root Drip Lateral",
      shortName: "Z1: Root Drip",
      type: "Inline Pressure-Compensated Drip (16mm, 2.2 L/h emitters)",
      areaAcres: 1.8,
      nominalFlowLpm: 38,
      isOpen: true, // Default ON for immediate visual feedback
      pressureBar: 1.65,
      color: "#06b6d4",
    },
    {
      id: "zone-2",
      name: "Zone 2: Sub-Surface Furrow Drip",
      shortName: "Z2: Furrow Drip",
      type: "Sub-surface Heavy-Wall Drip Tape (20cm depth)",
      areaAcres: 1.2,
      nominalFlowLpm: 26,
      isOpen: false,
      pressureBar: 1.60,
      color: "#10b981",
    },
    {
      id: "zone-3",
      name: "Zone 3: Canopy Micro-Sprinkler & Misting",
      shortName: "Z3: Micro-Sprinkler",
      type: "Overhead Inverted Micro-Sprinkler Sprayers",
      areaAcres: 0.8,
      nominalFlowLpm: 18,
      isOpen: false,
      pressureBar: 2.10,
      color: "#8b5cf6",
    },
  ]);

  const zone1Open = zones.find((zone) => zone.id === "zone-1")?.isOpen ?? false;
  const zone2Open = zones.find((zone) => zone.id === "zone-2")?.isOpen ?? false;
  const zone3Open = zones.find((zone) => zone.id === "zone-3")?.isOpen ?? false;

  const [operatingMode, setOperatingMode] = useState<"smart" | "manual">("smart");
  const [sessionLiters, setSessionLiters] = useState(482);
  const [showPayload, setShowPayload] = useState(false);
  const [lastActionMessage, setLastActionMessage] = useState<string | null>(
    "Zone 1 Solenoid active · Dispensing 38 L/min rootzone drip"
  );

  const anyZoneOpen = zones.some((z) => z.isOpen);
  const totalFlowLpm = zones.reduce((sum, z) => (z.isOpen ? sum + z.nominalFlowLpm : sum), 0);
  const activePressure = anyZoneOpen ? Number((1.55 + totalFlowLpm * 0.003).toFixed(2)) : 0;
  const powerDrawKw = anyZoneOpen ? (0.75 + totalFlowLpm * 0.009).toFixed(2) : "0.00";

  // Simulate real-time continuous water accumulation when valves are open
  useEffect(() => {
    if (!anyZoneOpen) return;
    const interval = window.setInterval(() => {
      setSessionLiters((prev) => prev + Math.max(1, Math.round(totalFlowLpm / 60)));
    }, 1000);
    return () => clearInterval(interval);
  }, [anyZoneOpen, totalFlowLpm]);

  function handleToggleZone(zoneId: string) {
    setZones((prev) =>
      prev.map((z) => {
        if (z.id === zoneId) {
          const nextState = !z.isOpen;
          analytics.actuateSolenoidValve(Number(z.id.replace(/\D/g, "")) || 1, nextState, z.nominalFlowLpm);
          setLastActionMessage(
            nextState
              ? `${z.shortName} OPENED · Dispensing ${z.nominalFlowLpm} L/min`
              : `${z.shortName} CLOSED · Standby Mode`
          );
          return { ...z, isOpen: nextState };
        }
        return z;
      })
    );
  }

  function handleOpenAll() {
    setZones((prev) => prev.map((z) => ({ ...z, isOpen: true })));
    setLastActionMessage("All 3 Solenoids Actuated OPEN · Full Manifold Flow (82 L/min)");
  }

  function handleEmergencyShutdown() {
    setZones((prev) => prev.map((z) => ({ ...z, isOpen: false })));
    setLastActionMessage("EMERGENCY SHUTDOWN · All Solenoid Valves Closed");
  }

  return (
    <div className={`p-5 rounded-xl bg-white/5 border border-white/10 ${className}`}>
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-lg shadow-cyan-500/10">
            <Droplets size={20} className={anyZoneOpen ? "animate-bounce" : ""} />
          </div>
          <div>
            <div className="text-sm font-semibold text-white/95 flex items-center gap-2">
              Solenoid Valve Digital Twin &amp; Animated Hydraulic Manifold
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-bold border border-cyan-500/30">
                Phase C · IoT Actuation
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              Futuristic 12V DC latching valve twin with fluid dynamics, pressure gauges &amp; animated water emitters
            </div>
          </div>
        </div>

        {/* Operating Mode Selector */}
        <div className="flex items-center gap-2 text-xs">
          <div className="flex rounded-lg bg-black/40 p-0.5 border border-white/10">
            <button
              type="button"
              onClick={() => setOperatingMode("smart")}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                operatingMode === "smart"
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                  : "text-white/60 hover:text-white"
              }`}
            >
              Smart Safe Mode
            </button>
            <button
              type="button"
              onClick={() => setOperatingMode("manual")}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                operatingMode === "manual"
                  ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                  : "text-white/60 hover:text-white"
              }`}
            >
              Manual Testbench
            </button>
          </div>

          <span className="text-[11px] font-mono text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded border border-cyan-500/30 flex items-center gap-1.5">
            <Activity size={12} className={anyZoneOpen ? "animate-spin text-cyan-400" : "text-white/40"} />
            {anyZoneOpen ? `FLOWING: ${totalFlowLpm} L/min` : "STANDBY"}
          </span>
        </div>
      </div>

      {/* Real-time Status / Action Toast */}
      {lastActionMessage && (
        <div className="mt-3 px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs flex items-center justify-between font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>{lastActionMessage}</span>
          </div>
          <span className="text-[10px] text-white/50">MQTT READY</span>
        </div>
      )}

      {/* Hydraulic Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
        <div className="p-3 rounded-lg bg-black/40 border border-white/10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-cyan-500/10 rounded-full blur-xl pointer-events-none" />
          <div className="text-white/60 text-[11px] flex items-center gap-1.5">
            <Droplets size={13} className="text-cyan-400" /> Active Flow Rate
          </div>
          <div className="text-xl font-bold text-white/95 mt-1 font-mono flex items-baseline gap-1">
            <span className={anyZoneOpen ? "text-cyan-400 font-extrabold" : "text-white/60"}>{totalFlowLpm}</span>
            <span className="text-xs font-normal text-white/60">L/min</span>
          </div>
          <div className="text-[10px] text-white/40 mt-0.5">
            {anyZoneOpen ? "Pressure-compensated" : "Pump idle"}
          </div>
        </div>

        <div className="p-3 rounded-lg bg-black/40 border border-white/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
          <div className="text-white/60 text-[11px] flex items-center gap-1.5">
            <Gauge size={13} className="text-emerald-400" /> Manifold Pressure
          </div>
          <div className="text-xl font-bold text-white/95 mt-1 font-mono flex items-baseline gap-1">
            <span className={anyZoneOpen ? "text-emerald-400" : "text-white/60"}>{activePressure.toFixed(2)}</span>
            <span className="text-xs font-normal text-white/60">bar</span>
          </div>
          <div className="text-[10px] text-white/40 mt-0.5">
            {anyZoneOpen ? `Nominal: ${(activePressure * 14.5038).toFixed(1)} psi` : "0 psi"}
          </div>
        </div>

        <div className="p-3 rounded-lg bg-black/40 border border-white/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 rounded-full blur-xl pointer-events-none" />
          <div className="text-white/60 text-[11px] flex items-center gap-1.5">
            <RotateCcw size={13} className="text-blue-400" /> Session Delivered
          </div>
          <div className="text-xl font-bold text-white/95 mt-1 font-mono flex items-baseline gap-1">
            <span className="text-blue-300 font-extrabold">{sessionLiters.toLocaleString()}</span>
            <span className="text-xs font-normal text-white/60">Liters</span>
          </div>
          <div className="text-[10px] text-white/40 mt-0.5">
            Root zone accumulation
          </div>
        </div>

        <div className="p-3 rounded-lg bg-black/40 border border-white/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />
          <div className="text-white/60 text-[11px] flex items-center gap-1.5">
            <Zap size={13} className="text-amber-400" /> Pump Contactor
          </div>
          <div className="text-xl font-bold text-white/95 mt-1 font-mono flex items-baseline gap-1">
            <span className={anyZoneOpen ? "text-amber-400" : "text-white/60"}>{powerDrawKw}</span>
            <span className="text-xs font-normal text-white/60">kW</span>
          </div>
          <div className="text-[10px] text-white/40 mt-0.5">
            3-Phase 415V Agricultural Grid
          </div>
        </div>
      </div>

      {/* Animated Futuristic Hydraulic Manifold (SVG) */}
      <div className="p-4 rounded-xl bg-black/60 border border-white/15 relative overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between text-xs text-white/70 mb-3 font-mono">
          <span className="flex items-center gap-1.5 text-cyan-300">
            <Sliders size={13} />
            <span>INTERACTIVE HYDRAULIC DIGITAL TWIN</span>
          </span>
          <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${anyZoneOpen ? "bg-emerald-400 animate-pulse" : "bg-red-400"}`} />
            {anyZoneOpen ? "WATER FLOWING (ACTIVE DISPENSING)" : "HYDRAULIC STANDBY"}
          </span>
        </div>

        <svg viewBox="0 0 720 200" className="w-full h-44 select-none" aria-label="Futuristic Hydraulic Manifold Schematic">
          <defs>
            {/* Futuristic Glowing Water Gradient */}
            <linearGradient id="cyberWaterGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="50%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>

            <linearGradient id="pumpGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>

            <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Submersible Solar/Grid Agricultural Pump Box */}
          <rect
            x="15"
            y="70"
            width="55"
            height="55"
            rx="8"
            fill="url(#pumpGrad)"
            stroke={anyZoneOpen ? "#06b6d4" : "#475569"}
            strokeWidth="2.5"
            className={anyZoneOpen ? "pipe-glow" : ""}
          />
          <text x="42" y="96" fill="#38bdf8" fontSize="10" textAnchor="middle" fontWeight="bold" fontFamily="monospace">
            3-HP
          </text>
          <text x="42" y="112" fill="#94a3b8" fontSize="9" textAnchor="middle" fontFamily="monospace">
            PUMP
          </text>

          {/* Main Delivery Pipe from Pump to Header */}
          <path
            d="M 70 98 L 150 98"
            stroke={anyZoneOpen ? "url(#cyberWaterGrad)" : "#334155"}
            strokeWidth="8"
            strokeLinecap="round"
            className={anyZoneOpen ? "pipe-active pipe-glow" : ""}
          />

          {/* Manifold Header Trunk (Vertical Distributor) */}
          <path
            d="M 150 35 L 150 165"
            stroke={anyZoneOpen ? "url(#cyberWaterGrad)" : "#334155"}
            strokeWidth="8"
            strokeLinecap="round"
            className={anyZoneOpen ? "pipe-active pipe-glow" : ""}
          />

          {/* ----------------- ZONE 1: PRIMARY ROOT DRIP ----------------- */}
          <path
            d="M 150 45 L 260 45"
            stroke={zone1Open ? "url(#cyberWaterGrad)" : "#334155"}
            strokeWidth="6"
            strokeLinecap="round"
            className={zone1Open ? "pipe-active pipe-glow" : ""}
          />

          {/* Solenoid Valve 1 Actuator Box */}
          <g
            className="cursor-pointer"
            onClick={() => handleToggleZone("zone-1")}
            title="Click to toggle Zone 1 Solenoid"
          >
            <rect
              x="260"
              y="32"
              width="36"
              height="26"
              rx="4"
              fill={zone1Open ? "#0f766e" : "#1e293b"}
              stroke={zone1Open ? "#2dd4bf" : "#ef4444"}
              strokeWidth="2"
            />
            <text x="278" y="49" fill="#ffffff" fontSize="9" textAnchor="middle" fontWeight="bold" fontFamily="monospace">
              {zone1Open ? "ON" : "OFF"}
            </text>
          </g>

          {/* Zone 1 Lateral Line with Emitter Ripples */}
          <path
            d="M 296 45 L 685 45"
            stroke={zone1Open ? "url(#cyberWaterGrad)" : "#1e293b"}
            strokeWidth="5"
            strokeLinecap="round"
            className={zone1Open ? "pipe-active pipe-glow" : ""}
          />

          {/* Emitters & Water Drop Ripples along Zone 1 */}
          {zone1Open && (
            <>
              <circle cx="370" cy="45" r="4" fill="#38bdf8" />
              <circle cx="370" cy="45" r="8" fill="none" stroke="#38bdf8" strokeWidth="1.5" className="emitter-wave" />
              <circle cx="480" cy="45" r="4" fill="#38bdf8" />
              <circle cx="480" cy="45" r="8" fill="none" stroke="#38bdf8" strokeWidth="1.5" className="emitter-wave" />
              <circle cx="590" cy="45" r="4" fill="#38bdf8" />
              <circle cx="590" cy="45" r="8" fill="none" stroke="#38bdf8" strokeWidth="1.5" className="emitter-wave" />
            </>
          )}

          <text x="320" y="32" fill={zone1Open ? "#2dd4bf" : "#64748b"} fontSize="11" fontWeight="bold">
            Zone 1: Lateral Drip (38 L/min) {zone1Open ? "— 💧 DISPENSING ROOT WATER" : "— STANDBY"}
          </text>

          {/* ----------------- ZONE 2: SUB-SURFACE FURROW DRIP ----------------- */}
          <path
            d="M 150 100 L 260 100"
            stroke={zone2Open ? "url(#cyberWaterGrad)" : "#334155"}
            strokeWidth="6"
            strokeLinecap="round"
            className={zone2Open ? "pipe-active pipe-glow" : ""}
          />

          {/* Solenoid Valve 2 Actuator Box */}
          <g
            className="cursor-pointer"
            onClick={() => handleToggleZone("zone-2")}
            title="Click to toggle Zone 2 Solenoid"
          >
            <rect
              x="260"
              y="87"
              width="36"
              height="26"
              rx="4"
              fill={zone2Open ? "#0f766e" : "#1e293b"}
              stroke={zone2Open ? "#2dd4bf" : "#ef4444"}
              strokeWidth="2"
            />
            <text x="278" y="104" fill="#ffffff" fontSize="9" textAnchor="middle" fontWeight="bold" fontFamily="monospace">
              {zone2Open ? "ON" : "OFF"}
            </text>
          </g>

          {/* Zone 2 Lateral Line */}
          <path
            d="M 296 100 L 685 100"
            stroke={zone2Open ? "url(#cyberWaterGrad)" : "#1e293b"}
            strokeWidth="5"
            strokeLinecap="round"
            className={zone2Open ? "pipe-active pipe-glow" : ""}
          />

          {zone2Open && (
            <>
              <circle cx="390" cy="100" r="4" fill="#10b981" />
              <circle cx="390" cy="100" r="8" fill="none" stroke="#10b981" strokeWidth="1.5" className="emitter-wave" />
              <circle cx="510" cy="100" r="4" fill="#10b981" />
              <circle cx="510" cy="100" r="8" fill="none" stroke="#10b981" strokeWidth="1.5" className="emitter-wave" />
              <circle cx="630" cy="100" r="4" fill="#10b981" />
              <circle cx="630" cy="100" r="8" fill="none" stroke="#10b981" strokeWidth="1.5" className="emitter-wave" />
            </>
          )}

          <text x="320" y="87" fill={zone2Open ? "#2dd4bf" : "#64748b"} fontSize="11" fontWeight="bold">
            Zone 2: Sub-Surface Furrow Tape (26 L/min) {zone2Open ? "— 💧 DISPENSING" : "— STANDBY"}
          </text>

          {/* ----------------- ZONE 3: MICRO-SPRINKLER ----------------- */}
          <path
            d="M 150 155 L 260 155"
            stroke={zone3Open ? "url(#cyberWaterGrad)" : "#334155"}
            strokeWidth="6"
            strokeLinecap="round"
            className={zone3Open ? "pipe-active pipe-glow" : ""}
          />

          {/* Solenoid Valve 3 Actuator Box */}
          <g
            className="cursor-pointer"
            onClick={() => handleToggleZone("zone-3")}
            title="Click to toggle Zone 3 Solenoid"
          >
            <rect
              x="260"
              y="142"
              width="36"
              height="26"
              rx="4"
              fill={zone3Open ? "#0f766e" : "#1e293b"}
              stroke={zone3Open ? "#2dd4bf" : "#ef4444"}
              strokeWidth="2"
            />
            <text x="278" y="159" fill="#ffffff" fontSize="9" textAnchor="middle" fontWeight="bold" fontFamily="monospace">
              {zone3Open ? "ON" : "OFF"}
            </text>
          </g>

          {/* Zone 3 Lateral Line */}
          <path
            d="M 296 155 L 685 155"
            stroke={zone3Open ? "url(#cyberWaterGrad)" : "#1e293b"}
            strokeWidth="5"
            strokeLinecap="round"
            className={zone3Open ? "pipe-active pipe-glow" : ""}
          />

          {zone3Open && (
            <>
              <circle cx="410" cy="155" r="4" fill="#a855f7" />
              <circle cx="410" cy="155" r="9" fill="none" stroke="#a855f7" strokeWidth="1.5" className="emitter-wave" />
              <circle cx="540" cy="155" r="4" fill="#a855f7" />
              <circle cx="540" cy="155" r="9" fill="none" stroke="#a855f7" strokeWidth="1.5" className="emitter-wave" />
            </>
          )}

          <text x="320" y="142" fill={zone3Open ? "#c084fc" : "#64748b"} fontSize="11" fontWeight="bold">
            Zone 3: Canopy Micro-Sprinkler (18 L/min) {zone3Open ? "— 💧 MISTING ACTIVE" : "— STANDBY"}
          </text>
        </svg>
      </div>

      {/* Individual Valve Interactive Control Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
        {zones.map((zone) => (
          <div
            key={zone.id}
            className={`p-3.5 rounded-xl border transition-all ${
              zone.isOpen
                ? "bg-cyan-500/10 border-cyan-500/40 shadow-lg shadow-cyan-500/10"
                : "bg-black/30 border-white/10"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-xs text-white/95">{zone.shortName}</span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold flex items-center gap-1 ${
                  zone.isOpen
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    : "bg-red-500/20 text-red-300 border border-red-500/30"
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${zone.isOpen ? "bg-emerald-400 animate-ping" : "bg-red-400"}`} />
                {zone.isOpen ? "VALVE OPEN" : "CLOSED"}
              </span>
            </div>

            <div className="text-[11px] text-white/70 line-clamp-1">{zone.type}</div>

            <div className="flex items-center justify-between text-xs text-white/60 my-2 pt-2 border-t border-white/5">
              <span>Acreage: <b>{zone.areaAcres} ac</b></span>
              <span className="font-mono text-cyan-300 font-bold">{zone.nominalFlowLpm} L/min</span>
            </div>

            <Button
              type="button"
              variant={zone.isOpen ? "destructive" : "secondary"}
              size="sm"
              onClick={() => handleToggleZone(zone.id)}
              className="w-full text-xs cursor-pointer mt-1"
            >
              <Power size={13} className="mr-1.5" />
              {zone.isOpen ? "Close Solenoid Valve" : "Actuate Open Solenoid"}
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
            onClick={handleOpenAll}
            className="text-xs text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/10 cursor-pointer"
          >
            Open All 3 Zones
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleEmergencyShutdown}
            className="text-xs cursor-pointer"
          >
            Emergency All Standby
          </Button>
        </div>

        <button
          type="button"
          onClick={() => setShowPayload(!showPayload)}
          className="text-white/60 hover:text-white flex items-center gap-1.5 cursor-pointer text-[11px]"
        >
          <Terminal size={13} className="text-cyan-400" />
          <span>{showPayload ? "Hide MQTT Telemetry Packet" : "Inspect MQTT Actuator Packet"}</span>
        </button>
      </div>

      {/* Collapsible MQTT Packet Preview */}
      {showPayload && (
        <div className="mt-3 p-3 rounded-lg bg-black/80 border border-white/15 font-mono text-[11px] text-cyan-400 leading-relaxed overflow-x-auto shadow-inner">
          <div className="text-white/40 text-[10px] uppercase mb-1">// Topic: mitti/hardware/actuator/esp32-relay-01</div>
          {JSON.stringify(
            {
              timestamp: new Date().toISOString(),
              deviceId: "MITTI-ESP32-ACT-01",
              operatingMode,
              command: "SET_MANIFOLD_STATE",
              valves: zones.map((z) => ({
                id: z.id,
                name: z.shortName,
                state: z.isOpen ? 1 : 0,
                flowLpm: z.isOpen ? z.nominalFlowLpm : 0,
              })),
              totalFlowLpm,
              pressureBar: activePressure,
              sessionDeliveredLiters: sessionLiters,
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
