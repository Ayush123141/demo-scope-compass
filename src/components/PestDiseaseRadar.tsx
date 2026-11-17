import React from "react";
import { Bug, AlertCircle, ShieldAlert, Sparkles, CheckCircle2, Droplets } from "lucide-react";

interface PestDiseaseRadarProps {
  cropType: string;
  moisturePercent: number;
  temperatureC: number;
  humidityPercent: number;
  rainfallMm24h: number;
  className?: string;
}

export function PestDiseaseRadar({
  cropType,
  moisturePercent,
  temperatureC,
  humidityPercent,
  rainfallMm24h,
  className = "",
}: PestDiseaseRadarProps) {
  // Agronomic micro-climate spore germination calculation
  let riskScore = 15;
  let primaryThreat = "None (Favorable Aeration)";
  let preventiveMeasure = "Maintain standard weed-free mulch and drip fertigation schedule.";
  let riskLevel: "low" | "moderate" | "high" | "severe" = "low";

  // Downy Mildew / Powdery Mildew in Grapes: thrives between 20°C - 28°C with RH > 70%
  if (cropType.toLowerCase().includes("grape") || cropType.toLowerCase().includes("onion")) {
    if (humidityPercent > 70 && temperatureC >= 20 && temperatureC <= 29) {
      riskScore = 82;
      primaryThreat = "Downy Mildew (केवडा) & Anthracnose Spore Surge";
      preventiveMeasure = "Apply preventive bio-spray of Trichoderma viride (5g/L) or Copper Oxychloride 50 WP (2.5g/L). Avoid canopy wetting.";
      riskLevel = "high";
    } else if (humidityPercent > 60 || moisturePercent > 45) {
      riskScore = 48;
      primaryThreat = "Powdery Mildew (भुरी) & Purple Blotch Vigilance";
      preventiveMeasure = "Dust wettable sulfur (80% WP @ 2g/L) during early morning before temperature rises.";
      riskLevel = "moderate";
    } else {
      riskScore = 18;
      primaryThreat = "Low Spore Pressure (Healthy Microclimate)";
      preventiveMeasure = "Canopy well aerated. Monitor undersides of new shoot leaves twice weekly.";
      riskLevel = "low";
    }
  } 
  // Cotton / Soybean: Root Rot (Rhizoctonia) & Bollworm
  else if (cropType.toLowerCase().includes("cotton") || cropType.toLowerCase().includes("soy")) {
    if (moisturePercent > 48 && humidityPercent > 65) {
      riskScore = 78;
      primaryThreat = "Rhizoctonia Root Rot (मूळ कुज) & Sucking Pest Surge";
      preventiveMeasure = "Drench root zone with Pseudomonas fluorescens (10g/L). Ensure furrow drainage trenches are open.";
      riskLevel = "high";
    } else if (temperatureC > 30 && humidityPercent < 50) {
      riskScore = 52;
      primaryThreat = "Whitefly & Aphid Vector Pressure";
      preventiveMeasure = "Install yellow sticky traps (15 traps/acre) and spray 5% Neem Seed Kernel Extract (NSKE).";
      riskLevel = "moderate";
    } else {
      riskScore = 20;
      primaryThreat = "Low Infestation Pressure";
      preventiveMeasure = "Optimal soil aeration. Scout pheromone traps for pink bollworm moths.";
      riskLevel = "low";
    }
  } 
  // Sugarcane / Wheat / Citrus defaults
  else {
    if (humidityPercent > 72 && rainfallMm24h > 5) {
      riskScore = 75;
      primaryThreat = "Fungal Blight & Leaf Spot Germination";
      preventiveMeasure = "Ensure surface runoff drainage. Apply Mancozeb 75 WP @ 2.5g/L preventive coverage.";
      riskLevel = "high";
    } else {
      riskScore = 22;
      primaryThreat = "Balanced Microclimate (Low Threat)";
      preventiveMeasure = "Crop transpiration normal. Continue planned nutrient split.";
      riskLevel = "low";
    }
  }

  const badgeColor =
    riskLevel === "high"
      ? "bg-red-500/20 text-red-300 border-red-500/40"
      : riskLevel === "moderate"
      ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
      : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";

  return (
    <div className={`p-4 rounded-xl bg-white/5 border border-white/10 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-red-500/20 text-red-400">
            <Bug size={16} />
          </div>
          <div>
            <div className="text-xs font-semibold text-white/95 flex items-center gap-2">
              Micro-Climate Pest &amp; Fungal Disease Radar
              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-mono font-semibold ${badgeColor}`}>
                {riskLevel.toUpperCase()} RISK ({riskScore}%)
              </span>
            </div>
            <div className="text-[11px] text-muted-foreground">
              Correlating root moisture ({moisturePercent}%), Open-Meteo humidity ({humidityPercent}%), and ambient temp ({temperatureC}°C)
            </div>
          </div>
        </div>
      </div>

      <div className="p-3 rounded-lg bg-black/40 border border-white/10 space-y-2 text-xs">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <div className="text-white/60 text-[10px] uppercase font-semibold">Primary Microclimate Threat:</div>
            <div className="font-semibold text-white/95 flex items-center gap-1.5">
              {riskLevel === "high" ? (
                <ShieldAlert size={14} className="text-red-400 shrink-0" />
              ) : (
                <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
              )}
              <span>{primaryThreat}</span>
            </div>
          </div>

          <div className="text-right text-[11px] font-mono text-white/60 shrink-0">
            RH: {humidityPercent}% · {temperatureC}°C
          </div>
        </div>

        <div className="pt-2 border-t border-white/10">
          <div className="text-white/60 text-[10px] uppercase font-semibold mb-1">
            Actionable Bio-Fungicide / Cultural Advisory:
          </div>
          <div className="text-emerald-200/90 leading-relaxed text-[11.5px]">
            {preventiveMeasure}
          </div>
        </div>
      </div>
    </div>
  );
}
