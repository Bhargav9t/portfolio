import { useState } from "react";
import {
  Sliders,
  Eye,
  Shuffle,
  Compass,
  Info,
  Play,
  Pause,
  Sun,
  Moon,
  Zap,
} from "lucide-react";
import { soundFx } from "@/utils/audio";

interface SceneControlsProps {
  showWireframe: boolean;
  onToggleWireframe: () => void;
  waveSpeed: number;
  onChangeWaveSpeed: (speed: number) => void;
  onResetView: () => void;
  onRespawn?: () => void;
  timeOfDay?: number;
  onChangeTimeOfDay?: (time: number) => void;
  isCycleActive?: boolean;
  onToggleCycle?: () => void;
  isLowEndMode?: boolean;
  onToggleLowEndMode?: () => void;
  isBlackHoleEasterEgg?: boolean;
  onToggleBlackHoleEasterEgg?: () => void;
}

export function SceneControls({
  showWireframe,
  onToggleWireframe,
  waveSpeed,
  onChangeWaveSpeed,
  onResetView,
  onRespawn,
  timeOfDay = Math.PI * 0.45,
  onChangeTimeOfDay,
  isCycleActive = true,
  onToggleCycle,
  isLowEndMode = false,
  onToggleLowEndMode,
  isBlackHoleEasterEgg = false,
  onToggleBlackHoleEasterEgg,
}: SceneControlsProps) {
  const [showInfo, setShowInfo] = useState(false);

  let phaseLabel = "NOON // SUN";
  let isSunActive = true;

  if (isBlackHoleEasterEgg) {
    phaseLabel = "GARGANTUA // BLACK HOLE";
    isSunActive = false;
  } else {
    const norm = (timeOfDay % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
    const sinT = Math.sin(norm);
    const cosT = Math.cos(norm);

    if (sinT > 0.3) {
      phaseLabel = "NOON // SUN";
      isSunActive = true;
    } else if (sinT > -0.2 && cosT < 0) {
      phaseLabel = "DUSK // SUNSET";
      isSunActive = true;
    } else if (sinT < -0.3) {
      phaseLabel = "NIGHT // MOON";
      isSunActive = false;
    } else {
      phaseLabel = "DAWN // SUNRISE";
      isSunActive = true;
    }
  }

  const handleOpenToolkit = () => {
    soundFx.select();
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "q" }));
  };

  return (
    <div className="absolute bottom-2.5 left-3 right-3 md:left-6 md:right-6 flex flex-col md:flex-row items-center justify-between gap-2 pointer-events-none z-30 select-none">
      {/* Left: Unified Parchment Scroll Bar for Toolkit & Guide Hint */}
      <div className="flex items-center gap-1.5 pointer-events-auto parchment-card p-1 md:px-2 md:py-0.5 shadow-lg">
        {/* Integrated Toolkit Trigger */}
        <button
          id="toolkit-q-trigger-button"
          onClick={handleOpenToolkit}
          title="Click or press [Q] on keyboard to open Toolkit Wheel"
          className="parchment-chip-active px-2 py-0.5 text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer shadow-sm active:scale-95"
        >
          <span className="w-1 h-1 rounded-full bg-[#8b3c1b] animate-pulse" />
          <span className="px-1 py-0.2 rounded bg-[#544534] text-[#d7c198] font-mono text-[9px] font-black">
            Q
          </span>
          <span className="tracking-wider">TOOLKIT</span>
        </button>

        <div className="w-[1px] h-3 bg-[#8c7b64]/40" />

        {/* Guide Button & Hint Text */}
        <button
          onClick={() => {
            soundFx.hover();
            setShowInfo(!showInfo);
          }}
          className="parchment-chip parchment-chip-interactive px-1.5 py-0.5 text-[10px] font-mono flex items-center gap-1 cursor-pointer"
          title="View System Lore & Shortcuts"
        >
          <Info className="w-3 h-3 text-[#8b3c1b]" />
          <span className="hidden sm:inline">GUIDE</span>
        </button>

        <span className="text-[10px] font-mono text-[#59432d] hidden xl:inline max-w-[200px] truncate pl-1 font-medium">
          {isBlackHoleEasterEgg
            ? "GARGANTUA // 'BLACK' to exit"
            : "Sun & Moon // Type B-L-A-C-K"}
        </span>
      </div>

      {/* Sci-fi Gravitational Lore Modal */}
      {showInfo && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center p-3 z-50 pointer-events-auto">
          <div className="parchment-card max-w-sm w-full p-3.5 shadow-2xl space-y-2.5 font-mono text-left">
            <div className="flex items-center justify-between border-b border-[#8c7b64]/30 pb-2">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#8b3c1b] animate-ping" />
                <h3 className="text-xs font-bold text-[#1a1107] tracking-wider">CELESTIAL SYSTEM LORE</h3>
              </div>
              <button
                onClick={() => setShowInfo(false)}
                className="parchment-chip parchment-chip-interactive px-1.5 py-0.2 text-[10px] text-[#544534] cursor-pointer"
              >
                ✕ CLOSE
              </button>
            </div>

            <div className="space-y-2 text-[10px] leading-relaxed text-[#2b1f14]">
              <div className="parchment-inset p-2 space-y-0.5">
                <div className="text-[#8b3c1b] font-bold">1. NORMAL DAY & NIGHT CYCLE</div>
                <p className="text-[10px] text-[#3c2a18]">
                  Diurnal cycle: Pixel smiling Sun with sunglasses floats by day. At night, the Moon rises with an animated fiery eye.
                </p>
              </div>

              <div className="parchment-inset p-2 space-y-0.5">
                <div className="text-[#8b3c1b] font-bold">2. SECRET EASTER EGG (TYPE "BLACK")</div>
                <p className="text-[10px] text-[#3c2a18]">
                  Type <span className="font-bold text-[#1a1107] px-1 py-0.2 rounded border border-[#544534]/50 bg-[#cbb283]">B-L-A-C-K</span> (or click easter egg) to tear open spacetime and awaken Gargantua!
                </p>
              </div>

              <div className="parchment-inset p-2 space-y-0.5">
                <div className="text-[#8b3c1b] font-bold">3. GARGANTUA WAVE SUCTION</div>
                <p className="text-[10px] text-[#3c2a18]">
                  Ocean light is sucked into event horizon. 5 message bottles resist at radius 10.8 with anti-gravity shields!
                </p>
              </div>

              <div className="parchment-inset p-2 space-y-0.5">
                <div className="text-[#8b3c1b] font-bold">4. LOW-END DEVICE / LITE MODE</div>
                <p className="text-[10px] text-[#3c2a18]">
                  Toggle LITE mode to reduce ocean vertices by 84% for high FPS on any device.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Right Controls HUD: Unified Parchment Scroll Bar */}
      <div className="flex flex-wrap items-center gap-1 pointer-events-auto parchment-card p-1 md:px-2 md:py-0.5 shadow-lg">
        {/* Day/Night Cycle Play/Pause Toggle */}
        {onToggleCycle && (
          <button
            onClick={() => {
              soundFx.select();
              onToggleCycle();
            }}
            title={isCycleActive ? "Pause Orbit" : "Resume Orbit"}
            className={`px-1.5 py-0.5 text-[10px] font-mono transition-all cursor-pointer flex items-center gap-1 ${
              isCycleActive ? "parchment-chip-active" : "parchment-chip parchment-chip-interactive"
            }`}
          >
            {isCycleActive ? (
              <Pause className="w-2.5 h-2.5 text-[#8b3c1b]" />
            ) : (
              <Play className="w-2.5 h-2.5 text-[#8b3c1b]" />
            )}
            <span className="hidden lg:inline text-[9px] font-bold">{phaseLabel}</span>
          </button>
        )}

        {/* Celestial Orbit / Time of Day Scrubber */}
        {onChangeTimeOfDay && (
          <div
            title="Scrub Orbit"
            className="parchment-chip px-1.5 py-0.5 flex items-center gap-1"
          >
            {isSunActive ? (
              <Sun className="w-3 h-3 text-[#8b3c1b] animate-spin" style={{ animationDuration: "14s" }} />
            ) : (
              <Moon className="w-3 h-3 text-[#544534]" />
            )}
            <input
              type="range"
              min="0"
              max={Math.PI * 2}
              step="0.05"
              value={timeOfDay}
              onChange={(e) => onChangeTimeOfDay(parseFloat(e.target.value))}
              className="w-10 sm:w-12 h-1 accent-[#8b3c1b] cursor-pointer"
            />
          </div>
        )}

        {/* Wave Speed Slider */}
        <div
          title="Adjust Waves"
          className="parchment-chip px-1.5 py-0.5 flex items-center gap-1"
        >
          <Sliders className="w-3 h-3 text-[#8b3c1b]" />
          <span className="hidden xl:inline text-[9px]">WAVES</span>
          <input
            type="range"
            min="0.01"
            max="0.12"
            step="0.01"
            value={waveSpeed}
            onChange={(e) => onChangeWaveSpeed(parseFloat(e.target.value))}
            className="w-9 sm:w-11 h-1 accent-[#8b3c1b] cursor-pointer"
          />
        </div>

        {/* Performance / Low-End Device Mode toggle */}
        {onToggleLowEndMode && (
          <button
            onClick={() => {
              soundFx.select();
              onToggleLowEndMode();
            }}
            title={isLowEndMode ? "Low-End Mode Active" : "Ultra Graphics Active"}
            className={`px-1.5 py-0.5 text-[10px] font-mono transition-all cursor-pointer flex items-center gap-1 ${
              isLowEndMode ? "parchment-chip-active" : "parchment-chip parchment-chip-interactive"
            }`}
          >
            <Zap className="w-2.5 h-2.5 text-[#8b3c1b]" />
            <span className="hidden sm:inline font-bold">{isLowEndMode ? "LITE" : "ULTRA"}</span>
          </button>
        )}

        {/* Secret Easter Egg: Black Hole Singularity Toggle */}
        {onToggleBlackHoleEasterEgg && (
          <button
            onClick={() => {
              soundFx.select();
              soundFx.splash(1.6);
              onToggleBlackHoleEasterEgg();
            }}
            title={
              isBlackHoleEasterEgg
                ? "Gargantua Singularity Active"
                : "Summon Gargantua (or type 'BLACK')"
            }
            className={`px-1.5 py-0.5 text-[10px] font-mono transition-all cursor-pointer flex items-center gap-1 ${
              isBlackHoleEasterEgg ? "parchment-chip-active" : "parchment-chip parchment-chip-interactive"
            }`}
          >
            <span className="w-1 h-1 rounded-full bg-[#8b3c1b]" />
            <span className="hidden sm:inline font-bold">
              {isBlackHoleEasterEgg ? "SINGULARITY" : "B-L-A-C-K"}
            </span>
          </button>
        )}

        {/* Wireframe toggle */}
        <button
          onClick={() => {
            soundFx.hover();
            onToggleWireframe();
          }}
          title="Toggle Mesh Grid Overlay"
          className={`px-1.5 py-0.5 text-[10px] font-mono transition-all cursor-pointer flex items-center gap-1 ${
            showWireframe ? "parchment-chip-active" : "parchment-chip parchment-chip-interactive"
          }`}
        >
          <Eye className="w-2.5 h-2.5 text-[#8b3c1b]" />
          <span className="hidden md:inline font-bold">GRID</span>
        </button>

        {/* Drift Bottles button */}
        {onRespawn && (
          <button
            onClick={() => {
              soundFx.select();
              soundFx.splash(1.4);
              onRespawn();
            }}
            title="Drift Bottles"
            className="parchment-chip parchment-chip-interactive px-1.5 py-0.5 text-[10px] font-mono flex items-center gap-1 cursor-pointer"
          >
            <Shuffle className="w-2.5 h-2.5 text-[#8b3c1b]" />
            <span className="hidden sm:inline">DRIFT</span>
          </button>
        )}

        {/* Reset Camera button */}
        <button
          onClick={() => {
            soundFx.select();
            onResetView();
          }}
          title="Reset Camera"
          className="parchment-chip parchment-chip-interactive px-1.5 py-0.5 text-[10px] font-mono flex items-center gap-1 cursor-pointer"
        >
          <Compass className="w-2.5 h-2.5 text-[#8b3c1b]" />
          <span className="hidden sm:inline">OVERVIEW</span>
        </button>
      </div>
    </div>
  );
}

export default SceneControls;
