"use client";

import React, { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { soundFx } from "@/utils/audio";

export interface WaterSplashEffectProps {
  scale: [number, number, number]; // [width, height, depth]
  accentColor: number;
  isHovered: boolean;
  isActive: boolean;
  waterlineY: number; // Local Y coordinate of the water surface (e.g. -scale[1] * 0.35)
  waveSpeed?: number;
  impactFlash?: number;
  splashBurstTrigger?: number;
  defianceLevel?: number;
}

interface DropletParticle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
  baseSize: number;
  side: number;
}

const DROPLET_COUNT = 64;
const FOAM_NODE_COUNT = 48;
const RIPPLE_COUNT = 4;

export function WaterSplashEffect({
  scale,
  accentColor,
  isHovered,
  isActive,
  waterlineY,
  waveSpeed = 0.05,
  impactFlash = 0,
  splashBurstTrigger = 0,
  defianceLevel = 0,
}: WaterSplashEffectProps) {
  const [width, , depth] = scale;
  const baseRadius = Math.sqrt(width * width + depth * depth) * 0.52;

  // Refs for meshes & groups
  const dropletsMeshRef = useRef<THREE.InstancedMesh>(null);
  const foamMeshRef = useRef<THREE.InstancedMesh>(null);
  const ripplesGroupRef = useRef<THREE.Group>(null);
  const crownMeshRef = useRef<THREE.Mesh>(null);
  const crownWireRef = useRef<THREE.Mesh>(null);
  const burstRingMeshRef = useRef<THREE.Mesh>(null);

  // Temporary math helpers
  const dummyMatrix = useMemo(() => new THREE.Matrix4(), []);
  const dummyPos = useMemo(() => new THREE.Vector3(), []);
  const dummyQuat = useMemo(() => new THREE.Quaternion(), []);
  const dummyScale = useMemo(() => new THREE.Vector3(), []);
  const dummyDir = useMemo(() => new THREE.Vector3(), []);
  const upVec = useMemo(() => new THREE.Vector3(0, 1, 0), []);

  // Theme colors
  const waterColor = useMemo(() => new THREE.Color(accentColor), [accentColor]);
  const iceWhiteColor = useMemo(() => new THREE.Color(0xe0f8ff), []);
  const highlightColor = useMemo(() => new THREE.Color(0xffffff), []);

  // One-shot shockwave burst state
  const burstState = useRef({
    active: false,
    radius: baseRadius,
    maxRadius: baseRadius * 3.2,
    opacity: 0,
  });

  const prevTriggerRef = useRef(splashBurstTrigger);
  const prevActiveRef = useRef(isActive);
  const prevHoveredRef = useRef(isHovered);
  const prevImpactRef = useRef(impactFlash);

  // Trigger splash burst
  const triggerSplashBurst = (intensity: number = 1.0) => {
    burstState.current.active = true;
    burstState.current.radius = baseRadius * 0.9;
    burstState.current.opacity = Math.min(1.0, 0.85 * intensity);

    if (dropletsRef.current) {
      const particles = dropletsRef.current;
      const count = Math.floor(DROPLET_COUNT * 0.65);
      for (let i = 0; i < count; i++) {
        const p = particles[i];
        p.life = 0;
        p.maxLife = 0.45 + Math.random() * 0.45;
        p.y = waterlineY + (Math.random() - 0.5) * 0.02;

        const angle = Math.random() * Math.PI * 2;
        const speed = (0.6 + Math.random() * 1.5) * intensity;
        p.vx = Math.cos(angle) * speed;
        p.vz = Math.sin(angle) * speed;
        p.vy = (1.8 + Math.random() * 2.8) * intensity;
      }
    }

    soundFx.splash(intensity);
  };

  useEffect(() => {
    if (splashBurstTrigger > prevTriggerRef.current) {
      prevTriggerRef.current = splashBurstTrigger;
      triggerSplashBurst(1.4);
    }
  }, [splashBurstTrigger]);

  useEffect(() => {
    if (isActive && !prevActiveRef.current) {
      triggerSplashBurst(1.5);
    }
    prevActiveRef.current = isActive;
  }, [isActive]);

  useEffect(() => {
    if (isHovered && !prevHoveredRef.current) {
      triggerSplashBurst(1.15);
    }
    prevHoveredRef.current = isHovered;
  }, [isHovered]);

  useEffect(() => {
    if (impactFlash > 0.4 && impactFlash > prevImpactRef.current) {
      triggerSplashBurst(1.5);
    }
    prevImpactRef.current = impactFlash;
  }, [impactFlash]);

  // Initialize Droplet Particles with fine realistic sizes
  const dropletsRef = useRef<DropletParticle[]>(null!);
  if (!dropletsRef.current) {
    const list: DropletParticle[] = [];
    for (let i = 0; i < DROPLET_COUNT; i++) {
      const side = i % 4;
      let px = 0;
      let pz = 0;
      let nX = 0;
      let nZ = 0;

      if (side === 0) {
        px = (Math.random() - 0.5) * width;
        pz = depth * 0.5 + 0.02;
        nZ = 1;
      } else if (side === 1) {
        px = (Math.random() - 0.5) * width;
        pz = -depth * 0.5 - 0.02;
        nZ = -1;
      } else if (side === 2) {
        px = width * 0.5 + 0.02;
        pz = (Math.random() - 0.5) * depth;
        nX = 1;
      } else {
        px = -width * 0.5 - 0.02;
        pz = (Math.random() - 0.5) * depth;
        nX = -1;
      }

      list.push({
        x: px,
        y: waterlineY + (Math.random() - 0.5) * 0.02,
        z: pz,
        vx: nX * (0.25 + Math.random() * 0.6) + (Math.random() - 0.5) * 0.25,
        vy: 0.8 + Math.random() * 1.6,
        vz: nZ * (0.25 + Math.random() * 0.6) + (Math.random() - 0.5) * 0.25,
        life: Math.random() * 0.6,
        maxLife: 0.4 + Math.random() * 0.4,
        baseSize: 0.016 + Math.random() * 0.018, // Refined droplet scale
        side,
      });
    }
    dropletsRef.current = list;
  }

  // Pre-calculate baseline perimeter coords for the 48 foam nodes
  const foamNodesRef = useRef<Array<{ x: number; z: number; nx: number; nz: number }>>(null!);
  if (!foamNodesRef.current) {
    const nodes: Array<{ x: number; z: number; nx: number; nz: number }> = [];
    const perSide = Math.floor(FOAM_NODE_COUNT / 4);

    // Front (+Z)
    for (let i = 0; i < perSide; i++) {
      const u = (i / (perSide - 1) - 0.5) * width;
      nodes.push({ x: u, z: depth * 0.5 + 0.015, nx: 0, nz: 1 });
    }
    // Right (+X)
    for (let i = 0; i < perSide; i++) {
      const u = (i / (perSide - 1) - 0.5) * depth;
      nodes.push({ x: width * 0.5 + 0.015, z: u, nx: 1, nz: 0 });
    }
    // Back (-Z)
    for (let i = 0; i < perSide; i++) {
      const u = (0.5 - i / (perSide - 1)) * width;
      nodes.push({ x: u, z: -depth * 0.5 - 0.015, nx: 0, nz: -1 });
    }
    // Left (-X)
    for (let i = 0; i < perSide; i++) {
      const u = (0.5 - i / (perSide - 1)) * depth;
      nodes.push({ x: -width * 0.5 - 0.015, z: u, nx: -1, nz: 0 });
    }
    foamNodesRef.current = nodes;
  }

  // Crisp thin ripple geometry
  const thinRippleGeo = useMemo(() => new THREE.RingGeometry(0.978, 1.0, 48), []);
  const dropletGeo = useMemo(() => new THREE.OctahedronGeometry(1.0, 1), []);
  const foamBubbleGeo = useMemo(() => new THREE.IcosahedronGeometry(1.0, 1), []);

  // 4-sided flared splash crown frustum (cylinder with 4 segments rotated 45 deg)
  const crownGeo = useMemo(() => {
    const rBottom = Math.sqrt(width * width + depth * depth) * 0.51;
    const rTop = rBottom * 1.34;
    const geo = new THREE.CylinderGeometry(rTop, rBottom, 0.36, 4, 1, true);
    geo.rotateY(Math.PI / 4);
    return geo;
  }, [width, depth]);

  // Frame loop
  useFrame(({ clock }, delta) => {
    const dt = Math.min(delta, 0.04);
    const time = clock.getElapsedTime();
    const speedFactor = waveSpeed / 0.05;

    // 1. UPDATE DROPLET PARTICLES
    if (dropletsMeshRef.current) {
      const particles = dropletsRef.current;
      const energy = (isHovered || isActive ? 1.5 : 1.0) * (1.0 + impactFlash * 1.6 + defianceLevel * 2.2);

      for (let i = 0; i < DROPLET_COUNT; i++) {
        const p = particles[i];
        p.life += dt;

        p.x += p.vx * dt;
        p.z += p.vz * dt;
        p.vy -= 6.8 * dt; // Gravity
        p.y += p.vy * dt;

        p.vx *= 0.982;
        p.vz *= 0.982;

        // Respawn upon hitting water surface or age limit
        if (p.y <= waterlineY || p.life >= p.maxLife) {
          p.life = 0;
          p.maxLife = 0.38 + Math.random() * 0.42;
          p.y = waterlineY + (Math.random() - 0.5) * 0.02;

          const side = Math.floor(Math.random() * 4);
          p.side = side;
          let nX = 0;
          let nZ = 0;

          if (side === 0) {
            p.x = (Math.random() - 0.5) * width;
            p.z = depth * 0.5 + 0.015;
            nZ = 1;
          } else if (side === 1) {
            p.x = (Math.random() - 0.5) * width;
            p.z = -depth * 0.5 - 0.015;
            nZ = -1;
          } else if (side === 2) {
            p.x = width * 0.5 + 0.015;
            p.z = (Math.random() - 0.5) * depth;
            nX = 1;
          } else {
            p.x = -width * 0.5 - 0.015;
            p.z = (Math.random() - 0.5) * depth;
            nX = -1;
          }

          p.vx = nX * (0.28 + Math.random() * 0.65) + (Math.random() - 0.5) * 0.28;
          p.vz = nZ * (0.28 + Math.random() * 0.65) + (Math.random() - 0.5) * 0.28;
          p.vy = (0.85 + Math.random() * 1.8) * energy;
        }

        // Calculate aerodynamic stretch along velocity
        const progress = p.life / p.maxLife;
        const envelope = Math.sin(progress * Math.PI);
        const radius = p.baseSize * envelope;
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy + p.vz * p.vz);
        const stretch = radius * (1.0 + Math.min(2.5, speed * 0.4));

        dummyPos.set(p.x, p.y, p.z);
        dummyDir.set(p.vx, p.vy, p.vz).normalize();
        dummyQuat.setFromUnitVectors(upVec, dummyDir.lengthSq() > 0.01 ? dummyDir : upVec);
        dummyScale.set(radius, stretch, radius);

        dummyMatrix.compose(dummyPos, dummyQuat, dummyScale);
        dropletsMeshRef.current.setMatrixAt(i, dummyMatrix);
      }
      dropletsMeshRef.current.instanceMatrix.needsUpdate = true;
    }

    // 2. UPDATE SEA FOAM / FROTH COLLAR (Churning micro-bubbles)
    if (foamMeshRef.current) {
      const nodes = foamNodesRef.current;
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];

        // Froth oscillation
        const pushWave = Math.sin(time * 4.2 * speedFactor + i * 1.1) * 0.035;
        const heightWave = Math.sin(time * 4.8 * speedFactor + i * 1.4) * 0.024;
        const scaleWave = 0.024 + Math.sin(time * 3.4 + i * 0.8) * 0.012;

        dummyPos.set(
          node.x + node.nx * (0.025 + pushWave),
          waterlineY + 0.01 + heightWave,
          node.z + node.nz * (0.025 + pushWave)
        );

        dummyScale.set(scaleWave, scaleWave * 0.6, scaleWave);
        dummyQuat.setFromAxisAngle(upVec, time * 0.6 + i);

        dummyMatrix.compose(dummyPos, dummyQuat, dummyScale);
        foamMeshRef.current.setMatrixAt(i, dummyMatrix);
      }
      foamMeshRef.current.instanceMatrix.needsUpdate = true;
    }

    // 3. UPDATE CONCENTRIC WAKE & RIPPLE RINGS
    if (ripplesGroupRef.current) {
      const rings = ripplesGroupRef.current.children as THREE.Mesh[];
      const maxRippleRadius = baseRadius * 2.8;
      const rippleSpeed = 0.48 * speedFactor;

      for (let k = 0; k < rings.length; k++) {
        const ring = rings[k];
        const phase = (time * rippleSpeed + k / RIPPLE_COUNT) % 1.0;

        // Smooth expanding radius
        const curRadius = baseRadius * 0.98 + phase * (maxRippleRadius - baseRadius);
        ring.scale.set(curRadius, curRadius, 1);

        // Opacity ramps up then smoothly diffuses
        const opacity =
          Math.sin(phase * Math.PI) *
          Math.pow(1.0 - phase, 0.5) *
          (isHovered || isActive ? 0.9 : 0.55);

        const mat = ring.material as THREE.MeshBasicMaterial;
        if (mat) {
          mat.opacity = opacity;
        }
      }
    }

    // 4. UPDATE TRANSLUCENT FLARING WATER SPLASH CROWN
    if (crownMeshRef.current && crownWireRef.current) {
      const pulse = Math.sin(time * 3.0 * speedFactor) * 0.05;
      const boost = isHovered || isActive ? 0.08 : 0;
      const curH = 0.32 + pulse + boost + impactFlash * 0.2;

      crownMeshRef.current.scale.set(1.0 + pulse * 0.3, curH, 1.0 + pulse * 0.3);
      crownMeshRef.current.position.y = waterlineY + curH * 0.46;

      crownWireRef.current.scale.copy(crownMeshRef.current.scale);
      crownWireRef.current.position.copy(crownMeshRef.current.position);

      const crownMat = crownMeshRef.current.material as THREE.MeshBasicMaterial;
      const wireMat = crownWireRef.current.material as THREE.MeshBasicMaterial;

      if (crownMat) {
        crownMat.opacity = Math.min(0.35, (isHovered || isActive ? 0.24 : 0.12) + impactFlash * 0.25);
      }
      if (wireMat) {
        wireMat.opacity = Math.min(0.5, (isHovered || isActive ? 0.38 : 0.2) + impactFlash * 0.3);
      }
    }

    // 5. UPDATE INSTANT SPLASH SHOCKWAVE BURST RING
    if (burstRingMeshRef.current && burstState.current.active) {
      const b = burstState.current;
      b.radius += dt * 8.2;
      b.opacity -= dt * 2.6;

      if (b.opacity <= 0 || b.radius >= b.maxRadius) {
        b.active = false;
        b.opacity = 0;
      }

      burstRingMeshRef.current.scale.set(b.radius, b.radius, 1);
      const bMat = burstRingMeshRef.current.material as THREE.MeshBasicMaterial;
      if (bMat) {
        bMat.opacity = Math.max(0, b.opacity);
      }
    }
  });

  return (
    <group>
      {/* 1. Concentric Expanding Water Ripples (Razor-sharp liquid rings) */}
      <group
        ref={ripplesGroupRef}
        position={[0, waterlineY + 0.015, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        {Array.from({ length: RIPPLE_COUNT }).map((_, i) => (
          <mesh key={i} geometry={thinRippleGeo}>
            <meshBasicMaterial
              color={waterColor}
              transparent
              opacity={0.45}
              side={THREE.DoubleSide}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        ))}
      </group>

      {/* 2. Permanent Waterline Hull Border (Sharp Water-Glass Seal) */}
      <mesh
        position={[0, waterlineY + 0.02, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[baseRadius * 0.95, baseRadius * 1.05, 48]} />
        <meshBasicMaterial
          color={isHovered || isActive ? highlightColor : waterColor}
          transparent
          opacity={isHovered || isActive ? 0.85 : 0.45}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* 3. Flared Holographic Water Splash Crown Mesh */}
      <mesh
        ref={crownMeshRef}
        geometry={crownGeo}
        position={[0, waterlineY + 0.16, 0]}
      >
        <meshBasicMaterial
          color={iceWhiteColor}
          transparent
          opacity={0.15}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* 3b. Cyber Liquid Splash Crown Wireframe Accent */}
      <mesh
        ref={crownWireRef}
        geometry={crownGeo}
        position={[0, waterlineY + 0.16, 0]}
      >
        <meshBasicMaterial
          color={waterColor}
          wireframe
          transparent
          opacity={0.25}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* 4. Turbulent Sea Foam Collar (48 micro-bubbles) */}
      <instancedMesh
        ref={foamMeshRef}
        args={[foamBubbleGeo, undefined, FOAM_NODE_COUNT]}
      >
        <meshBasicMaterial
          color={iceWhiteColor}
          transparent
          opacity={isHovered || isActive ? 0.85 : 0.55}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </instancedMesh>

      {/* 5. 3D Ballistic Water Droplet Spray Particles (64 droplets) */}
      <instancedMesh
        ref={dropletsMeshRef}
        args={[dropletGeo, undefined, DROPLET_COUNT]}
      >
        <meshBasicMaterial
          color={isHovered || isActive ? highlightColor : iceWhiteColor}
          transparent
          opacity={0.85}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </instancedMesh>

      {/* 6. High-Energy Water Splash Shockwave Burst Ring */}
      <mesh
        ref={burstRingMeshRef}
        geometry={thinRippleGeo}
        position={[0, waterlineY + 0.02, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <meshBasicMaterial
          color={highlightColor}
          transparent
          opacity={0}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

export default WaterSplashEffect;
