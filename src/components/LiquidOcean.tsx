"use client";

import React, { useRef, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { RectAreaLightUniformsLib } from "three/examples/jsm/lights/RectAreaLightUniformsLib.js";
import * as THREE from "three";
import { cn } from "@/lib/utils";
import {
  BUILDINGS,
  COLOR_PALETTE,
  generateMonolithSpawnLocations,
  type BuildingConfig,
} from "@/data/portfolioData";
import { Monolith } from "@/components/Monolith";
import { CosmicSky } from "@/components/CosmicSky";
import { WaterCausticOcean } from "@/components/WaterCausticOcean";
import { soundFx } from "@/utils/audio";
import { getBlackHoleState } from "@/utils/blackHoleCoords";
import { PirateShip, type ShipType } from "@/components/PirateShip";
import { ToolkitWheel, type ToolMode } from "@/components/ToolkitWheel";
import { OceanWildlife } from "@/components/OceanWildlife";
import { GlassShatterEffect } from "@/components/GlassShatterEffect";
import { Tool3DCursor } from "@/components/Tool3DCursor";

// Initialize RectAreaLight uniforms
if (typeof window !== "undefined") {
  RectAreaLightUniformsLib.init();
}

// =============================================================================
// DEFAULT THEME (Pitch Black Void & Image 1 Water Palette)
// =============================================================================
export const DEFAULT_THEME = {
  background: 0x000000, // Pitch black cosmic void
  gridColor: 0x1d8cf8,   // Vibrant Azure Blue (Image 1)
  accentColor: 0x5bc0f8, // Light Sky Blue (#5BC0F8 from Image 1)
};

// =============================================================================
// OCEAN MESH COMPONENT (Original mathematical wave displacement)
// =============================================================================
interface OceanMeshProps {
  geoSize: number;
  geoFragments: number;
  waveAmplitude: number;
  waveSpeed: number;
  accentColor: number;
  showWireframe: boolean;
  opacity: number;
}

function OceanMesh({
  geoSize,
  geoFragments,
  waveAmplitude,
  waveSpeed,
  accentColor,
  showWireframe,
  opacity,
}: OceanMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const wireRef = useRef<THREE.Mesh>(null);

  const { geometry, waves } = useMemo(() => {
    const geo = new THREE.PlaneGeometry(geoSize, geoSize, geoFragments, geoFragments);
    const positionAttribute = geo.getAttribute("position");
    const waveData: Array<{
      x: number;
      y: number;
      z: number;
      ang: number;
      amp: number;
      speed: number;
    }> = [];

    for (let i = 0; i < positionAttribute.count; i++) {
      waveData.push({
        x: positionAttribute.getX(i),
        y: positionAttribute.getY(i),
        z: positionAttribute.getZ(i),
        ang: Math.PI * 2,
        amp: Math.random() * waveAmplitude,
        speed: 0.03 + Math.random() * waveSpeed,
      });
    }

    return { geometry: geo, waves: waveData };
  }, [geoSize, geoFragments, waveAmplitude, waveSpeed]);

  useFrame(() => {
    if (!meshRef.current) return;

    const positionAttribute = meshRef.current.geometry.getAttribute("position");

    for (let i = 0; i < positionAttribute.count; i++) {
      const wave = waves[i];
      positionAttribute.setX(i, wave.x + Math.cos(wave.ang) * wave.amp);
      positionAttribute.setY(i, wave.y + Math.sin(wave.ang / 2) * wave.amp);
      positionAttribute.setZ(i, wave.z + Math.cos(wave.ang / 3) * wave.amp);
      wave.ang += wave.speed;
    }

    positionAttribute.needsUpdate = true;
  });

  const wireframeMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: accentColor,
        wireframe: true,
        transparent: false,
        opacity: 0.85,
        roughness: 0.1,
      }),
    [accentColor]
  );

  const surfaceMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: 0x01050a,
        transparent: true,
        opacity: opacity,
        wireframe: false,
        roughness: 0.08,
        metalness: 0.95,
        clearcoat: 1.0,
      }),
    [opacity]
  );

  return (
    <group rotation={[(-90 * Math.PI) / 180, 0, 0]}>
      <mesh ref={meshRef} geometry={geometry} material={surfaceMaterial} receiveShadow />
      {showWireframe && (
        <mesh ref={wireRef} geometry={geometry} material={wireframeMaterial} />
      )}
    </group>
  );
}

