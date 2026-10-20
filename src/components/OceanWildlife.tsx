"use client";

import React, { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { soundFx } from "@/utils/audio";

export interface OceanWildlifeProps {
  waveSpeed?: number;
  waveAmplitude?: number;
  timeOfDay?: number;
  blackHolePos?: [number, number, number];
  isBlackHoleEasterEgg?: boolean;
  onSetActionNotification?: (msg: string | null) => void;
}

interface FishData {
  id: string;
  state: "submerged" | "leaping";
  submergedTimer: number;
  leapProgress: number; // 0 to 1
  leapDuration: number;
  startX: number;
  startZ: number;
  targetX: number;
  targetZ: number;
  apexHeight: number;
  scale: number;
  direction: number; // 1 = right, -1 = left
}

interface SplashPoolItem {
  active: boolean;
  x: number;
  z: number;
  age: number;
  maxAge: number;
  scale: number;
}

const MAX_SPLASHES = 24;
const TOTAL_FISH = 12;

export function OceanWildlife({
  waveSpeed = 0.05,
  waveAmplitude = 0.2,
  timeOfDay = Math.PI * 0.5,
  blackHolePos = [0, 4.2, -18.5],
  isBlackHoleEasterEgg = false,
  onSetActionNotification,
}: OceanWildlifeProps) {
  const { camera } = useThree();

  // Load pixel art textures with NearestFilter for crisp retro aesthetic
  const { fishTex, splashTex } = useMemo(() => {
    const loader = new THREE.TextureLoader();
    const fTex = loader.load("/celestial/pixel_fish.png");
    const spTex = loader.load("/celestial/pixel_splash.png");

    [fTex, spTex].forEach((t) => {
      t.magFilter = THREE.NearestFilter;
      t.minFilter = THREE.NearestFilter;
      t.generateMipmaps = false;
      t.colorSpace = THREE.SRGBColorSpace;
    });

    return { fishTex: fTex, splashTex: spTex };
  }, []);

  // 2. Randomized Jumping Flying Fish
  // Define 5 randomized spawn zones across the entire visible frustum
  const pickRandomOceanSpawn = () => {
    const zone = Math.floor(Math.random() * 5);
    let x = 0;
    let z = 0;

    switch (zone) {
      case 0: // Far Western Flank
        x = THREE.MathUtils.randFloat(-16, -6);
        z = THREE.MathUtils.randFloat(-10, 1);
        break;
      case 1: // Far Eastern Flank
        x = THREE.MathUtils.randFloat(6, 16);
        z = THREE.MathUtils.randFloat(-10, 1);
        break;
      case 2: // Distant Northern Horizon (near lighthouse & wide horizon)
        x = THREE.MathUtils.randFloat(-22, 22);
        z = THREE.MathUtils.randFloat(-24, -13);
        break;
      case 3: // Mid-Depth Open Waters
        x = THREE.MathUtils.randFloat(-12, 12);
        z = THREE.MathUtils.randFloat(-12, -3);
        break;
      case 4: // Foreground Ocean
      default:
        x = THREE.MathUtils.randFloat(-9, 9);
        z = THREE.MathUtils.randFloat(-2, 3);
        break;
    }

    // Scale fish and jump height with perspective distance from camera (camera Z ≈ 4.8)
    const distToCam = Math.hypot(x, z - 4.8);
    const perspectiveFactor = THREE.MathUtils.clamp(1.0 - (distToCam - 6) / 36, 0.45, 1.15);
    const scale = 0.82 * perspectiveFactor;
    const apexHeight = (1.5 + Math.random() * 0.8) * perspectiveFactor;

    return { x, z, scale, apexHeight };
  };

  const fishesRef = useRef<FishData[]>(
    Array.from({ length: TOTAL_FISH }, (_, i) => {
      const spawn = pickRandomOceanSpawn();
      return {
        id: `fish-${i + 1}`,
        state: "submerged",
        submergedTimer: Math.random() * 3.5 + i * 0.25, // Staggered initial jumps
        leapProgress: 0,
        leapDuration: 1.15 + Math.random() * 0.3,
        startX: spawn.x,
        startZ: spawn.z,
        targetX: spawn.x + 3.0,
        targetZ: spawn.z,
        apexHeight: spawn.apexHeight,
        scale: spawn.scale,
        direction: Math.random() > 0.5 ? 1 : -1,
      };
    })
  );

  // 3. Zero-allocation splash pool
  const splashPoolRef = useRef<SplashPoolItem[]>(
    Array.from({ length: MAX_SPLASHES }, () => ({
      active: false,
      x: 0,
      z: 0,
      age: 0,
      maxAge: 0.58,
      scale: 1,
    }))
  );

  // Mesh & Group refs
  const fishGroupRefs = useRef<(THREE.Group | null)[]>([]);
  const fishMeshRefs = useRef<(THREE.Mesh | null)[]>([]);
  const splashGroupRefs = useRef<(THREE.Group | null)[]>([]);
  const splashMeshRefs = useRef<(THREE.Mesh | null)[]>([]);

  // Function to spawn a surface splash ring from the pool
  const spawnSplash = (x: number, z: number, scale = 1.0) => {
    const pool = splashPoolRef.current;
    let target = pool.find((item) => !item.active);
    if (!target) {
      target = pool.reduce((oldest, item) => (item.age > oldest.age ? item : oldest), pool[0]);
    }
    if (target) {
      target.active = true;
      target.x = x;
      target.z = z;
      target.age = 0;
      target.maxAge = 0.58;
      target.scale = scale;
    }
  };

  // Wave elevation calculation matching WaterCausticOcean
  const getWaveElevation = (x: number, z: number, t: number) => {
    const ampRatio = waveAmplitude / 0.2;
    const w1 = Math.sin(x * 0.32 + z * 0.28 + t * 1.6) * (0.10 * ampRatio);
    const w2 = Math.cos(x * 0.24 - z * 0.36 + t * 1.2) * (0.07 * ampRatio);
    const w3 = Math.sin(Math.sqrt(x * x + z * z) * 0.4 - t * 2.1) * (0.05 * ampRatio);

    let drop = 0;
    if (isBlackHoleEasterEgg) {
      const dx = blackHolePos[0] - x;
      const dz = blackHolePos[2] - z;
      const dist = Math.hypot(dx, dz);
      drop = -4.6 / (1.0 + Math.pow(dist / 5.6, 2.1));
    }
    return w1 + w2 + w3 + drop;
  };

  // Temporary vectors for zero-allocation math
  const tempVec = useMemo(() => new THREE.Vector3(), []);
  const camInvQuat = useMemo(() => new THREE.Quaternion(), []);

  // Main animation loop
  useFrame(({ clock }, delta) => {
    const time = clock.getElapsedTime();
    const dt = Math.min(delta, 0.1);

    // Day / Night lighting modulation
    const sinT = Math.sin(timeOfDay);
    const isNight = sinT < 0.1;
    const nightOpacity = isNight ? 0.78 : 1.0;

    camInvQuat.copy(camera.quaternion).invert();

    camInvQuat.copy(camera.quaternion).invert();

    // --- 1. JUMPING FISH CYCLES ---
    fishesRef.current.forEach((fish, i) => {
      const group = fishGroupRefs.current[i];
      const mesh = fishMeshRefs.current[i];
      if (!group || !mesh) return;

      if (fish.state === "submerged") {
        fish.submergedTimer -= dt;
        group.visible = false;

        if (fish.submergedTimer <= 0) {
          fish.state = "leaping";
          fish.leapProgress = 0;

          // Pick fresh randomized ocean spawn coordinates across all zones
          const spawn = pickRandomOceanSpawn();
          fish.startX = spawn.x;
          fish.startZ = spawn.z;
          fish.scale = spawn.scale;
          fish.apexHeight = spawn.apexHeight;

          // Natural jump trajectory
          const angle = Math.random() * Math.PI * 2;
          const jumpDist = 2.6 + Math.random() * 2.2;
          fish.targetX = fish.startX + Math.cos(angle) * jumpDist;
          fish.targetZ = fish.startZ + Math.sin(angle) * jumpDist;

          fish.direction = fish.targetX >= fish.startX ? 1 : -1;
          fish.leapDuration = 1.1 + Math.random() * 0.35;

          spawnSplash(fish.startX, fish.startZ, 0.85 * fish.scale);
        }
      } else if (fish.state === "leaping") {
        group.visible = true;
        fish.leapProgress += dt / fish.leapDuration;

        const p = Math.min(1.0, fish.leapProgress);

        const currentX = THREE.MathUtils.lerp(fish.startX, fish.targetX, p);
        const currentZ = THREE.MathUtils.lerp(fish.startZ, fish.targetZ, p);

        const baseWaterY = getWaveElevation(currentX, currentZ, time);
        const jumpY = 4 * fish.apexHeight * p * (1 - p);
        const currentY = baseWaterY + jumpY;

        group.position.set(currentX, currentY, currentZ);
        group.quaternion.copy(camera.quaternion);

        // Dynamic pitch rotation along parabolic arc
        const pitchAngle = (0.5 - p) * 1.5;
        mesh.rotation.z = fish.direction * pitchAngle;

        const finFlutter = 1.0 + Math.sin(time * 28 + i * 2.1) * 0.08;
        mesh.scale.set(fish.direction * fish.scale * 1.25, fish.scale * 1.0 * finFlutter, 1);

        const mat = mesh.material as THREE.MeshBasicMaterial;
        if (mat) {
          mat.opacity = nightOpacity;
        }

        if (p >= 1.0) {
          fish.state = "submerged";
          // Stagger next jump randomly between 2.0s and 5.5s
          fish.submergedTimer = 1.8 + Math.random() * 3.8;

          spawnSplash(fish.targetX, fish.targetZ, 1.0 * fish.scale);
          group.visible = false;
        }
      }
    });

    // --- 3. SPLASH POOL UPDATES ---
    splashPoolRef.current.forEach((splash, idx) => {
      const group = splashGroupRefs.current[idx];
      const mesh = splashMeshRefs.current[idx];
      if (!group || !mesh) return;

      if (!splash.active) {
        group.visible = false;
        return;
      }

      splash.age += dt;
      if (splash.age >= splash.maxAge) {
        splash.active = false;
        group.visible = false;
        return;
      }

      group.visible = true;
      const progress = splash.age / splash.maxAge;
      const currentScale = splash.scale * (0.7 + progress * 0.9);
      const waveY = getWaveElevation(splash.x, splash.z, time);

      group.position.set(splash.x, waveY + 0.08, splash.z);
      group.quaternion.copy(camera.quaternion);
      group.scale.set(currentScale * 1.2, currentScale * 1.0, 1);

      const mat = mesh.material as THREE.MeshBasicMaterial;
      if (mat) {
        mat.opacity = Math.max(0, 1.0 - progress * progress) * 0.95;
      }
    });
  });

  return (
    <group>
      {/* 1. JUMPING FLYING FISHES */}
      {fishesRef.current.map((fish, i) => (
        <group
          key={fish.id}
          ref={(el) => {
            fishGroupRefs.current[i] = el;
          }}
          visible={false}
          raycast={() => null}
        >
          {/* Crisp Pixel Fish Quad */}
          <mesh
            ref={(el) => {
              fishMeshRefs.current[i] = el;
            }}
            raycast={() => null}
          >
            <planeGeometry args={[1, 0.8]} />
            <meshBasicMaterial
              map={fishTex}
              transparent
              alphaTest={0.06}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
        </group>
      ))}

      {/* 3. ZERO-ALLOCATION PIXEL WATER SPLASH RINGS */}
      {splashPoolRef.current.map((_, idx) => (
        <group
          key={idx}
          ref={(el) => {
            splashGroupRefs.current[idx] = el;
          }}
          visible={false}
          raycast={() => null}
        >
          <mesh
            ref={(el) => {
              splashMeshRefs.current[idx] = el;
            }}
            raycast={() => null}
          >
            <planeGeometry args={[1.2, 1.1]} />
            <meshBasicMaterial
              map={splashTex}
              transparent
              opacity={0.9}
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

export default OceanWildlife;
