"use client";

import React, { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

export interface DayBirdsProps {
  sunPosition?: [number, number, number];
  intensity?: number;
}

interface BirdData {
  offset: [number, number, number];
  speed: number;
  flapSpeed: number;
  flapOffset: number;
  bobFreq: number;
  bobAmp: number;
  scale: number;
}

export function DayBirds({ sunPosition = [0, 8, -23], intensity = 1.0 }: DayBirdsProps) {
  const { camera } = useThree();
  const groupRef = useRef<THREE.Group>(null);
  const meshRefs = useRef<(THREE.Mesh | null)[]>([]);

  // Load the 2 flapping animation frames with NearestFilter for crisp pixel art
  const { frame1, frame2 } = useMemo(() => {
    const loader = new THREE.TextureLoader();
    const f1 = loader.load("/celestial/bird_frame1.png");
    const f2 = loader.load("/celestial/bird_frame2.png");

    [f1, f2].forEach((tex) => {
      tex.magFilter = THREE.NearestFilter;
      tex.minFilter = THREE.NearestFilter;
      tex.generateMipmaps = false;
      tex.colorSpace = THREE.SRGBColorSpace;
    });

    return { frame1: f1, frame2: f2 };
  }, []);

  // Exactly 3 tiny flying birds in elegant V-formation gliding across the open sky
  const birds = useMemo<BirdData[]>(() => {
    return [
      {
        offset: [0.0, 0.25, 0.0], // Lead bird
        speed: 0.32,
        flapSpeed: 7.2,
        flapOffset: 0.0,
        bobFreq: 1.8,
        bobAmp: 0.08,
        scale: 0.38, // Tiny pixel scale: ~0.9 units wide
      },
      {
        offset: [-1.15, -0.28, 0.1], // Wingman left
        speed: 0.32,
        flapSpeed: 6.8,
        flapOffset: 0.9,
        bobFreq: 1.6,
        bobAmp: 0.07,
        scale: 0.32, // Tiny pixel scale: ~0.76 units wide
      },
      {
        offset: [1.20, -0.38, -0.1], // Wingman right
        speed: 0.32,
        flapSpeed: 7.4,
        flapOffset: 1.8,
        bobFreq: 1.9,
        bobAmp: 0.09,
        scale: 0.34, // Tiny pixel scale: ~0.81 units wide
      },
    ];
  }, []);

  // Position flock gracefully in the open daytime sky
  const flockBaseX = -2.5;
  const flockBaseY = 9.2;
  const flockBaseZ = -20.5;

  useFrame(({ clock }) => {
    if (intensity <= 0.01) return;
    const time = clock.getElapsedTime();

    // Gentle panoramic soaring across the sky
    const flightDriftX = flockBaseX + Math.sin(time * 0.16) * 2.8;
    const flightDriftY = flockBaseY + Math.sin(time * 0.28) * 0.7;
    const flightDriftZ = flockBaseZ + Math.cos(time * 0.15) * 1.2;

    if (groupRef.current) {
      groupRef.current.position.set(flightDriftX, flightDriftY, flightDriftZ);
      groupRef.current.quaternion.copy(camera.quaternion);
    }

    // Update each bird's flapping animation frame and micro-bobbing
    meshRefs.current.forEach((mesh, index) => {
      if (!mesh) return;
      const b = birds[index];

      // Alternates between frame1 (wings up) and frame2 (wings down)
      const flapPhase = (time * b.flapSpeed + b.flapOffset) % (Math.PI * 2);
      const isWingDown = Math.sin(flapPhase) > 0.12;
      const mat = mesh.material as THREE.MeshBasicMaterial;
      const targetTex = isWingDown ? frame2 : frame1;
      if (mat && mat.map !== targetTex) {
        mat.map = targetTex;
        mat.needsUpdate = true;
      }

      if (mat) {
        mat.opacity = Math.max(0, Math.min(1.0, intensity));
      }

      // Micro-bobbing & gentle banking tilt in flight
      const localY = b.offset[1] + Math.sin(time * b.bobFreq + b.flapOffset) * b.bobAmp;
      mesh.position.set(b.offset[0], localY, b.offset[2]);

      const tilt = Math.cos(time * 0.35 + b.flapOffset) * 0.09;
      mesh.rotation.z = tilt;
    });
  });

  if (intensity <= 0.01) return null;

  return (
    <group ref={groupRef} position={[flockBaseX, flockBaseY, flockBaseZ]} raycast={() => null}>
      {birds.map((b, i) => (
        <mesh
          key={i}
          ref={(el) => {
            meshRefs.current[i] = el;
          }}
          position={b.offset}
          raycast={() => null}
        >
          {/* Tiny retro pixel scale: ~0.24 units wide */}
          <planeGeometry args={[b.scale * 2.4, (b.scale * 2.4) / 2.3]} />
          <meshBasicMaterial
            map={frame1}
            transparent
            alphaTest={0.06}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}

export default DayBirds;
