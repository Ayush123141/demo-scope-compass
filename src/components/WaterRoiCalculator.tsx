import React, { useState } from "react";
import { Zap, Droplets, Fuel, IndianRupee, ShieldCheck, ChevronRight } from "lucide-react";

interface WaterRoiCalculatorProps {
  cropType: string;
  className?: string;
}

export function WaterRoiCalculator({ cropType, className = "" }: WaterRoiCalculatorProps) {
  const [acres, setAcres] = useState<number>(3.5);
  const [pumpHp, setPumpHp] = useState<number>(5);
  const [irrigationType, setIrrigationType] = useState<"drip" | "flood">("drip");

  // Agronomic calculations:
  // Flood irrigation requires ~60,000 L/acre per cycle; Drip requires ~24,000 L/acre per cycle
  const waterPerCycle = acres * (irrigationType === "drip" ? 22000 : 54000);
  
  // A 5 HP pump draws ~3.73 kW. At 15,000 L/hr delivery, pump run time = waterPerCycle / (pumpHp * 3000)
  const pumpHours = Math.round((waterPerCycle / (pumpHp * 3200)) * 10) / 10;
  const powerKwh = Math.round(pumpHours * (pumpHp * 0.746) * 10) / 10;
  
  // Agri power tariff in Maharashtra/Punjab average ~₹2.80/kWh subsidized, or ₹160/hr diesel
  const rupeesSaved = Math.round(powerKwh * 3.5 + pumpHours * 18);
  const dieselSavedLiters = Math.round((pumpHours * (pumpHp * 0.22)) * 10) / 10;

  return (
    <div className={`p-4 rounded-xl bg-white/5 border border-white/10 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
            <Zap size={16} />
          </div>
          <div>
            <div className="text-xs font-semibold text-white/95 flex items-center gap-2">
              Economic &amp; Water Savings ROI Engine
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                Interactive Model
              </span>
            </div>
            <div className="text-[11px] text-muted-foreground">
              Direct groundwater &amp; electricity savings per deferred irrigation cycle
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Controls */}
      <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
        <div>
          <label className="text-[10px] text-muted-foreground block mb-1">Land Size:</label>
          <select
            value={acres}
            onChange={(e) => setAcres(Number(e.target.value))}
            className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white"
          >
            <option value={1.5}>1.5 Acres</option>
            <option value={3.5}>3.5 Acres</option>
            <option value={5.0}>5.0 Acres</option>
            <option value={10.0}>10.0 Acres</option>
          </select>
        </div>

        <div>
          <label className="text-[10px] text-muted-foreground block mb-1">Pump Motor:</label>
          <select
            value={pumpHp}
            onChange={(e) => setPumpHp(Number(e.target.value))}
            className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white"
          >
            <option value={3}>3.0 HP Submersible</option>
            <option value={5}>5.0 HP Submersible</option>
            <option value={7.5}>7.5 HP High Head</option>
            <option value={10}>10.0 HP Agricultural</option>
          </select>
        </div>

        <div>
          <label className="text-[10px] text-muted-foreground block mb-1">System:</label>
          <select
            value={irrigationType}
            onChange={(e) => setIrrigationType(e.target.value as "drip" | "flood")}
            className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white"
          >
            <option value="drip">Micro-Drip (Efficient)</option>
            <option value="flood">Flood / Furrow (Traditional)</option>
          </select>
        </div>
      </div>

      {/* Dynamic ROI Metrics Output */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-white/10 text-xs">
        <div className="p-2.5 rounded-lg bg-black/40 border border-white/5">
          <div className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Droplets size={12} className="text-cyan-400" /> Aquifer Water Saved
          </div>
          <div className="text-sm font-bold text-cyan-300 font-mono mt-0.5">
            {waterPerCycle.toLocaleString()} L
          </div>
          <div className="text-[10px] text-white/50">per deferred cycle</div>
        </div>

        <div className="p-2.5 rounded-lg bg-black/40 border border-white/5">
          <div className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Zap size={12} className="text-amber-400" /> Power Conserved
          </div>
          <div className="text-sm font-bold text-amber-300 font-mono mt-0.5">
            {powerKwh} kWh
          </div>
          <div className="text-[10px] text-white/50">~{pumpHours} hrs motor rest</div>
        </div>

        <div className="p-2.5 rounded-lg bg-black/40 border border-white/5">
          <div className="text-[10px] text-muted-foreground flex items-center gap-1">
            <IndianRupee size={12} className="text-emerald-400" /> Direct Cost Saved
          </div>
          <div className="text-sm font-bold text-emerald-300 font-mono mt-0.5">
            ₹{rupeesSaved}
          </div>
          <div className="text-[10px] text-white/50">subsidy + wear saved</div>
        </div>

        <div className="p-2.5 rounded-lg bg-black/40 border border-white/5">
          <div className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Fuel size={12} className="text-orange-400" /> Diesel Equiv.
          </div>
          <div className="text-sm font-bold text-orange-300 font-mono mt-0.5">
            {dieselSavedLiters} L
          </div>
          <div className="text-[10px] text-white/50">genset backup offset</div>
        </div>
      </div>
    </div>
  );
}
