import { useState, useEffect } from "react";
import { LiquidOcean, DEFAULT_THEME } from "@/components/LiquidOcean";
import { HeaderNav } from "@/components/HeaderNav";
import { DossierModal } from "@/components/DossierModal";
import { SceneControls } from "@/components/SceneControls";
import { type BuildingConfig, BUILDINGS, PORTFOLIO_DATA } from "@/data/portfolioData";
import { soundFx } from "@/utils/audio";
import { Compass, Sparkles, X, AlertTriangle } from "lucide-react";
import "./App.css";

export function App() {
  const [activeTab, setActiveTab] = useState<BuildingConfig["id"] | null>(null);
  const [accentColor, setAccentColor] = useState<number>(DEFAULT_THEME.accentColor);
  const [showWireframe, setShowWireframe] = useState<boolean>(false);
  const [waveSpeed, setWaveSpeed] = useState<number>(0.05);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [timeOfDay, setTimeOfDay] = useState<number>(Math.PI * 0.45); // Day / Golden Hour
  const [isCycleActive, setIsCycleActive] = useState<boolean>(true);
  const [resetViewTrigger, setResetViewTrigger] = useState<number>(0);
  const [respawnTrigger, setRespawnTrigger] = useState<number>(0);
  const [isLowEndMode, setIsLowEndMode] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("portfolio_low_end_mode");
      if (saved !== null) return saved === "true";
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isLowHardware = (navigator.hardwareConcurrency || 4) <= 4;
      return isMobile || isLowHardware;
    }
    return false;
  });

  // Secret Easter Egg state: unlocked by typing B-L-A-C-K, clicking distant black hole at night, or HUD button
  const [isBlackHoleEasterEgg, setIsBlackHoleEasterEgg] = useState<boolean>(false);
  const [isStaggering, setIsStaggering] = useState<boolean>(false);
  const [showEasterEggBanner, setShowEasterEggBanner] = useState<boolean>(false);
  const [easterEggToast, setEasterEggToast] = useState<{ visible: boolean; isUnlocked: boolean } | null>(null);

  const triggerEasterEgg = (nextUnlocked?: boolean) => {
    soundFx.select();
    soundFx.splash(1.6);
    const next = nextUnlocked !== undefined ? nextUnlocked : !isBlackHoleEasterEgg;
    setIsBlackHoleEasterEgg(next);
    setEasterEggToast({ visible: true, isUnlocked: next });

    if (next) {
      setIsStaggering(true);
      setShowEasterEggBanner(true);
      soundFx.singularityBoom();
      soundFx.whirlpoolSurge();
      setTimeout(() => {
        setIsStaggering(false);
      }, 4200);
      setTimeout(() => {
        setShowEasterEggBanner(false);
      }, 6000);
    } else {
      setIsStaggering(false);
      setShowEasterEggBanner(false);
    }
  };

  // Keyboard Easter Egg Listener: tracks typing "b", "l", "a", "c", "k"
  useEffect(() => {
    let typedBuffer: string[] = [];
    const targetCode = ["b", "l", "a", "c", "k"];

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in a form input
      if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) return;

      const key = e.key.toLowerCase();
      typedBuffer.push(key);
      if (typedBuffer.length > targetCode.length) {
        typedBuffer.shift();
      }

      if (typedBuffer.join("") === targetCode.join("")) {
        triggerEasterEgg();
        typedBuffer = [];
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleToggleBlackHoleEasterEgg = () => {
    triggerEasterEgg();
  };

  const handleToggleLowEndMode = () => {
    soundFx.select();
    setIsLowEndMode((prev) => {
      const next = !prev;
      localStorage.setItem("portfolio_low_end_mode", String(next));
      return next;
    });
  };

  const handleToggleMute = () => {
    const nextMuted = soundFx.toggleMute();
    setIsMuted(nextMuted);
  };

  const handleSelectBuilding = (id: BuildingConfig["id"]) => {
    setActiveTab(id);
  };

  const handleCloseModal = () => {
    setActiveTab(null);
  };

  const handleResetView = () => {
    setActiveTab(null);
    setResetViewTrigger((prev) => prev + 1);
  };

  const handleRespawn = () => {
    soundFx.select();
    soundFx.splash(1.4);
    setRespawnTrigger((prev) => prev + 1);
  };

  return (
    <main className={`relative w-screen h-screen overflow-hidden bg-black select-none ${isStaggering ? "animate-screen-stagger" : ""}`}>
      {/* 3D Liquid Ocean Canvas with Message Bottles & Celestial Sky */}
      <LiquidOcean
        accentColor={accentColor}
        showWireframe={showWireframe}
        waveSpeed={waveSpeed}
        activeTab={activeTab}
        onSelectBuilding={handleSelectBuilding}
        timeOfDay={timeOfDay}
        onUpdateTimeOfDay={setTimeOfDay}
        isCycleActive={isCycleActive}
        resetTrigger={resetViewTrigger}
        respawnTrigger={respawnTrigger}
        isLowEndMode={isLowEndMode}
        isBlackHoleEasterEgg={isBlackHoleEasterEgg}
        onToggleBlackHoleEasterEgg={handleToggleBlackHoleEasterEgg}
      >
        {/* Top Header & Navigation */}
        <div className="absolute top-0 left-0 right-0 z-40">
          <HeaderNav
            activeTab={activeTab}
            onSelectTab={setActiveTab}
            accentColor={accentColor}
            onSelectColor={setAccentColor}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
            isBlackHoleEasterEgg={isBlackHoleEasterEgg}
            onToggleBlackHoleEasterEgg={handleToggleBlackHoleEasterEgg}
          />
        </div>

        {/* Secret Easter Egg Toast Notification */}
        {easterEggToast?.visible && (
          <div className="absolute top-14 left-1/2 -translate-x-1/2 z-50 pointer-events-auto animate-in fade-in slide-in-from-top-4 duration-300">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border backdrop-blur-xl shadow-lg font-mono text-[11px] ${
              easterEggToast.isUnlocked
                ? "bg-red-950/90 border-red-500/80 text-red-100 shadow-[0_0_20px_rgba(239,68,68,0.5)]"
                : "bg-[#061426]/90 border-[#5bc0f8]/80 text-[#5bc0f8] shadow-[0_0_20px_rgba(91,192,248,0.4)]"
            }`}>
              <AlertTriangle className={`w-3.5 h-3.5 ${easterEggToast.isUnlocked ? "text-red-400 animate-pulse" : "text-[#5bc0f8]"}`} />
              <div>
                <div className="font-bold tracking-wider">
                  {easterEggToast.isUnlocked
                    ? "⚠ ANOMALY // GARGANTUA SINGULARITY"
                    : "✦ RESTORED // SOLAR & LUNAR CYCLE"}
                </div>
                <div className={`text-[9px] ${easterEggToast.isUnlocked ? "text-red-300/80" : "text-[#5bc0f8]/80"}`}>
                  {easterEggToast.isUnlocked
                    ? "Event horizon active. Type B-L-A-C-K to exit."
                    : "Normal daytime Sun and night Moon restored."}
                </div>
              </div>
              <button
                onClick={() => setEasterEggToast(null)}
                className="ml-1 p-0.5 rounded-md hover:bg-white/10 text-white/70 hover:text-white cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        {/* Ambient Bottom-Left Hero Card (Visible when no modal is open) */}
        {!activeTab && (
          <div className="absolute bottom-20 left-3 md:left-6 z-30 pointer-events-none max-w-[230px] sm:max-w-[250px] animate-in fade-in duration-300">
            <div className="parchment-card p-2.5 sm:p-3 pointer-events-auto space-y-1.5">
              <div className="flex items-center gap-1.5">
                <span className="parchment-chip text-[9px] px-1 py-0.2">
                  <span className={`w-1 h-1 rounded-full animate-ping ${
                    isBlackHoleEasterEgg ? "bg-red-700 shadow-[0_0_6px_#b91c1c]" : "bg-[#8b3c1b] shadow-[0_0_6px_#8b3c1b]"
                  }`} />
                  <span>{isBlackHoleEasterEgg ? "GARGANTUA // 5 BOTTLES" : "SOLAR & LUNAR"}</span>
                </span>
              </div>

              <div>
                <h1 className="text-xs sm:text-sm font-bold font-mono text-[#1a1107] tracking-tight leading-snug">
                  {PORTFOLIO_DATA.profile.name}
                </h1>
                <p className="text-[10px] text-[#59432d] font-mono mt-0.5 leading-snug line-clamp-2">
                  {PORTFOLIO_DATA.profile.role}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <button
                  onClick={() => {
                    soundFx.select();
                    soundFx.splash(1.0);
                    setActiveTab("projects");
                  }}
                  className="parchment-chip-active px-2 py-0.5 text-[9px] font-mono font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>PROJECTS [02]</span>
                </button>
                <button
                  onClick={() => {
                    soundFx.select();
                    soundFx.splash(1.0);
                    setActiveTab("about");
                  }}
                  className="parchment-chip parchment-chip-interactive px-2 py-0.5 text-[9px] font-mono font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Compass className="w-3 h-3" />
                  <span>ABOUT [01]</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Ocean Scene & Day/Night Controls */}
        <SceneControls
          showWireframe={showWireframe}
          onToggleWireframe={() => setShowWireframe(!showWireframe)}
          waveSpeed={waveSpeed}
          onChangeWaveSpeed={setWaveSpeed}
          onResetView={handleResetView}
          onRespawn={handleRespawn}
          timeOfDay={timeOfDay}
          onChangeTimeOfDay={setTimeOfDay}
          isCycleActive={isCycleActive}
          onToggleCycle={() => setIsCycleActive(!isCycleActive)}
          isLowEndMode={isLowEndMode}
          onToggleLowEndMode={handleToggleLowEndMode}
          isBlackHoleEasterEgg={isBlackHoleEasterEgg}
          onToggleBlackHoleEasterEgg={handleToggleBlackHoleEasterEgg}
        />
      </LiquidOcean>

      {/* Glassmorphic Cyber Dossier Overlay Modal */}
      <DossierModal
        activeTab={activeTab}
        onClose={handleCloseModal}
        onSelectTab={setActiveTab}
      />

      {/* Screen Stagger & Big Centered "EASTER EGG ACTIVATED" Announcement */}
      {showEasterEggBanner && (
        <div className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center p-4">
          <div className="flex flex-col items-center gap-3.5 px-8 py-6 sm:px-14 sm:py-9 rounded-3xl bg-black/92 border-2 border-red-500 shadow-[0_0_120px_rgba(239,68,68,0.95)] backdrop-blur-2xl text-center select-none animate-stagger-text pointer-events-auto">
            <div className="flex items-center gap-2.5 text-xs sm:text-sm font-mono tracking-widest text-red-400 font-bold uppercase animate-pulse">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <span>GARGANTUA SINGULARITY BREACH</span>
              <AlertTriangle className="w-4 h-4 text-red-500" />
            </div>
            <h2 className="text-3xl sm:text-5xl md:text-6xl font-extrabold font-mono tracking-tight text-white drop-shadow-[0_0_40px_#ef4444]">
              EASTER EGG ACTIVATED
            </h2>
            <p className="text-xs sm:text-sm font-mono text-red-300/90 tracking-wider max-w-md">
              DISTANT ANOMALY BREACHED // SPACETIME EQUILIBRIUM COLLAPSING
            </p>
            <button
              onClick={() => setShowEasterEggBanner(false)}
              className="mt-1 px-4 py-1.5 rounded-lg bg-red-950/80 hover:bg-red-900 border border-red-500/60 text-red-200 text-xs font-mono transition-all cursor-pointer"
            >
              DISMISS
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

export default App;
