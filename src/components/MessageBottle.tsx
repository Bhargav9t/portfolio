"use client";

import React, { useRef, useState, useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { BuildingConfig } from "@/data/portfolioData";
import { COLOR_PALETTE } from "@/data/portfolioData";
import { soundFx } from "@/utils/audio";
import { WaterSplashEffect } from "./WaterSplashEffect";

export interface MessageBottleProps {
  config: BuildingConfig;
  accentColor: number;
  isActive: boolean;
  onSelect: (id: BuildingConfig["id"]) => void;
  registerRef?: (ref: THREE.Group | null) => void;
  registerMaterial?: (mat: THREE.MeshPhysicalMaterial | null) => void;
  waveSpeed?: number;
  impactFlash?: number;
  splashTrigger?: number;
  defianceLevel?: number; // 0 to 1, intensity of active resistance against singularity suction
  escapeBoost?: number;   // surge intensity during slingshot escape maneuver
  blackHolePos?: [number, number, number];
}

export function MessageBottle({
  config,
  accentColor,
  isActive,
  onSelect,
  registerRef,
  registerMaterial,
  waveSpeed = 0.05,
  impactFlash = 0,
  splashTrigger = 0,
  defianceLevel = 0,
  escapeBoost = 0,
}: MessageBottleProps) {
  const rootGroupRef = useRef<THREE.Group>(null);
  const bottleGroupRef = useRef<THREE.Group>(null);
  const glassMaterialRef = useRef<THREE.MeshPhysicalMaterial>(null);
  const scrollRef = useRef<THREE.Group>(null);
  const stasisRingRef = useRef<THREE.Group>(null);

  const [hovered, setHovered] = useState(false);
  const [clickSplash, setClickSplash] = useState(0);

  useEffect(() => {
    if (registerRef && rootGroupRef.current) {
      registerRef(rootGroupRef.current);
    }
    return () => {
      if (registerRef) registerRef(null);
    };
  }, [registerRef]);

  useEffect(() => {
    if (registerMaterial && glassMaterialRef.current) {
      registerMaterial(glassMaterialRef.current);
    }
    return () => {
      if (registerMaterial) registerMaterial(null);
    };
  }, [registerMaterial]);

  // Gentle floating bottle rocking & scroll buoyancy bobbing + Stasis Shield dynamics
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (bottleGroupRef.current) {
      // Bottles in the sea float naturally tilted with subtle rotational sway
      const baseTiltZ = 0.22; // ~13 deg resting tilt
      const rockZ = Math.sin(t * 1.6 + config.pos * 10) * 0.06;
      const rockX = Math.cos(t * 1.3 + config.pos * 8) * 0.05;
      
      // Defiance recoil: bottle leans defensively away from the black hole suction
      const defianceLean = defianceLevel * 0.14;
      bottleGroupRef.current.rotation.z = baseTiltZ + rockZ + defianceLean;
      bottleGroupRef.current.rotation.x = rockX - defianceLean * 0.8;
    }

    if (scrollRef.current) {
      // Paper scroll floats gently inside the glass, vibrating with cosmic energy when resisting, bouncing on hammer smash
      const vibration = defianceLevel > 0.1 ? Math.sin(t * 42.0) * 0.008 * defianceLevel : 0;
      const smashBounce = impactFlash > 0.1 ? Math.sin(Math.min(1, impactFlash) * Math.PI) * 0.22 : 0;
      scrollRef.current.position.y = -0.05 + Math.sin(t * 2.1 + config.pos * 5) * 0.025 + vibration + smashBounce;
      scrollRef.current.rotation.y = Math.sin(t * 0.8 + config.pos * 3) * 0.15;
    }

    // Spin Anti-Gravity Stasis Shield Nodes
    if (stasisRingRef.current) {
      const rotSpeed = 1.4 + defianceLevel * 6.5;
      stasisRingRef.current.rotation.y = t * rotSpeed;
    }
  });

  // Colors based on User's Palette & Reference Image 3 (Pixel Beer Bottle)
  const bottleColors = useMemo(() => {
    return {
      // Translucent sea-green glass (Reference Image 3)
      glass: new THREE.Color(0x1e8a4a),
      glassHighlight: new THREE.Color(0xffffff),
      // Rolled parchment paper message (Tan from Image 1)
      parchment: new THREE.Color(COLOR_PALETTE.tan),
      // Ribbon seal around the message (Caput Mortuum from Image 1)
      ribbon: new THREE.Color(COLOR_PALETTE.caputMortuum),
      // Cork stopper (Coffee from Image 1)
      cork: new THREE.Color(COLOR_PALETTE.coffee),
      // Label backing & text
      labelBg: new THREE.Color(0xf0eee5),
      labelBorder: new THREE.Color(0x113a1e),
      starRed: new THREE.Color(COLOR_PALETTE.caputMortuum),
    };
  }, []);

  return (
    <group ref={rootGroupRef} position={config.position} rotation={[0, config.rotationY, 0]}>
      {/* Tilted Floating Bottle Body & Message */}
      <group
        ref={bottleGroupRef}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          soundFx.hover();
          if (!document.body.classList.contains("has-3d-cursor")) {
            document.body.style.cursor = "pointer";
          }
        }}
        onPointerOut={() => {
          setHovered(false);
          if (!document.body.classList.contains("has-3d-cursor")) {
            document.body.style.cursor = "auto";
          }
        }}
      >
        {/* 1. GLASS BOTTLE CYLINDRICAL MAIN BODY */}
        <mesh position={[0, 0, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.38, 0.38, 1.25, 18]} />
          <meshPhysicalMaterial
            ref={glassMaterialRef}
            color={hovered || isActive ? 0x2ec468 : bottleColors.glass}
            roughness={0.12}
            metalness={0.08}
            transmission={0.65}
            ior={1.45}
            transparent
            opacity={0.82}
            emissive={hovered || isActive ? new THREE.Color(accentColor) : new THREE.Color(0x0a3315)}
            emissiveIntensity={(hovered || isActive ? 0.45 : 0.12) + defianceLevel * 0.4}
          />
        </mesh>

        {/* 1b. Glass Bottom Base Cap */}
        <mesh position={[0, -0.63, 0]}>
          <cylinderGeometry args={[0.36, 0.38, 0.08, 18]} />
          <meshStandardMaterial
            color={0x0f4220}
            roughness={0.2}
            transparent
            opacity={0.9}
          />
        </mesh>

        {/* 2. TAPERED GLASS SHOULDER */}
        <mesh position={[0, 0.8, 0]}>
          <cylinderGeometry args={[0.18, 0.38, 0.42, 18]} />
          <meshPhysicalMaterial
            color={hovered || isActive ? 0x2ec468 : bottleColors.glass}
            roughness={0.12}
            metalness={0.08}
            transmission={0.65}
            ior={1.45}
            transparent
            opacity={0.82}
          />
        </mesh>

        {/* 3. SLIM GLASS NECK */}
        <mesh position={[0, 1.22, 0]}>
          <cylinderGeometry args={[0.18, 0.18, 0.48, 18]} />
          <meshPhysicalMaterial
            color={hovered || isActive ? 0x2ec468 : bottleColors.glass}
            roughness={0.12}
            metalness={0.08}
            transmission={0.65}
            ior={1.45}
            transparent
            opacity={0.85}
          />
        </mesh>

        {/* 4. GLASS LIP COLLAR / RIM */}
        <mesh position={[0, 1.48, 0]}>
          <torusGeometry args={[0.18, 0.045, 8, 18]} />
          <meshStandardMaterial color={0x155428} roughness={0.15} />
        </mesh>

        {/* 5. CORK STOPPER (Plugging the bottle top, Coffee #6F4D38) */}
        <mesh position={[0, 1.58, 0]}>
          <cylinderGeometry args={[0.17, 0.15, 0.22, 14]} />
          <meshStandardMaterial color={bottleColors.cork} roughness={0.75} />
        </mesh>

        {/* 6. 2D SPECULAR HIGHLIGHT STRIP (Hallmark of Reference Image 3 Pixel Bottle!) */}
        {/* Body highlight */}
        <mesh position={[-0.28, 0, 0.24]} rotation={[0, -0.65, 0]}>
          <planeGeometry args={[0.065, 1.15]} />
          <meshBasicMaterial
            color={bottleColors.glassHighlight}
            transparent
            opacity={hovered || isActive ? 0.95 : 0.75}
            side={THREE.DoubleSide}
          />
        </mesh>
        {/* Shoulder highlight */}
        <mesh position={[-0.2, 0.8, 0.18]} rotation={[0.2, -0.65, -0.4]}>
          <planeGeometry args={[0.055, 0.36]} />
          <meshBasicMaterial
            color={bottleColors.glassHighlight}
            transparent
            opacity={hovered || isActive ? 0.95 : 0.7}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* 6c. Dynamic Glass Fracture Web on Hammer Impact */}
        {impactFlash > 0.15 && (
          <group position={[0, 0, 0]}>
            <mesh>
              <cylinderGeometry args={[0.39, 0.39, 1.26, 12, 3]} />
              <meshBasicMaterial
                color="#ffffff"
                wireframe
                transparent
                opacity={Math.min(1.0, impactFlash * 1.1)}
              />
            </mesh>
            <mesh position={[0, 0.2, 0.38]}>
              <ringGeometry args={[0.06, 0.28, 8]} />
              <meshBasicMaterial
                color="#86efac"
                transparent
                opacity={Math.min(1.0, impactFlash * 1.3)}
                side={THREE.DoubleSide}
              />
            </mesh>
          </group>
        )}

        {/* 7. MESSAGE IN A BOTTLE (Rolled Parchment Paper Scroll inside the glass) */}
        <group ref={scrollRef} position={[0.04, -0.05, -0.02]} rotation={[0.1, 0.2, -0.15]}>
          {/* Rolled Paper Cylinder - Glowing with cosmic resistance energy */}
          <mesh>
            <cylinderGeometry args={[0.13, 0.13, 0.88, 14]} />
            <meshStandardMaterial
              color={bottleColors.parchment}
              roughness={0.5}
              emissive={new THREE.Color(0xffad3d)}
              emissiveIntensity={hovered || isActive ? 0.35 : Math.max(0.04, defianceLevel * 0.95)}
            />
          </mesh>

          {/* Inner Rolled Spiral Top & Bottom */}
          <mesh position={[0, 0.445, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.13, 12]} />
            <meshBasicMaterial color={0xc09f7a} />
          </mesh>
          <mesh position={[0, -0.445, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.13, 12]} />
            <meshBasicMaterial color={0xc09f7a} />
          </mesh>

          {/* Ribbon Tie around the Scroll (Caput Mortuum #632024) */}
          <mesh position={[0, 0, 0]}>
            <cylinderGeometry args={[0.135, 0.135, 0.14, 14]} />
            <meshStandardMaterial color={bottleColors.ribbon} roughness={0.3} />
          </mesh>

          {/* Red Wax Seal Knot on Ribbon - Flares bright ruby under suction stress */}
          <mesh position={[0, 0, 0.138]}>
            <circleGeometry args={[0.055, 10]} />
            <meshBasicMaterial color={defianceLevel > 0.25 ? 0xff3855 : bottleColors.ribbon} />
          </mesh>
        </group>

        {/* 8. FRONT BOTTLE LABEL (Reference Image 3 Emblem Style) */}
        <group position={[0, 0.05, 0.37]} rotation={[0, 0, 0]}>
          {/* Outer Border */}
          <mesh>
            <planeGeometry args={[0.44, 0.52]} />
            <meshBasicMaterial color={bottleColors.labelBorder} />
          </mesh>
          {/* White / Cream Label Plate */}
          <mesh position={[0, 0, 0.005]}>
            <planeGeometry args={[0.4, 0.48]} />
            <meshBasicMaterial color={bottleColors.labelBg} />
          </mesh>
          {/* Red Star Emblem (Caput Mortuum) */}
          <mesh position={[0, 0.11, 0.01]}>
            <octahedronGeometry args={[0.055, 0]} />
            <meshBasicMaterial color={bottleColors.starRed} />
          </mesh>
          {/* Section Number Badge Plate */}
          <mesh position={[0, -0.04, 0.01]}>
            <planeGeometry args={[0.32, 0.14]} />
            <meshBasicMaterial color={COLOR_PALETTE.spaceCadet} />
          </mesh>
        </group>
      </group>

      {/* 9. ANTI-GRAVITY STASIS SHIELD & DEFIANCE RIPPLE (Active resistance against suction) */}
      <group position={[0, -0.48, 0]}>
        {/* Outer glowing anti-singularity repelling ring */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.42, 0.85, 24]} />
          <meshBasicMaterial
            color={0x5bc0f8}
            transparent
            opacity={Math.min(0.85, Math.max(0.12, defianceLevel * 0.95))}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>

        {/* Secondary stepped inner photon ring */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
          <ringGeometry args={[0.48, 0.62, 24]} />
          <meshBasicMaterial
            color={0xffffff}
            transparent
            opacity={Math.min(0.9, defianceLevel * 1.1)}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>

        {/* Orbiting Stasis Crystal Nodes (Visible when defying the black hole) */}
        <group ref={stasisRingRef}>
          {[0, 1, 2, 3].map((i) => {
            const angle = (i * Math.PI) / 2;
            const r = 0.68;
            return (
              <mesh
                key={i}
                position={[Math.cos(angle) * r, 0.03, Math.sin(angle) * r]}
                scale={0.045 + defianceLevel * 0.035}
              >
                <octahedronGeometry args={[1, 0]} />
                <meshBasicMaterial
                  color={0xe0f8ff}
                  transparent
                  opacity={Math.min(0.95, Math.max(0.18, defianceLevel * 1.2))}
                  blending={THREE.AdditiveBlending}
                />
              </mesh>
            );
          })}
        </group>
      </group>

      {/* 10. WATER SPLASH & WAKE SYSTEM (Adapted for Bottle Waterline & Defiance Thrust) */}
      <WaterSplashEffect
        scale={[0.55, 1.8, 0.55]}
        accentColor={accentColor}
        isHovered={hovered}
        isActive={isActive}
        waterlineY={-0.48}
        waveSpeed={waveSpeed}
        impactFlash={Math.max(impactFlash, escapeBoost)}
        splashBurstTrigger={(splashTrigger || 0) + clickSplash}
        defianceLevel={defianceLevel}
      />
    </group>
  );
}

export default MessageBottle;
