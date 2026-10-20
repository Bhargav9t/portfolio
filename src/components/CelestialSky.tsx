"use client";

import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { COLOR_PALETTE } from "@/data/portfolioData";

export interface CelestialSkyProps {
  timeOfDay: number; // 0 to 2*PI (0 = dawn, PI/2 = noon, PI = sunset, 3*PI/2 = midnight)
  accentColor?: number;
}

export function CelestialSky({ timeOfDay }: CelestialSkyProps) {
  const sunGroupRef = useRef<THREE.Group>(null);
  const moonGroupRef = useRef<THREE.Group>(null);
  const sunLightRef = useRef<THREE.DirectionalLight>(null);
  const moonLightRef = useRef<THREE.DirectionalLight>(null);
  const sunRaysRef = useRef<THREE.Mesh>(null);
  const starsMatRef = useRef<THREE.PointsMaterial>(null);

  const orbitRadius = 26.0;

  // Starfield points distribution across celestial dome
  const { starPositions, starSizes } = useMemo(() => {
    const count = 480;
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // Hemisphere distribution above ocean horizon
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 0.78 + 0.12); // Above sea horizon in the sky
      const r = 42.0 + (Math.random() - 0.5) * 6.0;

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.cos(phi);
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

      sizes[i] = 0.12 + Math.random() * 0.18;
    }

    return { starPositions: positions, starSizes: sizes };
  }, []);

  // Update positions and lighting each frame
  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();

    // 1. Orbital position calculations: Sun and Moon 180 deg opposite
    // Arcs smoothly across the horizon and upper sky (X: -14.5 to +14.5, Y: -9.5 to +9.5, Z: -20)
    const sunX = Math.cos(timeOfDay) * 14.5;
    const sunY = Math.sin(timeOfDay) * 9.5;
    const sunZ = -20.0 + Math.cos(timeOfDay) * 2.0;

    const moonX = -sunX;
    const moonY = -sunY;
    const moonZ = -20.0 - Math.cos(timeOfDay) * 2.0;

    // Billboard orientation facing the camera zone (0, 5, 14)
    if (sunGroupRef.current) {
      sunGroupRef.current.position.set(sunX, sunY, sunZ);
      sunGroupRef.current.lookAt(0, 5, 14);
    }

    if (moonGroupRef.current) {
      moonGroupRef.current.position.set(moonX, moonY, moonZ);
      moonGroupRef.current.lookAt(0, 5, 14);
    }

    // Micro-rotation for stylized sunburst rays
    if (sunRaysRef.current) {
      sunRaysRef.current.rotation.z = time * 0.22;
    }

    // 2. Day/Night height factors
    const sunHeight = Math.sin(timeOfDay); // >0 is Day, <0 is Night
    const dayFactor = Math.max(0, Math.min(1, sunHeight * 1.5 + 0.2));
    const nightFactor = Math.max(0, Math.min(1, -sunHeight * 1.5 + 0.2));

    // Directional Sunlight (Warm Tan at dawn/dusk, bright white at noon)
    if (sunLightRef.current) {
      sunLightRef.current.position.set(sunX, Math.max(0.5, sunY), sunZ);
      sunLightRef.current.intensity = Math.max(0.08, dayFactor * 1.65);
      if (sunHeight < 0.35 && sunHeight > -0.2) {
        sunLightRef.current.color.setHex(COLOR_PALETTE.tan);
      } else {
        sunLightRef.current.color.setHex(0xfff8ed);
      }
    }

    // Directional Moonlight (Silvery Slate Gray)
    if (moonLightRef.current) {
      moonLightRef.current.position.set(moonX, Math.max(0.5, moonY), moonZ);
      moonLightRef.current.intensity = Math.max(0, nightFactor * 0.95);
      moonLightRef.current.color.setHex(COLOR_PALETTE.slateGray);
    }

    // 3. Stars twinkle & fade during daylight
    if (starsMatRef.current) {
      const baseOpacity = Math.max(0, Math.min(0.95, -sunHeight * 1.5 + 0.15));
      const twinkle = 0.82 + Math.sin(time * 2.8) * 0.18;
      starsMatRef.current.opacity = baseOpacity * twinkle;
    }
  });

  return (
    <>
      {/* Directional Sunlight & Moonlight */}
      <directionalLight
        ref={sunLightRef}
        args={[0xfff8ed, 1.4]}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <directionalLight
        ref={moonLightRef}
        args={[COLOR_PALETTE.slateGray, 0.85]}
      />

      {/* Twinkling Starfield in Space Cadet Night Sky */}
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[starPositions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          ref={starsMatRef}
          size={0.22}
          color={COLOR_PALETTE.tan}
          transparent
          opacity={0.85}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* 3D THE SUN (Warm Golden Tan Orb with Stylized Stepped Rays) */}
      <group ref={sunGroupRef}>
        {/* Core Glowing Sun Orb (Tan from Color Palette) */}
        <mesh>
          <sphereGeometry args={[1.8, 24, 24]} />
          <meshBasicMaterial color={COLOR_PALETTE.tan} />
        </mesh>

        {/* Inner Bright Solar Core */}
        <mesh>
          <sphereGeometry args={[1.45, 20, 20]} />
          <meshBasicMaterial color={0xfffcf2} />
        </mesh>

        {/* 2D/3D Stylized Stepped Corona Rays (12-pointed starburst) */}
        <mesh ref={sunRaysRef}>
          <ringGeometry args={[1.9, 2.9, 12]} />
          <meshBasicMaterial
            color={COLOR_PALETTE.tan}
            transparent
            opacity={0.75}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>

        {/* Soft Outer Solar Halo */}
        <mesh>
          <ringGeometry args={[2.4, 4.2, 32]} />
          <meshBasicMaterial
            color={COLOR_PALETTE.tan}
            transparent
            opacity={0.32}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      </group>

      {/* 3D THE MOON (Opposite Side - Slate Gray & Silvery Luminous Orb with Craters) */}
      <group ref={moonGroupRef}>
        {/* Lunar Body (Slate Gray from Color Palette) */}
        <mesh>
          <sphereGeometry args={[1.5, 24, 24]} />
          <meshBasicMaterial color={COLOR_PALETTE.slateGray} />
        </mesh>

        {/* Bright Crescent Rim (Silvery Moonlight) */}
        <mesh position={[-0.18, 0.12, 0.18]}>
          <sphereGeometry args={[1.42, 20, 20]} />
          <meshBasicMaterial color={0xe2eef8} />
        </mesh>

        {/* Stylized Lunar Crater Spots (2D/3D Cel-shaded Toon Aesthetic) */}
        <mesh position={[0.3, 0.35, 1.4]} rotation={[0, 0, 0]}>
          <circleGeometry args={[0.26, 12]} />
          <meshBasicMaterial color={COLOR_PALETTE.spaceCadet} />
        </mesh>
        <mesh position={[-0.38, -0.26, 1.35]} rotation={[0, 0, 0]}>
          <circleGeometry args={[0.2, 12]} />
          <meshBasicMaterial color={COLOR_PALETTE.spaceCadet} />
        </mesh>
        <mesh position={[0.42, -0.32, 1.3]} rotation={[0, 0, 0]}>
          <circleGeometry args={[0.16, 12]} />
          <meshBasicMaterial color={COLOR_PALETTE.spaceCadet} />
        </mesh>

        {/* Soft Lunar Corona Glow Ring */}
        <mesh>
          <ringGeometry args={[1.65, 3.2, 32]} />
          <meshBasicMaterial
            color={COLOR_PALETTE.slateGray}
            transparent
            opacity={0.38}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      </group>
    </>
  );
}

export default CelestialSky;
