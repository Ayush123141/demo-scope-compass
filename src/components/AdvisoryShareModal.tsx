import React, { useState } from "react";
import { motion } from "framer-motion";
import { MessageSquare, Share2, Copy, Check, Send, PhoneCall } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdvisoryShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  plotName: string;
  cropType: string;
  moisturePercent: number;
  recommendationTitle: string;
  recommendationReason: string;
  confidencePercent: number;
  rainfallForecastMm: number;
  language: "en" | "hi" | "mr";
}

export function AdvisoryShareModal({
  isOpen,
  onClose,
  plotName,
  cropType,
  moisturePercent,
  recommendationTitle,
  recommendationReason,
  confidencePercent,
  rainfallForecastMm,
  language,
}: AdvisoryShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [targetNumber, setTargetNumber] = useState("");

  if (!isOpen) return null;

  // Format multilingual WhatsApp message text
  let message = "";
  if (language === "hi") {
    message = `🌾 *मिट्टी सेंटिनल - खेत सिंचाई एडवाइजरी*\n\n` +
      `📍 *खेत:* ${plotName} (${cropType})\n` +
      `💧 *मिट्टी की नमी:* ${moisturePercent}% (VWC)\n` +
      `🌧️ *24 घंटे में संभावित बारिश:* ${rainfallForecastMm} मिमी\n` +
      `⚡ *सुझाव:* ${recommendationTitle} (${confidencePercent}% विश्वास)\n` +
      `📝 *कारण:* ${recommendationReason}\n\n` +
      `⚠️ *नोट:* पंप चलाने से पहले खेत का प्रत्यक्ष निरीक्षण अवश्य करें।\n` +
      `🔗 https://mitti-sentinel.lovable.app`;
  } else if (language === "mr") {
    message = `🌾 *माती सेंटिनेल - शेती सिंचन सल्ला*\n\n` +
      `📍 *शेत:* ${plotName} (${cropType})\n` +
      `💧 *मातीतील ओलावा:* ${moisturePercent}% (VWC)\n` +
      `🌧️ *पुढील २४ तासांत पाऊस:* ${rainfallForecastMm} मिमी\n` +
      `⚡ *शिफारस:* ${recommendationTitle} (${confidencePercent}% अचूकता)\n` +
      `📝 *कारण:* ${recommendationReason}\n\n` +
      `⚠️ *सूचना:* पंप सुरू करण्यापूर्वी शेताची स्वतः खात्री करा.\n` +
      `🔗 https://mitti-sentinel.lovable.app`;
  } else {
    message = `🌾 *Mitti Sentinel — Field Irrigation Advisory*\n\n` +
      `📍 *Plot:* ${plotName} (${cropType})\n` +
      `💧 *Soil Moisture:* ${moisturePercent}% VWC\n` +
      `🌧️ *Rain Forecast (24h):* ${rainfallForecastMm} mm\n` +
      `⚡ *Action:* ${recommendationTitle} (${confidencePercent}% confidence)\n` +
      `📝 *Reason:* ${recommendationReason}\n\n` +
      `⚠️ *Note:* Honest advisory. Always inspect root zone before actuating pump.\n` +
      `🔗 https://mitti-sentinel.lovable.app`;
  }

  const encoded = encodeURIComponent(message);
  const cleanPhone = targetNumber.replace(/\D/g, "");
  const whatsappUrl = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encoded}`
    : `https://wa.me/?text=${encoded}`;

  function handleCopy() {
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  function handleOpenWhatsApp() {
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="glass-surface w-full max-w-lg p-6 rounded-xl border border-emerald-500/30 shadow-2xl relative"
      >
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
              <Share2 size={18} />
            </div>
            <div>
              <h3 className="font-semibold text-base">Dispatch Advisory to Farmer / Operator</h3>
              <p className="text-xs text-muted-foreground">Instant WhatsApp &amp; Kisaan SMS transmission</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white p-1 rounded-md cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="py-4 space-y-3">
          {/* Target Phone */}
          <div>
            <label className="text-[11px] text-muted-foreground block mb-1">
              Recipient WhatsApp / Mobile Number (Optional):
            </label>
            <div className="flex gap-2">
              <input
                type="tel"
                value={targetNumber}
                onChange={(e) => setTargetNumber(e.target.value)}
                placeholder="+91 98221 44021 (Leave empty to choose contact in WhatsApp)"
                className="flex-1 bg-white/5 border border-white/10 rounded-md px-3 py-2 text-xs outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>

          {/* Formatted Message Preview */}
          <div>
            <label className="text-[11px] text-muted-foreground block mb-1">
              Formatted Message Payload:
            </label>
            <div className="p-3 rounded-lg bg-black/50 border border-white/10 text-xs font-mono whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto text-emerald-200/90">
              {message}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button
              type="button"
              onClick={handleOpenWhatsApp}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center justify-center gap-2"
            >
              <Send size={14} /> Send via WhatsApp
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleCopy}
              className="text-xs flex items-center justify-center gap-1.5 border-white/15"
            >
              {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              {copied ? "Copied to Clipboard!" : "Copy Payload"}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
