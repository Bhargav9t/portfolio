"use client";

import React, { useRef, useState, useEffect, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { soundFx } from "@/utils/audio";
import type { ToolMode } from "@/components/ToolkitWheel";

// =============================================================================
// 1. 3D DEMOLITION HAMMER MODEL
// =============================================================================
function HammerModel({
  actionProgress,
  isHovering,
}: {
  actionProgress: number; // 0 to 1
  isHovering: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const coreLightRef = useRef<THREE.PointLight>(null);

  // Calculate swing kinematics
  // 0.00 -> 0.15: wind-up back
  // 0.15 -> 0.42: downward smash slam (+75 deg)
  // 0.42 -> 0.58: impact recoil bounce
  // 0.58 -> 1.00: ease back to rest (-32 deg)
  let swingZ = -0.55; // Resting tilt (~ -32 deg)
  let swingX = 0.18;
  let offsetX = -14;
  let offsetY = 14;

  if (actionProgress > 0) {
    if (actionProgress < 0.15) {
      // Wind-up
      const p = actionProgress / 0.15;
      swingZ = -0.55 - 0.45 * p; // Tilt back to ~ -57 deg
      offsetY = 14 + 10 * p;
    } else if (actionProgress < 0.42) {
      // Downward power smash!
      const p = (actionProgress - 0.15) / 0.27;
      const easeP = Math.pow(p, 2.2); // Acceleration
      swingZ = -1.0 + 2.25 * easeP; // Slam to +72 deg!
      offsetX = -14 + 16 * easeP;
      offsetY = 24 - 32 * easeP;
    } else if (actionProgress < 0.58) {
      // Impact recoil bounce
      const p = (actionProgress - 0.42) / 0.16;
      swingZ = 1.25 - 0.35 * Math.sin(p * Math.PI);
      offsetX = 2 - 4 * Math.sin(p * Math.PI);
      offsetY = -8 + 6 * Math.sin(p * Math.PI);
    } else {
      // Recovery ease to resting pose
      const p = (actionProgress - 0.58) / 0.42;
      const smoothP = 0.5 - 0.5 * Math.cos(p * Math.PI);
      swingZ = 1.25 + (-0.55 - 1.25) * smoothP;
      offsetX = 2 + (-14 - 2) * smoothP;
      offsetY = -8 + (14 - -8) * smoothP;
    }
  }

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (groupRef.current) {
      // Idle breathing bobbing when not swinging
      const idleBob = actionProgress === 0 ? Math.sin(t * 3.5) * 0.04 : 0;
      groupRef.current.rotation.z = swingZ + idleBob;
      groupRef.current.rotation.x = swingX;
      groupRef.current.position.set(offsetX, offsetY, 0);
    }
    if (coreLightRef.current) {
      coreLightRef.current.intensity =
        actionProgress > 0.2 && actionProgress < 0.5
          ? 3.8
          : isHovering
          ? 2.2
          : 1.2 + Math.sin(t * 5.0) * 0.4;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Dynamic Point Light inside the Hammer Power Core */}
      <pointLight ref={coreLightRef} color="#fbbf24" distance={80} decay={1.8} />

      {/* A. HANDLE */}
      {/* 1. Main Carbon Steel Handle Shaft */}
      <mesh position={[0, -22, 0]}>
        <cylinderGeometry args={[2.2, 2.6, 44, 16]} />
        <meshStandardMaterial color="#1e2530" roughness={0.35} metalness={0.85} />
      </mesh>

      {/* 2. Ribbed Leather/Rubber Grip Wrap Segments */}
      {[-30, -24, -18, -12].map((y, i) => (
        <mesh key={i} position={[0, y, 0]}>
          <cylinderGeometry args={[2.7, 2.7, 3.2, 16]} />
          <meshStandardMaterial color="#451a03" roughness={0.7} metalness={0.2} />
        </mesh>
      ))}

      {/* 3. Gold Handle Ring Separators */}
      {[-33, -9].map((y, i) => (
        <mesh key={i} position={[0, y, 0]}>
          <cylinderGeometry args={[3.0, 3.0, 1.4, 16]} />
          <meshStandardMaterial color="#eab308" roughness={0.25} metalness={0.92} />
        </mesh>
      ))}

      {/* 4. Hexagonal Pommel Base with Emissive Rune */}
      <mesh position={[0, -45, 0]}>
        <cylinderGeometry args={[3.8, 3.2, 5, 6]} />
        <meshStandardMaterial color="#eab308" roughness={0.25} metalness={0.9} />
      </mesh>
      <mesh position={[0, -48, 0]}>
        <sphereGeometry args={[1.6, 12, 12]} />
        <meshBasicMaterial color="#f59e0b" />
      </mesh>

      {/* B. HEAD MOUNT COLLAR */}
      <mesh position={[0, -2, 0]}>
        <cylinderGeometry args={[4.2, 3.2, 5, 16]} />
        <meshStandardMaterial color="#eab308" roughness={0.25} metalness={0.9} />
      </mesh>

      {/* C. HEAVY HAMMER HEAD */}
      {/* 1. Center Power Chamber Block */}
      <mesh position={[0, 4, 0]}>
        <boxGeometry args={[13, 11, 11]} />
        <meshStandardMaterial color="#334155" roughness={0.3} metalness={0.88} />
      </mesh>

      {/* 2. Glowing Amber Core Chamber (Translucent with Inner Core) */}
      <mesh position={[0, 4, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[3.8, 3.8, 12, 16]} />
        <meshPhysicalMaterial
          color="#f59e0b"
          roughness={0.1}
          metalness={0.1}
          transmission={0.65}
          ior={1.45}
          transparent
          opacity={0.85}
          emissive="#fbbf24"
          emissiveIntensity={isHovering ? 0.9 : 0.45}
        />
      </mesh>

      {/* 3. Front Heavy Striking Face Faceplate (Strikes targets at top right) */}
      <group position={[11, 4, 0]}>
        {/* Tapered strike neck */}
        <mesh>
          <boxGeometry args={[10, 10, 10]} />
          <meshStandardMaterial color="#475569" roughness={0.35} metalness={0.85} />
        </mesh>
        {/* Beveled strike anvil plate */}
        <mesh position={[6, 0, 0]}>
          <boxGeometry args={[3.5, 13, 13]} />
          <meshStandardMaterial color="#eab308" roughness={0.2} metalness={0.95} />
        </mesh>
        {/* Hardened steel cross-peen strike ridges */}
        <mesh position={[8, 0, 0]}>
          <boxGeometry args={[1.2, 11, 11]} />
          <meshStandardMaterial color="#94a3b8" roughness={0.25} metalness={0.9} />
        </mesh>
      </group>

      {/* 4. Rear Kinetic Spike / Wedge Counter-weight */}
      <group position={[-10, 4, 0]} rotation={[0, 0, Math.PI / 2]}>
        <mesh>
          <coneGeometry args={[5.5, 12, 4]} />
          <meshStandardMaterial color="#475569" roughness={0.3} metalness={0.9} />
        </mesh>
        <mesh position={[0, -5, 0]}>
          <cylinderGeometry args={[5.2, 5.8, 3, 4]} />
          <meshStandardMaterial color="#eab308" roughness={0.25} metalness={0.92} />
        </mesh>
      </group>

      {/* 5. Gold Structural Side Plates & Bolts */}
      {[-5.8, 5.8].map((z, i) => (
        <group key={i} position={[0, 4, z]}>
          <mesh>
            <boxGeometry args={[11, 8, 1]} />
            <meshStandardMaterial color="#eab308" roughness={0.25} metalness={0.9} />
          </mesh>
          <mesh position={[-3.5, 0, 0.6]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.9, 0.9, 0.6, 6]} />
            <meshStandardMaterial color="#0f172a" roughness={0.5} />
          </mesh>
          <mesh position={[3.5, 0, 0.6]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.9, 0.9, 0.6, 6]} />
            <meshStandardMaterial color="#0f172a" roughness={0.5} />
          </mesh>
        </group>
      ))}

      {/* 6. Kinetic Strike Spark Indicator at Tip */}
      {actionProgress > 0.35 && actionProgress < 0.55 && (
        <mesh position={[20, 4, 0]}>
          <sphereGeometry args={[4.5, 16, 16]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.9} />
        </mesh>
      )}
    </group>
  );
}

