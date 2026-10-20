"use client";

import React, { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

export interface PixelLighthouseProps {
  position?: [number, number, number];
  scale?: [number, number, number];
  timeOfDay?: number;
}

export function PixelLighthouse({
  position = [-25.0, 0.45, -31.5], // Farther out on the distant ocean waterline
  scale = [1.9, 2.82, 1],          // A little bit bigger distant lighthouse silhouette
  timeOfDay = Math.PI * 0.5,
}: PixelLighthouseProps) {
  const { camera } = useThree();
  const groupRef = useRef<THREE.Group>(null);
  const beaconGroupRef = useRef<THREE.Group>(null);
  const beaconLightRef = useRef<THREE.PointLight>(null);
  const beamMatRef = useRef<THREE.MeshBasicMaterial>(null);

  // Load lighthouse texture with pixel-crisp NearestFilter
  const texture = useMemo(() => {
    const loader = new THREE.TextureLoader();
    const tex = loader.load("/celestial/lighthouse.png");
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    tex.generateMipmaps = false;
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);

  // Lantern room height offset inside the sprite (~68% up from base)
  const lanternY = scale[1] * 0.22;

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();

    // 1. Keep billboard facing towards the camera horizontally
    if (groupRef.current) {
      // Subtle buoyant bobbing on the distant water
      const waterBob = Math.sin(time * 1.4) * 0.015;
      groupRef.current.position.y = position[1] + waterBob;
      groupRef.current.quaternion.copy(camera.quaternion);
    }

    // 2. Subtle, Stepped Pixelated Beacon Rotation (16 discrete retro angular steps)
    if (beaconGroupRef.current) {
      // Discrete stepped retro rotation (16 frames per full turn)
      const stepAngle = Math.floor(time * 2.2) * (Math.PI / 8);
      beaconGroupRef.current.rotation.y = stepAngle;
    }

    // 3. Modulate beacon brightness based on night vs day (Extremely subtle)
    const sinT = Math.sin(timeOfDay);
    const isNight = sinT < 0.1;
    const beaconIntensity = isNight ? 0.5 : 0.15;

    if (beaconLightRef.current) {
      beaconLightRef.current.intensity = beaconIntensity;
    }

    if (beamMatRef.current) {
      // Delicate, very subtle pulsing opacity
      const pulse = 0.88 + Math.sin(time * 3.5) * 0.12;
      beamMatRef.current.opacity = (isNight ? 0.09 : 0.025) * pulse;
    }
  });

  return (
    <group position={position} raycast={() => null}>
      {/* 1. Main Distant Lighthouse Billboard Quad */}
      <group ref={groupRef} raycast={() => null}>
        <mesh position={[0, scale[1] * 0.38, 0]} raycast={() => null}>
          <planeGeometry args={[scale[0], scale[1]]} />
          <meshBasicMaterial
            map={texture}
            transparent
            alphaTest={0.06}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      </group>

      {/* 2. Rotating Subtle Pixelated Lighthouse Beacon Light */}
      <group position={[0, lanternY + scale[1] * 0.38, 0]} raycast={() => null}>
        {/* Core warm glowing lantern light */}
        <pointLight
          ref={beaconLightRef}
          args={[0xfff0aa, 0.5, 10]}
          position={[0, 0, 0.1]}
        />

        {/* Subtle, Delicate Stepped Low-Poly Pixel Beam */}
        <group ref={beaconGroupRef} raycast={() => null}>
          {/* Primary subtle beam */}
          <mesh position={[0, 0, 1.7]} rotation={[Math.PI * 0.5, 0, 0]} raycast={() => null}>
            <coneGeometry args={[0.52, 3.4, 6, 1, true]} />
            <meshBasicMaterial
              ref={beamMatRef}
              color={0xffea85}
              transparent
              opacity={0.08}
              side={THREE.DoubleSide}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>

          {/* Secondary subtle opposite beam */}
          <mesh position={[0, 0, -1.7]} rotation={[-Math.PI * 0.5, 0, 0]} raycast={() => null}>
            <coneGeometry args={[0.42, 3.4, 6, 1, true]} />
            <meshBasicMaterial
              color={0xffea85}
              transparent
              opacity={0.045}
              side={THREE.DoubleSide}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        </group>
      </group>
    </group>
  );
}

export default PixelLighthouse;
