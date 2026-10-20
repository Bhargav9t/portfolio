"use client";

import React, { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

export interface FloatingAstronautProps {
  intensity?: number;
  position?: [number, number, number];
}

export function FloatingAstronaut({
  intensity = 1.0,
  position = [8.2, 7.4, -23.5],
}: FloatingAstronautProps) {
  const { camera } = useThree();
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);

  // Load pixel astronaut sprite with NearestFilter
  const texture = useMemo(() => {
    const loader = new THREE.TextureLoader();
    const tex = loader.load("/celestial/astronaut.png");
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    tex.generateMipmaps = false;
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);

  useFrame(({ clock }, delta) => {
    if (intensity <= 0.01) return;
    const time = clock.getElapsedTime();

    // 1. Billboarding to face camera
    if (groupRef.current) {
      groupRef.current.quaternion.copy(camera.quaternion);

      // Weightless zero-g lateral drift & floating bob
      const driftX = position[0] + Math.sin(time * 0.18) * 1.6;
      const driftY = position[1] + Math.sin(time * 0.42) * 0.45;
      const driftZ = position[2] + Math.cos(time * 0.22) * 0.6;
      groupRef.current.position.set(driftX, driftY, driftZ);
    }

    // 2. Slow zero-g tumbling rotation
    if (meshRef.current) {
      meshRef.current.rotation.z += delta * 0.12;
    }
  });

  if (intensity <= 0.01) return null;

  return (
    <group ref={groupRef} position={position}>
      {/* Soft ethereal astronaut life-support beacon glow */}
      <pointLight args={[0x8cd9ff, 0.6 * intensity, 12]} position={[0, 0, 0.2]} />

      <mesh ref={meshRef}>
        {/* Astronaut square plane: scale 2.6 */}
        <planeGeometry args={[2.6, 2.6]} />
        <meshBasicMaterial
          map={texture}
          transparent
          alphaTest={0.06}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

export default FloatingAstronaut;