// =============================================================================
// 2. 3D CYBERNETIC GRAVITON HAND MODEL
// =============================================================================
function HandModel({
  actionProgress,
  isHovering,
}: {
  actionProgress: number;
  isHovering: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const repulsorLightRef = useRef<THREE.PointLight>(null);

  // Clench progress: 0 (open palm) to 1 (tight fist/claw)
  let clench = 0;
  if (actionProgress > 0) {
    if (actionProgress < 0.4) {
      clench = actionProgress / 0.4;
    } else if (actionProgress < 0.7) {
      clench = 1.0;
    } else {
      clench = 1.0 - (actionProgress - 0.7) / 0.3;
    }
  }

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (groupRef.current) {
      const idleBob = actionProgress === 0 ? Math.sin(t * 3.2) * 0.05 : 0;
      groupRef.current.rotation.z = -0.35 + idleBob;
      groupRef.current.rotation.y = 0.25;
      groupRef.current.position.set(-8, 8, 0);
    }
    if (repulsorLightRef.current) {
      repulsorLightRef.current.intensity =
        clench > 0.5 ? 3.5 : isHovering ? 2.0 : 1.2 + Math.sin(t * 4.5) * 0.4;
    }
  });

  const fingerCurl = clench * 1.35; // Angle in radians

  return (
    <group ref={groupRef}>
      <pointLight ref={repulsorLightRef} color="#4ade80" distance={70} decay={1.8} />

      {/* Wrist Gauntlet Base */}
      <mesh position={[0, -22, 0]}>
        <cylinderGeometry args={[6.5, 7.8, 18, 16]} />
        <meshStandardMaterial color="#1e293b" roughness={0.4} metalness={0.8} />
      </mesh>
      {/* Gauntlet emerald circuit accents */}
      <mesh position={[0, -18, 2.5]}>
        <boxGeometry args={[4, 10, 0.8]} />
        <meshBasicMaterial color="#4ade80" />
      </mesh>

      {/* Palm Chassis */}
      <mesh position={[0, -4, 0]}>
        <boxGeometry args={[14, 16, 6]} />
        <meshStandardMaterial color="#334155" roughness={0.35} metalness={0.85} />
      </mesh>

      {/* Graviton Repulsor Emitter Core (Palm Center) */}
      <group position={[0, -4, 3.2]}>
        {/* Outer Bezel */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[4.2, 4.2, 0.8, 20]} />
          <meshStandardMaterial color="#4ade80" roughness={0.2} metalness={0.9} />
        </mesh>
        {/* Pulsing Core */}
        <mesh position={[0, 0, 0.4]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[3.2, 3.2, 0.6, 20]} />
          <meshBasicMaterial color="#86efac" />
        </mesh>
        {/* Shockwave Energy Ring during grab */}
        {clench > 0.3 && (
          <mesh position={[0, 0, 1.2]}>
            <ringGeometry args={[4.5, 6.5, 24]} />
            <meshBasicMaterial color="#4ade80" transparent opacity={clench * 0.8} side={THREE.DoubleSide} />
          </mesh>
        )}
      </group>

      {/* 4 Articulated Fingers */}
      {[-4.8, -1.6, 1.6, 4.8].map((x, i) => {
        const len = i === 1 || i === 2 ? 14 : 12; // Middle/Index longer
        return (
          <group key={i} position={[x, 4, 0]} rotation={[fingerCurl, 0, 0]}>
            {/* Proximal phalanx */}
            <mesh position={[0, len * 0.28, 0]}>
              <boxGeometry args={[2.8, len * 0.55, 3.2]} />
              <meshStandardMaterial color="#1e293b" roughness={0.35} metalness={0.85} />
            </mesh>
            {/* Knuckle sphere */}
            <mesh position={[0, len * 0.58, 0]}>
              <sphereGeometry args={[1.6, 12, 12]} />
              <meshStandardMaterial color="#4ade80" roughness={0.25} metalness={0.9} />
            </mesh>
            {/* Distal phalanx curling more */}
            <group position={[0, len * 0.58, 0]} rotation={[fingerCurl * 0.85, 0, 0]}>
              <mesh position={[0, len * 0.24, 0]}>
                <boxGeometry args={[2.5, len * 0.48, 2.8]} />
                <meshStandardMaterial color="#475569" roughness={0.3} metalness={0.85} />
              </mesh>
              {/* Fingertip sensor dot */}
              <mesh position={[0, len * 0.48, 1.2]}>
                <sphereGeometry args={[0.8, 8, 8]} />
                <meshBasicMaterial color="#4ade80" />
              </mesh>
            </group>
          </group>
        );
      })}

      {/* Articulated Thumb */}
      <group position={[-7.5, -4, 1.5]} rotation={[0.4, -0.6, fingerCurl * 0.8]}>
        <mesh position={[-2.5, 3.5, 0]}>
          <boxGeometry args={[2.8, 7.5, 3]} />
          <meshStandardMaterial color="#1e293b" roughness={0.35} metalness={0.85} />
        </mesh>
        <mesh position={[-4.5, 7.5, 0]}>
          <boxGeometry args={[2.4, 6.0, 2.6]} />
          <meshStandardMaterial color="#475569" roughness={0.3} metalness={0.85} />
        </mesh>
      </group>
    </group>
  );
}

