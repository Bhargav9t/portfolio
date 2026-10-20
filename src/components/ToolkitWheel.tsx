"use client";

import React, { useState, useEffect, useRef } from "react";
import { soundFx } from "@/utils/audio";

export type ToolMode =
  | "default"
  | "hammer"
  | "hand"
  | "turn360"
  | "time"
  | "randomize";

export interface ToolkitProps {
  activeTool: ToolMode;
  onSelectTool: (tool: ToolMode) => void;
  isGrabbing?: boolean;
  actionNotification?: string | null;
  onTriggerAction?: (action: ToolMode) => void;
}

export interface WheelSector {
  id: ToolMode;
  label: string;
  sublabel: string;
  desc: string;
  color: string;
  ammo: string;
  hasOuterBracket?: boolean;
  bracketColor?: string;
  centerAngle: number; // In degrees, 0 = Top (12 o'clock)
}

// Exactly 5 sectors arranged clockwise:
// 1. hammer    -> Demolition Hammer (0° / 12:00)
// 2. hand      -> The Hand (72° / ~2:24)
// 3. time      -> Time Skip (144° / ~4:48)
// 4. turn360   -> 360° Turn (216° / ~7:12)
// 5. randomize -> Randomize (288° / ~9:36)
export const GTA_TOOL_SECTORS: WheelSector[] = [
  {
    id: "hammer",
    label: "HAMMER",
    sublabel: "DEMOLITION BREAKER",
    desc: "Smash message bottles to reveal portfolio dossier or bonk pirate ships",
    color: "#eab308", // Golden Yellow
    ammo: "17",
    centerAngle: 0,
  },
  {
    id: "hand",
    label: "THE HAND",
    sublabel: "GRAVITON MANIPULATOR",
    desc: "Pick up bottles and ships from ocean & relocate anywhere across the water",
    color: "#4ade80", // Cyber Green
    ammo: "60",
    centerAngle: 72,
  },
  {
    id: "time",
    label: "TIME SKIP",
    sublabel: "CELESTIAL CHRONO",
    desc: "Cycles celestial atmosphere: Noon, Golden Dawn & Midnight Moon",
    color: "#f97316", // High-Energy Orange
    ammo: "11",
    hasOuterBracket: true,
    bracketColor: "#f97316",
    centerAngle: 144,
  },
  {
    id: "turn360",
    label: "360° TURN",
    sublabel: "PANORAMIC ORBIT",
    desc: "Performs a complete 360-degree cinematic camera rotation around the ocean",
    color: "#38bdf8", // Electric Azure Blue
    ammo: "360",
    hasOuterBracket: true,
    bracketColor: "#38bdf8",
    centerAngle: 216,
  },
  {
    id: "randomize",
    label: "RANDOMIZE",
    sublabel: "QUANTUM SCATTER",
    desc: "Randomizes all bottle and ship positions across the 90m ocean",
    color: "#c084fc", // Deep Purple
    ammo: "5",
    centerAngle: 288,
  },
];

