"use client";

import React, { useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { BlackHole } from "./BlackHole";

export interface DistantBlackHoleProps {
  moonPosition?: [number, number, number];
  timeOfDay: number;
  isBlackHoleEasterEgg: boolean;
  onActivateEasterEgg?: () => void;
  position?: [number, number, number];
}

// User request: "Include the blackhole too and make sure that it has a fixed position which continuosly flickers"
export const FIXED_NIGHT_BLACK_HOLE_POS: [number, number, number] = [13.8, 7.2, -21.0];

export function DistantBlackHole({
  timeOfDay,
  isBlackHoleEasterEgg,
  onActivateEasterEgg,
  position = FIXED_NIGHT_BLACK_HOLE_POS,
}: DistantBlackHoleProps) {
  const { camera } = useThree();
  const groupRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  // Determine night time factor
  const sinT = Math.sin(timeOfDay);
  const isNight = sinT < -0.05;

  const [fixX, fixY, fixZ] = position;

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();

    if (groupRef.current) {
      groupRef.current.position.set(fixX, fixY, fixZ);
      groupRef.current.quaternion.copy(camera.quaternion);
    }

    // Pulsing gravitational anomaly glow with rapid plasma flicker
    if (glowRef.current) {
      const flicker = 1.0 + Math.sin(time * 19.5) * 0.14 + Math.cos(time * 33.1) * 0.09;
      const pulse = (1.0 + Math.sin(time * 3.5) * 0.08 + (hovered ? 0.35 : 0)) * flicker;
      glowRef.current.scale.set(pulse, pulse, 1);
    }
  });

  // Easter egg requirement:
  // "when the easter egg is activated, The blackhole from there dissappears"
  if (isBlackHoleEasterEgg || !isNight) {
    return null;
  }

  const handleTrigger = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    if (onActivateEasterEgg) {
      onActivateEasterEgg();
    }
  };

  return (
    <group ref={groupRef} position={[fixX, fixY, fixZ]}>
      {/* 1. Pulsing Gravitational Lensing Violet/Cyan Halo */}
      <mesh ref={glowRef} position={[0, 0, -0.2]} raycast={() => null}>
        <ringGeometry args={[0.3, 0.95, 32]} />
        <meshBasicMaterial
          color={hovered ? 0xef4444 : 0x8b5cf6}
          transparent
          opacity={hovered ? 0.75 : 0.45}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 2. 3D Black Hole (Accretion Disk, Photon Ring, Event Horizon) with Continuous Flicker */}
      <BlackHole scale={0.42} pixelGrid={8.0} flicker={true} flickerIntensity={1.4} />

      {/* 3. Interactive Raycast Hit Target for clicking the distant black hole easter egg */}
      <mesh
        position={[0, 0, 0.4]}
        onPointerDown={handleTrigger}
        onClick={handleTrigger}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setHovered(false);
          document.body.style.cursor = "default";
        }}
      >
        <sphereGeometry args={[2.8, 16, 16]} />
        <meshBasicMaterial transparent opacity={0.001} depthWrite={false} />
      </mesh>
    </group>
  );
}

export default DistantBlackHole;
