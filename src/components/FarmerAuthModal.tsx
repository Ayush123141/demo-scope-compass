import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  User,
  ShieldCheck,
  Mail,
  Lock,
  Smartphone,
  LogOut,
  Check,
  RefreshCw,
  Cpu,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  signInWithPassword,
  signUpWithEmail,
  signInWithMagicLink,
  signOutFarmer,
  type FarmerProfile,
  DEFAULT_GUEST_FARMER,
} from "@/lib/supabase-client";

interface FarmerAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  farmer: FarmerProfile;
  onUpdateFarmer: (updated: FarmerProfile) => void;
}

export function FarmerAuthModal({
  isOpen,
  onClose,
  farmer,
  onUpdateFarmer,
}: FarmerAuthModalProps) {
  const [authTab, setAuthTab] = useState<"demo" | "signin" | "signup">("demo");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [kisanId, setKisanId] = useState("");
  const [magicLinkEmail, setMagicLinkEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handlePasswordSignIn(e: React.FormEvent) {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);
    setIsSubmitting(true);

    const { user, error } = await signInWithPassword(email, password);
    setIsSubmitting(false);

    if (error) {
      setAuthError(error);
      return;
    }

    if (user) {
      const displayName = user.user_metadata?.display_name || email.split("@")[0] || "Registered Farmer";
      const userKisan = user.user_metadata?.kisan_id || "IND-KISAN-" + user.id.slice(0, 4).toUpperCase();
      onUpdateFarmer({
        id: user.id,
        name: displayName,
        kisanId: userKisan,
        email: user.email || email,
        deviceId: "MITTI-ESP32-01",
        isGuest: false,
      });
      setAuthSuccess(`Welcome back, ${displayName}! Logged in via Supabase.`);
      setTimeout(() => onClose(), 1200);
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);
    setIsSubmitting(true);

    const { user, error } = await signUpWithEmail(email, password, name, kisanId);
    setIsSubmitting(false);

    if (error) {
      setAuthError(error);
      return;
    }

    if (user) {
      onUpdateFarmer({
        id: user.id,
        name: name || "Registered Farmer",
        kisanId: kisanId || "IND-KISAN-NEW",
        email: user.email || email,
        deviceId: "MITTI-ESP32-01",
        isGuest: false,
      });
      setAuthSuccess("Account created successfully in Supabase!");
      setTimeout(() => onClose(), 1200);
    }
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);
    setIsSubmitting(true);

    const res = await signInWithMagicLink(magicLinkEmail);
    setIsSubmitting(false);

    if (!res.success) {
      setAuthError(res.error || "Failed to send magic link");
    } else {
      setAuthSuccess("Magic login link dispatched! Check your email inbox.");
    }
  }

  async function handleSignOut() {
    await signOutFarmer();
    onUpdateFarmer(DEFAULT_GUEST_FARMER);
    setAuthSuccess("Signed out. Switched back to Judge Evaluator Mode.");
    setTimeout(() => {
      setAuthSuccess(null);
    }, 2000);
  }

  function handleSelectDemoProfile(demoName: string, demoKisan: string, demoMobile: string) {
    onUpdateFarmer({
      id: `demo-${demoKisan.toLowerCase()}`,
      name: demoName,
      kisanId: demoKisan,
      mobile: demoMobile,
      deviceId: "MITTI-ESP32-01",
      isGuest: true,
    });
    setAuthSuccess(`Switched to ${demoName} demo profile.`);
    setTimeout(() => onClose(), 600);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="glass-surface w-full max-w-md p-6 rounded-xl border border-white/15 shadow-2xl relative"
      >
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
              <User size={18} />
            </div>
            <div>
              <h3 className="font-semibold text-base">Farmer Account &amp; Device Hub</h3>
              <p className="text-xs text-muted-foreground">Supabase PostgreSQL Authentication</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white p-1 rounded-md cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Current Active Farmer Card */}
        <div className="mt-3 p-3 rounded-lg bg-white/5 border border-white/10 text-xs space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Current Session:</span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 ${
                farmer.isGuest
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                  : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
              }`}
            >
              <ShieldCheck size={12} />
              {farmer.isGuest ? "Judge Evaluator Mode" : "Supabase Authenticated"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Farmer Name:</span>
            <span className="font-semibold text-white/95">{farmer.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Kisan Card ID:</span>
            <span className="font-mono text-emerald-400 font-medium">{farmer.kisanId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Paired Telemetry Node:</span>
            <span className="font-mono text-white/80">{farmer.deviceId}</span>
          </div>

          {!farmer.isGuest && (
            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="w-full text-xs flex items-center justify-center gap-1.5 text-red-400 border-red-500/30 hover:bg-red-500/10"
              >
                <LogOut size={13} /> Sign Out of Supabase
              </Button>
            </div>
          )}
        </div>

        {/* Auth Feedback Notifications */}
        {authError && (
          <div className="mt-3 p-2.5 rounded-md bg-red-500/15 border border-red-500/40 text-xs text-red-300">
            {authError}
          </div>
        )}
        {authSuccess && (
          <div className="mt-3 p-2.5 rounded-md bg-emerald-500/15 border border-emerald-500/40 text-xs text-emerald-300 flex items-center gap-1.5">
            <Check size={14} /> {authSuccess}
          </div>
        )}

        {/* Tab Switcher */}
        <div className="mt-4 flex border-b border-white/10 text-xs">
          <button
            type="button"
            onClick={() => {
              setAuthTab("demo");
              setAuthError(null);
            }}
            className={`flex-1 py-2 font-medium border-b-2 cursor-pointer transition-colors ${
              authTab === "demo"
                ? "border-emerald-400 text-emerald-300"
                : "border-transparent text-muted-foreground hover:text-white"
            }`}
          >
            Judge Demo Profiles
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthTab("signin");
              setAuthError(null);
            }}
            className={`flex-1 py-2 font-medium border-b-2 cursor-pointer transition-colors ${
              authTab === "signin"
                ? "border-emerald-400 text-emerald-300"
                : "border-transparent text-muted-foreground hover:text-white"
            }`}
          >
            Supabase Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthTab("signup");
              setAuthError(null);
            }}
            className={`flex-1 py-2 font-medium border-b-2 cursor-pointer transition-colors ${
              authTab === "signup"
                ? "border-emerald-400 text-emerald-300"
                : "border-transparent text-muted-foreground hover:text-white"
            }`}
          >
            Register Plot
          </button>
        </div>

        {/* Tab 1: Demo Profiles (Instant 1-Click for Hackathon Judges) */}
        {authTab === "demo" && (
          <div className="py-3 space-y-2 text-xs">
            <div className="text-[11px] text-muted-foreground">
              Select a pre-configured profile to test multi-farmer isolation:
            </div>
            <div
              onClick={() => handleSelectDemoProfile("Ramesh Patil", "MH-FAR-4192", "+91 98221 44021")}
              className="p-2.5 rounded-md bg-white/5 border border-white/10 hover:border-emerald-500/50 cursor-pointer transition-colors flex justify-between items-center"
            >
              <div>
                <div className="font-semibold text-white/95">Ramesh Patil (Nashik)</div>
                <div className="text-[10px] text-muted-foreground">Kisan ID: MH-FAR-4192 · Grape &amp; Onion</div>
              </div>
              <span className="text-[10px] text-emerald-400">1-Click Load</span>
            </div>

            <div
              onClick={() => handleSelectDemoProfile("Harpreet Singh", "PB-FAR-8812", "+91 98140 12093")}
              className="p-2.5 rounded-md bg-white/5 border border-white/10 hover:border-emerald-500/50 cursor-pointer transition-colors flex justify-between items-center"
            >
              <div>
                <div className="font-semibold text-white/95">Harpreet Singh (Ludhiana)</div>
                <div className="text-[10px] text-muted-foreground">Kisan ID: PB-FAR-8812 · Wheat Heartland</div>
              </div>
              <span className="text-[10px] text-emerald-400">1-Click Load</span>
            </div>

            <div
              onClick={() => handleSelectDemoProfile("Santosh Jadhav", "MH-CSN-3301", "+91 94220 55194")}
              className="p-2.5 rounded-md bg-white/5 border border-white/10 hover:border-emerald-500/50 cursor-pointer transition-colors flex justify-between items-center"
            >
              <div>
                <div className="font-semibold text-white/95">Santosh Jadhav (Sambhaji Nagar)</div>
                <div className="text-[10px] text-muted-foreground">Kisan ID: MH-CSN-3301 · Cotton &amp; Soy</div>
              </div>
              <span className="text-[10px] text-emerald-400">1-Click Load</span>
            </div>
          </div>
        )}

        {/* Tab 2: Supabase Sign In (Email / Password or Magic Link) */}
        {authTab === "signin" && (
          <form onSubmit={handlePasswordSignIn} className="py-3 space-y-3 text-xs">
            <div>
              <label className="text-[11px] text-muted-foreground block mb-1">Email Address:</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="farmer@example.com"
                className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-xs outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground block mb-1">Password:</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-xs outline-none focus:border-emerald-500"
              />
            </div>
            <Button type="submit" disabled={isSubmitting} className="w-full text-xs">
              {isSubmitting ? <RefreshCw size={13} className="animate-spin mr-1" /> : <Lock size={13} className="mr-1" />}
              Sign In with Supabase
            </Button>
          </form>
        )}

        {/* Tab 3: Register New Farmer */}
        {authTab === "signup" && (
          <form onSubmit={handleSignUp} className="py-3 space-y-2.5 text-xs">
            <div>
              <label className="text-[11px] text-muted-foreground block mb-1">Farmer Full Name:</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Dnyaneshwar Shinde"
                className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-1.5 text-xs outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground block mb-1">Kisan Card / Aadhaar ID:</label>
              <input
                type="text"
                required
                value={kisanId}
                onChange={(e) => setKisanId(e.target.value)}
                placeholder="e.g. MH-FAR-5520"
                className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-1.5 text-xs outline-none focus:border-emerald-500 font-mono"
              />
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground block mb-1">Email:</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="dnyaneshwar@krishi.in"
                className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-1.5 text-xs outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground block mb-1">Password:</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-1.5 text-xs outline-none focus:border-emerald-500"
              />
            </div>
            <Button type="submit" disabled={isSubmitting} className="w-full text-xs">
              {isSubmitting ? <RefreshCw size={13} className="animate-spin mr-1" /> : <Sparkles size={13} className="mr-1" />}
              Create Supabase Farmer Account
            </Button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