// =============================================================================
// 3. 3D CELESTIAL CHRONOMETER / TIME SKIP MODEL
// =============================================================================
function TimeChronoModel({
  actionProgress,
  isHovering,
}: {
  actionProgress: number;
  isHovering: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const ring1Ref = useRef<THREE.Group>(null);
  const ring2Ref = useRef<THREE.Group>(null);
  const needleRef = useRef<THREE.Group>(null);
  const coreLightRef = useRef<THREE.PointLight>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (groupRef.current) {
      const idleBob = actionProgress === 0 ? Math.sin(t * 3.0) * 0.05 : 0;
      groupRef.current.rotation.z = -0.25 + idleBob;
      groupRef.current.position.set(-10, 10, 0);
    }

    const spinMult = actionProgress > 0 ? 18.0 : 1.0;
    if (ring1Ref.current) ring1Ref.current.rotation.z = t * 1.5 * spinMult;
    if (ring2Ref.current) ring2Ref.current.rotation.z = -t * 2.2 * spinMult;
    if (needleRef.current) needleRef.current.rotation.z = -t * 4.5 * spinMult;

    if (coreLightRef.current) {
      coreLightRef.current.intensity =
        actionProgress > 0 ? 3.5 : isHovering ? 2.2 : 1.2 + Math.sin(t * 5.0) * 0.4;
    }
  });

  return (
    <group ref={groupRef}>
      <pointLight ref={coreLightRef} color="#f97316" distance={75} decay={1.8} />

      {/* Outer Bronze/Gold Astrolabe Housing */}
      <mesh>
        <torusGeometry args={[18, 2.2, 16, 32]} />
        <meshStandardMaterial color="#f97316" roughness={0.25} metalness={0.9} />
      </mesh>

      {/* 12 Hour Dial Ticks */}
      {[...Array(12)].map((_, i) => {
        const rad = (i * Math.PI) / 6;
        return (
          <mesh
            key={i}
            position={[Math.cos(rad) * 16, Math.sin(rad) * 16, 0.4]}
            rotation={[0, 0, rad]}
          >
            <boxGeometry args={[2.5, 0.8, 0.6]} />
            <meshStandardMaterial color="#fbbf24" roughness={0.2} metalness={0.9} />
          </mesh>
        );
      })}

      {/* Intermediate Counter-Rotating Gear Ring */}
      <group ref={ring1Ref}>
        <mesh>
          <ringGeometry args={[11, 14, 24]} />
          <meshStandardMaterial color="#d97706" roughness={0.3} metalness={0.85} side={THREE.DoubleSide} />
        </mesh>
        {[...Array(8)].map((_, i) => {
          const rad = (i * Math.PI) / 4;
          return (
            <mesh key={i} position={[Math.cos(rad) * 12.5, Math.sin(rad) * 12.5, 0.2]}>
              <boxGeometry args={[1.6, 1.6, 0.8]} />
              <meshStandardMaterial color="#fbbf24" roughness={0.2} metalness={0.9} />
            </mesh>
          );
        })}
      </group>

      {/* Inner Fast-Spinning Celestial Ring */}
      <group ref={ring2Ref}>
        <mesh>
          <torusGeometry args={[8.5, 1.2, 12, 24]} />
          <meshStandardMaterial color="#ea580c" roughness={0.2} metalness={0.95} />
        </mesh>
      </group>

      {/* Center Solar/Lunar Chrono Core */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[4.8, 20, 20]} />
        <meshPhysicalMaterial
          color="#f97316"
          roughness={0.1}
          metalness={0.15}
          transmission={0.65}
          transparent
          opacity={0.88}
          emissive="#fbbf24"
          emissiveIntensity={isHovering ? 0.8 : 0.4}
        />
      </mesh>

      {/* Rotating Chrono Needle */}
      <group ref={needleRef} position={[0, 0, 2.5]}>
        <mesh position={[0, 6, 0]}>
          <coneGeometry args={[1.2, 12, 8]} />
          <meshStandardMaterial color="#ffffff" roughness={0.1} metalness={0.95} />
        </mesh>
        <mesh position={[0, -2, 0]}>
          <cylinderGeometry args={[0.8, 0.8, 5, 8]} />
          <meshStandardMaterial color="#fbbf24" roughness={0.2} metalness={0.9} />
        </mesh>
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[1.6, 12, 12]} />
          <meshStandardMaterial color="#f97316" roughness={0.2} metalness={0.9} />
        </mesh>
      </group>
    </group>
  );
}

