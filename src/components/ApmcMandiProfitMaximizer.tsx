import React, { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Sparkles,
  Scale,
  Award,
  ChevronRight,
  ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface MandiQuote {
  commodity: string;
  mandi: string;
  state: string;
  pricePerQtl: number;
  mspPerQtl: number;
  change24h: number;
  grade: string;
}

const APMC_QUOTES: MandiQuote[] = [
  {
    commodity: "Bt Cotton (Medium Staple)",
    mandi: "Jalna APMC",
    state: "Maharashtra",
    pricePerQtl: 7650,
    mspPerQtl: 7121,
    change24h: 120,
    grade: "Grade-A (Moisture <10%)",
  },
  {
    commodity: "Soybean (Yellow)",
    mandi: "Latur Mandi",
    state: "Maharashtra",
    pricePerQtl: 4820,
    mspPerQtl: 4892,
    change24h: 45,
    grade: "FAQ Standard",
  },
  {
    commodity: "Table Grapes (Thompson)",
    mandi: "Pimpalgaon Baswant",
    state: "Nashik, MH",
    pricePerQtl: 8600,
    mspPerQtl: 5500,
    change24h: 240,
    grade: "Export Quality (Brix 18°)",
  },
  {
    commodity: "Sugarcane (Co 86032)",
    mandi: "Baramati Sugar Factory",
    state: "Pune, MH",
    pricePerQtl: 315, // per quintal (₹3150 / ton FRP)
    mspPerQtl: 315,
    change24h: 0,
    grade: "FRP 10.25% Recovery",
  },
  {
    commodity: "Red Onion (Gavran)",
    mandi: "Lasalgaon APMC",
    state: "Nashik, MH",
    pricePerQtl: 2150,
    mspPerQtl: 1800,
    change24h: -50,
    grade: "Medium Red Bulb",
  },
  {
    commodity: "Wheat (PBW 824)",
    mandi: "Khanna APMC",
    state: "Punjab",
    pricePerQtl: 2460,
    mspPerQtl: 2275,
    change24h: 30,
    grade: "Milling Grade 1",
  },
];

interface ApmcMandiProfitMaximizerProps {
  cropType: string;
  acres: number;
  currentMoisture: number;
  className?: string;
}

export function ApmcMandiProfitMaximizer({
  cropType,
  acres,
  currentMoisture,
  className = "",
}: ApmcMandiProfitMaximizerProps) {
  // Harvest moisture slider (Traders penalize when > 12%)
  const [harvestMoisturePercent, setHarvestMoisturePercent] = useState<number>(14.5);
  const [estimatedYieldQuintals, setEstimatedYieldQuintals] = useState<number>(Math.round(acres * 11));

  // Find matching quotation or default to first
  const activeQuote =
    APMC_QUOTES.find((q) =>
      cropType.toLowerCase().includes(q.commodity.toLowerCase().split(" ")[0] ?? "")
    ) ?? APMC_QUOTES[0]!;

  // Moisture dockage penalty calculation:
  // Baseline is 10-12% moisture. For each 1% above 12%, traders cut 1.8% of price for water weight.
  const excessMoisture = Math.max(0, harvestMoisturePercent - 12);
  const dockagePercent = Number((excessMoisture * 1.8).toFixed(1));
  const dockageCutPerQtl = Math.round((activeQuote.pricePerQtl * dockagePercent) / 100);
  const totalDockageLoss = dockageCutPerQtl * estimatedYieldQuintals;

  // Withholding irrigation 8 days prior to harvest saves:
  const waterSavedLiters = Math.round(acres * 85000);
  const electricitySavings = Math.round(acres * 480);
  const totalNetGain = totalDockageLoss + electricitySavings;

  return (
    <div className={`p-5 rounded-xl bg-white/5 border border-white/10 ${className}`}>
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <TrendingUp size={18} />
          </div>
          <div>
            <div className="text-sm font-semibold text-white/95 flex items-center gap-2">
              APMC Mandi Commodity Ticker &amp; Profit Maximizer
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-medium">
                Phase D · Market Intelligence
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              Real wholesale auction rates &amp; pre-harvest irrigation cut-off to eliminate moisture dockage penalties (कटौती)
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-[11px] font-mono text-emerald-400 bg-white/5 px-2.5 py-1 rounded border border-white/10">
            BENCHMARK: e-NAM &amp; APMC Daily Mandi Auctions
          </span>
        </div>
      </div>

      {/* Live Marquee Ticker Track */}
      <div className="mt-3 overflow-hidden bg-black/40 border border-white/10 rounded-lg p-2.5">
        <div className="mandi-ticker-track flex items-center gap-6">
          {APMC_QUOTES.concat(APMC_QUOTES).map((item, idx) => (
            <div key={`${item.commodity}-${idx}`} className="flex items-center gap-2 text-xs whitespace-nowrap">
              <span className="font-semibold text-white/90">{item.commodity}:</span>
              <span className="font-mono font-bold text-white">₹{item.pricePerQtl.toLocaleString()}/qtl</span>
              <span className="text-[11px] text-white/50">({item.mandi})</span>
              {item.change24h >= 0 ? (
                <span className="text-emerald-400 font-mono text-[11px] flex items-center">
                  +₹{item.change24h} <TrendingUp size={10} className="ml-0.5" />
                </span>
              ) : (
                <span className="text-red-400 font-mono text-[11px] flex items-center">
                  ₹{item.change24h} <TrendingDown size={10} className="ml-0.5" />
                </span>
              )}
              <span className="text-white/20">|</span>
            </div>
          ))}
        </div>
      </div>

      {/* Active Crop Mandi Highlight Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 my-4">
        <div className="p-3.5 rounded-lg bg-black/30 border border-white/5 md:col-span-1">
          <div className="text-[11px] text-white/60 mb-1 flex items-center gap-1">
            <Award size={12} className="text-emerald-400" /> Active Mandi Benchmark
          </div>
          <div className="text-base font-bold text-white">{activeQuote.commodity}</div>
          <div className="text-xs text-emerald-400 font-medium mt-0.5">{activeQuote.mandi}, {activeQuote.state}</div>

          <div className="mt-3 pt-3 border-t border-white/5 flex items-baseline justify-between">
            <span className="text-2xl font-mono font-bold text-emerald-400">
              ₹{activeQuote.pricePerQtl.toLocaleString()}
            </span>
            <span className="text-xs text-white/60 font-mono">
              MSP: ₹{activeQuote.mspPerQtl.toLocaleString()}
            </span>
          </div>

          <div className="text-[11px] text-white/60 mt-1">
            Premium over Govt MSP:{" "}
            <span className="text-emerald-300 font-semibold font-mono">
              +{Math.round(((activeQuote.pricePerQtl - activeQuote.mspPerQtl) / activeQuote.mspPerQtl) * 100)}%
            </span>
          </div>
        </div>

        {/* Moisture Dockage Penalty (कटौती) Calculator */}
        <div className="p-3.5 rounded-lg bg-black/30 border border-white/5 md:col-span-2">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-semibold text-white/90 flex items-center gap-1.5">
              <Scale size={13} className="text-amber-400" /> Moisture Dockage Penalty Calculator (ओलावा वजावट)
            </div>
            <span className="text-[11px] font-mono text-amber-300">
              {dockagePercent > 0 ? `-${dockagePercent}% APMC Rate Cut` : "0% Penalty (Grade-A)"}
            </span>
          </div>

          <div className="text-[11px] text-white/70 mb-3">
            Mandi traders deduct 1.8% per quintal for every 1% moisture above the 12% dry benchmark. Cutting off irrigation before harvest prevents this penalty entirely.
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/80">Simulated Crop Harvest Moisture:</span>
              <span className="font-mono font-bold text-amber-400">{harvestMoisturePercent}%</span>
            </div>
            <input
              type="range"
              min="9"
              max="18"
              step="0.5"
              value={harvestMoisturePercent}
              onChange={(e) => setHarvestMoisturePercent(parseFloat(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer h-1.5 bg-white/10 rounded"
            />
            <div className="flex justify-between text-[10px] text-white/40 font-mono">
              <span>9% (Crisp Dry - Grade A)</span>
              <span>12% (Mandi Safe Threshold)</span>
              <span>18% (Waterlogged Damp - High Penalty)</span>
            </div>
          </div>

          {/* Loss / Gain Tally */}
          <div className="mt-3 pt-3 border-t border-white/5 grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-white/50 block text-[10px] uppercase">Dockage Rate Deduction</span>
              <span className="font-mono font-bold text-red-400">-₹{dockageCutPerQtl}/qtl</span>
            </div>
            <div>
              <span className="text-white/50 block text-[10px] uppercase">Avoidable Farm Loss ({estimatedYieldQuintals} qtl)</span>
              <span className="font-mono font-bold text-red-400">-₹{totalDockageLoss.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Pre-Harvest Drying Advisory & Profit Gain Summary */}
      <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
            <Sparkles size={13} /> Mitti Sentinel Harvest Cut-Off Advisory:
          </div>
          <div className="text-xs text-white/90">
            Cut off irrigation <b>8 to 10 days before harvest</b>. Subterranean root drying will naturally bring crop moisture to &lt;10.5%, capturing top auction bids.
          </div>
          <div className="text-[11px] text-white/60">
            Water saved during drying: <b>{waterSavedLiters.toLocaleString()} L</b> · Electricity saved: <b>₹{electricitySavings}</b>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[10px] uppercase text-white/50 block">Net Financial Gain</span>
          <span className="text-lg font-mono font-bold text-emerald-400">
            +₹{totalNetGain.toLocaleString()}
          </span>
          <span className="text-[10px] text-emerald-300 block">per harvest cycle</span>
        </div>
      </div>
    </div>
  );
}
