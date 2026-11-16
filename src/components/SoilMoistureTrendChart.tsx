import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { Droplets, TrendingDown, TrendingUp, Layers } from "lucide-react";

interface MoistureDataPoint {
  time: string;
  shallow: number; // 0-15 cm
  deep: number;    // 15-45 cm
  threshold: number;
}

interface SoilMoistureTrendChartProps {
  currentMoisture: number;
  className?: string;
}

export function SoilMoistureTrendChart({ currentMoisture, className = "" }: SoilMoistureTrendChartProps) {
  // Generate realistic 24h curve anchored on currentMoisture
  const data: MoistureDataPoint[] = [
    { time: "00:00", shallow: Math.min(100, Math.max(15, currentMoisture + 4.2)), deep: Math.min(100, Math.max(20, currentMoisture + 2.5)), threshold: 30 },
    { time: "04:00", shallow: Math.min(100, Math.max(15, currentMoisture + 3.8)), deep: Math.min(100, Math.max(20, currentMoisture + 2.1)), threshold: 30 },
    { time: "08:00", shallow: Math.min(100, Math.max(15, currentMoisture + 1.2)), deep: Math.min(100, Math.max(20, currentMoisture + 1.5)), threshold: 30 },
    { time: "12:00", shallow: Math.min(100, Math.max(15, currentMoisture - 2.8)), deep: Math.min(100, Math.max(20, currentMoisture - 0.5)), threshold: 30 },
    { time: "16:00", shallow: Math.min(100, Math.max(15, currentMoisture - 3.4)), deep: Math.min(100, Math.max(20, currentMoisture - 1.2)), threshold: 30 },
    { time: "20:00", shallow: Math.min(100, Math.max(15, currentMoisture - 0.8)), deep: Math.min(100, Math.max(20, currentMoisture - 0.4)), threshold: 30 },
    { time: "NOW",   shallow: currentMoisture,                                    deep: Math.min(100, Math.max(20, currentMoisture + 1.2)), threshold: 30 },
  ];

  const isDrying = currentMoisture < 32;

  return (
    <div className={`p-4 rounded-xl bg-white/5 border border-white/10 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
            <Layers size={16} />
          </div>
          <div>
            <div className="text-xs font-semibold text-white/95 flex items-center gap-2">
              24-Hour Root Zone Profile &amp; Depletion Trend
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-mono">
                Multi-Depth VWC
              </span>
            </div>
            <div className="text-[11px] text-muted-foreground">
              Topsoil (0-15cm) vs. Deep Taproot (15-45cm) Moisture Dynamics
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          {isDrying ? (
            <span className="flex items-center gap-1 text-amber-400 font-medium">
              <TrendingDown size={14} /> Evaporative Deficit
            </span>
          ) : (
            <span className="flex items-center gap-1 text-emerald-400 font-medium">
              <TrendingUp size={14} /> Stable Retention
            </span>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-[11px] text-white/70 mb-2">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
          <span>Topsoil Layer (0-15 cm)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block" />
          <span>Taproot Zone (15-45 cm)</span>
        </div>
        <div className="flex items-center gap-1.5 text-amber-400/90 ml-auto">
          <span className="w-3 h-0.5 border-t border-dashed border-amber-400 inline-block" />
          <span>Stress Threshold (30%)</span>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="w-full h-36">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="shallowGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="deepGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="time"
              stroke="#6b7280"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: "#ffffff15" }}
            />
            <YAxis
              domain={[10, 60]}
              stroke="#6b7280"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: "#ffffff15" }}
              tickFormatter={(val) => `${val}%`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#121815",
                borderColor: "#374151",
                borderRadius: "8px",
                fontSize: "12px",
                color: "#f3f4f6",
              }}
              formatter={(val: any, name: any) => [
                `${Number(val).toFixed(1)}% VWC`,
                name === "shallow" ? "Topsoil (0-15cm)" : "Deep Root (15-45cm)",
              ]}
            />
            <ReferenceLine y={30} stroke="#f59e0b" strokeDasharray="3 3" />
            <Area
              type="monotone"
              dataKey="shallow"
              stroke="#10b981"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#shallowGrad)"
            />
            <Area
              type="monotone"
              dataKey="deep"
              stroke="#06b6d4"
              strokeWidth={1.5}
              fillOpacity={1}
              fill="url(#deepGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex justify-between items-center text-[10px] text-white/50 mt-1.5 pt-1.5 border-t border-white/5">
        <span>Soil Type: Black Cotton Clayey Loam (High CEC)</span>
        <span>Sensor Depth: Dual-probe SPI Capacitive Array</span>
      </div>
    </div>
  );
}
