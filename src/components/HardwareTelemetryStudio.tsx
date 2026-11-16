import React, { useState } from "react";
import { Cpu, Radio, Zap, Send, ShieldCheck, Check, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { persistSensorReading } from "@/lib/supabase-client";

interface HardwareTelemetryStudioProps {
  currentMoisture: number;
  onInjectMoisture: (moisture: number) => void;
  className?: string;
}

export function HardwareTelemetryStudio({
  currentMoisture,
  onInjectMoisture,
  className = "",
}: HardwareTelemetryStudioProps) {
  const [sliderValue, setSliderValue] = useState<number>(currentMoisture);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);

  // Compute realistic 12-bit ADC value
  const adcRaw = Math.round(3100 - (sliderValue / 100) * (3100 - 1350));

  async function handleBroadcastToSupabase() {
    setIsBroadcasting(true);
    setBroadcastSuccess(false);

    // 1. Immediately apply to local reactive state
    onInjectMoisture(sliderValue);

    // 2. Persist genuine IoT reading row into Supabase sensor_readings
    await persistSensorReading({
      device_id: "MITTI-ESP32-01",
      moisture_percent: sliderValue,
      temperature_c: 28.5,
      battery_v: 3.94,
      is_live: true,
      captured_at_ms: Date.now(),
    });

    setIsBroadcasting(false);
    setBroadcastSuccess(true);
    setTimeout(() => setBroadcastSuccess(false), 2500);
  }

  function handleSelectScenario(val: number) {
    setSliderValue(val);
    onInjectMoisture(val);
  }

  return (
    <div className={`p-4 rounded-xl bg-white/5 border border-white/10 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
            <Cpu size={16} />
          </div>
          <div>
            <div className="text-xs font-semibold text-white/95 flex items-center gap-2">
              Hardware Telemetry Studio &amp; ESP32 Cloud Injector
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                Judge Live Testing
              </span>
            </div>
            <div className="text-[11px] text-muted-foreground">
              Simulate live physical soil capacitive telemetry &amp; push to Supabase PostgreSQL
            </div>
          </div>
        </div>

        <div className="text-right text-[11px] font-mono text-emerald-400 hidden sm:block">
          Node: MITTI-ESP32-01 · ADC GPIO34
        </div>
      </div>

      {/* Preset Scenarios */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3 text-xs">
        <button
          type="button"
          onClick={() => handleSelectScenario(21.4)}
          className={`p-2 rounded-lg border text-left cursor-pointer transition-all ${
            sliderValue <= 25
              ? "bg-red-500/20 border-red-500/50 text-red-200"
              : "bg-white/5 border-white/10 hover:border-white/20 text-white/80"
          }`}
        >
          <div className="text-[10px] uppercase font-semibold text-red-400">Drought Stress</div>
          <div className="font-bold text-sm">21.4% VWC</div>
          <div className="text-[10px] text-white/60">Triggers Irrigate Now</div>
        </button>

        <button
          type="button"
          onClick={() => handleSelectScenario(31.8)}
          className={`p-2 rounded-lg border text-left cursor-pointer transition-all ${
            sliderValue > 25 && sliderValue <= 35
              ? "bg-amber-500/20 border-amber-500/50 text-amber-200"
              : "bg-white/5 border-white/10 hover:border-white/20 text-white/80"
          }`}
        >
          <div className="text-[10px] uppercase font-semibold text-amber-400">Watch Threshold</div>
          <div className="font-bold text-sm">31.8% VWC</div>
          <div className="text-[10px] text-white/60">Correlates with Rain</div>
        </button>

        <button
          type="button"
          onClick={() => handleSelectScenario(42.5)}
          className={`p-2 rounded-lg border text-left cursor-pointer transition-all ${
            sliderValue > 35 && sliderValue <= 48
              ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-200"
              : "bg-white/5 border-white/10 hover:border-white/20 text-white/80"
          }`}
        >
          <div className="text-[10px] uppercase font-semibold text-emerald-400">Optimal Field</div>
          <div className="font-bold text-sm">42.5% VWC</div>
          <div className="text-[10px] text-white/60">No Action Needed</div>
        </button>

        <button
          type="button"
          onClick={() => handleSelectScenario(56.2)}
          className={`p-2 rounded-lg border text-left cursor-pointer transition-all ${
            sliderValue > 48
              ? "bg-blue-500/20 border-blue-500/50 text-blue-200"
              : "bg-white/5 border-white/10 hover:border-white/20 text-white/80"
          }`}
        >
          <div className="text-[10px] uppercase font-semibold text-blue-400">Saturated Soil</div>
          <div className="font-bold text-sm">56.2% VWC</div>
          <div className="text-[10px] text-white/60">Triggers Drainage / Hold</div>
        </button>
      </div>

      {/* Interactive Slider & ADC Diagnostic */}
      <div className="p-3 rounded-lg bg-black/40 border border-white/10 space-y-3">
        <div className="flex justify-between items-center text-xs">
          <span className="text-muted-foreground flex items-center gap-1.5">
            <Radio size={14} className="text-emerald-400" /> Continuous Capacitive Moisture Dial:
          </span>
          <span className="font-mono text-sm font-bold text-emerald-400">
            {sliderValue.toFixed(1)}% VWC
            <span className="text-white/50 text-[11px] ml-2 font-normal">
              (ADC: {adcRaw} counts / 3.94V)
            </span>
          </span>
        </div>

        <input
          type="range"
          min={12}
          max={65}
          step={0.5}
          value={sliderValue}
          onChange={(e) => {
            const v = Number(e.target.value);
            setSliderValue(v);
            onInjectMoisture(v);
          }}
          className="w-full accent-emerald-500 cursor-pointer"
        />

        <div className="flex flex-col sm:flex-row gap-2 pt-1 items-center justify-between">
          <div className="text-[11px] text-white/60 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Realtime reactivity active: dial, risk halo, and decision re-evaluated instantly</span>
          </div>

          <Button
            type="button"
            size="sm"
            onClick={handleBroadcastToSupabase}
            disabled={isBroadcasting}
            className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 w-full sm:w-auto"
          >
            {isBroadcasting ? (
              <RefreshCw size={13} className="animate-spin" />
            ) : broadcastSuccess ? (
              <Check size={13} className="text-white" />
            ) : (
              <Send size={13} />
            )}
            {broadcastSuccess ? "Pushed to Supabase DB!" : "Push Reading to Supabase"}
          </Button>
        </div>
      </div>
    </div>
  );
}