// Vector Silhouettes matching the retro high-tech aesthetic
function WeaponVectorSilhouette({ id, color, size = 52 }: { id: ToolMode; color: string; size?: number }) {
  if (id === "hammer") {
    // Heavy kinetic warhammer with striking head & energy core
    return (
      <svg width={size} height={size * 0.55} viewBox="0 0 100 55" fill="none" className="overflow-visible">
        <rect x="18" y="24" width="70" height="7" rx="2" fill={color} opacity="0.85" />
        <rect x="68" y="22" width="22" height="11" rx="2" fill={color} />
        <path d="M 85 19 L 95 27.5 L 85 36 Z" fill={color} />
        <path d="M 10 8 L 32 12 L 32 43 L 10 47 Z" fill={color} />
        <rect x="5" y="14" width="7" height="27" rx="1.5" fill={color} />
        <rect x="15" y="22" width="14" height="11" fill="#000" opacity="0.6" />
        <line x1="17" y1="27.5" x2="27" y2="27.5" stroke={color} strokeWidth="2.5" />
      </svg>
    );
  }

  if (id === "hand") {
    // Cybernetic graviton manipulator gauntlet with tractor beam emitter
    return (
      <svg width={size} height={size * 0.55} viewBox="0 0 100 55" fill="none" className="overflow-visible">
        <rect x="62" y="20" width="30" height="18" rx="3" fill={color} opacity="0.8" />
        <rect x="52" y="16" width="12" height="26" rx="2" fill={color} />
        <path d="M 28 17 L 52 16 L 52 42 L 32 40 Z" fill={color} />
        <path d="M 12 12 L 26 14 L 28 20 L 16 18 Z" fill={color} />
        <path d="M 8 20 L 26 21 L 28 27 L 10 26 Z" fill={color} />
        <path d="M 8 29 L 26 28 L 28 34 L 10 35 Z" fill={color} />
        <path d="M 14 37 L 28 35 L 30 41 L 18 43 Z" fill={color} />
        <circle cx="40" cy="29" r="6" fill="#000" opacity="0.6" />
        <circle cx="40" cy="29" r="3.5" fill={color} />
      </svg>
    );
  }

  if (id === "time") {
    // Celestial orbital chrono-dial rifle
    return (
      <svg width={size} height={size * 0.55} viewBox="0 0 100 55" fill="none" className="overflow-visible">
        <path d="M 14 26 L 85 24 L 88 34 L 14 32 Z" fill={color} opacity="0.8" />
        <circle cx="50" cy="28.5" r="14" fill="#000" opacity="0.5" />
        <circle cx="50" cy="28.5" r="14" stroke={color} strokeWidth="2" fill="none" />
        <path d="M 44 20 A 10 10 0 0 0 56 36 A 12 12 0 0 1 44 20 Z" fill={color} />
        <path d="M 8 20 L 16 28.5 L 8 37 Z" fill={color} />
      </svg>
    );
  }

  if (id === "turn360") {
    // 360 Degree Panoramic Orbit Gyroscope
    return (
      <svg width={size} height={size * 0.55} viewBox="0 0 100 55" fill="none" className="overflow-visible">
        {/* Orbital 360 Ring */}
        <ellipse cx="50" cy="27.5" rx="36" ry="15" stroke={color} strokeWidth="2.5" strokeDasharray="16 4" fill="none" />
        {/* Rotation Arrows */}
        <path d="M 86 27.5 L 81 21 L 77 28.5 Z" fill={color} />
        <path d="M 14 27.5 L 19 34 L 23 26.5 Z" fill={color} />
        {/* Center Camera Lens Core */}
        <circle cx="50" cy="27.5" r="10" fill="#000" opacity="0.6" />
        <circle cx="50" cy="27.5" r="7" stroke={color} strokeWidth="2.5" fill="none" />
        <circle cx="50" cy="27.5" r="3.5" fill={color} />
      </svg>
    );
  }

  // Randomize / Quantum Scatter Cluster
  return (
    <svg width={size} height={size * 0.55} viewBox="0 0 100 55" fill="none" className="overflow-visible">
      <rect x="45" y="17" width="40" height="22" rx="3" fill={color} opacity="0.85" />
      <rect x="12" y="16" width="34" height="6" rx="1.5" fill={color} />
      <rect x="8" y="23" width="38" height="6" rx="1.5" fill={color} />
      <rect x="8" y="30" width="38" height="6" rx="1.5" fill={color} />
      <rect x="12" y="37" width="34" height="6" rx="1.5" fill={color} />
      <path d="M 60 38 L 74 38 L 72 49 L 62 49 Z" fill={color} />
    </svg>
  );
}

// Ammo Bullet Icons
function AmmoBulletsIcon({ color }: { color: string }) {
  return (
    <svg className="w-3.5 h-3 inline-block" viewBox="0 0 14 12" fill={color}>
      <rect x="0" y="3" width="2.2" height="7" rx="0.8" />
      <rect x="3.8" y="1" width="2.2" height="9" rx="0.8" />
      <rect x="7.6" y="1" width="2.2" height="9" rx="0.8" />
      <rect x="11.4" y="3" width="2.2" height="7" rx="0.8" />
    </svg>
  );
}