// =============================================================================
// AMBIENT ETHEREAL DUST PARTICLES
// =============================================================================
function AmbientCyberDust({ color }: { color: number }) {
  const points = useMemo(() => {
    const coords = new Float32Array(300 * 3);
    for (let i = 0; i < 300; i++) {
      coords[i * 3] = (Math.random() - 0.5) * 30;
      coords[i * 3 + 1] = Math.random() * 8;
      coords[i * 3 + 2] = (Math.random() - 0.5) * 30;
    }
    return coords;
  }, []);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[points, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        color={color}
        transparent
        opacity={0.35}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// =============================================================================
// CAMERA CHOREOGRAPHER & SCENE CONTROLLER (Top-Middle Slanting 3D Perspective)
// =============================================================================
export interface CameraHudData {
  mode: "orbit" | "pan";
  elevation: number;
  distance: number;
  gravityPull?: number;
  isResisting?: boolean;
}

interface CameraRigProps {
  activeTab: BuildingConfig["id"] | null;
  groupRef: React.RefObject<THREE.Group | null>;
  monolithRefs: React.RefObject<Record<string, THREE.Group | null>>;
  resetTrigger?: number;
  turn360Trigger?: number;
  onCameraHudUpdate?: (hud: CameraHudData | null) => void;
}

const DEFAULT_RADIUS = 16.5;
const DEFAULT_PHI = 1.39; // ~10.4 deg elevation angle, perfectly framing both Gargantua Black Hole in upper cosmos and bottles in pixel ocean
const DEFAULT_THETA = 0;

function CameraRig({
  activeTab,
  groupRef,
  monolithRefs,
  resetTrigger,
  turn360Trigger,
  onCameraHudUpdate,
}: CameraRigProps) {
  const { camera } = useThree();

  // Spherical Coordinates & Target Focal Point
  const targetLookPos = useRef(new THREE.Vector3(0, 1.6, -3.0));
  const currentLookPos = useRef(new THREE.Vector3(0, 1.6, -3.0));

  const targetRadius = useRef(DEFAULT_RADIUS);
  const currentRadius = useRef(DEFAULT_RADIUS);

  const targetPhi = useRef(DEFAULT_PHI);
  const currentPhi = useRef(DEFAULT_PHI);

  const targetTheta = useRef(DEFAULT_THETA);
  const currentTheta = useRef(DEFAULT_THETA);

  const isDragging = useRef(false);
  const dragMode = useRef<"orbit" | "pan">("orbit");
  const lastMousePos = useRef({ x: 0, y: 0 });
  const isManual = useRef(false);

  // Reset trigger from OVERVIEW button
  useEffect(() => {
    if (resetTrigger !== undefined && resetTrigger > 0) {
      targetRadius.current = DEFAULT_RADIUS;
      targetPhi.current = DEFAULT_PHI;
      targetTheta.current = DEFAULT_THETA;
      targetLookPos.current.set(0, 1.6, -3.0);
      isManual.current = false;
    }
  }, [resetTrigger]);

  // 360-degree cinematic ocean panoramic turn
  const turn360Time = useRef<number>(-1);
  const turn360StartTheta = useRef<number>(0);

  useEffect(() => {
    if (turn360Trigger && turn360Trigger > 0) {
      turn360Time.current = 0;
      turn360StartTheta.current = currentTheta.current;
      isManual.current = true;
    }
  }, [turn360Trigger]);

  // Handle active monolith selection
  useEffect(() => {
    if (activeTab) {
      const b = BUILDINGS.find((item) => item.id === activeTab);
      const group = monolithRefs.current?.[activeTab];
      if (b && group) {
        targetLookPos.current.set(group.position.x, group.position.y + 0.4, group.position.z);
      } else if (b) {
        targetLookPos.current.set(b.position[0], 0.4, b.position[2]);
      }
      targetRadius.current = 7.8;
      targetPhi.current = 1.22;
      targetTheta.current = 0;
    } else if (!isManual.current) {
      targetLookPos.current.set(0, 1.6, -3.0);
      targetRadius.current = DEFAULT_RADIUS;
      targetPhi.current = DEFAULT_PHI;
      targetTheta.current = DEFAULT_THETA;
    }
  }, [activeTab, monolithRefs]);

  // Interactive Middle-Mouse Button & Wheel Event Listeners
  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      // Middle mouse button (button 1) or right mouse button (button 2)
      if (e.button === 1 || e.button === 2) {
        e.preventDefault();
        isDragging.current = true;
        isManual.current = true;
        lastMousePos.current = { x: e.clientX, y: e.clientY };
        const mode: "orbit" | "pan" = (e.shiftKey || e.button === 2) ? "pan" : "orbit";
        dragMode.current = mode;
        document.body.style.cursor = mode === "pan" ? "move" : "grabbing";

        onCameraHudUpdate?.({
          mode,
          elevation: Math.round(90 - (currentPhi.current * 180) / Math.PI),
          distance: currentRadius.current,
        });
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      e.preventDefault();

      const dx = e.clientX - lastMousePos.current.x;
      const dy = e.clientY - lastMousePos.current.y;
      lastMousePos.current = { x: e.clientX, y: e.clientY };

      const mode: "orbit" | "pan" = (e.shiftKey || e.buttons === 2) ? "pan" : dragMode.current;

      if (mode === "pan") {
        const panSpeed = (targetRadius.current / 900) * 0.85;
        const theta = currentTheta.current;
        targetLookPos.current.x -= dx * panSpeed * Math.cos(theta);
        targetLookPos.current.z += dx * panSpeed * Math.sin(theta);
        targetLookPos.current.x += dy * panSpeed * Math.sin(theta);
        targetLookPos.current.z += dy * panSpeed * Math.cos(theta);
        targetLookPos.current.x = Math.max(-14, Math.min(14, targetLookPos.current.x));
        targetLookPos.current.z = Math.max(-16, Math.min(10, targetLookPos.current.z));
      } else {
        const orbitSpeed = 0.0055;

        // Gravitational Resistance calculation:
        // Angle toward the back of the black hole: 0 is in front (facing black hole), 1.0 is behind black hole (|theta| = PI)
        const backRatio = Math.min(1.0, Math.abs(currentTheta.current) / Math.PI);
        const pushingDeeper = (currentTheta.current >= 0 && dx < 0) || (currentTheta.current < 0 && dx > 0);

        let dragResistance = 1.0;
        if (backRatio > 0.20) {
          const intensity = (backRatio - 0.20) / 0.80;
          // Exponential drag: drops to ~0.05 near 180 deg, making orbiting behind the black hole extraordinarily heavy!
          dragResistance = Math.max(0.05, 1.0 - Math.pow(intensity, 1.85) * 0.95);
        }

        if (pushingDeeper) {
          targetTheta.current -= dx * orbitSpeed * dragResistance;
        } else {
          // Escaping back towards the front receives gravitational slingshot assist!
          targetTheta.current -= dx * orbitSpeed * 1.25;
        }

        targetPhi.current += dy * orbitSpeed;
        // Clamp polar angle (phi): 0.08 rad (~85 deg top view) to 1.48 rad (~5 deg horizon)
        targetPhi.current = Math.max(0.08, Math.min(1.48, targetPhi.current));
      }

      const backRatioNow = Math.min(1.0, Math.abs(currentTheta.current) / Math.PI);
      const gravityPercent = Math.round(Math.min(100, Math.max(0, (backRatioNow - 0.18) / 0.82 * 100)));

      onCameraHudUpdate?.({
        mode,
        elevation: Math.round(90 - (targetPhi.current * 180) / Math.PI),
        distance: Math.round(targetRadius.current * 10) / 10,
        gravityPull: gravityPercent,
        isResisting: backRatioNow > 0.32,
      });
    };

    const onMouseUp = (e: MouseEvent) => {
      if (e.button === 1 || e.button === 2) {
        isDragging.current = false;
        document.body.style.cursor = "auto";
        onCameraHudUpdate?.(null);
      }
    };

    const onAuxClick = (e: MouseEvent) => {
      if (e.button === 1) {
        e.preventDefault();
      }
    };

    const onWheel = (e: WheelEvent) => {
      // Do not zoom if user is scrolling inside a modal dialog
      let el = e.target as HTMLElement | null;
      let isScrollableModal = false;
      while (el && el !== document.body) {
        if (el.classList.contains("overflow-y-auto") || el.getAttribute("role") === "dialog") {
          isScrollableModal = true;
          break;
        }
        el = el.parentElement;
      }
      if (isScrollableModal) return;

      isManual.current = true;
      const zoomDelta = e.deltaY * 0.012;
      targetRadius.current = Math.max(6.0, Math.min(30.0, targetRadius.current + zoomDelta));
    };

    const onContextMenu = (e: MouseEvent) => {
      if (isDragging.current) {
        e.preventDefault();
      }
    };

    const getInitialRadius = () => {
      if (typeof window !== "undefined" && window.innerWidth < 768) {
        return 21.0;
      }
      return DEFAULT_RADIUS;
    };

    // Touch event listeners for mobile devices
    const touchStartPos = { x: 0, y: 0 };
    const lastTouchPos = { x: 0, y: 0 };
    let initialPinchDist = 0;
    let initialPinchRadius = DEFAULT_RADIUS;
    let isTouchOrbiting = false;
    let isPinching = false;

    const isInsideScrollable = (target: EventTarget | null) => {
      let el = target as HTMLElement | null;
      while (el && el !== document.body) {
        if (
          el.classList.contains("overflow-y-auto") ||
          el.getAttribute("role") === "dialog" ||
          el.tagName === "BUTTON" ||
          el.tagName === "INPUT" ||
          el.classList.contains("pointer-events-auto")
        ) {
          return true;
        }
        el = el.parentElement;
      }
      return false;
    };

    const onTouchStart = (e: TouchEvent) => {
      if (isInsideScrollable(e.target)) return;

      if (e.touches.length === 1) {
        isTouchOrbiting = true;
        isPinching = false;
        isManual.current = true;
        touchStartPos.x = e.touches[0].clientX;
        touchStartPos.y = e.touches[0].clientY;
        lastTouchPos.x = e.touches[0].clientX;
        lastTouchPos.y = e.touches[0].clientY;
      } else if (e.touches.length === 2) {
        isTouchOrbiting = false;
        isPinching = true;
        isManual.current = true;
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        initialPinchDist = Math.hypot(dx, dy);
        initialPinchRadius = targetRadius.current;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isTouchOrbiting && !isPinching) return;
      if (isInsideScrollable(e.target)) return;

      if (isPinching && e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.hypot(dx, dy);
        if (initialPinchDist > 0) {
          const factor = initialPinchDist / Math.max(10, dist);
          targetRadius.current = Math.max(6.0, Math.min(32.0, initialPinchRadius * factor));
        }
        return;
      }

      if (isTouchOrbiting && e.touches.length === 1) {
        const touch = e.touches[0];
        const dx = touch.clientX - lastTouchPos.x;
        const dy = touch.clientY - lastTouchPos.y;
        lastTouchPos.x = touch.clientX;
        lastTouchPos.y = touch.clientY;

        const touchOrbitSpeed = 0.007;
        const backRatio = Math.min(1.0, Math.abs(currentTheta.current) / Math.PI);
        const pushingDeeper = (currentTheta.current >= 0 && dx < 0) || (currentTheta.current < 0 && dx > 0);

        let dragResistance = 1.0;
        if (backRatio > 0.20) {
          const intensity = (backRatio - 0.20) / 0.80;
          dragResistance = Math.max(0.05, 1.0 - Math.pow(intensity, 1.85) * 0.95);
        }

        if (pushingDeeper) {
          targetTheta.current -= dx * touchOrbitSpeed * dragResistance;
        } else {
          targetTheta.current -= dx * touchOrbitSpeed * 1.25;
        }

        targetPhi.current += dy * touchOrbitSpeed;
        targetPhi.current = Math.max(0.08, Math.min(1.48, targetPhi.current));
      }
    };

    const onTouchEnd = () => {
      isTouchOrbiting = false;
      isPinching = false;
    };

    const onResize = () => {
      if (!isManual.current && !activeTab) {
        targetRadius.current = getInitialRadius();
      }
    };

    window.addEventListener("mousedown", onMouseDown, { passive: false });
    window.addEventListener("mousemove", onMouseMove, { passive: false });
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("auxclick", onAuxClick, { passive: false });
    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("contextmenu", onContextMenu);
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("touchcancel", onTouchEnd, { passive: true });
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("auxclick", onAuxClick);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("contextmenu", onContextMenu);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
      window.removeEventListener("resize", onResize);
      document.body.style.cursor = "auto";
    };
  }, [onCameraHudUpdate, activeTab]);

  useFrame(({ clock }, delta) => {
    const dt = Math.min(0.04, delta);
    const lerpRate = 0.08;
    currentRadius.current = THREE.MathUtils.lerp(currentRadius.current, targetRadius.current, lerpRate);
    currentPhi.current = THREE.MathUtils.lerp(currentPhi.current, targetPhi.current, lerpRate);

    // 360 Turn Animation override
    if (turn360Time.current >= 0) {
      turn360Time.current += dt;
      const duration = 3.4;
      const progress = Math.min(1.0, turn360Time.current / duration);
      const smooth = 0.5 - 0.5 * Math.cos(progress * Math.PI);
      currentTheta.current = turn360StartTheta.current + smooth * Math.PI * 2;
      targetTheta.current = currentTheta.current;
      if (progress >= 1.0) {
        turn360Time.current = -1;
        isManual.current = false;
        // Keep theta normalized
        currentTheta.current = currentTheta.current % (Math.PI * 2);
        targetTheta.current = currentTheta.current;
      }
    } else {
      currentTheta.current = THREE.MathUtils.lerp(currentTheta.current, targetTheta.current, lerpRate);
    }
    currentLookPos.current.lerp(targetLookPos.current, lerpRate);

    // Active Gravitational Restoring Torque:
    // When attempting to orbit behind the black hole (|theta| > 0.22 * PI),
    // the black hole's relativistic frame-dragging pull aggressively pulls the camera back toward the front orbit!
    const backRatio = Math.min(1.0, Math.abs(currentTheta.current) / Math.PI);
    if (turn360Time.current < 0 && backRatio > 0.22) {
      const pullForce = Math.pow((backRatio - 0.22) / 0.78, 2.2) * 5.4;
      targetTheta.current -= Math.sign(targetTheta.current) * pullForce * dt;
      // Tidal compression: pulls camera radius inward toward singularity
      targetRadius.current = Math.max(8.0, targetRadius.current - pullForce * 0.75 * dt);
    }

    // Keep tracking moving active monolith if tab is active
    if (activeTab) {
      const group = monolithRefs.current?.[activeTab];
      const b = BUILDINGS.find((item) => item.id === activeTab);
      if (group && b) {
        targetLookPos.current.set(group.position.x, group.position.y + b.scale[1] * 0.2, group.position.z);
      }
    }

    const r = currentRadius.current;
    const phi = currentPhi.current;
    const theta = currentTheta.current;

    // Convert spherical coordinates to 3D Cartesian coordinates
    let camX = currentLookPos.current.x + r * Math.sin(phi) * Math.sin(theta);
    let camY = currentLookPos.current.y + r * Math.cos(phi);
    let camZ = currentLookPos.current.z + r * Math.sin(phi) * Math.cos(theta);

    // Relativistic Spacetime Tremor when under strong gravitational pull
    if (backRatio > 0.32) {
      const time = clock.getElapsedTime();
      const gravityStress = Math.pow((backRatio - 0.32) / 0.68, 1.8);
      const tremorX = (Math.sin(time * 48.0) * 0.65 + Math.cos(time * 76.0) * 0.35) * gravityStress * 0.22;
      const tremorY = (Math.cos(time * 52.0) * 0.65 + Math.sin(time * 68.0) * 0.35) * gravityStress * 0.16;
      camX += tremorX;
      camY += tremorY;
    }

    // Gentle cyber ambient sway when not dragging or inspecting active monolith
    if (!isDragging.current && !activeTab && backRatio <= 0.32) {
      const time = clock.getElapsedTime();
      camX += Math.sin(time * 0.2) * 0.35;
      camY += Math.cos(time * 0.16) * 0.2;
      camZ += Math.sin(time * 0.12) * 0.25;
    }

    camera.position.set(camX, camY, camZ);
    camera.lookAt(currentLookPos.current);

    if (groupRef.current) {
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, 0, 0.05);
    }

    // Continuous gravitational warning if resisting even after mouse release
    if (!isDragging.current && backRatio > 0.28) {
      const gravityPercent = Math.round(Math.min(100, Math.max(0, (backRatio - 0.18) / 0.82 * 100)));
      onCameraHudUpdate?.({
        mode: "orbit",
        elevation: Math.round(90 - (currentPhi.current * 180) / Math.PI),
        distance: Math.round(currentRadius.current * 10) / 10,
        gravityPull: gravityPercent,
        isResisting: true,
      });
    }
  });

  return null;
}

// =============================================================================
// 3D BEACON TRACKER COMPONENT (Pins HTML overlays directly to moving monolith tops)
// =============================================================================
interface BeaconTrackerProps {
  beaconsRef: React.RefObject<HTMLDivElement | null>;
  monolithRefs: React.RefObject<Record<string, THREE.Group | null>>;
}

