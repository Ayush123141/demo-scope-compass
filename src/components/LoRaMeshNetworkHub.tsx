import React, { useState } from "react";
import {
  Radio,
  Wifi,
  Signal,
  BatteryCharging,
  Send,
  ShieldCheck,
  Zap,
  Activity,
  Layers,
  CheckCircle2,
  Cpu,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface LoRaNode {
  id: string;
  name: string;
  distanceKm: number;
  rssiDbm: number;
  snrDb: number;
  batteryV: number;
  lastPacketSec: number;
  status: "online" | "mesh_hop";
  spreadFactor: "SF7" | "SF8" | "SF9";
}

interface LoRaMeshNetworkHubProps {
  className?: string;
}

export function LoRaMeshNetworkHub({ className = "" }: LoRaMeshNetworkHubProps) {
  const [nodes, setNodes] = useState<LoRaNode[]>([
    {
      id: "node-csn-01",
      name: "Node 1: Marathwada Cotton & Soy",
      distanceKm: 0.85,
      rssiDbm: -76,
      snrDb: 9.4,
      batteryV: 3.95,
      lastPacketSec: 12,
      status: "online",
      spreadFactor: "SF7",
    },
    {
      id: "node-nsk-02",
      name: "Node 2: Dindori Vineyard Trellis",
      distanceKm: 2.1,
      rssiDbm: -84,
      snrDb: 7.8,
      batteryV: 3.88,
      lastPacketSec: 28,
      status: "online",
      spreadFactor: "SF7",
    },
    {
      id: "node-pune-03",
      name: "Node 3: Baramati Sugarcane Basin",
      distanceKm: 3.6,
      rssiDbm: -92,
      snrDb: 6.2,
      batteryV: 4.02,
      lastPacketSec: 45,
      status: "online",
      spreadFactor: "SF8",
    },
    {
      id: "node-ngp-04",
      name: "Node 4: Vidarbha Orange Orchard",
      distanceKm: 5.2,
      rssiDbm: -99,
      snrDb: 4.1,
      batteryV: 3.82,
      lastPacketSec: 84,
      status: "mesh_hop",
      spreadFactor: "SF9",
    },
  ]);

  const [isPinging, setIsPinging] = useState(false);
  const [lastChirp, setLastChirp] = useState<string | null>(
    "Sub-GHz Uplink verified · IN865 Band · 868.100 MHz · CRC OK"
  );

  function handleChirpTest() {
    setIsPinging(true);
    setLastChirp("Broadcasting SX1276 LoRa chirp on 868.1 MHz (SF7/125kHz)...");
    setTimeout(() => {
      setIsPinging(false);
      setLastChirp("ACK Received from Gram Panchayat Solar Gateway · RSSI: -74 dBm · Packet Loss: 0.0%");
      setNodes((prev) =>
        prev.map((n) => ({ ...n, lastPacketSec: 1, rssiDbm: n.rssiDbm + Math.round((Math.random() - 0.5) * 2) }))
      );
    }, 1200);
  }

  return (
    <div className={`p-5 rounded-xl bg-white/5 border border-white/10 ${className}`}>
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shadow-lg shadow-indigo-500/10">
            <Radio size={20} className={isPinging ? "animate-pulse text-indigo-300" : ""} />
          </div>
          <div>
            <div className="text-sm font-semibold text-white/95 flex items-center gap-2">
              Gram Panchayat LoRaWAN 868 MHz Rural Mesh Hub
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono font-bold border border-indigo-500/30">
                Phase E · Final Horizon
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              Zero-cellular Sub-GHz mesh connecting 100+ smallholder probes to 1 Gram Panchayat solar tower (6 km radius)
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={isPinging}
            onClick={handleChirpTest}
            className="text-xs cursor-pointer flex items-center gap-1.5"
          >
            <Send size={12} className={isPinging ? "animate-spin" : ""} />
            <span>{isPinging ? "Transmitting Chirp..." : "Transmit RF Chirp (868 MHz)"}</span>
          </Button>
        </div>
      </div>

      {/* Live Radio Sniffer Bar */}
      {lastChirp && (
        <div className="mt-3 px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs flex items-center justify-between font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
            <span>{lastChirp}</span>
          </div>
          <span className="text-[10px] text-white/50">IN865 SPEC</span>
        </div>
      )}

      {/* RF Metrics HUD */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
        <div className="p-3 rounded-lg bg-black/40 border border-white/10">
          <div className="text-white/60 text-[11px] flex items-center gap-1">
            <Radio size={12} className="text-indigo-400" /> Carrier Frequency
          </div>
          <div className="text-lg font-bold text-white/95 mt-1 font-mono">
            868.100 <span className="text-xs font-normal text-white/60">MHz</span>
          </div>
          <div className="text-[10px] text-white/40 mt-0.5">India Unlicensed ISM Band</div>
        </div>

        <div className="p-3 rounded-lg bg-black/40 border border-white/10">
          <div className="text-white/60 text-[11px] flex items-center gap-1">
            <Signal size={12} className="text-emerald-400" /> Mesh Coverage
          </div>
          <div className="text-lg font-bold text-emerald-400 mt-1 font-mono">
            6.2 <span className="text-xs font-normal text-white/60">km radius</span>
          </div>
          <div className="text-[10px] text-white/40 mt-0.5">Gram Panchayat Water Tower</div>
        </div>

        <div className="p-3 rounded-lg bg-black/40 border border-white/10">
          <div className="text-white/60 text-[11px] flex items-center gap-1">
            <Layers size={12} className="text-cyan-400" /> Connected Probes
          </div>
          <div className="text-lg font-bold text-cyan-300 mt-1 font-mono">
            4 Nodes <span className="text-xs font-normal text-white/60">(148 cap)</span>
          </div>
          <div className="text-[10px] text-white/40 mt-0.5">No SIM cards required</div>
        </div>

        <div className="p-3 rounded-lg bg-black/40 border border-white/10">
          <div className="text-white/60 text-[11px] flex items-center gap-1">
            <BatteryCharging size={12} className="text-purple-400" /> Battery Longevity
          </div>
          <div className="text-lg font-bold text-purple-300 mt-1 font-mono">
            3.2 <span className="text-xs font-normal text-white/60">Years</span>
          </div>
          <div className="text-[10px] text-white/40 mt-0.5">18650 Li-ion Deep Sleep</div>
        </div>
      </div>

      {/* Visual Mesh Topology Canvas (SVG) */}
      <div className="p-4 rounded-xl bg-black/60 border border-white/15 relative overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between text-xs text-white/70 mb-2 font-mono">
          <span className="text-indigo-300 flex items-center gap-1">
            <Signal size={13} /> LORAWAN STAR-OF-STARS MESH TOPOLOGY
          </span>
          <span className="text-[11px] text-emerald-400 font-semibold">
            PACKET RELIABILITY: 99.4%
          </span>
        </div>

        <svg viewBox="0 0 700 160" className="w-full h-36 select-none" aria-label="LoRaWAN Rural Mesh Topology">
          <defs>
            <radialGradient id="meshWave" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Central Gram Panchayat Solar Gateway Tower */}
          <circle cx="350" cy="80" r="45" fill="url(#meshWave)" className={isPinging ? "animate-ping" : ""} />
          <circle cx="350" cy="80" r="18" fill="#1e1b4b" stroke="#818cf8" strokeWidth="2.5" />
          <rect x="345" y="60" width="10" height="24" fill="#a5b4fc" rx="2" />
          <line x1="335" y1="64" x2="365" y2="64" stroke="#a5b4fc" strokeWidth="2" />
          <line x1="340" y1="56" x2="360" y2="56" stroke="#a5b4fc" strokeWidth="2" />
          <text x="350" y="112" fill="#c7d2fe" fontSize="10" textAnchor="middle" fontWeight="bold" fontFamily="monospace">
            GATEWAY (Panchayat)
          </text>

          {/* Node 1 Connection Line */}
          <line x1="120" y1="50" x2="350" y2="80" stroke="#818cf8" strokeWidth="1.5" strokeDasharray="4 4" />
          <circle cx="120" cy="50" r="12" fill="#065f46" stroke="#34d399" strokeWidth="2" />
          <text x="120" y="53" fill="#ffffff" fontSize="8" textAnchor="middle" fontWeight="bold">N1</text>
          <text x="120" y="74" fill="#6ee7b7" fontSize="9" textAnchor="middle" fontFamily="monospace">Cotton (0.8km)</text>

          {/* Node 2 Connection Line */}
          <line x1="180" y1="125" x2="350" y2="80" stroke="#818cf8" strokeWidth="1.5" strokeDasharray="4 4" />
          <circle cx="180" cy="125" r="12" fill="#065f46" stroke="#34d399" strokeWidth="2" />
          <text x="180" y="128" fill="#ffffff" fontSize="8" textAnchor="middle" fontWeight="bold">N2</text>
          <text x="180" y="148" fill="#6ee7b7" fontSize="9" textAnchor="middle" fontFamily="monospace">Vineyard (2.1km)</text>

          {/* Node 3 Connection Line */}
          <line x1="530" y1="45" x2="350" y2="80" stroke="#818cf8" strokeWidth="1.5" strokeDasharray="4 4" />
          <circle cx="530" cy="45" r="12" fill="#065f46" stroke="#34d399" strokeWidth="2" />
          <text x="530" y="48" fill="#ffffff" fontSize="8" textAnchor="middle" fontWeight="bold">N3</text>
          <text x="530" y="68" fill="#6ee7b7" fontSize="9" textAnchor="middle" fontFamily="monospace">Sugarcane (3.6km)</text>

          {/* Node 4 (Mesh Hop via Node 3) */}
          <line x1="640" y1="120" x2="530" y2="45" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="3 3" />
          <circle cx="640" cy="120" r="12" fill="#78350f" stroke="#fbbf24" strokeWidth="2" />
          <text x="640" y="123" fill="#ffffff" fontSize="8" textAnchor="middle" fontWeight="bold">N4</text>
          <text x="640" y="142" fill="#fcd34d" fontSize="9" textAnchor="middle" fontFamily="monospace">Hop Orchard (5.2km)</text>
        </svg>
      </div>

      {/* Node Telemetry Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
        {nodes.map((node) => (
          <div key={node.id} className="p-3 rounded-lg bg-black/30 border border-white/5 text-xs">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-semibold text-white/90 truncate">{node.name.split(":")[0]}</span>
              <span
                className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold ${
                  node.status === "online"
                    ? "bg-emerald-500/20 text-emerald-300"
                    : "bg-amber-500/20 text-amber-300"
                }`}
              >
                {node.status === "online" ? "DIRECT" : "MESH HOP"}
              </span>
            </div>

            <div className="space-y-1 text-white/60 font-mono text-[11px]">
              <div className="flex justify-between">
                <span>Distance:</span>
                <span className="text-white">{node.distanceKm} km</span>
              </div>
              <div className="flex justify-between">
                <span>Signal RSSI:</span>
                <span className="text-emerald-400">{node.rssiDbm} dBm</span>
              </div>
              <div className="flex justify-between">
                <span>SNR / Spread:</span>
                <span className="text-cyan-300">{node.snrDb} dB · {node.spreadFactor}</span>
              </div>
              <div className="flex justify-between">
                <span>Battery V:</span>
                <span className="text-purple-300">{node.batteryV} V</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
