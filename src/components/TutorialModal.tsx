import React, { useState } from "react";
import { soundFx } from "@/utils/audio";
import {
  Compass,
  Sparkles,
  X,
  Sliders,
  Eye,
  Shuffle,
  Shield,
  HelpCircle,
  MousePointer,
  Smartphone,
  ChevronRight,
  ChevronLeft,
  Check,
} from "lucide-react";

export interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TutorialTab = "overview" | "controls" | "toolkit" | "secrets";

export function TutorialModal({ isOpen, onClose }: TutorialModalProps) {
  const [activeTab, setActiveTab] = useState<TutorialTab>("overview");
  const [dontShowAgain, setDontShowAgain] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleClose = () => {
    if (dontShowAgain && typeof window !== "undefined") {
      localStorage.setItem("portfolio_has_seen_tutorial", "true");
    }
    soundFx.select();
    soundFx.splash(1.2);
    onClose();
  };

  const handleTabChange = (tab: TutorialTab) => {
    soundFx.hover();
    setActiveTab(tab);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 md:p-6 pointer-events-auto select-none animate-in fade-in duration-200">
      {/* Darkened Atmospheric Backdrop */}
      <div
        className="absolute inset-0 bg-[#060c14]/85 backdrop-blur-md cursor-pointer transition-opacity"
        onClick={handleClose}
      />

      {/* Unfurled Ancient Manuscript Scroll Container */}
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col parchment-card shadow-[0_10px_60px_rgba(0,0,0,0.95)] z-10 overflow-hidden font-mono text-[#2b1f14]">
        {/* Top Decorative Scroll Rod Bar */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-[#8c7b64]/35 bg-[#e5cfac]/90 select-none">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#8b3c1b] animate-pulse" />
            <div className="flex items-center gap-1.5 font-mono">
              <span className="text-[#8b3c1b] font-extrabold text-xs tracking-wider">
                📜 EXPEDITION ARCHIVE
              </span>
              <span className="text-[#59432d] text-xs font-bold hidden sm:inline">
                // ARCHIPELAGO NAVIGATION MANUAL
              </span>
            </div>
          </div>

          <button
            onClick={handleClose}
            aria-label="Close Guide"
            className="p-1 rounded-md bg-[#544534]/15 hover:bg-[#544534]/30 text-[#2b1f14] transition-all cursor-pointer flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Category Tabs */}
        <div className="flex items-center gap-1 px-3 py-1.5 border-b border-[#8c7b64]/25 bg-[#efe2c9]/70 overflow-x-auto custom-scrollbar">
          <button
            onClick={() => handleTabChange("overview")}
            className={`px-2 py-0.5 text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap transition-all ${
              activeTab === "overview"
                ? "parchment-chip-active scale-102"
                : "parchment-chip parchment-chip-interactive"
            }`}
          >
            <Compass className="w-3 h-3 text-[#8b3c1b]" />
            <span>1. ARCHIPELAGO</span>
          </button>

          <button
            onClick={() => handleTabChange("controls")}
            className={`px-2 py-0.5 text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap transition-all ${
              activeTab === "controls"
                ? "parchment-chip-active scale-102"
                : "parchment-chip parchment-chip-interactive"
            }`}
          >
            <Smartphone className="w-3 h-3 text-[#8b3c1b]" />
            <span>2. CONTROLS</span>
          </button>

          <button
            onClick={() => handleTabChange("toolkit")}
            className={`px-2 py-0.5 text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap transition-all ${
              activeTab === "toolkit"
                ? "parchment-chip-active scale-102"
                : "parchment-chip parchment-chip-interactive"
            }`}
          >
            <Sliders className="w-3 h-3 text-[#8b3c1b]" />
            <span>3. TOOLKIT [Q]</span>
          </button>

          <button
            onClick={() => handleTabChange("secrets")}
            className={`px-2 py-0.5 text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap transition-all ${
              activeTab === "secrets"
                ? "parchment-chip-active scale-102"
                : "parchment-chip parchment-chip-interactive"
            }`}
          >
            <Sparkles className="w-3 h-3 text-[#8b3c1b]" />
            <span>4. SECRETS & FLEETS</span>
          </button>
        </div>

        {/* Scrollable Content Body with Parchment Scroll Aesthetic */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 custom-scrollbar text-[#2b1f14] overscroll-contain touch-pan-y">
          {/* TAB 1: ARCHIPELAGO OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <div className="parchment-inset p-2.5 sm:p-3 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-[#8b3c1b] font-bold text-xs">
                    WELCOME TO THE CELESTIAL ARCHIVE
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed text-[#3c2a18]">
                  You have anchored within the interactive 3D ocean portfolio of{" "}
                  <strong className="text-[#1a1107]">Chinipilli Bhargav Reddy</strong>—AI &
                  Machine Learning Systems Engineer and Full-Stack Architect.
                </p>
              </div>

              <div className="space-y-2">
                <div className="text-[11px] font-bold text-[#8b3c1b] uppercase tracking-wider">
                  ✦ The 5 Message Bottles Floating in the Sea
                </div>
                <p className="text-[10px] text-[#4a3622] leading-relaxed">
                  Five glass bottles drift in the water, each housing a sealed scroll containing a dossier of work, research, and career milestones:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
                  <div className="parchment-inset p-2 space-y-1">
                    <div className="font-bold text-[#8b3c1b] flex items-center gap-1">
                      <span>[01] ABOUT</span>
                    </div>
                    <p className="text-[#4a3622]">
                      Identity, engineering philosophy, skills matrix, and foundation.
                    </p>
                  </div>

                  <div className="parchment-inset p-2 space-y-1">
                    <div className="font-bold text-[#8b3c1b] flex items-center gap-1">
                      <span>[02] PROJECTS</span>
                    </div>
                    <p className="text-[#4a3622]">
                      Award-winning AI platforms, Career Ladder, distributed PWAs, & systems.
                    </p>
                  </div>

                  <div className="parchment-inset p-2 space-y-1">
                    <div className="font-bold text-[#8b3c1b] flex items-center gap-1">
                      <span>[03] PUBLICATIONS</span>
                    </div>
                    <p className="text-[#4a3622]">
                      Research papers, IEEE/ACM conference works, & intellectual contributions.
                    </p>
                  </div>

                  <div className="parchment-inset p-2 space-y-1">
                    <div className="font-bold text-[#8b3c1b] flex items-center gap-1">
                      <span>[04] EXPERIENCE</span>
                    </div>
                    <p className="text-[#4a3622]">
                      Industry internships, tech lead roles, and academic achievements.
                    </p>
                  </div>

                  <div className="parchment-inset p-2 space-y-1 sm:col-span-2">
                    <div className="font-bold text-[#8b3c1b] flex items-center gap-1">
                      <span>[05] CONTACT</span>
                    </div>
                    <p className="text-[#4a3622]">
                      Direct signal transmission, GitHub, LinkedIn, email, and location channels.
                    </p>
                  </div>
                </div>

                <div className="parchment-chip px-2 py-1 text-[10px] flex items-center gap-1.5 w-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#8b3c1b]" />
                  <span>Tip: Click or tap any floating bottle or tag to inspect its dossier!</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CONTROLS & GESTURES */}
          {activeTab === "controls" && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Mobile Touch Navigation */}
                <div className="parchment-inset p-2.5 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#8b3c1b]">
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>ON PHONE / TOUCH SCREEN</span>
                  </div>
                  <ul className="space-y-1.5 text-[10px] text-[#4a3622]">
                    <li className="flex items-start gap-1.5">
                      <span className="font-bold text-[#1a1107]">👆 1-Finger Drag:</span>
                      <span>Smoothly orbit and glide the camera around the ocean archipelago.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="font-bold text-[#1a1107]">✌️ 2-Finger Pinch:</span>
                      <span>Pinch in and out to zoom into bottles or view the expansive horizon.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="font-bold text-[#1a1107]">📑 Top Menu:</span>
                      <span>Tap the top-right menu icon for immediate access to all 5 sections.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="font-bold text-[#1a1107]">🎛️ Bottom Bar:</span>
                      <span>Tap "MORE" to reveal wave adjustments, orbit scrubbing, & grid overlay.</span>
                    </li>
                  </ul>
                </div>

                {/* Desktop Mouse & Keyboard Navigation */}
                <div className="parchment-inset p-2.5 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#8b3c1b]">
                    <MousePointer className="w-3.5 h-3.5" />
                    <span>ON DESKTOP / LAPTOP</span>
                  </div>
                  <ul className="space-y-1.5 text-[10px] text-[#4a3622]">
                    <li className="flex items-start gap-1.5">
                      <span className="font-bold text-[#1a1107]">🖱️ Right / Middle Drag:</span>
                      <span>Orbit around the archipelago and change view perspective.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="font-bold text-[#1a1107]">⌨️ Shift + Drag:</span>
                      <span>Pan the camera across the surface of the sea.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="font-bold text-[#1a1107]">⚙️ Scroll Wheel:</span>
                      <span>Zoom camera in and out smoothly.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="font-bold text-[#1a1107]">⌨️ [Q] Key / [1-5]:</span>
                      <span>Open the GTA-style radial weapon wheel or hotkey equip tools.</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="parchment-inset p-2 space-y-1 text-[10px]">
                <div className="font-bold text-[#8b3c1b]">OVERVIEW BUTTON:</div>
                <p className="text-[#4a3622]">
                  Lost in the vastness of the sea? Tap <strong>OVERVIEW</strong> (or <strong>VIEW</strong> on mobile) on the bottom bar at any time to instantly reset the camera to the optimal vantage point.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: RADIAL TOOLKIT WHEEL */}
          {activeTab === "toolkit" && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <div className="parchment-inset p-2.5 space-y-1">
                <div className="text-xs font-bold text-[#8b3c1b]">
                  THE GTA-STYLE RADIAL WEAPON WHEEL
                </div>
                <p className="text-[10px] text-[#4a3622]">
                  Press <strong className="text-[#1a1107]">[Q]</strong> on your keyboard or tap the{" "}
                  <strong className="text-[#1a1107]">TOOLKIT</strong> HUD button to summon the 5-sector mechanical wheel. Aim or tap to equip:
                </p>
              </div>

              <div className="space-y-2 text-[10px]">
                <div className="parchment-inset p-2 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#854d0e] flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#d97706] inline-block shadow-xs" />
                      [1] DEMOLITION HAMMER
                    </span>
                    <span className="text-[9px] font-mono font-bold text-[#69523b]">AMMO: 17</span>
                  </div>
                  <p className="text-[#3c2a18]">
                    Slam down kinetic force! Shatter message bottles to reveal portfolio dossiers or bonk pirate ships as they sail past.
                  </p>
                </div>

                <div className="parchment-inset p-2 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#166534] flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#22c55e] inline-block shadow-xs" />
                      [2] THE GRAVITON HAND
                    </span>
                    <span className="text-[9px] font-mono font-bold text-[#69523b]">AMMO: 60</span>
                  </div>
                  <p className="text-[#3c2a18]">
                    Tractor-beam manipulator gauntlet. Pick up ocean bottles and ships directly from the water and fling them across the archipelago.
                  </p>
                </div>

                <div className="parchment-inset p-2 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#9a3412] flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#ea580c] inline-block shadow-xs" />
                      [3] TIME SKIP CHRONO
                    </span>
                    <span className="text-[9px] font-mono font-bold text-[#69523b]">AMMO: 11</span>
                  </div>
                  <p className="text-[#3c2a18]">
                    Accelerate celestial rotation between high noon, golden sunset, and midnight moon.
                  </p>
                </div>

                <div className="parchment-inset p-2 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#0369a1] flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#0ea5e9] inline-block shadow-xs" />
                      [4] 360° PANORAMIC TURN
                    </span>
                    <span className="text-[9px] font-mono font-bold text-[#69523b]">AMMO: 360</span>
                  </div>
                  <p className="text-[#3c2a18]">
                    Engages a smooth 360-degree cinematic ocean camera rotation to showcase the entire horizon.
                  </p>
                </div>

                <div className="parchment-inset p-2 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#6b21a8] flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#a855f7] inline-block shadow-xs" />
                      [5] QUANTUM RANDOMIZE
                    </span>
                    <span className="text-[9px] font-mono font-bold text-[#69523b]">AMMO: 5</span>
                  </div>
                  <p className="text-[#3c2a18]">
                    Scatter and randomize all bottle coordinates and fleet trajectories across the 90-meter open sea.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SECRETS & CELESTIAL FLEETS */}
          {activeTab === "secrets" && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <div className="parchment-inset p-2.5 space-y-1.5">
                <div className="text-xs font-bold text-[#8b3c1b] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#8b3c1b]" />
                  <span>NAVAL FLEETS & OCEAN WILDLIFE</span>
                </div>
                <p className="text-[10px] text-[#4a3622] leading-relaxed">
                  Five iconic pirate ships (<em>Thousand Sunny, Going Merry, Polar Tang, Red Force, and Ark Maxim</em>) patrol the waters.
                </p>
                <div className="parchment-chip px-2 py-0.5 text-[9px] font-bold">
                  ⚡ Click or tap any ship while sailing to give it a nitro speed boost!
                </div>
              </div>

              <div className="parchment-inset p-2.5 space-y-1.5">
                <div className="text-xs font-bold text-[#8b3c1b]">
                  CELESTIAL DIURNAL CYCLE
                </div>
                <p className="text-[10px] text-[#4a3622] leading-relaxed">
                  By day, the smiling Pixel Sun with sunglasses floats across azure skies. At night, the Moon ascends, accompanied by an animated fiery eye and nocturnal bats.
                </p>
              </div>

              {/* Secret Anomaly Lore (Cryptic and Mysterious without spoiling B-L-A-C-K) */}
              <div className="parchment-inset p-2.5 space-y-1.5 border border-[#8b3c1b]/40 bg-[#e0c9a6]">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#632024]">
                  <Shield className="w-3.5 h-3.5" />
                  <span>ANCIENT MARINERS' TALE // A VEILED ANOMALY</span>
                </div>
                <p className="text-[10px] text-[#3c2415] leading-relaxed italic">
                  "Old navigational charts speak of a dormant singularity sleeping somewhere in the cosmos. It is said that when the hour grows dark, those who utter a certain ancient five-letter whisper upon their keys, or gaze upon the farthest mystery in the stars, may witness the fabric of spacetime bend and pull..."
                </p>
                <div className="text-[9px] text-[#69523b] font-semibold">
                  ✦ Only the keenest voyagers shall ever uncover what lies beyond the veil.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Scroll Footer: Don't Show Again & Enter Archipelago Action */}
        <div className="px-3 py-2 border-t border-[#8c7b64]/35 bg-[#e5cfac]/95 flex flex-wrap items-center justify-between gap-2 text-[10px] select-none">
          {/* Checkbox: Don't show again */}
          <label className="flex items-center gap-1.5 cursor-pointer text-[#4a3622] hover:text-[#1a1107] transition-colors">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="w-3.5 h-3.5 accent-[#8b3c1b] rounded cursor-pointer"
            />
            <span className="font-medium text-[9px] sm:text-[10px]">
              Don't show expedition guide on startup
            </span>
          </label>

          {/* Action Button */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleClose}
              className="parchment-chip-active px-3 py-1 text-[10px] sm:text-[11px] font-mono font-bold flex items-center gap-1.5 cursor-pointer shadow-md active:scale-95 hover:brightness-105"
            >
              <span>ENTER ARCHIPELAGO</span>
              <ChevronRight className="w-3 h-3 text-[#8b3c1b]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TutorialModal;
