"use client";

import React, { useRef, useMemo, useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface GlassShard {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  rx: number;
  ry: number;
  rz: number;
  vrx: number;
  vry: number;
  vrz: number;
  scaleX: number;
  scaleY: number;
  scaleZ: number;
  geoIndex: number;
  life: number;
  maxLife: number;
}

interface ShatterBurst {
  id: number;
  originX: number;
  originY: number;
  originZ: number;
  color: THREE.Color;
  ringRadius: number;
  ringOpacity: number;
  shards: GlassShard[];
}

export function GlassShatterEffect() {
  const [bursts, setBursts] = useState<ShatterBurst[]>([]);
  const burstsRef = useRef<ShatterBurst[]>([]);
  burstsRef.current = bursts;

  // Pre-generate 3 distinct sharp glass shard geometries for high visual variety
  const geometries = useMemo(() => {
    // 1. Sharp triangular glass shard
    const triangleShape = new THREE.Shape();
    triangleShape.moveTo(0, -0.08);
    triangleShape.lineTo(0.06, 0.08);
    triangleShape.lineTo(-0.06, 0.05);
    triangleShape.closePath();
    const g1 = new THREE.ExtrudeGeometry(triangleShape, {
      depth: 0.02,
      bevelEnabled: true,
      bevelThickness: 0.005,
      bevelSize: 0.005,
      bevelSegments: 1,
    });

    // 2. Elongated tapered glass splinter
    const splinterShape = new THREE.Shape();
    splinterShape.moveTo(-0.03, -0.12);
    splinterShape.lineTo(0.03, -0.1);
    splinterShape.lineTo(0.015, 0.12);
    splinterShape.lineTo(-0.02, 0.1);
    splinterShape.closePath();
    const g2 = new THREE.ExtrudeGeometry(splinterShape, {
      depth: 0.018,
      bevelEnabled: true,
      bevelThickness: 0.004,
      bevelSize: 0.004,
      bevelSegments: 1,
    });

    // 3. Trapezoidal corner fracture chunk
    const chunkShape = new THREE.Shape();
    chunkShape.moveTo(-0.05, -0.05);
    chunkShape.lineTo(0.06, -0.06);
    chunkShape.lineTo(0.04, 0.06);
    chunkShape.lineTo(-0.05, 0.04);
    chunkShape.closePath();
    const g3 = new THREE.ExtrudeGeometry(chunkShape, {
      depth: 0.025,
      bevelEnabled: true,
      bevelThickness: 0.006,
      bevelSize: 0.005,
      bevelSegments: 1,
    });

    return [g1, g2, g3];
  }, []);

  // Shared glass materials for performance
  const glassMaterial = useMemo(() => {
    return new THREE.MeshPhysicalMaterial({
      color: 0x2ec468, // Translucent emerald green matching the message bottle
      roughness: 0.1,
      metalness: 0.1,
      transmission: 0.75,
      ior: 1.5,
      transparent: true,
      opacity: 0.88,
      emissive: new THREE.Color(0x155428),
      emissiveIntensity: 0.35,
    });
  }, []);

  const ringMaterial = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: 0x5bc0f8,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }, []);

  // Event listener to trigger glass shatter anywhere
  useEffect(() => {
    const handleGlassShatterEvent = (e: Event) => {
      const detail = (e as CustomEvent<{ x: number; y: number; z: number; color?: number }>).detail;
      if (!detail) return;

      const originX = detail.x || 0;
      const originY = (detail.y || 0) + 0.35; // Strike bottle waist/shoulder
      const originZ = detail.z || 0;
      const burstColor = new THREE.Color(detail.color !== undefined ? detail.color : 0x2ec468);

      const shardCount = 38;
      const newShards: GlassShard[] = [];

      for (let i = 0; i < shardCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const elevationAngle = (Math.random() - 0.2) * (Math.PI / 2); // Mostly upward & outward
        const speed = 2.4 + Math.random() * 4.6;

        const vx = Math.cos(angle) * Math.cos(elevationAngle) * speed;
        const vy = Math.sin(elevationAngle) * speed + 1.8;
        const vz = Math.sin(angle) * Math.cos(elevationAngle) * speed;

        const scale = 0.7 + Math.random() * 0.9;

        newShards.push({
          x: originX + (Math.random() - 0.5) * 0.2,
          y: originY + (Math.random() - 0.5) * 0.25,
          z: originZ + (Math.random() - 0.5) * 0.2,
          vx,
          vy,
          vz,
          rx: Math.random() * Math.PI * 2,
          ry: Math.random() * Math.PI * 2,
          rz: Math.random() * Math.PI * 2,
          vrx: (Math.random() - 0.5) * 22,
          vry: (Math.random() - 0.5) * 22,
          vrz: (Math.random() - 0.5) * 22,
          scaleX: scale * (0.8 + Math.random() * 0.4),
          scaleY: scale * (0.8 + Math.random() * 0.4),
          scaleZ: scale * (0.8 + Math.random() * 0.4),
          geoIndex: i % geometries.length,
          life: 0,
          maxLife: 1.1 + Math.random() * 0.5,
        });
      }

      const newBurst: ShatterBurst = {
        id: Date.now() + Math.random(),
        originX,
        originY,
        originZ,
        color: burstColor,
        ringRadius: 0.4,
        ringOpacity: 0.95,
        shards: newShards,
      };

      setBursts((prev) => [...prev.slice(-4), newBurst]); // Keep max 5 active bursts
    };

    window.addEventListener("portfolio:glass-shatter", handleGlassShatterEvent);
    return () => window.removeEventListener("portfolio:glass-shatter", handleGlassShatterEvent);
  }, [geometries]);

  // Physics animation loop for shards
  const burstGroupsRef = useRef<Record<number, THREE.Group | null>>({});

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const activeBursts = burstsRef.current;
    if (activeBursts.length === 0) return;

    let needsStateUpdate = false;
    const remainingBursts: ShatterBurst[] = [];

    for (const burst of activeBursts) {
      burst.ringRadius += dt * 3.8;
      burst.ringOpacity = Math.max(0, burst.ringOpacity - dt * 1.5);

      let aliveShardCount = 0;

      for (const shard of burst.shards) {
        shard.life += dt;
        if (shard.life < shard.maxLife) {
          aliveShardCount++;

          // Gravity
          shard.vy -= 9.8 * dt;

          // Water resistance when hitting ocean surface
          if (shard.y <= -0.15) {
            shard.y = -0.15;
            shard.vy = -shard.vy * 0.22; // Small water bounce
            shard.vx *= 0.65; // Water drag
            shard.vz *= 0.65;
            shard.vrx *= 0.7;
            shard.vry *= 0.7;
            shard.vrz *= 0.7;
          }

          shard.x += shard.vx * dt;
          shard.y += shard.vy * dt;
          shard.z += shard.vz * dt;

          shard.rx += shard.vrx * dt;
          shard.ry += shard.vry * dt;
          shard.rz += shard.vrz * dt;
        }
      }

      if (aliveShardCount > 0 || burst.ringOpacity > 0.02) {
        remainingBursts.push(burst);
      } else {
        needsStateUpdate = true;
      }
    }

    if (needsStateUpdate) {
      setBursts(remainingBursts);
    }
  });

  return (
    <group name="glass-shatter-system">
      {bursts.map((burst) => (
        <group
          key={burst.id}
          ref={(el) => {
            burstGroupsRef.current[burst.id] = el;
          }}
        >
          {/* Expanding Water Surface Shockwave Ring at Bottle Base */}
          {burst.ringOpacity > 0.01 && (
            <mesh
              position={[burst.originX, 0.04, burst.originZ]}
              rotation={[-Math.PI / 2, 0, 0]}
            >
              <ringGeometry args={[burst.ringRadius * 0.6, burst.ringRadius, 32]} />
              <primitive
                object={ringMaterial}
                attach="material"
                opacity={burst.ringOpacity}
              />
            </mesh>
          )}

          {/* Smashed 3D Glass Shards */}
          {burst.shards.map((shard, idx) => {
            if (shard.life >= shard.maxLife) return null;
            const progress = shard.life / shard.maxLife;
            const opacity = Math.max(0, 1 - Math.pow(progress, 2.5));

            return (
              <mesh
                key={idx}
                geometry={geometries[shard.geoIndex]}
                position={[shard.x, shard.y, shard.z]}
                rotation={[shard.rx, shard.ry, shard.rz]}
                scale={[
                  shard.scaleX * (1 - progress * 0.15),
                  shard.scaleY * (1 - progress * 0.15),
                  shard.scaleZ * (1 - progress * 0.15),
                ]}
              >
                <meshPhysicalMaterial
                  color={burst.color}
                  roughness={0.12}
                  metalness={0.1}
                  transmission={0.7}
                  ior={1.48}
                  transparent
                  opacity={opacity * 0.9}
                  emissive={burst.color}
                  emissiveIntensity={Math.max(0, (1 - progress * 2) * 0.6)}
                />
              </mesh>
            );
          })}
        </group>
      ))}
    </group>
  );
}

export default GlassShatterEffect;