function BeaconTracker({ beaconsRef, monolithRefs }: BeaconTrackerProps) {
  const { camera } = useThree();
  const v = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    if (!beaconsRef.current) return;
    const width = window.innerWidth;
    const height = window.innerHeight;

    BUILDINGS.forEach((b) => {
      const el = beaconsRef.current?.querySelector(`[data-beacon="${b.id}"]`) as HTMLElement | null;
      if (!el) return;

      const group = monolithRefs.current?.[b.id];
      if (group) {
        // Point right above the moving monolith's rooftop crystal spire from slanting view
        v.copy(group.position);
        v.y += b.scale[1] * 0.5 + 0.46;
      } else {
        v.set(b.position[0], b.scale[1] * 0.85 + 0.46, b.position[2]);
      }

      v.project(camera);

      // Check if behind camera
      if (v.z > 1) {
        el.style.display = "none";
        return;
      }

      const x = (v.x + 1) * 0.5 * width;
      const y = (-v.y + 1) * 0.5 * height;

      el.style.display = "flex";
      el.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -100%)`;
    });
  });

  return null;
}

// =============================================================================
// SUBTLE LOCALIZED TRON COLLISION CONTACT SPARK COMPONENT
// =============================================================================
interface ContactSparkData {
  id: number;
  x: number;
  y: number;
  z: number;
  radius: number;
  opacity: number;
}

function CollisionContactSparks({ sparks, color }: { sparks: ContactSparkData[]; color: number }) {
  if (sparks.length === 0) return null;
  return (
    <group>
      {sparks.map((spark) => (
        <group key={spark.id} position={[spark.x, spark.y, spark.z]}>
          {/* Subtle localized Tron data-ring at contact point */}
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[Math.max(0.01, spark.radius * 0.72), spark.radius, 24]} />
            <meshBasicMaterial
              color={color}
              transparent
              opacity={spark.opacity}
              side={THREE.DoubleSide}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
          {/* Tiny bright energetic core spark */}
          <mesh>
            <octahedronGeometry args={[spark.radius * 0.35, 0]} />
            <meshBasicMaterial
              color={0xffffff}
              transparent
              opacity={spark.opacity * 0.9}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
          {/* Water Splash Impact Ripple Ring at Ocean Waterline */}
          <mesh position={[0, -spark.y + 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[Math.max(0.01, spark.radius * 0.4), spark.radius * 1.6, 28]} />
            <meshBasicMaterial
              color={0xffffff}
              transparent
              opacity={spark.opacity * 0.7}
              side={THREE.DoubleSide}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
          {/* Water Splash Spray Plume */}
          <mesh position={[0, spark.radius * 0.45, 0]}>
            <coneGeometry args={[spark.radius * 0.55, spark.radius * 1.4, 8, 1, true]} />
            <meshBasicMaterial
              color={0xe0f8ff}
              transparent
              opacity={spark.opacity * 0.6}
              side={THREE.DoubleSide}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// =============================================================================
// SPACETIME RESISTANCE BARRIER RING COMPONENT
// =============================================================================
function ResistanceBarrierRing({
  position,
  radius = 10.8,
  intensity = 1.0,
  accentColor = 0x5bc0f8,
}: {
  position: [number, number, number];
  radius?: number;
  intensity?: number;
  accentColor?: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const pulseRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (meshRef.current) {
      meshRef.current.rotation.z = t * 0.04;
    }
    if (pulseRef.current) {
      const pulse = 1.0 + Math.sin(t * 4.2) * 0.015;
      pulseRef.current.scale.set(pulse, pulse, 1);
    }
  });

  if (intensity < 0.05) return null;

  return (
    <group position={[position[0], 0.03, position[2]]} rotation={[-Math.PI / 2, 0, 0]}>
      {/* 1. Main Barrier Energy Perimeter */}
      <mesh ref={meshRef}>
        <ringGeometry args={[radius - 0.2, radius + 0.2, 64]} />
        <meshBasicMaterial
          color={accentColor}
          transparent
          opacity={Math.min(0.65, intensity * 0.55)}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      {/* 2. Inner Pulsing Core Line */}
      <mesh ref={pulseRef}>
        <ringGeometry args={[radius - 0.05, radius + 0.05, 64]} />
        <meshBasicMaterial
          color={0xffffff}
          transparent
          opacity={Math.min(0.85, intensity * 0.75)}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

// =============================================================================
// SCENE CONTENT & 5-BODY TRON COLLISION PHYSICS ENGINE
// =============================================================================
interface SceneContentProps {
  backgroundColor: number;
  gridColor: number;
  accentColor: number;
  showGrid: boolean;
  oceanSize: number;
  oceanFragments: number;
  waveAmplitude: number;
  waveSpeed: number;
  showWireframe: boolean;
  oceanOpacity: number;
  activeTab: BuildingConfig["id"] | null;
  onSelectBuilding: (id: BuildingConfig["id"]) => void;
  timeOfDay: number;
  onUpdateTimeOfDay?: (t: number) => void;
  isCycleActive: boolean;
  beaconsRef: React.RefObject<HTMLDivElement | null>;
  resetTrigger?: number;
  respawnTrigger?: number;
  isLowEndMode?: boolean;
  isBlackHoleEasterEgg?: boolean;
  onToggleBlackHoleEasterEgg?: () => void;
  onCameraHudUpdate?: (
    hud: { mode: "orbit" | "pan"; elevation: number; distance: number } | null
  ) => void;
  onHoverShip?: (name: string | null) => void;
  activeTool?: ToolMode;
  turn360Trigger?: number;
  onSetActionNotification?: (msg: string | null) => void;
  onSetIsGrabbing?: (grabbing: boolean) => void;
}

// =============================================================================
// PIRATE SHIPS SIMULATION CONFIG & STATE
// =============================================================================
export interface ShipState {
  id: string;
  type: ShipType;
  name: string;
  scale: number;
  x: number;
  y: number;
  z: number;
  vx: number;
  vz: number;
  speed: number;
  pitch: number;
  roll: number;
  yaw: number;
  vPitch: number;
  vRoll: number;
  vYaw: number;
  radius: number;
  impactFlash: number;
  seed: number;
  defianceLevel: number;
  targetX: number;
  targetZ: number;
  waypointTimer: number;
  cruiseSpeed: number;
}

export const INITIAL_SHIPS_CONFIG: Array<{
  id: string;
  type: ShipType;
  name: string;
  scale: number;
  initialPos: [number, number];
  initialTarget: [number, number];
  cruiseSpeed: number;
}> = [
  {
    id: "sunny",
    type: "sunny",
    name: "Thousand Sunny",
    scale: 0.88,
    initialPos: [-6, 2],
    initialTarget: [-20, 16],
    cruiseSpeed: 1.05,
  },
  {
    id: "merry",
    type: "merry",
    name: "Going Merry",
    scale: 0.84,
    initialPos: [7, 3],
    initialTarget: [18, -12],
    cruiseSpeed: 0.98,
  },
  {
    id: "polar",
    type: "polar",
    name: "Polar Tang",
    scale: 0.82,
    initialPos: [-8, 6],
    initialTarget: [-24, -18],
    cruiseSpeed: 1.15,
  },
  {
    id: "redforce",
    type: "redforce",
    name: "Red Force",
    scale: 0.90,
    initialPos: [10, -2],
    initialTarget: [22, 16],
    cruiseSpeed: 1.02,
  },
  {
    id: "maxim",
    type: "maxim",
    name: "Ark Maxim",
    scale: 0.86,
    initialPos: [1, 8],
    initialTarget: [14, 24],
    cruiseSpeed: 0.95,
  },
];

interface BodyState {
  id: BuildingConfig["id"];
  config: BuildingConfig;
  spawnX: number;
  spawnZ: number;
  x: number;
  y: number;
  z: number;
  vx: number;
  vz: number;
  pitch: number;
  roll: number;
  yaw: number;
  vPitch: number;
  vRoll: number;
  vYaw: number;
  radius: number;
  impactFlash: number;
  seed: number;
  defianceLevel: number; // 0 to 1, anti-singularity resistance intensity
  escapeBoost: number;   // emergency slingshot surge
}

function SceneContent({
  backgroundColor,
  accentColor,
  showGrid,
  oceanSize,
  oceanFragments,
  waveAmplitude,
  waveSpeed,
  showWireframe,
  oceanOpacity,
  activeTab,
  onSelectBuilding,
  timeOfDay,
  onUpdateTimeOfDay,
  isCycleActive,
  beaconsRef,
  resetTrigger,
  respawnTrigger,
  isLowEndMode = false,
  isBlackHoleEasterEgg = false,
  onToggleBlackHoleEasterEgg,
  onCameraHudUpdate,
  onHoverShip,
  activeTool = "hammer",
  turn360Trigger = 0,
  onSetActionNotification,
  onSetIsGrabbing,
}: SceneContentProps) {
  const { scene } = useThree();
  const currentBhState = getBlackHoleState(timeOfDay);
  const rectLightRef = useRef<THREE.RectAreaLight>(null);
  const hemiLightRef = useRef<THREE.HemisphereLight>(null);
  const ambientLightRef = useRef<THREE.AmbientLight>(null);
  const groupRef = useRef<THREE.Group>(null);
  const monolithRefs = useRef<Record<string, THREE.Group | null>>({});
  const monolithMaterialRefs = useRef<Record<string, THREE.MeshPhysicalMaterial | null>>({});

  const easterEggTimerRef = useRef(isBlackHoleEasterEgg ? 10 : 0);
  const prevEasterEggRef = useRef(isBlackHoleEasterEgg);
  const playedBoomRef = useRef(isBlackHoleEasterEgg);
  const [isBarrierActive, setIsBarrierActive] = useState(isBlackHoleEasterEgg);

  // Autonomous Roaming Pirate Ships Simulation State
  const shipsRef = useRef<ShipState[]>(null!);
  if (!shipsRef.current) {
    shipsRef.current = INITIAL_SHIPS_CONFIG.map((cfg) => {
      const heading = Math.atan2(
        -(cfg.initialTarget[0] - cfg.initialPos[0]),
        -(cfg.initialTarget[1] - cfg.initialPos[1])
      );
      return {
        id: cfg.id,
        type: cfg.type,
        name: cfg.name,
        scale: cfg.scale,
        x: cfg.initialPos[0],
        y: 0,
        z: cfg.initialPos[1],
        vx: 0,
        vz: 0,
        speed: cfg.cruiseSpeed,
        pitch: 0,
        roll: 0,
        yaw: heading,
        vPitch: 0,
        vRoll: 0,
        vYaw: 0,
        radius: cfg.scale * 1.05 + 0.1,
        impactFlash: 0.4,
        seed: Math.random() * 1000,
        defianceLevel: 0,
        targetX: cfg.initialTarget[0],
        targetZ: cfg.initialTarget[1],
        waypointTimer: 8.0 + Math.random() * 10.0,
        cruiseSpeed: cfg.cruiseSpeed,
      };
    });
  }
  const shipRefs = useRef<Record<string, THREE.Group | null>>({});
  const [hoveredShip, setHoveredShip] = useState<string | null>(null);

  // Hand Tool Grabbed Entity State
  const grabbedEntityRef = useRef<{
    type: "bottle" | "ship";
    id: string;
    liftProgress: number;
  } | null>(null);
  const [hasGrabbedEntity, setHasGrabbedEntity] = useState(false);

  // Global PointerUp Listener for dropping grabbed bottle or ship
  useEffect(() => {
    const handleGlobalPointerUp = () => {
      if (grabbedEntityRef.current) {
        const grabbed = grabbedEntityRef.current;
        soundFx.placeDown();
        soundFx.splash(1.5);

        let itemName = "Item";
        let dropX = 0;
        let dropY = 0;
        let dropZ = 0;

        if (grabbed.type === "bottle") {
          const b = bodiesRef.current?.find((item) => item.id === grabbed.id);
          if (b) {
            itemName = `[${b.config.number}] ${b.config.label} Bottle`;
            b.spawnX = b.x;
            b.spawnZ = b.z;
            b.vx = (Math.random() - 0.5) * 0.2;
            b.vz = (Math.random() - 0.5) * 0.2;
            b.impactFlash = 0.8;
            dropX = b.x;
            dropY = b.y;
            dropZ = b.z;
          }
        } else if (grabbed.type === "ship") {
          const s = shipsRef.current?.find((item) => item.id === grabbed.id);
          if (s) {
            itemName = s.name;
            s.targetX = s.x + (Math.random() - 0.5) * 20;
            s.targetZ = s.z + (Math.random() - 0.5) * 20;
            s.vx = -Math.sin(s.yaw) * 1.5;
            s.vz = -Math.cos(s.yaw) * 1.5;
            s.impactFlash = 0.8;
            dropX = s.x;
            dropY = s.y;
            dropZ = s.z;
          }
        }

        spawnContactSpark(dropX, Math.max(0.08, dropY), dropZ);
        onSetActionNotification?.(`✋ Placed ${itemName} at [${dropX.toFixed(1)}, ${dropZ.toFixed(1)}]`);
        setTimeout(() => onSetActionNotification?.(null), 3000);

        grabbedEntityRef.current = null;
        setHasGrabbedEntity(false);
        onSetIsGrabbing?.(false);
      }
    };

    window.addEventListener("pointerup", handleGlobalPointerUp);
    return () => window.removeEventListener("pointerup", handleGlobalPointerUp);
  }, [onSetActionNotification, onSetIsGrabbing]);

  // 5-Body Physics Simulation State with Procedural Randomized Spawns
  const bodiesRef = useRef<BodyState[]>(null!);
  if (!bodiesRef.current) {
    bodiesRef.current = BUILDINGS.map((b) => {
      const spawn = { x: b.position[0], z: b.position[2], rotationY: b.rotationY };
      return {
        id: b.id,
        config: b,
        spawnX: spawn.x,
        spawnZ: spawn.z,
        x: spawn.x,
        y: b.position[1],
        z: spawn.z,
        vx: 0,
        vz: 0,
        pitch: 0,
        roll: 0,
        yaw: spawn.rotationY,
        vPitch: 0,
        vRoll: 0,
        vYaw: 0,
        radius: Math.max(b.scale[0], b.scale[2]) * 1.05 + 0.1,
        impactFlash: 0.35,
        seed: Math.random() * 1000,
        defianceLevel: 0,
        escapeBoost: 0,
      };
    });
  }

  // Handle re-spawn trigger to warp monoliths to new random positions on demand
  useEffect(() => {
    if (respawnTrigger !== undefined && respawnTrigger > 0) {
      const newSpawns = generateMonolithSpawnLocations();
      bodiesRef.current.forEach((b, i) => {
        const s = newSpawns[i];
        if (s) {
          b.spawnX = s.x;
          b.spawnZ = s.z;
          b.x = s.x;
          b.z = s.z;
          b.vx = (Math.random() - 0.5) * 0.3;
          b.vz = (Math.random() - 0.5) * 0.3;
          b.yaw = s.rotationY;
          b.seed = Math.random() * 1000;
          b.impactFlash = 0.7; // energetic spawn flash!

          const group = monolithRefs.current[b.id];
          if (group) {
            group.position.set(b.x, b.y, b.z);
            group.rotation.y = b.yaw;
          }
        }
      });

      // Scatter and surge pirate ships on respawn
      shipsRef.current?.forEach((s) => {
        s.targetX = (Math.random() - 0.5) * 64;
        s.targetZ = (Math.random() - 0.5) * 64;
        s.waypointTimer = 12.0 + Math.random() * 12.0;
        s.impactFlash = 0.6;
        s.vx += (Math.random() - 0.5) * 1.5;
        s.vz += (Math.random() - 0.5) * 1.5;
      });
    }
  }, [respawnTrigger]);

  const sparksRef = useRef<ContactSparkData[]>([]);
  const [activeSparks, setActiveSparks] = useState<ContactSparkData[]>([]);
  const sparkIdCounter = useRef(0);

  const spawnContactSpark = (x: number, y: number, z: number) => {
    sparkIdCounter.current += 1;
    sparksRef.current.push({
      id: sparkIdCounter.current,
      x,
      y,
      z,
      radius: 0.05,
      opacity: 0.85,
    });
    if (sparksRef.current.length > 6) {
      sparksRef.current.shift();
    }
  };

  useEffect(() => {
    scene.fog = new THREE.Fog(0x000000, 24, 75);
    scene.background = new THREE.Color(0x000000);
  }, [scene]);

  const oceanPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), []);
  const mousePlanePos = useMemo(() => new THREE.Vector3(), []);

  useFrame(({ clock, raycaster }, delta) => {
    const dt = Math.min(delta, 0.04);

    // 0. EASTER EGG TIMELINE & IMMEDIATE WATER SURGE SEQUENCER
    if (isBlackHoleEasterEgg && !prevEasterEggRef.current) {
      easterEggTimerRef.current = 0.0;
      playedBoomRef.current = false;
      setIsBarrierActive(false);
      soundFx.whirlpoolSurge(); // Immediate rushing whirlpool water surge sound!
    } else if (!isBlackHoleEasterEgg && prevEasterEggRef.current) {
      setIsBarrierActive(false);
    }
    prevEasterEggRef.current = isBlackHoleEasterEgg;

    let activeSuction = 0;
    let effectiveWaveSpeed = waveSpeed;

    if (isBlackHoleEasterEgg) {
      easterEggTimerRef.current += dt;
      const tSurge = easterEggTimerRef.current;

      if (tSurge < 1.8) {
        // SURGE PHASE (0 - 1.8s):
        // 1. Water immediately speeds up to 4.8x!
        const surgeRatio = THREE.MathUtils.lerp(4.8, 3.2, tSurge / 1.8);
        effectiveWaveSpeed = waveSpeed * surgeRatio;
        // 2. Water rushes inward into the center vortex
        activeSuction = Math.min(1.0, tSurge / 0.55);
      } else {
        // SINGULARITY BREACH (t >= 1.8s):
        // 3. Gargantua breaches into existence with seismic sub-bass boom!
        if (!playedBoomRef.current) {
          playedBoomRef.current = true;
          setIsBarrierActive(true);
          soundFx.singularityBoom();
        }
        const settleProgress = Math.min(1.0, (tSurge - 1.8) / 1.4);
        effectiveWaveSpeed = waveSpeed * THREE.MathUtils.lerp(3.2, 1.5, settleProgress);
        activeSuction = 1.0;
      }
    }

    // 1. CELESTIAL DAY/NIGHT ORBITAL CYCLE ADVANCEMENT
    if (isCycleActive && onUpdateTimeOfDay) {
      const cycleSpeed = 0.038;
      const nextTime = (timeOfDay + dt * cycleSpeed) % (Math.PI * 2);
      onUpdateTimeOfDay(nextTime);
    }

    const sinT = Math.sin(timeOfDay);

    // 2. DAY / SUNSET / NIGHT / BLACK HOLE FOG AND SKY AMBIENCE
    if (scene.fog) {
      if (isBlackHoleEasterEgg) {
        scene.fog.color.setHex(0x000000);
        if (scene.background instanceof THREE.Color) scene.background.setHex(0x000000);
      } else {
        const dayFactor = Math.max(0, Math.min(1.0, (sinT + 0.12) / 0.75));
        const sunsetFactor = Math.max(0, Math.min(1.0, 1.0 - Math.abs(sinT) * 2.2));

        const dayFog = new THREE.Color(0x6ec5fd);
        const sunsetFog = new THREE.Color(0xd86a42);
        const nightFog = new THREE.Color(0x000000);

        const currentFog = new THREE.Color(0x000000);
        if (dayFactor > 0.001) {
          const blendDay = sunsetFog.clone().lerp(dayFog, dayFactor);
          currentFog.copy(nightFog).lerp(blendDay, dayFactor);
        } else if (sunsetFactor > 0.001) {
          currentFog.copy(nightFog).lerp(sunsetFog, sunsetFactor);
        }

        scene.fog.color.copy(currentFog);
        if (scene.background instanceof THREE.Color) {
          scene.background.copy(currentFog);
        }
      }
    }

    // 3. DYNAMIC DIURNAL ATMOSPHERE LIGHTING
    if (hemiLightRef.current && ambientLightRef.current) {
      if (isBlackHoleEasterEgg) {
        hemiLightRef.current.color.setHex(0xd8f0ff);
        hemiLightRef.current.groundColor.setHex(0x020817);
        hemiLightRef.current.intensity = 0.55;
        ambientLightRef.current.color.setHex(0x061426);
        ambientLightRef.current.intensity = 0.45;
      } else {
        const dayFactor = Math.max(0, Math.min(1.0, (sinT + 0.12) / 0.75));
        const dayHemiSky = new THREE.Color(0xd6f1ff);
        const dayHemiGround = new THREE.Color(0x0b61d6);
        const nightHemiSky = new THREE.Color(0x0d1a38);
        const nightHemiGround = new THREE.Color(0x010512);

        hemiLightRef.current.color.copy(nightHemiSky).lerp(dayHemiSky, dayFactor);
        hemiLightRef.current.groundColor.copy(nightHemiGround).lerp(dayHemiGround, dayFactor);
        hemiLightRef.current.intensity = THREE.MathUtils.lerp(0.35, 1.05, dayFactor);

        const dayAmb = new THREE.Color(0xfff6e8);
        const nightAmb = new THREE.Color(0x071126);
        ambientLightRef.current.color.copy(nightAmb).lerp(dayAmb, dayFactor);
        ambientLightRef.current.intensity = THREE.MathUtils.lerp(0.3, 0.95, dayFactor);
      }
    }

    if (rectLightRef.current) {
      rectLightRef.current.lookAt(0, 0, 0);
    }

    const speedRatio = effectiveWaveSpeed / 0.05;
    const ampRatio = waveAmplitude / 0.25;
    const t = clock.getElapsedTime() * 0.75 * speedRatio;

    // Check mouse cursor raycast against ocean plane for interactive mouse nudge
    let hasMouseHover = false;
    if (raycaster.ray.intersectPlane(oceanPlane, mousePlanePos)) {
      hasMouseHover = true;
    }

    const bodies = bodiesRef.current;
    const bhState = getBlackHoleState(timeOfDay);

    // 1. FORCES: OCEAN DRIFT CURRENTS, FLUID DRAG & BLACK HOLE GRAVITATIONAL SUCTION
    for (let i = 0; i < bodies.length; i++) {
      const b = bodies[i];
      const p1 = b.seed % 6.28;
      const p2 = (b.seed * 1.618) % 6.28;
      const p3 = (b.seed * 2.718) % 6.28;

      // Natural wandering target based on ocean currents
      const driftRadiusX = (0.85 + b.config.vel * 0.12) * ampRatio;
      const driftRadiusZ = (0.95 + b.config.pos * 1.5) * ampRatio;

      const targetX =
        b.spawnX +
        Math.sin(t * 0.48 + p1) * driftRadiusX +
        Math.cos(t * 0.78 + p2) * (driftRadiusX * 0.45);

      // When black hole is active, the ocean current actively draws the bottles forward toward Gargantua
      const attractionZ = -12.2; // active destination in front of the black hole
      const naturalTargetZ =
        b.spawnZ +
        Math.cos(t * 0.42 + p2) * driftRadiusZ +
        Math.sin(t * 0.7 + p3) * (driftRadiusZ * 0.45) +
        Math.sin(t * 1.6 + p1) * 0.35 * ampRatio;

      // Blend target towards the black hole based on active suction intensity!
      const targetZ = THREE.MathUtils.lerp(
        naturalTargetZ,
        attractionZ + Math.sin(t * 0.35 + p2) * 1.5,
        activeSuction * 0.88
      );

      // Soft spring force drawing toward current target
      const springK = activeSuction > 0.05 ? 1.0 : 3.6;
      const fx = (targetX - b.x) * 2.5;
      const fz = (targetZ - b.z) * springK;

      b.vx += fx * dt;
      b.vz += fz * dt;

      // Black hole distance and direction on ocean plane
      const dxBH = bhState.x - b.x;
      const dzBH = bhState.z - b.z;
      const distBH = Math.hypot(dxBH, dzBH);
      const dirBHX = dxBH / (distBH + 0.0001);
      const dirBHZ = dzBH / (distBH + 0.0001);

      if (activeSuction > 0.01) {
        // 1. ACTIVELY GOING THERE (EASTER EGG ACTIVE):
        // Strong gravitational suction accelerating the bottles forward toward the black hole
        const suctionForce = (activeSuction * 8.5) / Math.max(1.0, Math.pow(distBH / 6.0, 1.2));
        b.vx += dirBHX * suctionForce * dt;
        b.vz += dirBHZ * suctionForce * dt;

        // Inward drift current pushing bottles along waves toward Gargantua
        b.vz -= activeSuction * 2.2 * dt;

        // 2. SOMETHING IS ACTIVELY STOPPING THEM: THE RESISTANCE BARRIER
        // Appears once singularity breaches (at t >= 1.8s)
        const barrierRadius = 10.8;
        if (isBarrierActive && distBH < barrierRadius + 2.5) {
          const proximity = Math.min(1.0, (barrierRadius + 2.5 - distBH) / 2.5);
          b.defianceLevel = Math.max(b.defianceLevel, proximity);

          // Hard resistance barrier repulsion:
          if (distBH <= barrierRadius) {
            const penetration = barrierRadius - distBH; // inward depth
            const barrierStiffness = 42.0 + penetration * 80.0;
            b.vx -= dirBHX * barrierStiffness * dt;
            b.vz -= dirBHZ * barrierStiffness * dt;

            // Inward velocity damping (viscous spacetime barrier arrests forward plunge)
            const inwardVel = b.vx * dirBHX + b.vz * dirBHZ;
            if (inwardVel > 0) {
              b.vx -= dirBHX * inwardVel * Math.min(1.0, 16.0 * dt);
              b.vz -= dirBHZ * inwardVel * Math.min(1.0, 16.0 * dt);
            }

            // High-frequency relativistic trembling / shuddering against the resistance wall
            const shudder = Math.sin(t * 68.0 + b.seed) * 0.075 * b.defianceLevel;
            b.pitch += shudder;
            b.roll += shudder * 0.8;

            // Deflect into tangential orbital surfing along the barrier rim
            const tanX = -dirBHZ;
            const tanZ = dirBHX;
            const orbitalSpeed = (3.8 + proximity * 3.2) * activeSuction;
            b.vx += tanX * orbitalSpeed * dt;
            b.vz += tanZ * orbitalSpeed * dt;

            // Dynamic wave tilt: leaning away from the barrier
            b.vPitch -= dirBHZ * (0.45 * proximity);
            b.vRoll += tanX * (0.45 * proximity);

            // Contact sparks & splash bursts when fighting the barrier
            if (penetration > 0.25 && Math.random() < 0.15) {
              spawnContactSpark(b.x + (Math.random() - 0.5) * 0.25, b.y + 0.1, b.z + (Math.random() - 0.5) * 0.25);
              b.impactFlash = Math.max(b.impactFlash, 0.7);
            }
          }
        } else {
          b.defianceLevel = Math.max(0, b.defianceLevel - dt * 1.5);
        }
      } else {
        b.defianceLevel = 0;
      }
      b.escapeBoost = Math.max(0, b.escapeBoost - dt * 2.5);

      // Interactive mouse repulsion force (subtle nudge)
      if (hasMouseHover) {
        const mdx = b.x - mousePlanePos.x;
        const mdz = b.z - mousePlanePos.z;
        const mDist = Math.sqrt(mdx * mdx + mdz * mdz);
        const mRange = 2.0;
        if (mDist < mRange && mDist > 0.05) {
          const push = (1.0 - mDist / mRange) * 4.2;
          b.vx += (mdx / mDist) * push * dt;
          b.vz += (mdz / mDist) * push * dt;
        }
      }

      // Fluid drag / water resistance
      const drag = Math.pow(0.86, dt * 60);
      b.vx *= drag;
      b.vz *= drag;

      // Integrate positions
      b.x += b.vx * dt;
      b.z += b.vz * dt;
    }

    // 2. PAIRWISE MONOLITH COLLISIONS (Subtle, Damped & Localized Contact FX)
    for (let i = 0; i < bodies.length; i++) {
      for (let j = i + 1; j < bodies.length; j++) {
        const b1 = bodies[i];
        const b2 = bodies[j];

        const dx = b2.x - b1.x;
        const dz = b2.z - b1.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        const minDist = b1.radius + b2.radius;

        if (dist < minDist && dist > 0.0001) {
          // Collision detected!
          const nx = dx / dist; // Normal from b1 -> b2
          const nz = dz / dist;
          const overlap = minDist - dist;

          // 1. Gentle position separation
          const separation = overlap * 0.51;
          b1.x -= nx * separation;
          b1.z -= nz * separation;
          b2.x += nx * separation;
          b2.z += nz * separation;

          // 2. Damped velocity impulse exchange (subtle cushioned deflection)
          const relVx = b1.vx - b2.vx;
          const relVz = b1.vz - b2.vz;
          const normalVel = relVx * nx + relVz * nz;

          // If moving toward each other, soft deflection!
          if (normalVel > 0) {
            const restitution = 0.42; // Soft, cushioned Tron deflection
            const impulse = normalVel * (1 + restitution) * 0.5;

            b1.vx -= nx * impulse;
            b1.vz -= nz * impulse;
            b2.vx += nx * impulse;
            b2.vz += nz * impulse;

            // 3. Subtle impact micro-torque (delicate rocking)
            b1.vPitch -= nz * 0.07;
            b1.vRoll += nx * 0.07;
            b2.vPitch += nz * 0.07;
            b2.vRoll -= nx * 0.07;

            // 4. Subtle localized impact flash
            b1.impactFlash = 0.35;
            b2.impactFlash = 0.35;

            // 5. Spawn small, localized Tron contact spark at exact touch point
            const contactX = (b1.x + b2.x) * 0.5;
            const contactZ = (b1.z + b2.z) * 0.5;
            const contactY = Math.max(0.08, (b1.y + b2.y) * 0.5 * 0.4 + 0.1);
            spawnContactSpark(contactX, contactY, contactZ);

            // 6. Subtle digitized deflection blip sound & fluid water splash
            soundFx.collision();
            soundFx.splash(0.7);
          }
        }
      }
    }

    // 3. WATER HEAVE, TILTING & THREE.JS SCENE UPDATES
    for (let i = 0; i < bodies.length; i++) {
      const b = bodies[i];
      const p1 = b.seed % 6.28;
      const p2 = (b.seed * 1.618) % 6.28;
      const p3 = (b.seed * 2.718) % 6.28;

      // Sample multi-harmonic ocean wave elevation at current (b.x, b.z)
      const waveWave1 = Math.sin(b.x * 0.55 + b.z * 0.45 + t * 2.3 + p1) * (0.24 * ampRatio);
      const waveWave2 = Math.cos(b.x * 0.38 - b.z * 0.65 + t * 1.8 + p2) * (0.17 * ampRatio);
      const waveWave3 = Math.sin(Math.sqrt(b.x * b.x + b.z * b.z) * 0.5 - t * 2.6) * (0.11 * ampRatio);
      const buoyancyBounce = Math.sin(t * 2.1 + p3) * 0.08 * ampRatio;

      // Gravitational whirlpool funnel depression and vortex surge at bottle coordinates
      const dxBH = bhState.x - b.x;
      const dzBH = bhState.z - b.z;
      const distBH = Math.hypot(dxBH, dzBH);
      const funnelDrop = - (activeSuction * 4.6) / (1.0 + Math.pow(distBH / 5.6, 2.1));
      const angleBH = Math.atan2(dzBH, dxBH);
      const vortexSurge = Math.sin(distBH * 1.15 - t * 4.2 + angleBH * 3.0) * (0.22 * ampRatio) * activeSuction;

      let currentY = b.config.scale[1] * 0.35 + waveWave1 + waveWave2 + waveWave3 + buoyancyBounce + funnelDrop + vortexSurge;

      // Hand tool lifting & dragging dynamics for bottles
      const isThisBottleGrabbed = grabbedEntityRef.current?.type === "bottle" && grabbedEntityRef.current.id === b.id;
      if (isThisBottleGrabbed && grabbedEntityRef.current) {
        grabbedEntityRef.current.liftProgress = Math.min(1.0, grabbedEntityRef.current.liftProgress + dt * 4.5);
        currentY += 2.6 * grabbedEntityRef.current.liftProgress;
        if (hasMouseHover) {
          b.x = THREE.MathUtils.lerp(b.x, mousePlanePos.x, 0.28);
          b.z = THREE.MathUtils.lerp(b.z, mousePlanePos.z, 0.28);
        }
        b.vx = 0;
        b.vz = 0;
        b.pitch = THREE.MathUtils.lerp(b.pitch, 0.35, 0.14);
        b.roll = THREE.MathUtils.lerp(b.roll, 0.12, 0.14);
      }

      b.y = currentY;

      // Wave slope inclinations
      const basePitch = Math.cos(b.x * 0.55 + b.z * 0.45 + t * 2.3 + p1) * (0.14 * ampRatio);
      const baseRoll = -Math.sin(b.x * 0.38 - b.z * 0.65 + t * 1.8 + p2) * (0.15 * ampRatio);
      const baseYaw = b.config.rotationY + Math.sin(t * 0.32 + p1) * 0.28 + Math.cos(t * 0.18 + p3) * 0.16;

      // Integrate angular momentum from impact & waves, with upright clamping
      b.pitch = Math.max(-0.24, Math.min(0.24, b.pitch + b.vPitch * dt));
      b.roll = Math.max(-0.24, Math.min(0.24, b.roll + b.vRoll * dt));
      b.yaw += b.vYaw * dt;

      // Restorative spring returning toward wave slope
      b.vPitch += (basePitch - b.pitch) * 9.0 * dt;
      b.vRoll += (baseRoll - b.roll) * 9.0 * dt;
      b.vYaw += (baseYaw - b.yaw) * 6.0 * dt;

      b.vPitch *= Math.pow(0.85, dt * 60);
      b.vRoll *= Math.pow(0.85, dt * 60);
      b.vYaw *= Math.pow(0.85, dt * 60);

      // Flash decay
      b.impactFlash = Math.max(0, b.impactFlash - dt * 3.5);

      // Update 3D Group Transform & Defiance Telemetry
      const group = monolithRefs.current[b.id];
      if (group) {
        group.position.set(b.x, currentY, b.z);
        group.rotation.set(b.pitch, b.yaw, b.roll);
        group.userData.defianceLevel = b.defianceLevel;
        group.userData.escapeBoost = b.escapeBoost;
      }

      // Update Material emissive glow on impact flash (subtle neon pulse)
      const mat = monolithMaterialRefs.current[b.id];
      if (mat) {
        const isSelected = activeTab === b.id;
        const baseIntensity = isSelected ? 0.65 : 0.12;
        mat.emissiveIntensity = baseIntensity + b.impactFlash * 0.35;
      }
    }

    // 4. PIRATE SHIPS SIMULATION: AUTONOMOUS ROAMING, IDENTICAL OCEAN PHYSICS & COLLISIONS
    const ships = shipsRef.current;
    if (ships) {
      // 4a. Waypoint Navigation, Boundaries, Black Hole & Drag
      for (let i = 0; i < ships.length; i++) {
        const s = ships[i];
        s.waypointTimer -= dt;
        const toTargetX = s.targetX - s.x;
        const toTargetZ = s.targetZ - s.z;
        const distToTarget = Math.hypot(toTargetX, toTargetZ);

        // Pick new random waypoint anywhere across the ocean [-34, 34] when reached or timer expires
        if (distToTarget < 3.2 || s.waypointTimer <= 0) {
          s.targetX = (Math.random() - 0.5) * 68;
          s.targetZ = (Math.random() - 0.5) * 68;
          s.waypointTimer = 14.0 + Math.random() * 16.0;
        }

        const dirTargetX = toTargetX / (distToTarget + 0.001);
        const dirTargetZ = toTargetZ / (distToTarget + 0.001);
        const desiredVx = dirTargetX * s.cruiseSpeed;
        const desiredVz = dirTargetZ * s.cruiseSpeed;

        const steerX = (desiredVx - s.vx) * 1.8;
        const steerZ = (desiredVz - s.vz) * 1.8;
        s.vx += steerX * dt;
        s.vz += steerZ * dt;

        // Soft ocean boundary containment: steer away from edges
        if (Math.abs(s.x) > 33) {
          const pushX = -Math.sign(s.x) * (Math.abs(s.x) - 33) * 8.0;
          s.vx += pushX * dt;
          if (Math.sign(s.targetX) === Math.sign(s.x)) s.targetX = -s.x * 0.7;
        }
        if (Math.abs(s.z) > 33) {
          const pushZ = -Math.sign(s.z) * (Math.abs(s.z) - 33) * 8.0;
          s.vz += pushZ * dt;
          if (Math.sign(s.targetZ) === Math.sign(s.z)) s.targetZ = -s.z * 0.7;
        }

        // Black hole gravitational suction & resistance barrier (matching bottle physics)
        const dxBH = bhState.x - s.x;
        const dzBH = bhState.z - s.z;
        const distBH = Math.hypot(dxBH, dzBH);
        const dirBHX = dxBH / (distBH + 0.0001);
        const dirBHZ = dzBH / (distBH + 0.0001);

        if (activeSuction > 0.01) {
          const suctionForce = (activeSuction * 8.0) / Math.max(1.0, Math.pow(distBH / 6.0, 1.2));
          s.vx += dirBHX * suctionForce * dt;
          s.vz += dirBHZ * suctionForce * dt;
          s.vz -= activeSuction * 2.0 * dt;

          const barrierRadius = 10.8;
          if (isBarrierActive && distBH < barrierRadius + 2.5) {
            const proximity = Math.min(1.0, (barrierRadius + 2.5 - distBH) / 2.5);
            s.defianceLevel = Math.max(s.defianceLevel, proximity);

            if (distBH <= barrierRadius) {
              const penetration = barrierRadius - distBH;
              const barrierStiffness = 42.0 + penetration * 80.0;
              s.vx -= dirBHX * barrierStiffness * dt;
              s.vz -= dirBHZ * barrierStiffness * dt;

              const inwardVel = s.vx * dirBHX + s.vz * dirBHZ;
              if (inwardVel > 0) {
                s.vx -= dirBHX * inwardVel * Math.min(1.0, 16.0 * dt);
                s.vz -= dirBHZ * inwardVel * Math.min(1.0, 16.0 * dt);
              }

              // High-frequency relativistic trembling against resistance barrier
              const shudder = Math.sin(t * 68.0 + s.seed) * 0.075 * s.defianceLevel;
              s.pitch += shudder;
              s.roll += shudder * 0.8;

              // Orbital surfing along barrier rim
              const tanX = -dirBHZ;
              const tanZ = dirBHX;
              const orbitalSpeed = (3.6 + proximity * 3.0) * activeSuction;
              s.vx += tanX * orbitalSpeed * dt;
              s.vz += tanZ * orbitalSpeed * dt;

              s.vPitch -= dirBHZ * (0.45 * proximity);
              s.vRoll += tanX * (0.45 * proximity);

              if (penetration > 0.25 && Math.random() < 0.15) {
                spawnContactSpark(s.x + (Math.random() - 0.5) * 0.25, s.y + 0.1, s.z + (Math.random() - 0.5) * 0.25);
                s.impactFlash = Math.max(s.impactFlash, 0.7);
              }
            }
          } else {
            s.defianceLevel = Math.max(0, s.defianceLevel - dt * 1.5);
          }
        } else {
          s.defianceLevel = 0;
        }

        // Interactive mouse hover repulsion
        if (hasMouseHover) {
          const mdx = s.x - mousePlanePos.x;
          const mdz = s.z - mousePlanePos.z;
          const mDist = Math.sqrt(mdx * mdx + mdz * mdz);
          const mRange = 2.2;
          if (mDist < mRange && mDist > 0.05) {
            const push = (1.0 - mDist / mRange) * 4.6;
            s.vx += (mdx / mDist) * push * dt;
            s.vz += (mdz / mDist) * push * dt;
          }
        }

        // Fluid drag
        const drag = Math.pow(0.88, dt * 60);
        s.vx *= drag;
        s.vz *= drag;

        s.x += s.vx * dt;
        s.z += s.vz * dt;
        s.speed = Math.hypot(s.vx, s.vz);
      }

      // 4b. Pairwise Ship-to-Ship Collisions
      for (let i = 0; i < ships.length; i++) {
        for (let j = i + 1; j < ships.length; j++) {
          const s1 = ships[i];
          const s2 = ships[j];
          const dx = s2.x - s1.x;
          const dz = s2.z - s1.z;
          const dist = Math.hypot(dx, dz);
          const minDist = s1.radius + s2.radius;
          if (dist < minDist && dist > 0.0001) {
            const nx = dx / dist;
            const nz = dz / dist;
            const overlap = minDist - dist;
            const separation = overlap * 0.51;
            s1.x -= nx * separation;
            s1.z -= nz * separation;
            s2.x += nx * separation;
            s2.z += nz * separation;

            const relVx = s1.vx - s2.vx;
            const relVz = s1.vz - s2.vz;
            const normalVel = relVx * nx + relVz * nz;
            if (normalVel > 0) {
              const restitution = 0.48;
              const impulse = normalVel * (1 + restitution) * 0.5;
              s1.vx -= nx * impulse;
              s1.vz -= nz * impulse;
              s2.vx += nx * impulse;
              s2.vz += nz * impulse;

              s1.vPitch -= nz * 0.1;
              s1.vRoll += nx * 0.1;
              s2.vPitch += nz * 0.1;
              s2.vRoll -= nx * 0.1;

              s1.impactFlash = 0.5;
              s2.impactFlash = 0.5;

              spawnContactSpark((s1.x + s2.x) * 0.5, Math.max(0.08, (s1.y + s2.y) * 0.5), (s1.z + s2.z) * 0.5);
              soundFx.collision();
              soundFx.splash(0.65);
            }
          }
        }
      }

      // 4c. Pairwise Ship-to-Bottle Collisions
      for (let i = 0; i < ships.length; i++) {
        const s = ships[i];
        for (let j = 0; j < bodies.length; j++) {
          const b = bodies[j];
          const dx = b.x - s.x;
          const dz = b.z - s.z;
          const dist = Math.hypot(dx, dz);
          const minDist = s.radius + b.radius;
          if (dist < minDist && dist > 0.0001) {
            const nx = dx / dist;
            const nz = dz / dist;
            const overlap = minDist - dist;
            const separation = overlap * 0.51;
            s.x -= nx * separation;
            s.z -= nz * separation;
            b.x += nx * separation;
            b.z += nz * separation;

            const relVx = s.vx - b.vx;
            const relVz = s.vz - b.vz;
            const normalVel = relVx * nx + relVz * nz;
            if (normalVel > 0) {
              const restitution = 0.46;
              const impulse = normalVel * (1 + restitution) * 0.5;
              s.vx -= nx * impulse;
              s.vz -= nz * impulse;
              b.vx += nx * impulse;
              b.vz += nz * impulse;

              s.vPitch -= nz * 0.12;
              s.vRoll += nx * 0.12;
              b.vPitch += nz * 0.08;
              b.vRoll -= nx * 0.08;

              s.impactFlash = 0.55;
              b.impactFlash = 0.4;

              spawnContactSpark((s.x + b.x) * 0.5, Math.max(0.08, (s.y + b.y) * 0.5), (s.z + b.z) * 0.5);
              soundFx.collision();
              soundFx.splash(0.75);
            }
          }
        }
      }

      // 4d. Wave Elevation Heave, Rocking Slope Pitch/Roll, Heading Yaw & Three.js Transforms
      for (let i = 0; i < ships.length; i++) {
        const s = ships[i];
        const p1 = s.seed % 6.28;
        const p2 = (s.seed * 1.618) % 6.28;
        const p3 = (s.seed * 2.718) % 6.28;

        const waveWave1 = Math.sin(s.x * 0.55 + s.z * 0.45 + t * 2.3 + p1) * (0.24 * ampRatio);
        const waveWave2 = Math.cos(s.x * 0.38 - s.z * 0.65 + t * 1.8 + p2) * (0.17 * ampRatio);
        const waveWave3 = Math.sin(Math.sqrt(s.x * s.x + s.z * s.z) * 0.5 - t * 2.6) * (0.11 * ampRatio);
        const buoyancyBounce = Math.sin(t * 2.1 + p3) * 0.08 * ampRatio;

        const dxBH = bhState.x - s.x;
        const dzBH = bhState.z - s.z;
        const distBH = Math.hypot(dxBH, dzBH);
        const funnelDrop = - (activeSuction * 4.6) / (1.0 + Math.pow(distBH / 5.6, 2.1));
        const angleBH = Math.atan2(dzBH, dxBH);
        const vortexSurge = Math.sin(distBH * 1.15 - t * 4.2 + angleBH * 3.0) * (0.22 * ampRatio) * activeSuction;

        let currentY = s.scale * 0.18 + waveWave1 + waveWave2 + waveWave3 + buoyancyBounce + funnelDrop + vortexSurge;

        // Hand tool lifting & dragging dynamics for pirate ships
        const isThisShipGrabbed = grabbedEntityRef.current?.type === "ship" && grabbedEntityRef.current.id === s.id;
        if (isThisShipGrabbed && grabbedEntityRef.current) {
          grabbedEntityRef.current.liftProgress = Math.min(1.0, grabbedEntityRef.current.liftProgress + dt * 4.5);
          currentY += 2.6 * grabbedEntityRef.current.liftProgress;
          if (hasMouseHover) {
            s.x = THREE.MathUtils.lerp(s.x, mousePlanePos.x, 0.28);
            s.z = THREE.MathUtils.lerp(s.z, mousePlanePos.z, 0.28);
          }
          s.vx = 0;
          s.vz = 0;
          s.pitch = THREE.MathUtils.lerp(s.pitch, -0.25, 0.14);
          s.roll = THREE.MathUtils.lerp(s.roll, 0.1, 0.14);
        }

        s.y = currentY;

        // Wave slope pitch and roll
        const basePitch = Math.cos(s.x * 0.55 + s.z * 0.45 + t * 2.3 + p1) * (0.15 * ampRatio);
        const baseRoll = -Math.sin(s.x * 0.38 - s.z * 0.65 + t * 1.8 + p2) * (0.15 * ampRatio);

        // Smooth yaw alignment towards velocity direction
        if (s.speed > 0.08) {
          const targetHeading = Math.atan2(-s.vx, -s.vz);
          let diffYaw = (targetHeading - s.yaw) % (Math.PI * 2);
          if (diffYaw > Math.PI) diffYaw -= Math.PI * 2;
          if (diffYaw < -Math.PI) diffYaw += Math.PI * 2;
          s.vYaw += diffYaw * 5.0 * dt;
        }

        // Banking tilt when turning
        const bankRoll = -s.vYaw * 0.22;

        s.pitch = Math.max(-0.28, Math.min(0.28, s.pitch + s.vPitch * dt));
        s.roll = Math.max(-0.32, Math.min(0.32, s.roll + s.vRoll * dt));
        s.yaw += s.vYaw * dt;

        s.vPitch += (basePitch - s.pitch) * 9.0 * dt;
        s.vRoll += (baseRoll + bankRoll - s.roll) * 9.0 * dt;
        s.vYaw *= Math.pow(0.82, dt * 60);
        s.vPitch *= Math.pow(0.85, dt * 60);
        s.vRoll *= Math.pow(0.85, dt * 60);

        s.impactFlash = Math.max(0, s.impactFlash - dt * 3.5);

        const group = shipRefs.current[s.id];
        if (group) {
          group.position.set(s.x, currentY, s.z);
          group.rotation.set(s.pitch, s.yaw, s.roll);
        }
      }
    }

    // 5. UPDATE LOCALIZED CONTACT SPARKS (fast, subtle fadeout)
    if (sparksRef.current.length > 0) {
      for (let s = sparksRef.current.length - 1; s >= 0; s--) {
        const spark = sparksRef.current[s];
        spark.radius += dt * 1.2; // Expands subtly to max ~0.35
        spark.opacity -= dt * 3.5; // Fades out in ~0.24s
        if (spark.opacity <= 0 || spark.radius > 0.42) {
          sparksRef.current.splice(s, 1);
        }
      }
      setActiveSparks([...sparksRef.current]);
    }
  });

  return (
    <>
      <CameraRig
        activeTab={activeTab}
        groupRef={groupRef}
        monolithRefs={monolithRefs}
        resetTrigger={resetTrigger}
        turn360Trigger={turn360Trigger}
        onCameraHudUpdate={onCameraHudUpdate}
      />

      <BeaconTracker
        beaconsRef={beaconsRef}
        monolithRefs={monolithRefs}
      />

      {/* 1. Celestial Sky with Sun, Moon or Gargantua Black Hole */}
      <CosmicSky
        timeOfDay={timeOfDay}
        accentColor={accentColor}
        isLowEndMode={isLowEndMode}
        isBlackHoleEasterEgg={isBlackHoleEasterEgg}
        onToggleBlackHoleEasterEgg={onToggleBlackHoleEasterEgg}
      />

      {/* 2. Atmosphere Ambient & Hemisphere Light */}
      <hemisphereLight
        ref={hemiLightRef}
        args={[
          0xd8f0ff, // Cold white cosmic sky light
          0x0b61d6, // Deep royal water reflection
          0.95,
        ]}
      />
      <ambientLight ref={ambientLightRef} args={[0xd6ecff, 0.9]} />
      <pointLight args={[0x5bc0f8, 1.4]} position={[0, 6, 2]} />

      {/* Group containing Message Bottles, Caustic Ocean, Barrier Ring, and Contact Sparks */}
      <group ref={groupRef}>
        {showGrid && <gridHelper args={[28, 28, accentColor, COLOR_PALETTE.slateGray]} position={[0, -0.6, 0]} />}

        {/* Small Localized Collision Contact Sparks */}
        <CollisionContactSparks sparks={activeSparks} color={accentColor} />

        {/* Spacetime Resistance Barrier Ring at Black Hole Perimeter (Only in Easter Egg mode after singularity breaches) */}
        {isBlackHoleEasterEgg && isBarrierActive && (
          <ResistanceBarrierRing
            position={currentBhState.position}
            radius={10.8}
            intensity={1.0}
            accentColor={accentColor}
          />
        )}

        {/* Message in a Bottle Floating Portfolio Items */}
        {BUILDINGS.map((building) => {
          const body = bodiesRef.current?.find((b) => b.id === building.id);
          return (
            <group
              key={building.id}
              onPointerDown={(e) => {
                if (activeTool === "hand") {
                  e.stopPropagation();
                  grabbedEntityRef.current = { type: "bottle", id: building.id, liftProgress: 0 };
                  setHasGrabbedEntity(true);
                  onSetIsGrabbing?.(true);
                  soundFx.pickUp();
                }
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (activeTool === "hammer" || activeTool === "default") {
                  // Smashes the bottle with 3D glass breaking animation & sound effect!
                  window.dispatchEvent(new CustomEvent("portfolio:tool-swing"));
                  if (body) {
                    window.dispatchEvent(
                      new CustomEvent("portfolio:glass-shatter", {
                        detail: { x: body.x, y: body.y, z: body.z, color: 0x2ec468 },
                      })
                    );
                    body.vPitch -= 0.65;
                    body.vRoll += 0.55;
                    body.impactFlash = 1.0;
                    spawnContactSpark(body.x, body.y + 0.35, body.z);
                    spawnContactSpark(body.x + 0.12, body.y + 0.5, body.z - 0.12);
                  }
                  soundFx.glassBreak(1.4);
                  soundFx.splash(1.6);
                  onSetActionNotification?.(`💥 [SMASHED] Glass shattered! Revealed [${building.number}] ${building.label}!`);
                  setTimeout(() => onSetActionNotification?.(null), 3000);
                  onSelectBuilding(building.id);
                } else if (activeTool === "hand") {
                  soundFx.select();
                  soundFx.splash(1.2);
                  onSelectBuilding(building.id);
                } else {
                  soundFx.select();
                  soundFx.splash(1.2);
                  onSelectBuilding(building.id);
                }
              }}
            >
              {/* Invisible raycast hit-box for generous bottle target */}
              <mesh visible={false} position={[0, 0.4, 0]}>
                <boxGeometry args={[1.8, 2.8, 1.8]} />
                <meshBasicMaterial transparent opacity={0} />
              </mesh>
              <Monolith
                config={building}
                accentColor={accentColor}
                isActive={activeTab === building.id}
                onSelect={onSelectBuilding}
                waveSpeed={waveSpeed}
                impactFlash={body?.impactFlash || 0}
                splashTrigger={respawnTrigger}
                defianceLevel={body?.defianceLevel || 0}
                escapeBoost={body?.escapeBoost || 0}
                blackHolePos={currentBhState.position}
                registerRef={(ref) => {
                  monolithRefs.current[building.id] = ref;
                  if (ref && body) {
                    ref.position.set(body.x, body.y, body.z);
                    ref.rotation.y = body.yaw;
                  }
                }}
                registerMaterial={(mat) => {
                  monolithMaterialRefs.current[building.id] = mat;
                }}
              />
            </group>
          );
        })}

        {/* 3. Tiny Autonomous Chibi Pirate Ships Roaming Across the Ocean */}
        {shipsRef.current?.map((ship) => (
          <group
            key={ship.id}
            ref={(el) => {
              shipRefs.current[ship.id] = el;
              if (el) {
                el.position.set(ship.x, ship.y, ship.z);
                el.rotation.set(ship.pitch, ship.yaw, ship.roll);
              }
            }}
            onPointerDown={(e) => {
              if (activeTool === "hand") {
                e.stopPropagation();
                grabbedEntityRef.current = { type: "ship", id: ship.id, liftProgress: 0 };
                setHasGrabbedEntity(true);
                onSetIsGrabbing?.(true);
                soundFx.pickUp();
              }
            }}
            onPointerOver={(e) => {
              e.stopPropagation();
              setHoveredShip(ship.id);
              onHoverShip?.(ship.name);
              soundFx.hover();
            }}
            onPointerOut={(e) => {
              e.stopPropagation();
              setHoveredShip((prev) => (prev === ship.id ? null : prev));
              onHoverShip?.(null);
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (activeTool === "hammer") {
                // Comical hammer bonk! Ship spins with speed burst & sparks
                soundFx.hammerSmash();
                soundFx.splash(1.3);
                ship.vYaw += 14.0;
                ship.vPitch -= 0.38;
                ship.impactFlash = 1.0;
                const forwardX = -Math.sin(ship.yaw);
                const forwardZ = -Math.cos(ship.yaw);
                ship.vx += forwardX * 4.6;
                ship.vz += forwardZ * 4.6;
                spawnContactSpark(ship.x, ship.y + 0.25, ship.z);
                onSetActionNotification?.(`🔨 BONK! Accelerated ${ship.name}!`);
                setTimeout(() => onSetActionNotification?.(null), 2500);
              } else {
                soundFx.select();
                soundFx.splash(1.1);
                const forwardX = -Math.sin(ship.yaw);
                const forwardZ = -Math.cos(ship.yaw);
                ship.vx += forwardX * 2.8;
                ship.vz += forwardZ * 2.8;
                ship.vPitch -= 0.22;
                ship.impactFlash = 0.8;
                spawnContactSpark(ship.x, ship.y + 0.15, ship.z);
              }
            }}
          >
            {/* Generous invisible raycast hit-box for easy hovering & clicking */}
            <mesh visible={false} position={[0, 0.4, 0]}>
              <boxGeometry args={[2.0, 1.8, 2.6]} />
              <meshBasicMaterial transparent opacity={0} />
            </mesh>
            <PirateShip
              type={ship.type}
              name={ship.name}
              scale={ship.scale}
              impactFlash={ship.impactFlash}
              defianceLevel={ship.defianceLevel}
              speed={ship.speed}
              isHovered={hoveredShip === ship.id}
            />
          </group>
        ))}

        {/* Hand Tool Landing Ripple Reticle on Water Surface when dragging */}
        {hasGrabbedEntity && (
          <group position={[mousePlanePos.x, 0.05, mousePlanePos.z]} rotation={[-Math.PI / 2, 0, 0]}>
            <mesh>
              <ringGeometry args={[0.7, 1.05, 32]} />
              <meshBasicMaterial
                color={0x5bc0f8}
                transparent
                opacity={0.8}
                side={THREE.DoubleSide}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
              />
            </mesh>
            <mesh>
              <circleGeometry args={[0.24, 16]} />
              <meshBasicMaterial
                color={0xffffff}
                transparent
                opacity={0.9}
                side={THREE.DoubleSide}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
              />
            </mesh>
          </group>
        )}

        {/* 3b. Living Ocean Wildlife: Patrolling Shark Fins & Leaping Flying Fishes */}
        <OceanWildlife
          waveSpeed={waveSpeed}
          waveAmplitude={waveAmplitude}
          timeOfDay={timeOfDay}
          blackHolePos={currentBhState.position}
          isBlackHoleEasterEgg={isBlackHoleEasterEgg}
          onSetActionNotification={onSetActionNotification}
        />

        {/* 4. Water Caustic Ocean with Stepped 2D/3D Pixel Shading & Conditional Black Hole Suction Vortex */}
        <WaterCausticOcean
          oceanSize={oceanSize}
          oceanFragments={oceanFragments}
          waveSpeed={waveSpeed}
          waveAmplitude={waveAmplitude}
          timeOfDay={timeOfDay}
          accentColor={accentColor}
          blackHolePos={currentBhState.position}
          suctionIntensity={1.0}
          isBlackHoleEasterEgg={isBlackHoleEasterEgg}
        />

        {/* 5. 3D Physical Glass Shattering Particles & Water Shockwave Effect */}
        <GlassShatterEffect />
      </group>
    </>
  );
}

// =============================================================================
// MAIN COMPONENT - Props for reusability
// =============================================================================
export interface LiquidOceanProps {
  className?: string;
  backgroundColor?: number;
  gridColor?: number;
  accentColor?: number;
  fov?: number;
  rotationSpeed?: number;
  showGrid?: boolean;
  oceanSize?: number;
  oceanFragments?: number;
  waveAmplitude?: number;
  waveSpeed?: number;
  showWireframe?: boolean;
  oceanOpacity?: number;
  activeTab: BuildingConfig["id"] | null;
  onSelectBuilding: (id: BuildingConfig["id"]) => void;
  timeOfDay?: number;
  onUpdateTimeOfDay?: (t: number) => void;
  isCycleActive?: boolean;
  resetTrigger?: number;
  respawnTrigger?: number;
  isLowEndMode?: boolean;
  isBlackHoleEasterEgg?: boolean;
  onToggleBlackHoleEasterEgg?: () => void;
  children?: React.ReactNode;
}

export function LiquidOcean({
  className,
  backgroundColor = DEFAULT_THEME.background,
  gridColor = DEFAULT_THEME.gridColor,
  accentColor = DEFAULT_THEME.accentColor,
  fov = 46,
  showGrid = false,
  oceanSize = 90,
  oceanFragments = 120,
  waveAmplitude = 0.12,
  waveSpeed = 0.05,
  showWireframe = false,
  oceanOpacity = 0.92,
  activeTab,
  onSelectBuilding,
  timeOfDay: externalTimeOfDay,
  onUpdateTimeOfDay,
  isCycleActive: externalIsCycleActive = true,
  resetTrigger,
  respawnTrigger,
  isLowEndMode = false,
  isBlackHoleEasterEgg = false,
  onToggleBlackHoleEasterEgg,
  children,
}: LiquidOceanProps) {
  const [internalTimeOfDay, setInternalTimeOfDay] = React.useState(Math.PI * 0.45);
  const timeOfDay = externalTimeOfDay !== undefined ? externalTimeOfDay : internalTimeOfDay;
  const setTimeOfDay = onUpdateTimeOfDay || setInternalTimeOfDay;

  const [isVisible, setIsVisible] = React.useState(false);
  const [cameraHud, setCameraHud] = React.useState<CameraHudData | null>(null);
  const [hoveredShipName, setHoveredShipName] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<ToolMode>("hammer");
  const [turn360Trigger, setTurn360Trigger] = useState(0);
  const [isGrabbing, setIsGrabbing] = useState(false);
  const [actionNotification, setActionNotification] = useState<string | null>(null);
  const [internalRespawnTrigger, setInternalRespawnTrigger] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const beaconsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0 }
    );
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative w-full h-full min-h-screen overflow-hidden bg-black",
        className
      )}
    >
      <Canvas
        shadows={!isLowEndMode}
        dpr={isLowEndMode ? 1 : Math.min(typeof window !== "undefined" ? window.devicePixelRatio : 1, 1.8)}
        frameloop={isVisible ? "always" : "never"}
        camera={{ position: [0, 15.2, 4.8], fov: fov || 48 }}
        gl={{
          antialias: !isLowEndMode,
          alpha: false,
          powerPreference: isLowEndMode ? "low-power" : "high-performance",
        }}
        style={{ position: "absolute", inset: 0 }}
      >
        <SceneContent
          backgroundColor={backgroundColor}
          gridColor={gridColor}
          accentColor={accentColor}
          showGrid={showGrid}
          oceanSize={oceanSize}
          oceanFragments={isVisible ? (isLowEndMode ? 48 : oceanFragments) : 10}
          waveAmplitude={waveAmplitude}
          waveSpeed={waveSpeed}
          showWireframe={showWireframe}
          oceanOpacity={oceanOpacity}
          activeTab={activeTab}
          onSelectBuilding={onSelectBuilding}
          timeOfDay={timeOfDay}
          onUpdateTimeOfDay={setTimeOfDay}
          isCycleActive={externalIsCycleActive}
          beaconsRef={beaconsContainerRef}
          resetTrigger={resetTrigger}
          respawnTrigger={(respawnTrigger || 0) + internalRespawnTrigger}
          isLowEndMode={isLowEndMode}
          isBlackHoleEasterEgg={isBlackHoleEasterEgg}
          onToggleBlackHoleEasterEgg={onToggleBlackHoleEasterEgg}
          onCameraHudUpdate={setCameraHud}
          onHoverShip={setHoveredShipName}
          activeTool={activeTool}
          turn360Trigger={turn360Trigger}
          onSetActionNotification={setActionNotification}
          onSetIsGrabbing={setIsGrabbing}
        />
      </Canvas>

      {/* Real-Time Interactive MMB Camera Placement & Gravitational Anomaly HUD */}
      {cameraHud && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none flex flex-col items-center gap-2 animate-in fade-in zoom-in-95 duration-150">
          {/* Gravitational Singularity Pull Alert when attempting to navigate behind the Black Hole */}
          {(cameraHud.gravityPull || 0) > 24 && (
            <div className="flex flex-col items-center gap-1 animate-pulse">
              <div className="flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-red-950/90 border border-red-500/80 shadow-[0_0_30px_rgba(239,68,68,0.7)] text-xs font-mono text-red-100">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                </span>
                <span className="font-bold text-red-300">
                  ⚠ GRAVITATIONAL SINGULARITY PULL // {cameraHud.gravityPull}% INTENSITY
                </span>
              </div>
              <div className="w-56 h-1.5 bg-red-950/80 rounded-full overflow-hidden border border-red-500/40">
                <div
                  className="h-full bg-gradient-to-r from-red-600 via-orange-500 to-amber-300 transition-all duration-75"
                  style={{ width: `${cameraHud.gravityPull}%` }}
                />
              </div>
              <span className="text-[10px] font-mono text-red-400 tracking-widest uppercase">
                {(cameraHud.gravityPull || 0) > 65
                  ? "CRITICAL FRAME-DRAGGING RESISTANCE // TRAJECTORY DEFLECTED"
                  : "EVENT HORIZON RESISTANCE DETECTED"}
              </span>
            </div>
          )}

          {/* Standard Camera Placement Badge */}
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-black/80 border border-[#1d8cf8]/40 backdrop-blur-md shadow-md text-[10px] font-mono text-[#5bc0f8]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#5bc0f8] animate-ping" />
            <span className="font-bold tracking-wider">
              [CAMERA] {cameraHud.mode === "pan" ? "PAN" : "ORBIT"}
            </span>
            <span className="text-[#8ecdf8] border-l border-[#1d8cf8]/40 pl-1.5">
              {cameraHud.elevation}°
            </span>
            <span className="text-[#8ecdf8] border-l border-[#1d8cf8]/40 pl-1.5">
              {cameraHud.distance.toFixed(1)}m
            </span>
            {(cameraHud.gravityPull || 0) > 15 && (
              <span className="text-red-400 font-bold border-l border-red-500/40 pl-1.5">
                PULL: {cameraHud.gravityPull}%
              </span>
            )}
          </div>
        </div>
      )}

      {/* Active Pirate Ship Telemetry Badge (Always visible when hovering any ship) */}
      {hoveredShipName && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-50 pointer-events-none inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg parchment-chip shadow-md text-[10px] font-mono text-[#1a1107] whitespace-nowrap animate-in fade-in zoom-in-95 duration-150">
          <span className="w-1.5 h-1.5 rounded-full bg-[#8b3c1b] animate-ping" />
          <span className="font-bold tracking-wider text-[#8b3c1b]">[SHIP]</span>
          <span className="text-[#1a1107] font-bold">{hoveredShipName}</span>
          <span className="text-[#59432d] border-l border-[#8c7b64]/40 pl-1.5 text-[9px] font-semibold">
            CLICK TO BOOST
          </span>
        </div>
      )}

      {/* Pinned 3D Floating Bottle Beacon Overlay */}
      <div
        ref={beaconsContainerRef}
        className="absolute inset-0 pointer-events-none overflow-hidden z-20"
      >
        {BUILDINGS.map((b) => (
          <div
            key={b.id}
            data-beacon={b.id}
            style={{ position: "absolute", top: 0, left: 0, display: "none", willChange: "transform" }}
            className="pointer-events-auto"
          >
            <button
              onClick={() => {
                if (activeTool === "hammer" || activeTool === "default") {
                  window.dispatchEvent(new CustomEvent("portfolio:tool-swing"));
                  window.dispatchEvent(
                    new CustomEvent("portfolio:glass-shatter", {
                      detail: { x: b.position[0], y: b.position[1], z: b.position[2], color: 0x2ec468 },
                    })
                  );
                  soundFx.glassBreak(1.4);
                  soundFx.splash(1.6);
                  setActionNotification(`💥 [SMASHED] Glass shattered! Revealed [${b.number}] ${b.label}!`);
                  setTimeout(() => setActionNotification(null), 3000);
                } else {
                  soundFx.select();
                  soundFx.splash(1.2);
                }
                onSelectBuilding(b.id);
              }}
              onMouseEnter={() => soundFx.hover()}
              className={`group flex items-center gap-1.5 px-2 py-0.5 rounded-lg border backdrop-blur-md transition-all duration-150 select-none cursor-pointer ${
                activeTab === b.id
                  ? "bg-[#d5b893] border-white text-[#25344f] shadow-md scale-105 font-bold"
                  : "bg-[#25344f]/85 border-[#617891]/40 hover:border-[#d5b893] text-[#d5b893] shadow-sm hover:scale-102"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#d5b893] group-hover:bg-[#632024] animate-pulse" />
              <span className="font-mono font-bold text-[10px] tracking-wide">
                {activeTool === "hammer" ? "🔨 " : ""}[{b.number}] {b.label}
              </span>
            </button>
          </div>
        ))}
      </div>

      {/* Video Game Radial Toolkit Wheel, Long Click Ring & Floating Tool Badges */}
      <ToolkitWheel
        activeTool={activeTool}
        onSelectTool={setActiveTool}
        isGrabbing={isGrabbing}
        actionNotification={actionNotification}
        onTriggerAction={(action) => {
          if (action === "turn360") {
            setTurn360Trigger((prev) => prev + 1);
            soundFx.select();
            setActionNotification("🔄 [360° TURN] Panoramic ocean rotation!");
            setTimeout(() => setActionNotification(null), 3500);
          } else if (action === "randomize") {
            soundFx.singularityBoom();
            soundFx.splash(1.4);
            setActionNotification("🎲 [RANDOMIZE] Shuffled all ocean bottles and fleets!");
            setTimeout(() => setActionNotification(null), 3000);
            setInternalRespawnTrigger((prev) => prev + 1);
          } else if (action === "time") {
            const nextTime = (timeOfDay + Math.PI * 0.5) % (Math.PI * 2);
            setTimeOfDay(nextTime);
            soundFx.select();
            setActionNotification("🌙 [TIME SKIP] Advanced celestial day/night sphere!");
            setTimeout(() => setActionNotification(null), 3000);
          }
        }}
      />

      {/* 3D Model Toolkit Cursor replacing native mouse pointer */}
      <Tool3DCursor
        activeTool={activeTool}
        onTriggerToolAction={(action) => {
          if (action === "turn360") {
            setTurn360Trigger((prev) => prev + 1);
            setActionNotification("🔄 [360° TURN] Panoramic ocean rotation!");
            setTimeout(() => setActionNotification(null), 3500);
          } else if (action === "randomize") {
            soundFx.singularityBoom();
            soundFx.splash(1.4);
            setActionNotification("🎲 [RANDOMIZE] Shuffled all ocean bottles and fleets!");
            setTimeout(() => setActionNotification(null), 3000);
            setInternalRespawnTrigger((prev) => prev + 1);
          } else if (action === "time") {
            const nextTime = (timeOfDay + Math.PI * 0.5) % (Math.PI * 2);
            setTimeOfDay(nextTime);
            setActionNotification("🌙 [TIME SKIP] Advanced celestial day/night sphere!");
            setTimeout(() => setActionNotification(null), 3000);
          }
        }}
      />

      {/* Overlay Content & UI HUD */}
      {children && (
        <div className="absolute inset-0 pointer-events-none">
          {children}
        </div>
      )}
    </div>
  );
}

export default LiquidOcean;
