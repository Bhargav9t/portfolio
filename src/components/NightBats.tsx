"use client";

import React, { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

export interface NightBatsProps {
  intensity?: number;
}

interface BatData {
  basePos: [number, number, number];
  speedX: number;
  speedY: number;
  flightRangeX: number;
  flightRangeY: number;
  flapSpeed: number;
  flapOffset: number;
  scale: number;
}

export function NightBats({ intensity = 1.0 }: NightBatsProps) {
  const { camera } = useThree();
  const groupRef = useRef<THREE.Group>(null);
  const meshRefs = useRef<(THREE.Mesh | null)[]>([]);

  // Load the 2 flapping animation frames from user references Bat.jpg & Bat3.jpg
  const { texWingsUp, texWingsDown } = useMemo(() => {
    const loader = new THREE.TextureLoader();
    const up = loader.load("/celestial/bat_wings_up.png");
    const down = loader.load("/celestial/bat_wings_down.png");

    [up, down].forEach((tex) => {
      tex.magFilter = THREE.NearestFilter;
      tex.minFilter = THREE.NearestFilter;
      tex.generateMipmaps = false;
      tex.colorSpace = THREE.SRGBColorSpace;
    });

    return { texWingsUp: up, texWingsDown: down };
  }, []);

  // 4 fluttering bats with erratic nocturnal flight paths across the starry sky
  const bats = useMemo<BatData[]>(() => {
    return [
      {
        basePos: [-6.5, 6.2, -21.0],
        speedX: 0.32,
        speedY: 1.8,
        flightRangeX: 7.5,
        flightRangeY: 1.4,
        flapSpeed: 9.5,
        flapOffset: 0.0,
        scale: 1.25,
      },
      {
        basePos: [4.8, 7.5, -20.5],
        speedX: 0.28,
        speedY: 2.2,
        flightRangeX: 6.8,
        flightRangeY: 1.1,
        flapSpeed: 10.2,
        flapOffset: 1.6,
        scale: 1.1,
      },
      {
        basePos: [-1.2, 5.0, -21.8],
        speedX: 0.45,
        speedY: 2.6,
        flightRangeX: 9.2,
        flightRangeY: 1.6,
        flapSpeed: 11.0,
        flapOffset: 2.8,
        scale: 1.35,
      },
      {
        basePos: [9.0, 5.8, -22.2],
        speedX: 0.36,
        speedY: 1.5,
        flightRangeX: 5.5,
        flightRangeY: 1.2,
        flapSpeed: 8.8,
        flapOffset: 4.1,
        scale: 0.95,
      },
    ];
  }, []);

  useFrame(({ clock }) => {
    if (intensity <= 0.01) return;
    const time = clock.getElapsedTime();

    meshRefs.current.forEach((mesh, index) => {
      if (!mesh) return;
      const b = bats[index];

      // 1. Keep bat billboarding directly facing camera
      mesh.quaternion.copy(camera.quaternion);

      // 2. High frequency wing flutter cycle (alternating wings up & wings down)
      const flapPhase = (time * b.flapSpeed + b.flapOffset) % (Math.PI * 2);
      const isWingUp = Math.sin(flapPhase) > 0.0;
      const mat = mesh.material as THREE.MeshBasicMaterial;
      const targetTex = isWingUp ? texWingsUp : texWingsDown;
      if (mat && mat.map !== targetTex) {
        mat.map = targetTex;
        mat.needsUpdate = true;
      }

      // 3. Erratic nocturnal swooping flight path
      const flightX =
        b.basePos[0] + Math.sin(time * b.speedX + b.flapOffset) * b.flightRangeX;
      const flightY =
        b.basePos[1] +
        Math.sin(time * b.speedY + b.flapOffset) * b.flightRangeY +
        Math.cos(time * 0.8 + b.flapOffset) * 0.4;
      const flightZ = b.basePos[2] + Math.cos(time * b.speedX * 0.7) * 0.6;

      mesh.position.set(flightX, flightY, flightZ);

      // Bank / tilt slightly in flight direction
      const bank = Math.cos(time * b.speedX + b.flapOffset) * 0.16;
      mesh.rotation.z = bank;
    });
  });

  if (intensity <= 0.01) return null;

  return (
    <group ref={groupRef}>
      {bats.map((b, i) => (
        <mesh
          key={i}
          ref={(el) => {
            meshRefs.current[i] = el;
          }}
          position={b.basePos}
        >
          {/* Bat sprite plane */}
          <planeGeometry args={[b.scale * 1.8, b.scale * 1.15]} />
          <meshBasicMaterial
            map={texWingsUp}
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

export default NightBats;
