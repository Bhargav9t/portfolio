"use client";

import React from "react";
import type { BuildingConfig } from "@/data/portfolioData";
import { MessageBottle } from "./MessageBottle";
import * as THREE from "three";

export interface MonolithProps {
  config: BuildingConfig;
  accentColor: number;
  isActive: boolean;
  onSelect: (id: BuildingConfig["id"]) => void;
  registerRef?: (ref: THREE.Group | null) => void;
  registerMaterial?: (mat: THREE.MeshPhysicalMaterial | null) => void;
  waveSpeed?: number;
  impactFlash?: number;
  splashTrigger?: number;
  defianceLevel?: number;
  escapeBoost?: number;
  blackHolePos?: [number, number, number];
}

export function Monolith(props: MonolithProps) {
  return <MessageBottle {...props} />;
}

export default Monolith;
