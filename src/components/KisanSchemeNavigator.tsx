import React, { useState } from "react";
import { Landmark, Sun, Droplets, CheckCircle2, ArrowUpRight, IndianRupee, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

interface KisanSchemeNavigatorProps {
  acres: number;
  className?: string;
}

export function KisanSchemeNavigator({ acres = 3.5, className = "" }: KisanSchemeNavigatorProps) {
  const [selectedScheme, setSelectedScheme] = useState<"pmksy" | "kusum">("pmksy");

  // Economic calculations based on Ministry of Agriculture guidelines
  // PMKSY Drip Benchmark: ~₹42,000/acre. Small/Marginal farmers receive 80% subsidy in MH/Karnataka/Punjab
  const dripGrossCost = Math.round(acres * 41500);
  const pmksySubsidy = Math.round(dripGrossCost * 0.80);
  const pmksyFarmerShare = dripGrossCost - pmksySubsidy;

  // PM-KUSUM Solar Pump (5 HP submersible): Benchmark ~₹2,65,000. 60% subsidy + 30% soft loan = 10% farmer deposit
  const solarPumpGross = 265000;
  const solarSubsidy = Math.round(solarPumpGross * 0.60);
  const solarLoan = Math.round(solarPumpGross * 0.30);
  const solarFarmerShare = solarPumpGross - solarSubsidy - solarLoan;

  return (
    <div className={`p-4 rounded-xl bg-white/5 border border-white/10 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
            <Landmark size={16} />
          </div>
          <div>
            <div className="text-xs font-semibold text-white/95 flex items-center gap-2">
              Government Kisan Subsidy &amp; Solar Scheme Navigator
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono">
                Direct Benefit Transfer (DBT)
              </span>
            </div>
            <div className="text-[11px] text-muted-foreground">
              Official Indian Central &amp; State agricultural financial support for your {acres}-acre holding
            </div>
          </div>
        </div>

        {/* Scheme Switcher */}
        <div className="flex gap-1 text-xs">
          <button
            type="button"
            onClick={() => setSelectedScheme("pmksy")}
            className={`px-2.5 py-1 rounded text-xs cursor-pointer transition-colors ${
              selectedScheme === "pmksy"
                ? "bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 font-semibold"
                : "bg-white/5 text-white/60 hover:text-white"
            }`}
          >
            PMKSY Micro-Drip (80%)
          </button>
          <button
            type="button"
            onClick={() => setSelectedScheme("kusum")}
            className={`px-2.5 py-1 rounded text-xs cursor-pointer transition-colors ${
              selectedScheme === "kusum"
                ? "bg-amber-500/25 text-amber-300 border border-amber-500/40 font-semibold"
                : "bg-white/5 text-white/60 hover:text-white"
            }`}
          >
            PM-KUSUM Solar Pump (90%)
          </button>
        </div>
      </div>

      {selectedScheme === "pmksy" ? (
        <div className="space-y-3">
          <div className="p-3 rounded-lg bg-black/40 border border-white/10 text-xs">
            <div className="flex justify-between items-center mb-1.5">
              <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
                <Droplets size={14} /> Pradhan Mantri Krishi Sinchayee Yojana (Per Drop More Crop)
              </span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded">
                80% Grant for {acres} Acres
              </span>
            </div>
            <p className="text-white/70 text-[11.5px] leading-relaxed">
              Provides direct capital assistance for micro-irrigation systems. By pairing with Mitti Sentinel telemetry, 
              sensor audit reports qualify for expedited technical sanction under district agricultural offices.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="p-2.5 rounded-lg bg-white/5 border border-white/5">
              <div className="text-[10px] text-white/60">Estimated System Cost:</div>
              <div className="text-sm font-bold text-white/90 font-mono mt-0.5">
                ₹{dripGrossCost.toLocaleString()}
              </div>
              <div className="text-[10px] text-white/50">{acres} acres drip layout</div>
            </div>

            <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
              <div className="text-[10px] text-emerald-400">Government Grant (80%):</div>
              <div className="text-sm font-bold text-emerald-300 font-mono mt-0.5">
                ₹{pmksySubsidy.toLocaleString()}
              </div>
              <div className="text-[10px] text-emerald-400/80">Direct DBT to vendor</div>
            </div>

            <div className="p-2.5 rounded-lg bg-white/5 border border-white/5">
              <div className="text-[10px] text-white/60">Farmer Out-of-Pocket:</div>
              <div className="text-sm font-bold text-amber-300 font-mono mt-0.5">
                ₹{pmksyFarmerShare.toLocaleString()}
              </div>
              <div className="text-[10px] text-white/50">Only 20% net investment</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="p-3 rounded-lg bg-black/40 border border-white/10 text-xs">
            <div className="flex justify-between items-center mb-1.5">
              <span className="font-semibold text-amber-400 flex items-center gap-1.5">
                <Sun size={14} /> PM-KUSUM Component-B: Standalone Solar Agricultural Pump
              </span>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded">
                90% Financial Coverage
              </span>
            </div>
            <p className="text-white/70 text-[11.5px] leading-relaxed">
              Replaces high-tariff grid electric or diesel motor pumps with 5 HP off-grid solar arrays. 
              Zero recurring power costs for 25 years with automatic daylight pumping.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="p-2.5 rounded-lg bg-white/5 border border-white/5">
              <div className="text-[10px] text-white/60">5 HP Solar Benchmark:</div>
              <div className="text-sm font-bold text-white/90 font-mono mt-0.5">
                ₹{solarPumpGross.toLocaleString()}
              </div>
              <div className="text-[10px] text-white/50">MNRE 2026 tariff rate</div>
            </div>

            <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <div className="text-[10px] text-amber-400">Total Subsidy (60%):</div>
              <div className="text-sm font-bold text-amber-300 font-mono mt-0.5">
                ₹{solarSubsidy.toLocaleString()}
              </div>
              <div className="text-[10px] text-amber-400/80">30% Central + 30% State</div>
            </div>

            <div className="p-2.5 rounded-lg bg-white/5 border border-white/5">
              <div className="text-[10px] text-white/60">Farmer Net Contribution:</div>
              <div className="text-sm font-bold text-emerald-300 font-mono mt-0.5">
                ₹{solarFarmerShare.toLocaleString()}
              </div>
              <div className="text-[10px] text-white/50">Just 10% (Rest 30% loan)</div>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center text-[10px] text-white/55 mt-2.5 pt-2 border-t border-white/5">
        <span>Verified Documents Required: 7/12 Extract, 8A Khata, Aadhaar, Bank IFSC</span>
        <a
          href="https://mahadbt.maharashtra.gov.in/Farmer/SchemeData/SchemeData?param=Y"
          target="_blank"
          rel="noopener noreferrer"
          className="text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium cursor-pointer"
        >
          Check Eligibility on Mahadbt <ArrowUpRight size={11} />
        </a>
      </div>
    </div>
  );
}