// Secondary Mod Badge Hexagon
function ModHexBadge({ id, color }: { id: ToolMode; color: string }) {
  const getGlyph = () => {
    switch (id) {
      case "hammer":
        return "🔨";
      case "hand":
        return "✋";
      case "time":
        return "🌙";
      case "turn360":
        return "🔄";
      case "randomize":
        return "🎲";
      default:
        return "⬡";
    }
  };

  return (
    <div
      className="w-5 h-5 flex items-center justify-center font-bold text-[9px] rounded-sm border"
      style={{
        borderColor: color,
        backgroundColor: "rgba(0,0,0,0.75)",
        color: color,
        clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
      }}
    >
      <span className="scale-85">{getGlyph()}</span>
    </div>
  );
}

// Helper to calculate mathematical SVG annular sector path
function describeAnnularSector(
  cx: number,
  cy: number,
  innerR: number,
  outerR: number,
  startAngleDeg: number,
  endAngleDeg: number
): string {
  const startRad = ((startAngleDeg - 90) * Math.PI) / 180;
  const endRad = ((endAngleDeg - 90) * Math.PI) / 180;

  const x1 = cx + innerR * Math.cos(startRad);
  const y1 = cy + innerR * Math.sin(startRad);
  const x2 = cx + outerR * Math.cos(startRad);
  const y2 = cy + outerR * Math.sin(startRad);
  const x3 = cx + outerR * Math.cos(endRad);
  const y3 = cy + outerR * Math.sin(endRad);
  const x4 = cx + innerR * Math.cos(endRad);
  const y4 = cy + innerR * Math.sin(endRad);

  const largeArcFlag = endAngleDeg - startAngleDeg <= 180 ? 0 : 1;

  return [
    `M ${x1.toFixed(2)} ${y1.toFixed(2)}`,
    `L ${x2.toFixed(2)} ${y2.toFixed(2)}`,
    `A ${outerR} ${outerR} 0 ${largeArcFlag} 1 ${x3.toFixed(2)} ${y3.toFixed(2)}`,
    `L ${x4.toFixed(2)} ${y4.toFixed(2)}`,
    `A ${innerR} ${innerR} 0 ${largeArcFlag} 0 ${x1.toFixed(2)} ${y1.toFixed(2)}`,
    "Z",
  ].join(" ");
}

// Helper to draw the outer curved bracket accent bar
function describeOuterAccentBar(
  cx: number,
  cy: number,
  r: number,
  startAngleDeg: number,
  endAngleDeg: number
): string {
  const startRad = ((startAngleDeg - 90) * Math.PI) / 180;
  const endRad = ((endAngleDeg - 90) * Math.PI) / 180;
  const x1 = cx + r * Math.cos(startRad);
  const y1 = cy + r * Math.sin(startRad);
  const x2 = cx + r * Math.cos(endRad);
  const y2 = cy + r * Math.sin(endRad);
  const largeArcFlag = endAngleDeg - startAngleDeg <= 180 ? 0 : 1;
  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${largeArcFlag} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
}