// =============================================================================
// 4. 3D PANORAMIC GYROSCOPE / 360° TURN MODEL
// =============================================================================
function Gyro360Model({
  actionProgress,
  isHovering,
}: {
  actionProgress: number;
  isHovering: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const outerRingRef = useRef<THREE.Group>(null);
  const innerRingRef = useRef<THREE.Group>(null);
  const lensRef = useRef<THREE.Group>(null);
  const lensLightRef = useRef<THREE.PointLight>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (groupRef.current) {
      const idleBob = actionProgress === 0 ? Math.sin(t * 3.0) * 0.05 : 0;
      groupRef.current.rotation.z = -0.25 + idleBob;
      groupRef.current.position.set(-10, 10, 0);
    }

    const spinMult = actionProgress > 0 ? 16.0 : 1.0;
    if (outerRingRef.current) outerRingRef.current.rotation.y = t * 1.8 * spinMult;
    if (innerRingRef.current) innerRingRef.current.rotation.x = t * 2.6 * spinMult;
    if (lensRef.current) lensRef.current.rotation.z = t * 3.2 * spinMult;

    if (lensLightRef.current) {
      lensLightRef.current.intensity =
        actionProgress > 0 ? 3.8 : isHovering ? 2.4 : 1.2 + Math.sin(t * 4.0) * 0.4;
    }
  });

  return (
    <group ref={groupRef}>
      <pointLight ref={lensLightRef} color="#38bdf8" distance={75} decay={1.8} />

      {/* Outer Azure Gimbal Ring (Yaw Axis) */}
      <group ref={outerRingRef}>
        <mesh>
          <torusGeometry args={[18, 1.8, 16, 32]} />
          <meshStandardMaterial color="#38bdf8" roughness={0.2} metalness={0.9} />
        </mesh>
        {/* Gimbal bearing nodes */}
        {[0, Math.PI].map((rad, i) => (
          <mesh key={i} position={[Math.cos(rad) * 18, Math.sin(rad) * 18, 0]}>
            <cylinderGeometry args={[2.5, 2.5, 2.5, 12]} />
            <meshStandardMaterial color="#e0f2fe" roughness={0.2} metalness={0.95} />
          </mesh>
        ))}
      </group>

      {/* Inner Pitch Gimbal Ring */}
      <group ref={innerRingRef}>
        <mesh>
          <torusGeometry args={[13, 1.6, 16, 28]} />
          <meshStandardMaterial color="#0284c7" roughness={0.25} metalness={0.9} />
        </mesh>
      </group>

      {/* Central Panoramic Camera Module */}
      <group ref={lensRef}>
        {/* Lens Barrel Housing */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[6.5, 6.5, 8, 24]} />
          <meshStandardMaterial color="#0f172a" roughness={0.4} metalness={0.8} />
        </mesh>
        {/* Chrome Accent Rings */}
        {[-3.5, 3.5].map((z, i) => (
          <mesh key={i} position={[0, 0, z]}>
            <torusGeometry args={[6.6, 0.6, 12, 24]} />
            <meshStandardMaterial color="#38bdf8" roughness={0.15} metalness={0.95} />
          </mesh>
        ))}
        {/* Front Sapphire Camera Lens Glass */}
        <mesh position={[0, 0, 4.2]}>
          <sphereGeometry args={[4.8, 20, 20, 0, Math.PI * 2, 0, Math.PI * 0.45]} />
          <meshPhysicalMaterial
            color="#38bdf8"
            roughness={0.08}
            metalness={0.1}
            transmission={0.8}
            ior={1.52}
            transparent
            opacity={0.9}
            emissive="#38bdf8"
            emissiveIntensity={isHovering ? 0.8 : 0.4}
          />
        </mesh>
        {/* Camera Aperture Diaphragm Ring */}
        <mesh position={[0, 0, 4.0]}>
          <ringGeometry args={[2.5, 4.8, 18]} />
          <meshBasicMaterial color="#0284c7" side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  );
}

