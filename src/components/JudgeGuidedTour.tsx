import React, { useState, useEffect } from "react";
import { Play, Pause, X, ChevronRight, Check, Sparkles, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

interface JudgeGuidedTourProps {
  isRunning: boolean;
  onStartTour: () => void;
  onStopTour: () => void;
  onStepChange?: (stepIndex: number) => void;
}

export function JudgeGuidedTour({
  isRunning,
  onStartTour,
  onStopTour,
  onStepChange,
}: JudgeGuidedTourProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: "1. Multi-Spectral Spaceborne Imagery",
      desc: "Sentinel-2 5-index suite (RGB, NDVI, NDWI, SAVI, EVI) centered on authentic rural agrarian field bunds.",
      targetId: "dashboard",
    },
    {
      title: "2. Physical Soil Root Telemetry",
      desc: "Calibrated capacitive VWC measurement (0-100%) with 24h multi-depth taproot trend.",
      targetId: "dashboard",
    },
    {
      title: "3. Two-Way Regional Voice Copilot",
      desc: "Microphone speech recognition input & audio broadcasts in Marathi, Hindi, and English.",
      targetId: "dashboard",
    },
    {
      title: "4. Solenoid Valve Digital Twin",
      desc: "Interactive 3-zone manifold with animated water flow, safety interlocks, and live MQTT packets.",
      targetId: "valves",
    },
    {
      title: "5. APMC Mandi Profit Maximizer",
      desc: "Real-time wholesale auction ticker & pre-harvest irrigation cut-off to eliminate dockage penalties (कटौती).",
      targetId: "mandi",
    },
    {
      title: "6. Pest Radar & Precision Fertigation",
      desc: "Micro-climate spore germination alerts and NPK leaching guards to prevent fertilizer loss.",
      targetId: "radar",
    },
    {
      title: "7. Water & Energy ROI Economics",
      desc: "Quantified groundwater & power savings (860,000+ liters & ₹14,200 annual savings for 3.8-acre farmer).",
      targetId: "roi",
    },
  ];

  useEffect(() => {
    if (!isRunning) {
      setCurrentStep(0);
      return;
    }

    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= steps.length - 1) {
          onStopTour();
          return 0;
        }
        const next = prev + 1;
        const target = steps[next]?.targetId;
        if (target) {
          const el = document.getElementById(target);
          el?.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        if (onStepChange) onStepChange(next);
        return next;
      });
    }, 7000);

    return () => clearInterval(interval);
  }, [isRunning]);

  if (!isRunning) {
    return (
      <Button
        type="button"
        size="sm"
        onClick={() => {
          onStartTour();
          const target = steps[0]?.targetId;
          if (target) {
            document.getElementById(target)?.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }}
        className="fixed bottom-6 right-6 z-40 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-xl shadow-emerald-950/60 rounded-full px-4 py-2.5 text-xs font-semibold flex items-center gap-2 cursor-pointer border border-emerald-400/40"
      >
        <Sparkles size={15} className="animate-spin text-emerald-200" />
        <span>Judge Auto-Tour (90s)</span>
      </Button>
    );
  }

  const activeStepObj = steps[currentStep] || steps[0]!;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full p-4 rounded-xl bg-[#0f1713]/95 border border-emerald-500/50 shadow-2xl backdrop-blur-md text-white text-xs space-y-2">
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
          <Compass size={16} className="animate-spin text-emerald-300" />
          <span>Interactive Judge Walkthrough</span>
        </div>
        <button
          onClick={onStopTour}
          className="text-white/60 hover:text-white p-1 rounded cursor-pointer"
        >
          <X size={15} />
        </button>
      </div>

      <div>
        <div className="text-sm font-bold text-white/95">{activeStepObj.title}</div>
        <p className="text-[11.5px] text-white/70 mt-0.5 leading-relaxed">
          {activeStepObj.desc}
        </p>
      </div>

      {/* Progress Bars */}
      <div className="flex gap-1 pt-1">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all ${
              i <= currentStep ? "bg-emerald-400" : "bg-white/20"
            }`}
          />
        ))}
      </div>

      <div className="flex justify-between items-center pt-1 text-[10px] text-white/50">
        <span>Step {currentStep + 1} of {steps.length} (Auto-progressing)</span>
        <button
          onClick={onStopTour}
          className="text-amber-400 hover:underline cursor-pointer"
        >
          Exit Tour
        </button>
      </div>
    </div>
  );
}