export function ToolkitWheel({
  activeTool,
  onSelectTool,
  isGrabbing = false,
  actionNotification,
  onTriggerAction,
}: ToolkitProps) {
  // Only opens when clicking / pressing Q!
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState(0);

  const lastSoundTickRef = useRef<number>(0);

  // Wheel Dimensions
  const SIZE = 560;
  const CX = SIZE / 2;
  const CY = SIZE / 2;
  const INNER_R = 98;
  const OUTER_R = 240;
  const ACCENT_R = 249;

  const SECTOR_COUNT = GTA_TOOL_SECTORS.length; // 5
  const SECTOR_SPAN = 360 / SECTOR_COUNT; // 72 deg
  const HALF_SPAN = SECTOR_SPAN / 2 - 1.8; // 34.2 deg (with 3.6 deg mechanical gap)

  const selectedSector = GTA_TOOL_SECTORS[hoveredIndex] || GTA_TOOL_SECTORS[0];

  const selectSectorIndex = (idx: number, playSound = true) => {
    if (idx < 0 || idx >= GTA_TOOL_SECTORS.length) return;
    setHoveredIndex(idx);

    const now = performance.now();
    if (playSound && now - lastSoundTickRef.current > 80) {
      soundFx.wheelTick();
      lastSoundTickRef.current = now;
    }
  };

  const commitSelection = (idx: number) => {
    const selected = GTA_TOOL_SECTORS[idx];
    if (selected) {
      soundFx.wheelEquip();
      onSelectTool(selected.id);
      onTriggerAction?.(selected.id);
    }
    setIsOpen(false);
  };

  const wheelContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMove = (clientX: number, clientY: number) => {
      if (!isOpen) return;

      const rect = wheelContainerRef.current?.getBoundingClientRect();
      const centerX = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
      const centerY = rect ? rect.top + rect.height / 2 : window.innerHeight / 2;
      const dx = clientX - centerX;
      const dy = clientY - centerY;
      const dist = Math.hypot(dx, dy);

      // Aiming direction selects sector when outside center deadzone
      if (dist > 18) {
        let angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
        if (angleDeg < 0) angleDeg += 360;

        // Map angle across the 5 sectors of 72° each, offset by 36°
        const sectorIdx = Math.floor(((angleDeg + SECTOR_SPAN / 2) % 360) / SECTOR_SPAN);

        if (sectorIdx >= 0 && sectorIdx < SECTOR_COUNT && sectorIdx !== hoveredIndex) {
          selectSectorIndex(sectorIdx, true);
        }
      }
    };

    const handlePointerMove = (e: MouseEvent) => {
      handleMove(e.clientX, e.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    // Hotkey: [Q] toggles wheel, [1-5] hotkeys switch tools directly
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === "q" || e.key === "Q") {
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
          const curIdx = GTA_TOOL_SECTORS.findIndex((t) => t.id === activeTool);
          selectSectorIndex(curIdx >= 0 ? curIdx : 0, false);
          soundFx.toolkitOpen();
        } else {
          commitSelection(hoveredIndex);
        }
      } else if (e.key === "Escape") {
        if (isOpen) {
          setIsOpen(false);
        }
      } else if (e.key >= "1" && e.key <= "5") {
        // Quick 1-5 number hotkeys equip tools directly
        const idx = parseInt(e.key, 10) - 1;
        if (idx >= 0 && idx < GTA_TOOL_SECTORS.length) {
          commitSelection(idx);
        }
      }
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, hoveredIndex, activeTool, onSelectTool, onTriggerAction]);

  return (
    <>
      {/* 1. RADIAL WEAPON TOOLKIT WHEEL (TRIGGERED ONLY VIA Q OR HUD BUTTON) */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 select-none flex items-center justify-center bg-black/75 backdrop-blur-md animate-in fade-in duration-100 p-2"
          onClick={(e) => {
            // Clicking backdrop closes wheel
            if (e.target === e.currentTarget) {
              setIsOpen(false);
            }
          }}
        >
          {/* Mobile Close Button */}
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-4 right-4 z-10 px-3 py-1.5 rounded-xl bg-black/60 border border-white/20 text-[#d5b893] hover:text-white font-mono text-xs flex items-center gap-1 cursor-pointer backdrop-blur-md active:scale-95"
          >
            ✕ CLOSE
          </button>

          <div
            ref={wheelContainerRef}
            className="relative w-[min(560px,90vw)] h-[min(560px,90vw)] max-w-[560px] max-h-[560px]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* The SVG Annular Wheel Geometry */}
            <svg
              viewBox={`0 0 ${SIZE} ${SIZE}`}
              className="w-full h-full overflow-visible filter drop-shadow-[0_0_40px_rgba(0,0,0,0.95)]"
            >
              <defs>
                {/* Radial Glowing Gradients for Each Sector */}
                {GTA_TOOL_SECTORS.map((tool) => (
                  <radialGradient
                    key={`grad-${tool.id}`}
                    id={`grad-${tool.id}`}
                    cx="50%"
                    cy="50%"
                    r="50%"
                  >
                    <stop offset="0%" stopColor={tool.color} stopOpacity="0.45" />
                    <stop offset="65%" stopColor={tool.color} stopOpacity="0.25" />
                    <stop offset="100%" stopColor={tool.color} stopOpacity="0.08" />
                  </radialGradient>
                ))}
              </defs>

              {/* Outer Mechanical Guide Circles */}
              <circle
                cx={CX}
                cy={CY}
                r={OUTER_R + 5}
                fill="none"
                stroke="rgba(255,255,255,0.15)"
                strokeWidth="1.5"
                strokeDasharray="14 4"
              />
              <circle
                cx={CX}
                cy={CY}
                r={OUTER_R + 10}
                fill="none"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="1"
              />

              {/* Chamfered Top Tab at 12 o'clock */}
              <path
                d={`M ${CX - 24} ${CY - OUTER_R - 5} L ${CX - 16} ${CY - OUTER_R - 14} L ${CX + 16} ${CY - OUTER_R - 14} L ${CX + 24} ${CY - OUTER_R - 5} Z`}
                fill="rgba(255,255,255,0.18)"
                stroke="rgba(255,255,255,0.35)"
                strokeWidth="1"
              />

              {/* 5 Annular Sector Wedges */}
              {GTA_TOOL_SECTORS.map((tool, idx) => {
                const isSelected = hoveredIndex === idx;
                const startAngle = tool.centerAngle - HALF_SPAN;
                const endAngle = tool.centerAngle + HALF_SPAN;
                const pathD = describeAnnularSector(CX, CY, INNER_R, OUTER_R, startAngle, endAngle);

                return (
                  <g
                    key={tool.id}
                    className="cursor-pointer transition-all duration-100"
                    onPointerEnter={() => selectSectorIndex(idx, true)}
                    onPointerMove={() => selectSectorIndex(idx, true)}
                    onClick={() => commitSelection(idx)}
                  >
                    {/* Sector Wedge Fill & Border */}
                    <path
                      d={pathD}
                      fill={isSelected ? `url(#grad-${tool.id})` : "rgba(16, 28, 20, 0.72)"}
                      stroke={isSelected ? tool.color : "rgba(255, 255, 255, 0.25)"}
                      strokeWidth={isSelected ? "2.5" : "1.2"}
                      strokeLinejoin="round"
                      style={{
                        filter: isSelected ? `drop-shadow(0 0 14px ${tool.color})` : "none",
                      }}
                    />

                    {/* Active Outer Glowing Perimeter Bracket Bar */}
                    {isSelected && (
                      <path
                        d={describeOuterAccentBar(CX, CY, ACCENT_R, startAngle + 2, endAngle - 2)}
                        fill="none"
                        stroke={tool.color}
                        strokeWidth="6"
                        strokeLinecap="round"
                        className="filter drop-shadow-[0_0_12px_currentColor]"
                      />
                    )}

                    {/* Sector Corner Marker Dots on Outer Rim */}
                    <circle
                      cx={CX + (OUTER_R - 2) * Math.cos(((startAngle - 90) * Math.PI) / 180)}
                      cy={CY + (OUTER_R - 2) * Math.sin(((startAngle - 90) * Math.PI) / 180)}
                      r="1.8"
                      fill={isSelected ? tool.color : "rgba(255,255,255,0.35)"}
                    />
                    <circle
                      cx={CX + (OUTER_R - 2) * Math.cos(((endAngle - 90) * Math.PI) / 180)}
                      cy={CY + (OUTER_R - 2) * Math.sin(((endAngle - 90) * Math.PI) / 180)}
                      r="1.8"
                      fill={isSelected ? tool.color : "rgba(255,255,255,0.35)"}
                    />
                  </g>
                );
              })}

              {/* Inner Center Hub Border Ring */}
              <circle
                cx={CX}
                cy={CY}
                r={INNER_R}
                fill="none"
                stroke={selectedSector.color}
                strokeWidth="2.5"
                className="transition-colors duration-150 filter drop-shadow-[0_0_10px_currentColor]"
              />
              <circle
                cx={CX}
                cy={CY}
                r={INNER_R - 6}
                fill="none"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="1"
                strokeDasharray="4 6"
              />

              {/* Cardinal Tick Marks at each spoke */}
              {GTA_TOOL_SECTORS.map((tool) => {
                const rad = ((tool.centerAngle - 90) * Math.PI) / 180;
                const x1 = CX + (INNER_R - 9) * Math.cos(rad);
                const y1 = CY + (INNER_R - 9) * Math.sin(rad);
                const x2 = CX + INNER_R * Math.cos(rad);
                const y2 = CY + INNER_R * Math.sin(rad);
                return (
                  <line
                    key={`tick-${tool.id}`}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="rgba(255,255,255,0.5)"
                    strokeWidth="1.5"
                  />
                );
              })}

              {/* Aiming Needle pointing from center towards selected sector */}
              {(() => {
                const rad = ((selectedSector.centerAngle - 90) * Math.PI) / 180;
                const tipX = CX + (INNER_R - 14) * Math.cos(rad);
                const tipY = CY + (INNER_R - 14) * Math.sin(rad);
                return (
                  <line
                    x1={CX}
                    y1={CY}
                    x2={tipX}
                    y2={tipY}
                    stroke={selectedSector.color}
                    strokeWidth="2.5"
                    strokeDasharray="3 3"
                    className="transition-all duration-100"
                  />
                );
              })()}
            </svg>

            {/* DOM Overlays positioned inside each Sector Wedge */}
            {GTA_TOOL_SECTORS.map((tool, idx) => {
              const isSelected = hoveredIndex === idx;
              const rad = ((tool.centerAngle - 90) * Math.PI) / 180;
              const dist = (INNER_R + OUTER_R) / 2;
              const posX = CX + dist * Math.cos(rad);
              const posY = CY + dist * Math.sin(rad);

              return (
                <div
                  key={`content-${tool.id}`}
                  style={{
                    position: "absolute",
                    left: `${(posX / SIZE) * 100}%`,
                    top: `${(posY / SIZE) * 100}%`,
                    transform: "translate(-50%, -50%)",
                    pointerEvents: "none",
                  }}
                  className={`flex flex-col items-center justify-center transition-all duration-100 select-none ${
                    isSelected ? "scale-105 sm:scale-110" : "scale-85 sm:scale-90 opacity-75"
                  }`}
                >
                  {/* Ammo Count & Mod Hex Badge */}
                  <div className="flex items-center gap-1 sm:gap-1.5 mb-0.5 sm:mb-1 text-[9px] sm:text-[11px] font-mono font-bold">
                    <AmmoBulletsIcon color={isSelected ? tool.color : "#94a3b8"} />
                    <span style={{ color: isSelected ? tool.color : "#94a3b8" }}>{tool.ammo}</span>
                    <ModHexBadge id={tool.id} color={isSelected ? tool.color : "#94a3b8"} />
                  </div>

                  {/* Weapon Silhouette */}
                  <div className="filter drop-shadow-[0_0_8px_rgba(0,0,0,0.8)] scale-85 sm:scale-100">
                    <WeaponVectorSilhouette
                      id={tool.id}
                      color={isSelected ? tool.color : "#94a3b8"}
                      size={60}
                    />
                  </div>

                  {/* Sector Title Label */}
                  <span
                    className="text-[8px] sm:text-[10px] font-mono font-extrabold tracking-wider uppercase mt-0.5 sm:mt-1 px-1 sm:px-1.5 py-0.2 sm:py-0.5 rounded"
                    style={{
                      color: isSelected ? "#000000" : "#ffffff",
                      backgroundColor: isSelected ? tool.color : "rgba(0,0,0,0.6)",
                    }}
                  >
                    [{idx + 1}] {tool.label}
                  </span>
                </div>
              );
            })}

            {/* CENTER HUB TELEMETRY DISPLAY */}
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full flex flex-col items-center justify-center text-center p-2 sm:p-4 pointer-events-none select-none"
              style={{
                width: `${((INNER_R * 1.8) / SIZE) * 100}%`,
                height: `${((INNER_R * 1.8) / SIZE) * 100}%`,
                backgroundColor: "rgba(6, 14, 10, 0.92)",
                boxShadow: `inset 0 0 25px ${selectedSector.color}33`,
              }}
            >
              <span className="text-[10px] font-mono font-bold tracking-widest text-white/50 uppercase">
                EQUIPMENT [Q]
              </span>
              <span
                className="text-base font-black font-mono tracking-tight leading-tight transition-colors duration-150"
                style={{ color: selectedSector.color }}
              >
                {selectedSector.label}
              </span>
              <span className="text-[9px] font-mono text-white/70 tracking-widest uppercase mt-0.5">
                {selectedSector.sublabel}
              </span>

              <div
                className="w-16 h-0.5 my-1.5 opacity-60 transition-colors duration-150"
                style={{ backgroundColor: selectedSector.color }}
              />

              <p className="text-[9px] font-mono text-white/80 leading-tight max-w-[150px] line-clamp-2 px-1">
                {selectedSector.desc}
              </p>

              <div className="mt-1 flex items-center gap-2 text-[9px] font-mono text-white/60">
                <span className="flex items-center gap-1 font-bold text-white">
                  AMMO: {selectedSector.ammo}
                </span>
                <span>•</span>
                <span style={{ color: selectedSector.color }} className="font-bold">
                  PRESS Q / CLICK
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. REAL-TIME ACTION NOTIFICATION TOAST */}
      {actionNotification && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="px-3 py-1 rounded-xl bg-black/90 border border-[#eab308]/80 text-[#eab308] font-mono text-[10px] font-bold tracking-wide shadow-md backdrop-blur-md flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#eab308] animate-ping" />
            <span>{actionNotification}</span>
          </div>
        </div>
      )}

      {/* 3. ACTIVE 3D TOOL CURSOR BADGE & QUICK WHEEL SHORTCUT */}
      {(() => {
        const currentEquipped =
          GTA_TOOL_SECTORS.find((s) => s.id === activeTool) || GTA_TOOL_SECTORS[0];
        const icon =
          currentEquipped.id === "hammer"
            ? "🔨"
            : currentEquipped.id === "hand"
            ? "✋"
            : currentEquipped.id === "time"
            ? "🌙"
            : currentEquipped.id === "turn360"
            ? "🔄"
            : "🎲";

        return (
          <div
            className="fixed bottom-12 right-4 z-40 pointer-events-auto flex items-center gap-2 px-2.5 py-1 rounded-xl bg-black/90 border backdrop-blur-md shadow-lg animate-in fade-in duration-150 cursor-pointer hover:scale-105 transition-all select-none"
            style={{ borderColor: `${currentEquipped.color}80` }}
            onClick={() => {
              setIsOpen(!isOpen);
              soundFx.toolkitOpen();
            }}
            title="Active 3D Cursor Tool. Press [Q] to open wheel or [1-5] to quick-switch."
          >
            <span
              className="w-2 h-2 rounded-full animate-ping"
              style={{ backgroundColor: currentEquipped.color }}
            />
            <div className="flex flex-col text-left">
              <div
                className="flex items-center gap-1 font-mono text-[10px] font-extrabold tracking-wider"
                style={{ color: currentEquipped.color }}
              >
                <span>{icon}</span>
                <span>3D {currentEquipped.label}</span>
              </div>
              <span className="text-[8px] font-mono text-white/50 tracking-wider">
                [Q] WHEEL • [1-5] SWITCH
              </span>
            </div>
          </div>
        );
      })()}

    </>
  );
}

export default ToolkitWheel;