// =============================================================================
// 5. 3D QUANTUM POLYHEDRAL SCATTER DIE / RANDOMIZE MODEL
// =============================================================================
function QuantumDiceModel({
  actionProgress,
  isHovering,
}: {
  actionProgress: number;
  isHovering: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const dieRef = useRef<THREE.Group>(null);
  const satellitesRef = useRef<THREE.Group>(null);
  const quantumLightRef = useRef<THREE.PointLight>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (groupRef.current) {
      const idleBob = actionProgress === 0 ? Math.sin(t * 3.0) * 0.05 : 0;
      groupRef.current.position.set(-10, 10, 0);
      groupRef.current.rotation.z = -0.25 + idleBob;
    }

    const spinMult = actionProgress > 0 ? 18.0 : 1.0;
    if (dieRef.current) {
      dieRef.current.rotation.x = t * 1.8 * spinMult;
      dieRef.current.rotation.y = t * 2.4 * spinMult;
      dieRef.current.rotation.z = t * 1.2 * spinMult;
    }

    if (satellitesRef.current) {
      satellitesRef.current.rotation.y = -t * 3.0 * spinMult;
      satellitesRef.current.rotation.z = t * 2.0 * spinMult;
    }

    if (quantumLightRef.current) {
      quantumLightRef.current.intensity =
        actionProgress > 0 ? 3.8 : isHovering ? 2.4 : 1.2 + Math.sin(t * 4.5) * 0.4;
    }
  });

  return (
    <group ref={groupRef}>
      <pointLight ref={quantumLightRef} color="#c084fc" distance={75} decay={1.8} />

      {/* Main Quantum D20 Icosahedron Die */}
      <group ref={dieRef}>
        <mesh>
          <icosahedronGeometry args={[13, 0]} />
          <meshPhysicalMaterial
            color="#a855f7"
            roughness={0.12}
            metalness={0.15}
            transmission={0.7}
            ior={1.5}
            transparent
            opacity={0.88}
            emissive="#c084fc"
            emissiveIntensity={isHovering ? 0.7 : 0.35}
          />
        </mesh>
        {/* Wireframe Glowing Edges */}
        <mesh>
          <icosahedronGeometry args={[13.2, 0]} />
          <meshBasicMaterial color="#f0abfc" wireframe transparent opacity={0.75} />
        </mesh>
        {/* Inner Singularity Spark */}
        <mesh>
          <sphereGeometry args={[4, 12, 12]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      </group>

      {/* Orbiting Satellite Micro-Crystals */}
      <group ref={satellitesRef}>
        {[0, (2 * Math.PI) / 3, (4 * Math.PI) / 3].map((rad, i) => (
          <mesh
            key={i}
            position={[Math.cos(rad) * 20, Math.sin(rad) * 20, Math.sin(rad * 2) * 8]}
          >
            <octahedronGeometry args={[3.2, 0]} />
            <meshStandardMaterial color="#c084fc" roughness={0.2} metalness={0.9} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

// =============================================================================
// MAIN 3D TOOL CURSOR SCENE RENDERER
// =============================================================================
interface CursorSceneProps {
  activeTool: ToolMode;
  mousePos: { x: number; y: number };
  velocity: { vx: number; vy: number };
  actionProgress: number;
  isHovering: boolean;
}

function CursorScene({
  activeTool,
  mousePos,
  velocity,
  actionProgress,
  isHovering,
}: CursorSceneProps) {
  const { size, camera } = useThree();
  const rootRef = useRef<THREE.Group>(null);

  // Update Orthographic Camera projection to match screen pixels exactly
  useEffect(() => {
    const ortho = camera as THREE.OrthographicCamera;
    ortho.left = 0;
    ortho.right = size.width;
    ortho.top = 0;
    ortho.bottom = -size.height;
    ortho.near = -1000;
    ortho.far = 1000;
    ortho.updateProjectionMatrix();
  }, [size, camera]);

  useFrame(() => {
    if (rootRef.current) {
      // Map screen coords directly to 3D Orthographic world space
      rootRef.current.position.set(mousePos.x, -mousePos.y, 0);

      // Dynamic tilt based on mouse velocity (inertia & weight)
      const targetTiltY = Math.max(-0.35, Math.min(0.35, velocity.vx * 0.015));
      const targetTiltX = Math.max(-0.35, Math.min(0.35, -velocity.vy * 0.015));

      rootRef.current.rotation.y = THREE.MathUtils.lerp(
        rootRef.current.rotation.y,
        targetTiltY,
        0.18
      );
      rootRef.current.rotation.x = THREE.MathUtils.lerp(
        rootRef.current.rotation.x,
        targetTiltX,
        0.18
      );
    }
  });

  return (
    <>
      <ambientLight intensity={0.9} />
      <directionalLight position={[-40, 50, 60]} intensity={1.8} />
      <directionalLight position={[40, -30, 40]} intensity={0.7} />

      <group ref={rootRef}>
        {/* Render the appropriate 3D Model based on activeTool */}
        {(activeTool === "hammer" || activeTool === "default") && (
          <HammerModel actionProgress={actionProgress} isHovering={isHovering} />
        )}
        {activeTool === "hand" && (
          <HandModel actionProgress={actionProgress} isHovering={isHovering} />
        )}
        {activeTool === "time" && (
          <TimeChronoModel actionProgress={actionProgress} isHovering={isHovering} />
        )}
        {activeTool === "turn360" && (
          <Gyro360Model actionProgress={actionProgress} isHovering={isHovering} />
        )}
        {activeTool === "randomize" && (
          <QuantumDiceModel actionProgress={actionProgress} isHovering={isHovering} />
        )}
      </group>
    </>
  );
}

// =============================================================================
// ROOT EXPORT: 3D TOOL CURSOR OVERLAY
// =============================================================================
export interface Tool3DCursorProps {
  activeTool: ToolMode;
  onTriggerToolAction?: (action: ToolMode) => void;
}

export function Tool3DCursor({
  activeTool,
  onTriggerToolAction,
}: Tool3DCursorProps) {
  const [mousePos, setMousePos] = useState(() => ({
    x: typeof window !== "undefined" ? window.innerWidth / 2 : 400,
    y: typeof window !== "undefined" ? window.innerHeight / 2 : 300,
  }));
  const [velocity, setVelocity] = useState({ vx: 0, vy: 0 });
  const [isVisible, setIsVisible] = useState(true);
  const [isHovering, setIsHovering] = useState(false);
  const [actionProgress, setActionProgress] = useState(0);

  const prevMouseRef = useRef({ x: 0, y: 0, time: performance.now() });
  const animFrameRef = useRef<number | null>(null);

  // Trigger animation for the tool
  const triggerToolAnimation = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

    const startTime = performance.now();
    const duration = activeTool === "hammer" ? 420 : 500; // ms

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1.0, elapsed / duration);
      setActionProgress(progress);

      if (progress < 1.0) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        setActionProgress(0);
        animFrameRef.current = null;
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);
  };

  // Track pointer movements & velocity across the whole window
  useEffect(() => {
    let lastEventTime = performance.now();

    const handlePointerMove = (e: PointerEvent) => {
      setIsVisible(true);
      const now = performance.now();
      const dt = Math.max(1, now - lastEventTime);
      lastEventTime = now;

      const vx = ((e.clientX - prevMouseRef.current.x) / dt) * 16;
      const vy = ((e.clientY - prevMouseRef.current.y) / dt) * 16;

      prevMouseRef.current = { x: e.clientX, y: e.clientY, time: now };
      setMousePos({ x: e.clientX, y: e.clientY });
      setVelocity({ vx, vy });

      // Detect hover over interactive elements
      const target = e.target as HTMLElement | null;
      const isInteractive =
        target?.tagName === "BUTTON" ||
        target?.tagName === "A" ||
        target?.getAttribute("role") === "button" ||
        target?.classList.contains("cursor-pointer") ||
        window.getComputedStyle(target || document.body).cursor === "pointer";

      setIsHovering(Boolean(isInteractive));
    };

    const handlePointerDown = (e: PointerEvent) => {
      // Don't trigger tool swing if interacting with UI controls, inputs, or sliders
      const target = e.target as HTMLElement | null;
      if (
        target?.closest(
          "input, select, textarea, button, a, [role='button'], .parchment-card, .gta-wheel-modal"
        )
      ) {
        return;
      }

      triggerToolAnimation();

      // Play tool sound if swung in open sea / air
      if (activeTool === "hammer") {
        soundFx.hammerSwing();
      } else if (activeTool === "hand") {
        soundFx.handGrab();
      } else if (activeTool === "time") {
        soundFx.chronoSpin();
      } else if (activeTool === "turn360") {
        soundFx.gyroSpin();
      } else if (activeTool === "randomize") {
        soundFx.quantumRoll();
      }
    };

    const handleMouseLeave = () => setIsVisible(false);
    const handleMouseEnter = () => setIsVisible(true);

    // Custom event to trigger swing animation programmatically (e.g. from bottle click)
    const handleCustomSwingEvent = () => {
      triggerToolAnimation();
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerdown", handlePointerDown, { passive: true });
    document.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("mouseenter", handleMouseEnter);
    window.addEventListener("portfolio:tool-swing", handleCustomSwingEvent);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("mouseenter", handleMouseEnter);
      window.removeEventListener("portfolio:tool-swing", handleCustomSwingEvent);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [activeTool]);

  const isTouchDevice = useMemo(() => {
    if (typeof window === "undefined") return false;
    return (
      window.matchMedia("(pointer: coarse)").matches ||
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0
    );
  }, []);

  // Apply `has-3d-cursor` to body to hide native arrow cursor only on desktop mouse devices
  useEffect(() => {
    if (isTouchDevice) return;
    document.body.classList.add("has-3d-cursor");
    return () => {
      document.body.classList.remove("has-3d-cursor");
    };
  }, [isTouchDevice]);

  if (isTouchDevice || !isVisible) return null;

  return (
    <div
      className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden select-none tool-3d-cursor-overlay"
      style={{ willChange: "transform", pointerEvents: "none" }}
    >
      <Canvas
        events={(() => ({ enabled: false, priority: 0, handlePointer: () => () => {}, connected: false })) as unknown as undefined}
        orthographic
        gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
        camera={{ position: [0, 0, 500] }}
        style={{ width: "100vw", height: "100vh", pointerEvents: "none" }}
      >
        <CursorScene
          activeTool={activeTool}
          mousePos={mousePos}
          velocity={velocity}
          actionProgress={actionProgress}
          isHovering={isHovering}
        />
      </Canvas>
    </div>
  );
}

export default Tool3DCursor;
