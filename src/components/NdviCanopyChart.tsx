import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";
import { Leaf, Sparkles, TrendingUp } from "lucide-react";
import { SATELLITE_PASS_HISTORY } from "@/lib/satellite-service";

interface NdviPassData {
  pass: string;
  ndvi: number;
  lai: number; // Leaf Area Index
  cloudCover: number;
  vigorLabel: string;
}

interface NdviCanopyChartProps {
  activePassIndex: number;
  onSelectPass?: (index: number) => void;
  className?: string;
}

export function NdviCanopyChart({
  activePassIndex,
  onSelectPass,
  className = "",
}: NdviCanopyChartProps) {
  // Modeled historical NDVI progression over Maharashtra agro-climatic growth cycles
  const data: NdviPassData[] = [
    { pass: "20 Oct", ndvi: 0.44, lai: 1.8, cloudCover: 1.2, vigorLabel: "Vegetative Emergence" },
    { pass: "25 Oct", ndvi: 0.51, lai: 2.3, cloudCover: 3.5, vigorLabel: "Tillering / Active Leafing" },
    { pass: "30 Oct", ndvi: 0.62, lai: 3.1, cloudCover: 0.8, vigorLabel: "Canopy Expansion" },
    { pass: "04 Nov", ndvi: 0.73, lai: 3.8, cloudCover: 0.0, vigorLabel: "Peak Chlorophyll Density" },
    { pass: "09 Nov", ndvi: 0.76, lai: 4.1, cloudCover: 2.1, vigorLabel: "Optimal Vigor Canopy" },
    { pass: "14 Nov", ndvi: 0.71, lai: 3.9, cloudCover: 0.0, vigorLabel: "Current Grounded Pass" },
  ];

  const currentPass = data[activePassIndex] || data[data.length - 1]!;

  return (
    <div className={`p-4 rounded-xl bg-white/5 border border-white/10 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-lime-500/20 text-lime-400">
            <Leaf size={16} />
          </div>
          <div>
            <div className="text-xs font-semibold text-white/95 flex items-center gap-2">
              Copernicus Sentinel-2 NDVI Canopy Progression
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                5-Day Revisit
              </span>
            </div>
            <div className="text-[11px] text-muted-foreground">
              Chlorophyll absorption index (B08 NIR / B04 Red) over 25-day growth window
            </div>
          </div>
        </div>

        <div className="text-right text-xs">
          <span className="text-muted-foreground text-[10px] block">Selected Pass NDVI:</span>
          <span className="font-mono text-sm font-bold text-lime-400">
            {currentPass.ndvi.toFixed(2)}{" "}
            <span className="text-white/60 text-[10px] font-normal">
              (LAI: {currentPass.lai.toFixed(1)})
            </span>
          </span>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="w-full h-32 mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 10, left: -25, bottom: 0 }}>
            <XAxis
              dataKey="pass"
              stroke="#6b7280"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: "#ffffff15" }}
            />
            <YAxis
              domain={[0.2, 0.9]}
              stroke="#6b7280"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: "#ffffff15" }}
              tickFormatter={(v) => v.toFixed(1)}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#121815",
                borderColor: "#374151",
                borderRadius: "8px",
                fontSize: "12px",
                color: "#f3f4f6",
              }}
              formatter={(val: any, name: any, item: any) => [
                `NDVI: ${Number(val).toFixed(2)} (${item.payload.vigorLabel})`,
                "Biomass Vigor",
              ]}
            />
            <ReferenceLine y={0.65} stroke="#10b981" strokeDasharray="3 3" />
            <Bar
              dataKey="ndvi"
              radius={[4, 4, 0, 0]}
              onClick={(_, index) => onSelectPass && onSelectPass(index)}
              cursor="pointer"
            >
              {data.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    index === activePassIndex
                      ? "#4ade80"
                      : index === data.length - 1
                      ? "#22c55e"
                      : "#15803d"
                  }
                  opacity={index === activePassIndex ? 1 : 0.65}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex justify-between items-center text-[10px] text-white/55 mt-2 pt-1.5 border-t border-white/5">
        <span>Click bar to inspect orbital pass date</span>
        <span className="flex items-center gap-1 text-emerald-400">
          <TrendingUp size={11} /> +61% Canopy Growth Since 20 Oct
        </span>
      </div>
    </div>
  );
}
