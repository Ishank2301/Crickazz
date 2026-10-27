import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import {
  RotateCcw,
  Play,
  Pause,
  Compass,
  Eye,
  Layers,
  ChevronDown,
  ChevronUp,
  Target,
  Camera,
  UserCheck,
  Activity,
  Zap,
  Flame,
  Clock,
  Sparkles,
  ShieldAlert,
  Sliders,
} from 'lucide-react';
import { sounds } from '../utils/audio';

export type PresetCameraView = 'birds_eye' | 'bowlers_end' | 'umpire_view' | 'stump_cam';

export interface CameraViewConfig {
  id: PresetCameraView;
  label: string;
  badge: string;
  sublabel: string;
  position: THREE.Vector3;
  target: THREE.Vector3;
  spherical: { radius: number; theta: number; phi: number };
}

export const PRESET_CAMERA_VIEWS: CameraViewConfig[] = [
  {
    id: 'birds_eye',
    label: "Bird's Eye",
    badge: '360° Aerial',
    sublabel: 'Full pitch, field rings & boundary overview from above',
    position: new THREE.Vector3(0, 36, 0.05),
    target: new THREE.Vector3(0, 0, 0),
    spherical: { radius: 36, theta: 0, phi: 0.06 },
  },
  {
    id: 'bowlers_end',
    label: "Bowler's End",
    badge: 'Trajectory',
    sublabel: 'Behind bowler following swing, seam & dip down the wicket',
    position: new THREE.Vector3(0, 3.8, -19),
    target: new THREE.Vector3(0, 0.8, 8),
    spherical: { radius: 24, theta: Math.PI, phi: 1.25 },
  },
  {
    id: 'umpire_view',
    label: 'Umpire View',
    badge: 'LBW Cam',
    sublabel: '1.75m eye level behind non-striker stumps evaluating LBW line',
    position: new THREE.Vector3(0, 1.75, -12.5),
    target: new THREE.Vector3(0, 0.71, 10),
    spherical: { radius: 18, theta: Math.PI, phi: 1.48 },
  },
  {
    id: 'stump_cam',
    label: 'Stump Cam',
    badge: 'Impact Replay',
    sublabel: 'Close-up camera behind striker stumps inspecting wicket collision',
    position: new THREE.Vector3(0, 1.35, 6.8),
    target: new THREE.Vector3(0, 0.65, 10.0),
    spherical: { radius: 3.5, theta: Math.PI, phi: 1.38 },
  },
];

export interface DeliveryDrs {
  pitching: 'IN LINE' | 'OUTSIDE OFF' | 'OUTSIDE LEG';
  impact: 'IN LINE' | 'OUTSIDE OFF' | 'UMPIRE CALL';
  wickets: 'HITTING' | 'MISSING' | 'UMPIRE CALL';
  verdict: 'OUT' | 'NOT OUT';
  deviation: string;
  releaseHeight: string;
  bounceHeight: string;
}

export interface ImpactInfo {
  stump: string;
  contactPoint: { x: number; y: number; z: number };
  impactSpeedKmh: number;
  type: 'BOWLED' | 'LBW_PAD' | 'BEATEN';
  badge: string;
  badgeColor: 'rose' | 'amber' | 'slate' | 'emerald';
  title: string;
  description: string;
  bailsFly: boolean;
  stumpHitName: 'Leg Stump' | 'Off Stump' | 'Middle Stump' | 'Pad' | 'Air';
  normalizedStumpX: number; // -1 (off) to 1 (leg) for diagram
  normalizedStumpY: number; // 0 (base) to 1 (bail)
}

export interface DeliveryPreset {
  id: string;
  name: string;
  speedKmh: number;
  type: string;
  bowler: string;
  description: string;
  curve: THREE.Vector3[];
  bounceIndex: number;
  hitStumps: boolean;
  drs: DeliveryDrs;
  impactInfo: ImpactInfo;
}

export interface WagonShot {
  id: string;
  runs: number;
  shotName: string;
  distanceMeters: number;
  angleRad: number;
  color: number;
  height: number;
  batsman: string;
}

export const DELIVERIES: DeliveryPreset[] = [
  {
    id: 'yorker',
    name: '148 km/h Inswinging Yorker',
    speedKmh: 148,
    type: 'Fast Yorker',
    bowler: 'Mitchell Starc',
    description: 'Devastating dipping yorker shattering the base of leg stump.',
    curve: [
      new THREE.Vector3(0.2, 2.15, -10),
      new THREE.Vector3(0.1, 1.1, -3),
      new THREE.Vector3(-0.15, 0.08, 8.8), // deep bounce point
      new THREE.Vector3(-0.25, 0.35, 9.8),
      new THREE.Vector3(-0.28, 0.45, 10.0), // crashes into stump!
    ],
    bounceIndex: 2,
    hitStumps: true,
    drs: {
      pitching: 'IN LINE',
      impact: 'IN LINE',
      wickets: 'HITTING',
      verdict: 'OUT',
      deviation: '-3.1° Inswing',
      releaseHeight: '2.15m',
      bounceHeight: '0.35m',
    },
    impactInfo: {
      stump: 'Leg Stump (Base)',
      contactPoint: { x: -0.28, y: 0.45, z: 10.0 },
      impactSpeedKmh: 141,
      type: 'BOWLED',
      badge: 'WICKET · BOWLED',
      badgeColor: 'rose',
      title: 'Starc 148 km/h Inswinging Yorker',
      description: 'Dipping yorker shatters the base of leg stump at 141 km/h. Both bails ejected 2.8m into the air.',
      bailsFly: true,
      stumpHitName: 'Leg Stump',
      normalizedStumpX: 0.72,
      normalizedStumpY: 0.32,
    },
  },
  {
    id: 'outswinger',
    name: '144 km/h Lethal Outswinger',
    speedKmh: 144,
    type: 'Pace / Seam',
    bowler: 'Jasprit Bumrah',
    description: 'Pitches on middle, shapes away late beating the outside edge.',
    curve: [
      new THREE.Vector3(0, 2.1, -10),
      new THREE.Vector3(0.05, 1.3, -5),
      new THREE.Vector3(0.1, 0.08, 6.2), // pitch bounce point
      new THREE.Vector3(0.45, 0.65, 8.5),
      new THREE.Vector3(0.85, 0.72, 10), // beats bat
    ],
    bounceIndex: 2,
    hitStumps: false,
    drs: {
      pitching: 'IN LINE',
      impact: 'OUTSIDE OFF',
      wickets: 'MISSING',
      verdict: 'NOT OUT',
      deviation: '+2.4° Away Seam',
      releaseHeight: '2.10m',
      bounceHeight: '0.65m',
    },
    impactInfo: {
      stump: 'Beats Outside Edge',
      contactPoint: { x: 0.85, y: 0.72, z: 10.0 },
      impactSpeedKmh: 136,
      type: 'BEATEN',
      badge: 'BEATS OUTSIDE EDGE',
      badgeColor: 'slate',
      title: 'Bumrah 144 km/h Outswinger Miss',
      description: 'Late deviation shapes 4.8cm past the outside edge. Wicketkeeper collects at waist height.',
      bailsFly: false,
      stumpHitName: 'Air',
      normalizedStumpX: -1.35,
      normalizedStumpY: 0.78,
    },
  },
  {
    id: 'googly',
    name: '89 km/h Deceptive Googly',
    speedKmh: 89,
    type: 'Wrist Spin',
    bowler: 'Rashid Khan',
    description: 'Disguised back-of-the-hand wrong un turns back sharply between bat and pad.',
    curve: [
      new THREE.Vector3(0.3, 1.9, -10),
      new THREE.Vector3(0.35, 1.5, -4),
      new THREE.Vector3(0.5, 0.08, 6.8), // wide bounce
      new THREE.Vector3(0.1, 0.5, 8.8),
      new THREE.Vector3(-0.12, 0.65, 10.0), // clips off-stump!
    ],
    bounceIndex: 2,
    hitStumps: true,
    drs: {
      pitching: 'OUTSIDE OFF',
      impact: 'IN LINE',
      wickets: 'HITTING',
      verdict: 'OUT',
      deviation: '-4.6° Sharp Turn',
      releaseHeight: '1.90m',
      bounceHeight: '0.50m',
    },
    impactInfo: {
      stump: 'Off Stump (Top Notch)',
      contactPoint: { x: -0.12, y: 0.65, z: 10.0 },
      impactSpeedKmh: 83,
      type: 'BOWLED',
      badge: 'WICKET · BOWLED',
      badgeColor: 'rose',
      title: 'Rashid Khan 89 km/h Googly Stump Impact',
      description: 'Disguised googly cuts back sharply, clipping the top of off stump and dislodging off-bail.',
      bailsFly: true,
      stumpHitName: 'Off Stump',
      normalizedStumpX: -0.72,
      normalizedStumpY: 0.88,
    },
  },
  {
    id: 'bouncer',
    name: '142 km/h Sharp Bouncer',
    speedKmh: 142,
    type: 'Short Pitch',
    bowler: 'Pat Cummins',
    description: 'Digs in short halfway down the pitch, steep bounce over batsman helmet.',
    curve: [
      new THREE.Vector3(-0.1, 2.2, -10),
      new THREE.Vector3(-0.05, 1.4, -6),
      new THREE.Vector3(0.0, 0.08, 0.5), // short bounce
      new THREE.Vector3(0.15, 1.6, 6.5),
      new THREE.Vector3(0.25, 2.1, 10), // over shoulder
    ],
    bounceIndex: 2,
    hitStumps: false,
    drs: {
      pitching: 'IN LINE',
      impact: 'IN LINE',
      wickets: 'MISSING',
      verdict: 'NOT OUT',
      deviation: '+1.1° Bounce Lift',
      releaseHeight: '2.20m',
      bounceHeight: '1.60m',
    },
    impactInfo: {
      stump: 'Over Wickets & Helmet',
      contactPoint: { x: 0.25, y: 2.1, z: 10.0 },
      impactSpeedKmh: 132,
      type: 'BEATEN',
      badge: 'BOUNCER · OVER STUMPS',
      badgeColor: 'amber',
      title: 'Cummins 142 km/h Bouncer Lift',
      description: 'Steep bounce clears the stump line by 1.38m. Batsman ducks comfortably underneath.',
      bailsFly: false,
      stumpHitName: 'Air',
      normalizedStumpX: 0.2,
      normalizedStumpY: 1.8,
    },
  },
  {
    id: 'offbreak',
    name: '86 km/h Drifting Off-Break',
    speedKmh: 86,
    type: 'Finger Spin',
    bowler: 'Ravichandran Ashwin',
    description: 'Flights outside off with dip, bites off the turf and spins into the pads.',
    curve: [
      new THREE.Vector3(-0.4, 2.0, -10),
      new THREE.Vector3(-0.45, 1.6, -3),
      new THREE.Vector3(-0.6, 0.08, 6.5), // bounce outside off
      new THREE.Vector3(-0.25, 0.6, 8.6),
      new THREE.Vector3(0.1, 0.7, 10.0),
    ],
    bounceIndex: 2,
    hitStumps: false,
    drs: {
      pitching: 'OUTSIDE OFF',
      impact: 'IN LINE',
      wickets: 'UMPIRE CALL',
      verdict: 'NOT OUT',
      deviation: '+3.8° Drift & Spin',
      releaseHeight: '2.00m',
      bounceHeight: '0.60m',
    },
    impactInfo: {
      stump: 'Front Pad (Knee Roll)',
      contactPoint: { x: 0.1, y: 0.7, z: 10.0 },
      impactSpeedKmh: 81,
      type: 'LBW_PAD',
      badge: 'LBW IMPACT · PAD IN-LINE',
      badgeColor: 'amber',
      title: 'Ashwin 86 km/h Off-Break Pad Impact',
      description: 'Spins into the knee roll 54cm above turf in-line with middle stump. Umpire call on height.',
      bailsFly: false,
      stumpHitName: 'Pad',
      normalizedStumpX: 0.15,
      normalizedStumpY: 0.62,
    },
  },
];

export const WAGON_SHOTS: WagonShot[] = [
  { id: '1', runs: 6, shotName: 'Cover Drive Loft', distanceMeters: 88, angleRad: -Math.PI * 0.65, color: 0xa855f7, height: 8.5, batsman: 'Virat Kohli' },
  { id: '2', runs: 6, shotName: 'Pull over Mid-Wicket', distanceMeters: 94, angleRad: Math.PI * 0.45, color: 0xa855f7, height: 9.2, batsman: 'Rohit Sharma' },
  { id: '3', runs: 4, shotName: 'Punch through Extra Cover', distanceMeters: 74, angleRad: -Math.PI * 0.8, color: 0x10b981, height: 0.5, batsman: 'Virat Kohli' },
  { id: '4', runs: 4, shotName: 'Straight Drive Down Ground', distanceMeters: 78, angleRad: -Math.PI * 0.5, color: 0x10b981, height: 0.4, batsman: 'KL Rahul' },
  { id: '5', runs: 4, shotName: 'Square Cut Past Point', distanceMeters: 69, angleRad: -Math.PI * 0.15, color: 0x10b981, height: 0.6, batsman: 'Rishabh Pant' },
  { id: '6', runs: 4, shotName: 'Sweep to Deep Fine Leg', distanceMeters: 66, angleRad: Math.PI * 0.85, color: 0x10b981, height: 0.5, batsman: 'Suryakumar Yadav' },
  { id: '7', runs: 6, shotName: 'Straight Lofted Six', distanceMeters: 96, angleRad: -Math.PI * 0.5, color: 0xf59e0b, height: 10.5, batsman: 'MS Dhoni' },
  { id: '8', runs: 2, shotName: 'Flick into Mid-Wicket Gap', distanceMeters: 55, angleRad: Math.PI * 0.35, color: 0x38bdf8, height: 1.2, batsman: 'Hardik Pandya' },
  { id: '9', runs: 1, shotName: 'Steer to Third Man', distanceMeters: 42, angleRad: -Math.PI * 0.05, color: 0x94a3b8, height: 0.3, batsman: 'Ravindra Jadeja' },
  { id: '10', runs: 6, shotName: 'Helicopter over Long-on', distanceMeters: 102, angleRad: Math.PI * 0.6, color: 0xf59e0b, height: 11.0, batsman: 'MS Dhoni' },
];

export const BOUNDARY_RADIUS = 38.0;

export interface BoundaryShot {
  id: string;
  name: string;
  batsman: string;
  shotType: string;
  speedKmh: number;
  expectedOutcome: 'FOUR' | 'SIX';
  curve: THREE.Vector3[];
  description: string;
}

export interface BoundaryCollisionInfo {
  hasCollided: boolean;
  contactPoint: { x: number; y: number; z: number };
  horizontalDistance: number;
  elevationAtCrossing: number;
  crossingProgress: number;
  angleDeg: number;
  sectorName: string;
  isGroundBoundary: boolean;
  runs: 4 | 6;
  badge: string;
  title: string;
  description: string;
  collisionType: 'ROPE_STRIKE_FOUR' | 'AERIAL_CLEARANCE_SIX';
}

/**
 * Resolves cricket stadium fielding sector name from polar angle in radians.
 */
export function getBoundarySectorName(angleRad: number): string {
  let deg = (angleRad * (180 / Math.PI)) % 360;
  if (deg < 0) deg += 360;

  if (deg >= 22.5 && deg < 67.5) return 'Deep Extra Cover';
  if (deg >= 67.5 && deg < 112.5) return 'Long Off';
  if (deg >= 112.5 && deg < 157.5) return 'Long On';
  if (deg >= 157.5 && deg < 202.5) return 'Deep Mid-Wicket';
  if (deg >= 202.5 && deg < 247.5) return 'Deep Square Leg';
  if (deg >= 247.5 && deg < 292.5) return 'Deep Fine Leg';
  if (deg >= 292.5 && deg < 337.5) return 'Third Man';
  return 'Deep Point / Backward Point';
}

/**
 * Calculates trajectory intersection and collision telemetry with the 3D stadium boundary rope (R = 38.0m).
 */
export function checkBoundaryCollision(
  curvePoints: THREE.Vector3[],
  boundaryRadius: number = BOUNDARY_RADIUS
): BoundaryCollisionInfo | null {
  if (!curvePoints || curvePoints.length < 2) return null;

  const spline = new THREE.CatmullRomCurve3(curvePoints);
  const samples = 80;

  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const pt = spline.getPoint(t);
    const horizDist = Math.sqrt(pt.x * pt.x + pt.z * pt.z);

    if (horizDist >= boundaryRadius) {
      const angleRad = Math.atan2(pt.z, pt.x);
      const angleDeg = ((angleRad * 180) / Math.PI + 360) % 360;
      const sectorName = getBoundarySectorName(angleRad);
      const isGround = pt.y <= 0.40;

      return {
        hasCollided: true,
        contactPoint: {
          x: Number((boundaryRadius * Math.cos(angleRad)).toFixed(2)),
          y: Number(pt.y.toFixed(2)),
          z: Number((boundaryRadius * Math.sin(angleRad)).toFixed(2)),
        },
        horizontalDistance: Number(horizDist.toFixed(2)),
        elevationAtCrossing: Number(pt.y.toFixed(2)),
        crossingProgress: Number(t.toFixed(3)),
        angleDeg: Number(angleDeg.toFixed(1)),
        sectorName,
        isGroundBoundary: isGround,
        runs: isGround ? 4 : 6,
        badge: isGround ? 'BOUNDARY · 4 RUNS' : 'MAXIMUM · 6 RUNS',
        title: isGround ? 'Ground Boundary Rope Impact' : 'Aerial Boundary Rope Clearance',
        description: isGround
          ? `Ball struck the 38.0m boundary rope cushion at ${sectorName} (${angleDeg.toFixed(0)}°) at ${pt.y.toFixed(2)}m elevation. 4 runs scored.`
          : `Ball sailed over the 38.0m boundary rope at ${sectorName} at ${pt.y.toFixed(1)}m elevation into the crowd. 6 runs scored.`,
        collisionType: isGround ? 'ROPE_STRIKE_FOUR' : 'AERIAL_CLEARANCE_SIX',
      };
    }
  }

  return null;
}

export const BOUNDARY_SHOTS: BoundaryShot[] = [
  {
    id: 'cover_drive_four',
    name: '138 km/h Cover Drive (Rope Impact)',
    batsman: 'Virat Kohli',
    shotType: 'Ground Stroke',
    speedKmh: 138,
    expectedOutcome: 'FOUR',
    description: 'Crisp cover drive along the turf striking the deep extra cover boundary rope cushion.',
    curve: [
      new THREE.Vector3(0, 0.4, 10.0),
      new THREE.Vector3(12.0, 0.12, 17.5),
      new THREE.Vector3(22.0, 0.08, 24.0),
      new THREE.Vector3(27.0, 0.08, 27.0), // Hits boundary rope R=38m at 45 deg
    ],
  },
  {
    id: 'straight_drive_four',
    name: '144 km/h Straight Drive (Long-Off Rope)',
    batsman: 'KL Rahul',
    shotType: 'Ground Stroke',
    speedKmh: 144,
    expectedOutcome: 'FOUR',
    description: 'Bullet tracer down the ground past non-striker hitting Long-Off boundary padding.',
    curve: [
      new THREE.Vector3(0, 0.4, 10.0),
      new THREE.Vector3(0.0, 0.12, -2.0),
      new THREE.Vector3(0.0, 0.08, -20.0),
      new THREE.Vector3(0.0, 0.08, -38.2), // Hits Long-off boundary rope
    ],
  },
  {
    id: 'square_cut_four',
    name: '136 km/h Backward Point Cut (Rope Strike)',
    batsman: 'Rishabh Pant',
    shotType: 'Ground Stroke',
    speedKmh: 136,
    expectedOutcome: 'FOUR',
    description: 'Fierce cut beating backward point into deep point boundary rope.',
    curve: [
      new THREE.Vector3(0, 0.4, 10.0),
      new THREE.Vector3(14.0, 0.12, 9.0),
      new THREE.Vector3(26.0, 0.08, 7.5),
      new THREE.Vector3(38.1, 0.08, 5.8), // Hits Deep Point boundary
    ],
  },
  {
    id: 'pull_shot_six',
    name: '142 km/h Pull Shot Maximum (Clears Rope)',
    batsman: 'Rohit Sharma',
    shotType: 'Aerial Maximum',
    speedKmh: 142,
    expectedOutcome: 'SIX',
    description: 'Soaring pull shot clearing the deep mid-wicket boundary rope by 4.8 meters.',
    curve: [
      new THREE.Vector3(0, 0.4, 10.0),
      new THREE.Vector3(-12.0, 5.8, 17.0),
      new THREE.Vector3(-22.0, 7.4, 23.0),
      new THREE.Vector3(-32.0, 4.8, 30.0), // Clears 38m rope at ~4.8m elevation
      new THREE.Vector3(-38.0, 2.2, 36.0),
    ],
  },
  {
    id: 'helicopter_six',
    name: '152 km/h Helicopter Six (Over Long-On)',
    batsman: 'MS Dhoni',
    shotType: 'Aerial Maximum',
    speedKmh: 152,
    expectedOutcome: 'SIX',
    description: 'Trademark helicopter whip clearing the long-on boundary rope by 6.2 meters.',
    curve: [
      new THREE.Vector3(0, 0.4, 10.0),
      new THREE.Vector3(-6.0, 7.2, -5.0),
      new THREE.Vector3(-12.0, 9.5, -20.0),
      new THREE.Vector3(-15.0, 6.2, -37.0), // Clears rope at Long-On
      new THREE.Vector3(-18.0, 3.0, -44.0),
    ],
  },
];

/**
 * Creates high-resolution procedural grass & soil shader material for the 22-yard cricket pitch.
 * Blends compacted clay center, longitudinal grass fibers, mowing lawn stripes, bowler/batsman
 * crease wear scuffs, and specular blade glint.
 */
export function createPitchGrassMaterial(options?: {
  sunDirection?: THREE.Vector3;
}): THREE.ShaderMaterial {
  const sunDir = options?.sunDirection ?? new THREE.Vector3(15, 25, -15).normalize();

  const vertexShader = /* glsl */ `
    varying vec2 vUv;
    varying vec3 vWorldPosition;
    varying vec3 vNormal;

    void main() {
      vUv = uv;
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPos.xyz;
      vNormal = normalize(normalMatrix * normal);
      gl_Position = projectionMatrix * viewMatrix * worldPos;
    }
  `;

  const fragmentShader = /* glsl */ `
    precision highp float;

    uniform float uTime;
    uniform vec3 uGrassColorBase;
    uniform vec3 uGrassColorLawn;
    uniform vec3 uPitchSoilColor;
    uniform vec3 uPitchDustColor;
    uniform vec3 uWearMarkColor;
    uniform vec3 uSunDirection;
    uniform float uStripeFrequency;

    varying vec2 vUv;
    varying vec3 vWorldPosition;
    varying vec3 vNormal;

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
    }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(
        mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
        mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
        u.y
      );
    }

    float fbm(vec2 p) {
      float v = 0.0;
      float a = 0.5;
      mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
      for (int i = 0; i < 4; ++i) {
        v += a * noise(p);
        p = rot * p * 2.1 + vec2(100.0);
        a *= 0.5;
      }
      return v;
    }

    void main() {
      // 1. High-frequency longitudinal grass blade fibers along pitch length
      float bladeNoise = noise(vUv * vec2(180.0, 420.0));
      float fineFibers = fbm(vUv * vec2(60.0, 200.0));

      // 2. Mowing lawn roller stripes across length
      float stripe = sin(vWorldPosition.z * uStripeFrequency) * 0.5 + 0.5;
      vec3 grassTurf = mix(uGrassColorBase, uGrassColorLawn, stripe * 0.4 + bladeNoise * 0.25);

      // 3. Compacted central clay strip (22 yards central track)
      float distFromCenter = abs(vUv.x - 0.5) * 2.0; // 0 at center, 1 at edge
      float soilNoise = fbm(vUv * vec2(30.0, 60.0));
      vec3 pitchClay = mix(uPitchSoilColor, uPitchDustColor, soilNoise);

      // Blending central clay strip to lush grassy borders
      float turfBlend = smoothstep(0.40, 0.82, distFromCenter + (fineFibers - 0.5) * 0.12);
      vec3 surfaceColor = mix(pitchClay, grassTurf, turfBlend);

      // 4. Bowler and Batsman crease landing wear marks
      float batsmanCreaseWear = 1.0 - smoothstep(0.0, 0.07, abs(vUv.y - 0.91));
      float bowlerStrideWear = 1.0 - smoothstep(0.0, 0.07, abs(vUv.y - 0.09));
      float goodLengthWear = (1.0 - smoothstep(0.0, 0.06, abs(vUv.y - 0.76))) * (1.0 - distFromCenter);

      float totalWear = clamp((batsmanCreaseWear * 0.85 + bowlerStrideWear * 0.8 + goodLengthWear * 0.6) * (1.0 - distFromCenter * 0.45), 0.0, 1.0);
      float wearRoughness = fbm(vUv * vec2(50.0, 100.0));
      totalWear *= smoothstep(0.2, 0.8, wearRoughness);

      // Darken and abrade into scuffed dry clay where spikes dig in
      surfaceColor = mix(surfaceColor, uWearMarkColor, totalWear * 0.8);

      // 5. Directional sun lighting & subtle blade glint
      vec3 N = normalize(vNormal);
      vec3 L = normalize(uSunDirection);
      float NdotL = max(dot(N, L), 0.0);
      float diffuse = NdotL * 0.82 + 0.28;

      vec3 V = normalize(cameraPosition - vWorldPosition);
      vec3 H = normalize(L + V);
      float NdotH = max(dot(N, H), 0.0);
      float specular = pow(NdotH, 32.0) * (1.0 - totalWear) * (turfBlend * 0.35 + 0.08);

      // Subtle dynamic wind shimmer
      float wind = sin(uTime * 2.0 + vWorldPosition.x * 2.5 + vWorldPosition.z * 1.2) * 0.02 * turfBlend;

      vec3 finalColor = surfaceColor * (diffuse + wind) + vec3(specular * 0.28);
      gl_FragColor = vec4(finalColor, 1.0);
    }
  `;

  return new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      uTime: { value: 0.0 },
      uGrassColorBase: { value: new THREE.Color(0x235227) },
      uGrassColorLawn: { value: new THREE.Color(0x387d3d) },
      uPitchSoilColor: { value: new THREE.Color(0xc9a463) },
      uPitchDustColor: { value: new THREE.Color(0xdfc085) },
      uWearMarkColor: { value: new THREE.Color(0x8a6231) },
      uSunDirection: { value: sunDir },
      uStripeFrequency: { value: 1.8 },
    },
    side: THREE.FrontSide,
  });
}

export function CricketPitch3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeMode, setActiveMode] = useState<'pitch' | 'trajectory' | 'wagon' | 'boundary'>('trajectory');
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryPreset>(DELIVERIES[0]);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isDockCollapsed, setIsDockCollapsed] = useState<boolean>(false);
  const [activeCameraView, setActiveCameraView] = useState<PresetCameraView>('bowlers_end');

  // Impact Replay States
  const [isSlowMo, setIsSlowMo] = useState<boolean>(false);
  const [isImpactFrozen, setIsImpactFrozen] = useState<boolean>(false);
  const [showImpactOverlay, setShowImpactOverlay] = useState<boolean>(true);
  const [isImpactNear, setIsImpactNear] = useState<boolean>(false);

  // Boundary 3D & Collision States
  const [selectedBoundaryShot, setSelectedBoundaryShot] = useState<BoundaryShot>(BOUNDARY_SHOTS[0]);
  const [boundaryCollisionInfo, setBoundaryCollisionInfo] = useState<BoundaryCollisionInfo | null>(() =>
    checkBoundaryCollision(BOUNDARY_SHOTS[0].curve)
  );
  const [isBoundaryColliding, setIsBoundaryColliding] = useState<boolean>(false);

  // Mutable refs to prevent stale closure in animation loop
  const activeModeRef = useRef<'pitch' | 'trajectory' | 'wagon' | 'boundary'>(activeMode);
  activeModeRef.current = activeMode;
  const selectedDeliveryRef = useRef<DeliveryPreset>(selectedDelivery);
  selectedDeliveryRef.current = selectedDelivery;
  const selectedBoundaryShotRef = useRef<BoundaryShot>(selectedBoundaryShot);
  selectedBoundaryShotRef.current = selectedBoundaryShot;
  const isBoundaryCollidingRef = useRef<boolean>(isBoundaryColliding);
  isBoundaryCollidingRef.current = isBoundaryColliding;
  const isPlayingRef = useRef<boolean>(isPlaying);
  isPlayingRef.current = isPlaying;
  const isSlowMoRef = useRef<boolean>(isSlowMo);
  isSlowMoRef.current = isSlowMo;
  const isImpactFrozenRef = useRef<boolean>(isImpactFrozen);
  isImpactFrozenRef.current = isImpactFrozen;

  // Three.js scene refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const boundaryRopeMeshRef = useRef<THREE.Mesh | null>(null);
  const boundaryLedStripRef = useRef<THREE.Mesh | null>(null);
  const boundaryWedgesGroupRef = useRef<THREE.Group | null>(null);
  const boundaryImpactBeaconGroupRef = useRef<THREE.Group | null>(null);
  const boundaryTrajectoryLineRef = useRef<THREE.Line | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Hawkeye objects
  const ballMeshRef = useRef<THREE.Mesh | null>(null);
  const hawkeyePreLineRef = useRef<THREE.Line | null>(null);
  const hawkeyePostLineRef = useRef<THREE.Line | null>(null);
  const hawkeyeProjectedLineRef = useRef<THREE.Line | null>(null);
  const bounceMarkerRef = useRef<THREE.Mesh | null>(null);
  const pitchGrassShaderRef = useRef<THREE.ShaderMaterial | null>(null);
  const wagonLinesRef = useRef<THREE.Group | null>(null);
  const pitchDimensionGroupRef = useRef<THREE.Group | null>(null);
  const stumpsGroupRef = useRef<THREE.Group | null>(null);
  const bailsMeshRef = useRef<THREE.Mesh[]>([]);
  const ballProgressRef = useRef<number>(0);

  // 3D Impact Replay Shockwave & Laser Anchor Ref
  const impactBeaconGroupRef = useRef<THREE.Group | null>(null);
  const impactRingMeshRef = useRef<THREE.Mesh | null>(null);
  const impactCoreMeshRef = useRef<THREE.Mesh | null>(null);
  const impactAnchorLineRef = useRef<THREE.Line | null>(null);

  // Pre-cached splines for each delivery to prevent runtime allocation
  const curvesCacheRef = useRef<Map<string, THREE.CatmullRomCurve3>>(new Map());

  // Mouse orbit controls
  const isMouseDownRef = useRef<boolean>(false);
  const mousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const cameraTargetRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0.8, 8));
  const cameraSphericalRef = useRef<{ radius: number; theta: number; phi: number }>({
    radius: 24,
    theta: Math.PI,
    phi: 1.25,
  });

  // Camera lerp animation
  const targetCamPosRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 3.8, -19));
  const targetCamLookAtRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0.8, 8));
  const currentCamLookAtRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0.8, 8));
  const isTransitioningCameraRef = useRef<boolean>(false);

  // Re-build or update Hawkeye illuminated trajectory beam
  const updateHawkeyeBeam = useCallback((delivery: DeliveryPreset) => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;

    if (hawkeyePreLineRef.current) scene.remove(hawkeyePreLineRef.current);
    if (hawkeyePostLineRef.current) scene.remove(hawkeyePostLineRef.current);
    if (hawkeyeProjectedLineRef.current) scene.remove(hawkeyeProjectedLineRef.current);

    let curve = curvesCacheRef.current.get(delivery.id);
    if (!curve) {
      curve = new THREE.CatmullRomCurve3(delivery.curve);
      curvesCacheRef.current.set(delivery.id, curve);
    }

    const bouncePointIndex = delivery.bounceIndex;
    const totalPoints = delivery.curve.length;
    const bounceT = bouncePointIndex / (totalPoints - 1);

    const prePoints: THREE.Vector3[] = [];
    const postPoints: THREE.Vector3[] = [];
    const projectedPoints: THREE.Vector3[] = [];

    const segments = 40;
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const pt = curve.getPoint(t);
      if (t <= bounceT) {
        prePoints.push(pt);
      } else {
        if (postPoints.length === 0 && prePoints.length > 0) {
          postPoints.push(prePoints[prePoints.length - 1]);
        }
        postPoints.push(pt);
      }
    }

    const lastPt = delivery.curve[delivery.curve.length - 1];
    const secondLastPt = delivery.curve[delivery.curve.length - 2];
    const dir = new THREE.Vector3().subVectors(lastPt, secondLastPt).normalize();
    projectedPoints.push(lastPt.clone());
    projectedPoints.push(
      new THREE.Vector3(lastPt.x + dir.x * 3.5, Math.max(0.08, lastPt.y + dir.y * 3.5), lastPt.z + dir.z * 3.5)
    );

    // Pre-bounce beam (Glowing Cyan #00f0ff)
    const preGeo = new THREE.BufferGeometry().setFromPoints(prePoints);
    const preMat = new THREE.LineBasicMaterial({
      color: 0x00f0ff,
      linewidth: 3,
      transparent: true,
      opacity: 0.9,
    });
    const preLine = new THREE.Line(preGeo, preMat);
    scene.add(preLine);
    hawkeyePreLineRef.current = preLine;

    // Post-bounce beam (Neon Rose / Amber)
    const postGeo = new THREE.BufferGeometry().setFromPoints(postPoints);
    const postMat = new THREE.LineBasicMaterial({
      color: delivery.hitStumps ? 0xff2e63 : 0xf59e0b,
      linewidth: 3,
      transparent: true,
      opacity: 0.95,
    });
    const postLine = new THREE.Line(postGeo, postMat);
    scene.add(postLine);
    hawkeyePostLineRef.current = postLine;

    // Projected path line
    const projGeo = new THREE.BufferGeometry().setFromPoints(projectedPoints);
    const projMat = new THREE.LineBasicMaterial({
      color: delivery.hitStumps ? 0xff2e63 : 0x94a3b8,
      linewidth: 1,
      transparent: true,
      opacity: 0.45,
    });
    const projLine = new THREE.Line(projGeo, projMat);
    scene.add(projLine);
    hawkeyeProjectedLineRef.current = projLine;

    // Position pitch bounce marker
    if (bounceMarkerRef.current && delivery.curve.length > bouncePointIndex) {
      const bouncePt = delivery.curve[bouncePointIndex];
      bounceMarkerRef.current.position.set(bouncePt.x, 0.045, bouncePt.z);
      bounceMarkerRef.current.visible = true;
    }

    // Position impact beacon initially
    if (impactBeaconGroupRef.current && delivery.impactInfo) {
      const cp = delivery.impactInfo.contactPoint;
      impactBeaconGroupRef.current.position.set(cp.x, cp.y, cp.z);
      if (impactCoreMeshRef.current) {
        (impactCoreMeshRef.current.material as THREE.MeshBasicMaterial).color.set(
          delivery.hitStumps ? 0xff2e63 : 0xf59e0b
        );
      }
      if (impactRingMeshRef.current) {
        (impactRingMeshRef.current.material as THREE.MeshBasicMaterial).color.set(
          delivery.hitStumps ? 0xff2e63 : 0xf59e0b
        );
      }
    }
  }, []);

  // Re-build or update Boundary Trajectory Beam
  const updateBoundaryBeam = useCallback((shot: BoundaryShot) => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;

    if (boundaryTrajectoryLineRef.current) {
      scene.remove(boundaryTrajectoryLineRef.current);
    }

    let curve = curvesCacheRef.current.get(shot.id);
    if (!curve) {
      curve = new THREE.CatmullRomCurve3(shot.curve);
      curvesCacheRef.current.set(shot.id, curve);
    }

    const points = curve.getPoints(50);
    const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
    const isSix = shot.expectedOutcome === 'SIX';
    const lineMat = new THREE.LineBasicMaterial({
      color: isSix ? 0xa855f7 : 0x10b981,
      linewidth: 3,
      transparent: true,
      opacity: 0.9,
    });
    const line = new THREE.Line(lineGeo, lineMat);
    scene.add(line);
    boundaryTrajectoryLineRef.current = line;
  }, []);

  const resetBails = () => {
    if (bailsMeshRef.current.length >= 2) {
      bailsMeshRef.current[0].position.set(-0.06, 0.73, 0);
      bailsMeshRef.current[0].rotation.set(0, 0, Math.PI / 2);
      bailsMeshRef.current[1].position.set(0.06, 0.73, 0);
      bailsMeshRef.current[1].rotation.set(0, 0, Math.PI / 2);
    }
  };

  // Select camera view
  const handleSelectCameraView = (viewId: PresetCameraView) => {
    setActiveCameraView(viewId);
    sounds.playClick();
    const config = PRESET_CAMERA_VIEWS.find((v) => v.id === viewId);
    if (!config) return;

    cameraSphericalRef.current = { ...config.spherical };
    targetCamPosRef.current.copy(config.position);
    targetCamLookAtRef.current.copy(config.target);
    cameraTargetRef.current.copy(config.target);
    isTransitioningCameraRef.current = true;
  };

  // Impact Replay Actions
  const handleTriggerImpactReplay = () => {
    sounds.playClick();
    setIsImpactFrozen(false);
    isImpactFrozenRef.current = false;
    setIsSlowMo(true);
    isSlowMoRef.current = true;
    setIsPlaying(true);
    isPlayingRef.current = true;
    ballProgressRef.current = 0.72; // Start right after bounce
    resetBails();
    handleSelectCameraView('stump_cam');
  };

  const handleFreezeAtImpact = () => {
    sounds.playClick();
    setIsImpactFrozen(true);
    isImpactFrozenRef.current = true;
    setIsPlaying(false);
    isPlayingRef.current = false;
    ballProgressRef.current = 0.98; // Exact impact frame
    if (impactBeaconGroupRef.current) {
      impactBeaconGroupRef.current.visible = true;
    }
    if (selectedDelivery.hitStumps && bailsMeshRef.current.length >= 2) {
      bailsMeshRef.current[0].position.set(-0.03, 0.95, 0.1);
      bailsMeshRef.current[0].rotation.set(0.8, 0.4, 1.2);
      bailsMeshRef.current[1].position.set(0.08, 1.05, -0.1);
      bailsMeshRef.current[1].rotation.set(-0.6, 0.7, -1.0);
    }
    handleSelectCameraView('stump_cam');
  };

  const handleResumeNormalSpeed = () => {
    sounds.playClick();
    setIsSlowMo(false);
    isSlowMoRef.current = false;
    setIsImpactFrozen(false);
    isImpactFrozenRef.current = false;
    setIsPlaying(true);
    isPlayingRef.current = true;
    resetBails();
    handleSelectCameraView('bowlers_end');
  };

  // Mount Three.js Scene
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 520;

    const isSoftwareGl = (() => {
      try {
        const gl = document.createElement('canvas').getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return false;
      }
    })();

    // 1. Scene Setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x060c18);
    scene.fog = new THREE.FogExp2(0x060c18, 0.015);

    // 2. Camera Setup
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 500);
    cameraRef.current = camera;
    camera.position.set(0, 3.8, -19);
    camera.lookAt(0, 0.8, 8);

    // 3. Renderer Setup
    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      alpha: false,
      powerPreference: 'high-performance',
    });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFShadowMap;

    container.replaceChildren(renderer.domElement);

    // 4. Lighting Rig
    const keyLight = new THREE.DirectionalLight(0xfff5e0, 1.8);
    keyLight.position.set(15, 25, -15);
    keyLight.castShadow = !isSoftwareGl;
    if (!isSoftwareGl) {
      keyLight.shadow.mapSize.width = 1024;
      keyLight.shadow.mapSize.height = 1024;
      keyLight.shadow.camera.near = 0.5;
      keyLight.shadow.camera.far = 100;
      keyLight.shadow.camera.left = -20;
      keyLight.shadow.camera.right = 20;
      keyLight.shadow.camera.top = 20;
      keyLight.shadow.camera.bottom = -20;
      keyLight.shadow.bias = -0.0005;
    }
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x9fc5e8, 0.9);
    fillLight.position.set(-18, 18, 20);
    scene.add(fillLight);

    const hemiLight = new THREE.HemisphereLight(0x386641, 0x0f172a, 0.7);
    scene.add(hemiLight);

    // 5. Turf Texture & Field
    const turfCanvas = document.createElement('canvas');
    turfCanvas.width = 512;
    turfCanvas.height = 512;
    const ctx = turfCanvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#1e4822';
      ctx.fillRect(0, 0, 512, 512);
      for (let i = 0; i < 512; i += 32) {
        ctx.fillStyle = i % 64 === 0 ? '#26582b' : '#1e4822';
        ctx.fillRect(0, i, 512, 32);
      }
    }
    const turfTexture = new THREE.CanvasTexture(turfCanvas);
    turfTexture.wrapS = THREE.RepeatWrapping;
    turfTexture.wrapT = THREE.RepeatWrapping;
    turfTexture.repeat.set(8, 8);
    turfTexture.colorSpace = THREE.SRGBColorSpace;

    // Field Cylinder
    const fieldGeo = new THREE.CylinderGeometry(40, 41, 0.4, 48);
    const fieldMat = new THREE.MeshStandardMaterial({
      map: turfTexture,
      roughness: 0.85,
      metalness: 0.05,
    });
    const field = new THREE.Mesh(fieldGeo, fieldMat);
    field.position.y = -0.2;
    field.receiveShadow = !isSoftwareGl;
    scene.add(field);

    // 6. Dynamic 3D Braided Boundary Rope System & Foam Sponsor Wedges (R = 38.0m)
    // Procedural braided rope texture: alternating crimson & white spiral coils with twine cord striations
    const ropeCanvas = document.createElement('canvas');
    ropeCanvas.width = 512;
    ropeCanvas.height = 128;
    const ropeCtx = ropeCanvas.getContext('2d');
    if (ropeCtx) {
      ropeCtx.fillStyle = '#f8fafc'; // Crisp white rope cord base
      ropeCtx.fillRect(0, 0, 512, 128);
      ropeCtx.fillStyle = '#dc2626'; // Deep cricket red safety bands
      for (let x = -128; x < 512 + 128; x += 32) {
        ropeCtx.beginPath();
        ropeCtx.moveTo(x, 0);
        ropeCtx.lineTo(x + 64, 128);
        ropeCtx.lineTo(x + 48, 128);
        ropeCtx.lineTo(x - 16, 0);
        ropeCtx.closePath();
        ropeCtx.fill();
      }
      ropeCtx.strokeStyle = 'rgba(0, 0, 0, 0.18)';
      ropeCtx.lineWidth = 2;
      for (let y = 0; y < 128; y += 8) {
        ropeCtx.beginPath();
        ropeCtx.moveTo(0, y);
        ropeCtx.lineTo(512, y);
        ropeCtx.stroke();
      }
    }
    const ropeTexture = new THREE.CanvasTexture(ropeCanvas);
    ropeTexture.wrapS = THREE.RepeatWrapping;
    ropeTexture.wrapT = THREE.RepeatWrapping;
    ropeTexture.repeat.set(64, 1);
    ropeTexture.colorSpace = THREE.SRGBColorSpace;

    // High-resolution braided rope geometry (Radius 38.0m, tube thickness 0.24m, 128 perimeter segments)
    const boundaryGeo = new THREE.TorusGeometry(BOUNDARY_RADIUS, 0.24, 16, 128);
    const boundaryMat = new THREE.MeshStandardMaterial({
      map: ropeTexture,
      roughness: 0.55,
      metalness: 0.15,
    });
    const boundaryRope = new THREE.Mesh(boundaryGeo, boundaryMat);
    boundaryRope.rotation.x = Math.PI / 2;
    boundaryRope.position.y = 0.08;
    boundaryRope.receiveShadow = !isSoftwareGl;
    boundaryRope.castShadow = !isSoftwareGl;
    scene.add(boundaryRope);
    boundaryRopeMeshRef.current = boundaryRope;

    // Dynamic LED Pulse Under-Glow Strip
    const ledGeo = new THREE.TorusGeometry(BOUNDARY_RADIUS, 0.06, 8, 96);
    const ledMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.4,
    });
    const boundaryLed = new THREE.Mesh(ledGeo, ledMat);
    boundaryLed.rotation.x = Math.PI / 2;
    boundaryLed.position.y = 0.03;
    scene.add(boundaryLed);
    boundaryLedStripRef.current = boundaryLed;

    // 36 Triangular 3D Foam Advertising Wedges (Boundary Toboggans)
    const wedgesGroup = new THREE.Group();
    const wedgeGeo = new THREE.BoxGeometry(2.4, 0.36, 0.42);
    const sponsorColors = [0x0f172a, 0x047857, 0x1d4ed8, 0xb91c1c];

    for (let i = 0; i < 36; i++) {
      const angle = (i * 2 * Math.PI) / 36;
      const x = BOUNDARY_RADIUS * Math.cos(angle);
      const z = BOUNDARY_RADIUS * Math.sin(angle);

      const wedgeMat = new THREE.MeshStandardMaterial({
        color: sponsorColors[i % sponsorColors.length],
        roughness: 0.6,
        metalness: 0.1,
      });
      const wedge = new THREE.Mesh(wedgeGeo, wedgeMat);
      wedge.position.set(x, 0.18, z);
      wedge.rotation.y = -angle + Math.PI / 2;
      wedge.castShadow = !isSoftwareGl;
      wedgesGroup.add(wedge);
    }
    scene.add(wedgesGroup);
    boundaryWedgesGroupRef.current = wedgesGroup;

    // Boundary Impact Shockwave Beacon Group
    const bImpactGroup = new THREE.Group();
    const bCoreGeo = new THREE.SphereGeometry(0.35, 16, 16);
    const bCoreMat = new THREE.MeshBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.95 });
    const bCore = new THREE.Mesh(bCoreGeo, bCoreMat);
    bImpactGroup.add(bCore);

    const bRingGeo = new THREE.RingGeometry(0.2, 1.4, 32);
    const bRingMat = new THREE.MeshBasicMaterial({ color: 0xff3b30, side: THREE.DoubleSide, transparent: true, opacity: 0.8 });
    const bRing = new THREE.Mesh(bRingGeo, bRingMat);
    bRing.rotation.x = -Math.PI / 2;
    bImpactGroup.add(bRing);

    bImpactGroup.visible = false;
    scene.add(bImpactGroup);
    boundaryImpactBeaconGroupRef.current = bImpactGroup;

    // 30-Yard Circle
    const circle30Geo = new THREE.RingGeometry(18.5, 18.7, 48);
    const circle30Mat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.35,
    });
    const circle30 = new THREE.Mesh(circle30Geo, circle30Mat);
    circle30.rotation.x = -Math.PI / 2;
    circle30.position.y = 0.02;
    scene.add(circle30);

    // 22-Yard Central Pitch (Scaled 20.12m x 3.05m)
    const pitchGeo = new THREE.BoxGeometry(3.2, 0.05, 20.2);
    const pitchBaseMat = new THREE.MeshStandardMaterial({
      color: 0x936838, // Subsurface compacted clay foundation
      roughness: 0.95,
      metalness: 0.02,
    });
    const pitchBase = new THREE.Mesh(pitchGeo, pitchBaseMat);
    pitchBase.position.y = 0.02;
    pitchBase.receiveShadow = !isSoftwareGl;
    scene.add(pitchBase);

    // High-Resolution Procedural Grass & Soil Playing Surface Layer
    const pitchGrassMat = createPitchGrassMaterial({
      sunDirection: keyLight.position.clone().normalize(),
    });
    pitchGrassShaderRef.current = pitchGrassMat;

    const pitchSurfaceGeo = new THREE.PlaneGeometry(3.2, 20.2, 48, 96);
    const pitchSurface = new THREE.Mesh(pitchSurfaceGeo, pitchGrassMat);
    pitchSurface.rotation.x = -Math.PI / 2;
    pitchSurface.position.y = 0.046;
    pitchSurface.receiveShadow = !isSoftwareGl;
    scene.add(pitchSurface);

    // Crease Markings
    const createCreaseMarking = (width: number, length: number, x: number, z: number) => {
      const geo = new THREE.PlaneGeometry(width, length);
      const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
      const crease = new THREE.Mesh(geo, mat);
      crease.rotation.x = -Math.PI / 2;
      crease.position.set(x, 0.046, z);
      scene.add(crease);
    };

    // Batsman End Creases (z = 10)
    createCreaseMarking(2.6, 0.08, 0, 10.0);
    createCreaseMarking(3.0, 0.08, 0, 8.8);
    createCreaseMarking(0.08, 2.4, -1.3, 9.4);
    createCreaseMarking(0.08, 2.4, 1.3, 9.4);

    // Bowler End Creases (z = -10)
    createCreaseMarking(2.6, 0.08, 0, -10.0);
    createCreaseMarking(3.0, 0.08, 0, -8.8);
    createCreaseMarking(0.08, 2.4, -1.3, -9.4);
    createCreaseMarking(0.08, 2.4, 1.3, -9.4);

    // Pitch Dimensions Visualization Group
    const pitchDimGroup = new THREE.Group();
    const dimLineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-1.7, 0.1, -10),
      new THREE.Vector3(-1.7, 0.1, 10),
    ]);
    const dimLineMat = new THREE.LineDashedMaterial({
      color: 0x38bdf8,
      dashSize: 0.5,
      gapSize: 0.3,
    });
    const dimLine = new THREE.Line(dimLineGeo, dimLineMat);
    dimLine.computeLineDistances();
    pitchDimGroup.add(dimLine);
    pitchDimGroup.visible = false;
    scene.add(pitchDimGroup);
    pitchDimensionGroupRef.current = pitchDimGroup;

    // Stumps & Bails
    const buildWicketGroup = (zPos: number, isTarget: boolean) => {
      const wicketGroup = new THREE.Group();
      const woodMat = new THREE.MeshStandardMaterial({
        color: 0xe0a96d,
        roughness: 0.4,
        metalness: 0.1,
      });

      const stumpGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.72, 12);
      const spacing = 0.12;

      for (let i = -1; i <= 1; i++) {
        const stump = new THREE.Mesh(stumpGeo, woodMat);
        stump.position.set(i * spacing, 0.36, 0);
        stump.castShadow = !isSoftwareGl;
        wicketGroup.add(stump);
      }

      const bailGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.13, 8);
      const bail1 = new THREE.Mesh(bailGeo, woodMat);
      bail1.rotation.z = Math.PI / 2;
      bail1.position.set(-spacing / 2, 0.73, 0);
      wicketGroup.add(bail1);

      const bail2 = new THREE.Mesh(bailGeo, woodMat);
      bail2.rotation.z = Math.PI / 2;
      bail2.position.set(spacing / 2, 0.73, 0);
      wicketGroup.add(bail2);

      wicketGroup.position.set(0, 0.03, zPos);
      scene.add(wicketGroup);

      if (isTarget) {
        stumpsGroupRef.current = wicketGroup;
        bailsMeshRef.current = [bail1, bail2];
      }
    };

    buildWicketGroup(10.0, true);
    buildWicketGroup(-10.0, false);

    // Sight Screens
    const buildSightScreen = (zPos: number) => {
      const group = new THREE.Group();
      const screenGeo = new THREE.BoxGeometry(4.2, 2.8, 0.1);
      const screenMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.7 });
      const board = new THREE.Mesh(screenGeo, screenMat);
      board.position.y = 1.6;
      group.add(board);
      group.position.set(0, 0, zPos);
      scene.add(group);
    };
    buildSightScreen(36);
    buildSightScreen(-36);

    // Floodlight Towers
    const towerPositions = [
      { x: 30, z: 25 },
      { x: -30, z: 25 },
      { x: 30, z: -25 },
      { x: -30, z: -25 },
    ];
    towerPositions.forEach((pos) => {
      const towerGroup = new THREE.Group();
      const pylonGeo = new THREE.CylinderGeometry(0.4, 0.8, 22, 6);
      const pylonMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8, roughness: 0.3 });
      const pylon = new THREE.Mesh(pylonGeo, pylonMat);
      pylon.position.y = 11;
      towerGroup.add(pylon);

      const headGeo = new THREE.BoxGeometry(3.5, 2.0, 0.8);
      const headMat = new THREE.MeshStandardMaterial({
        color: 0xfffbe8,
        emissive: 0xfff1aa,
        emissiveIntensity: 1.5,
        roughness: 0.2,
      });
      const head = new THREE.Mesh(headGeo, headMat);
      head.position.y = 22;
      head.lookAt(0, 5, 0);
      towerGroup.add(head);

      towerGroup.position.set(pos.x, 0, pos.z);
      scene.add(towerGroup);
    });

    // Cricket Ball
    const ballGeo = new THREE.SphereGeometry(0.12, 24, 24);
    const ballMat = new THREE.MeshStandardMaterial({
      color: 0xdc2626,
      roughness: 0.3,
      metalness: 0.1,
    });
    const ballMesh = new THREE.Mesh(ballGeo, ballMat);
    ballMesh.castShadow = !isSoftwareGl;
    scene.add(ballMesh);
    ballMeshRef.current = ballMesh;

    // Pitch Bounce Marker
    const bounceMarkerGeo = new THREE.RingGeometry(0.08, 0.35, 24);
    const bounceMarkerMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8,
    });
    const bounceMarker = new THREE.Mesh(bounceMarkerGeo, bounceMarkerMat);
    bounceMarker.rotation.x = -Math.PI / 2;
    bounceMarker.position.y = 0.05;
    scene.add(bounceMarker);
    bounceMarkerRef.current = bounceMarker;

    // 12. Visual Impact Replay Beacon & Shockwave Group
    const impactGroup = new THREE.Group();

    // Center glowing contact core
    const coreGeo = new THREE.SphereGeometry(0.14, 16, 16);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0xff2e63,
      transparent: true,
      opacity: 0.9,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    impactGroup.add(coreMesh);
    impactCoreMeshRef.current = coreMesh;

    // Expanding shockwave ripple ring
    const ringGeo = new THREE.RingGeometry(0.08, 0.42, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xff2e63,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = -Math.PI / 2;
    impactGroup.add(ringMesh);
    impactRingMeshRef.current = ringMesh;

    // Vertical anchor laser line connecting contact point to pitch surface
    const anchorGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, -0.6, 0),
    ]);
    const anchorMat = new THREE.LineDashedMaterial({
      color: 0x38bdf8,
      dashSize: 0.05,
      gapSize: 0.03,
      transparent: true,
      opacity: 0.75,
    });
    const anchorLine = new THREE.Line(anchorGeo, anchorMat);
    anchorLine.computeLineDistances();
    impactGroup.add(anchorLine);
    impactAnchorLineRef.current = anchorLine;

    impactGroup.visible = false;
    scene.add(impactGroup);
    impactBeaconGroupRef.current = impactGroup;

    // Wagon Wheel Group
    const wagonGroup = new THREE.Group();
    WAGON_SHOTS.forEach((shot) => {
      const radius = shot.distanceMeters * 0.36;
      const targetX = Math.cos(shot.angleRad) * radius;
      const targetZ = 10.0 + Math.sin(shot.angleRad) * radius;

      const curve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(0, 0.4, 10.0),
        new THREE.Vector3(targetX * 0.5, shot.height, 10.0 + (targetZ - 10.0) * 0.5),
        new THREE.Vector3(targetX, 0.1, targetZ)
      );

      const points = curve.getPoints(24);
      const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
      const lineMat = new THREE.LineBasicMaterial({
        color: shot.color,
        linewidth: shot.runs === 6 ? 3 : 2,
        transparent: true,
        opacity: 0.85,
      });
      const arcLine = new THREE.Line(lineGeo, lineMat);
      wagonGroup.add(arcLine);

      const pinGeo = new THREE.SphereGeometry(0.2, 12, 12);
      const pinMat = new THREE.MeshStandardMaterial({
        color: shot.color,
        emissive: shot.color,
        emissiveIntensity: 0.8,
      });
      const pin = new THREE.Mesh(pinGeo, pinMat);
      pin.position.set(targetX, 0.1, targetZ);
      wagonGroup.add(pin);
    });
    wagonGroup.visible = false;
    scene.add(wagonGroup);
    wagonLinesRef.current = wagonGroup;

    // Build initial Hawkeye beam
    updateHawkeyeBeam(selectedDeliveryRef.current);

    // Mouse drag orbit handlers
    const onMouseDown = (e: MouseEvent) => {
      isMouseDownRef.current = true;
      isTransitioningCameraRef.current = false;
      mousePosRef.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isMouseDownRef.current) return;
      const deltaX = e.clientX - mousePosRef.current.x;
      const deltaY = e.clientY - mousePosRef.current.y;
      mousePosRef.current = { x: e.clientX, y: e.clientY };

      cameraSphericalRef.current.theta -= deltaX * 0.008;
      cameraSphericalRef.current.phi = Math.max(
        0.08,
        Math.min(Math.PI / 2 - 0.05, cameraSphericalRef.current.phi - deltaY * 0.008)
      );

      const { radius, theta, phi } = cameraSphericalRef.current;
      const target = cameraTargetRef.current;
      camera.position.x = target.x + radius * Math.sin(phi) * Math.sin(theta);
      camera.position.y = target.y + radius * Math.cos(phi);
      camera.position.z = target.z + radius * Math.sin(phi) * Math.cos(theta);
      camera.lookAt(target);
    };

    const onMouseUp = () => {
      isMouseDownRef.current = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      cameraSphericalRef.current.radius = Math.max(
        3.0,
        Math.min(60, cameraSphericalRef.current.radius + e.deltaY * 0.03)
      );
      const { radius, theta, phi } = cameraSphericalRef.current;
      const target = cameraTargetRef.current;
      camera.position.x = target.x + radius * Math.sin(phi) * Math.sin(theta);
      camera.position.y = target.y + radius * Math.cos(phi);
      camera.position.z = target.z + radius * Math.sin(phi) * Math.cos(theta);
      camera.lookAt(target);
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    container.addEventListener('wheel', onWheel, { passive: false });

    const onResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    // Render & Animation Loop
    let lastTime = performance.now();
    let isDisposed = false;

    const animate = (currentTime: number) => {
      if (isDisposed) return;

      const rawDelta = (currentTime - lastTime) / 1000;
      const deltaTime = Math.max(0, Math.min(0.08, isNaN(rawDelta) ? 0.016 : rawDelta));
      lastTime = currentTime;

      const currentMode = activeModeRef.current;
      const currentPlaying = isPlayingRef.current;
      const currentDelivery = selectedDeliveryRef.current;
      const isSlow = isSlowMoRef.current;
      const isFrozen = isImpactFrozenRef.current;

      // Ball Hawkeye physics animation
      if (ballMeshRef.current && currentMode === 'trajectory') {
        if (currentPlaying && !isFrozen) {
          const speed = currentDelivery.speedKmh || 140;
          const speedFactor = isSlow ? 0.22 : 0.65;
          ballProgressRef.current += deltaTime * (speed / 140) * speedFactor;

          if (ballProgressRef.current >= 1.0) {
            if (isSlow) {
              // In Slow-Mo replay, loop the impact segment smoothly from post-bounce
              ballProgressRef.current = 0.68;
              resetBails();
            } else {
              ballProgressRef.current = 0;
              resetBails();
            }
          }
        }

        const t = Math.max(
          0,
          Math.min(1, isNaN(ballProgressRef.current) ? 0 : ballProgressRef.current)
        );

        // Near-impact state notification
        setIsImpactNear(t >= 0.90);

        let activeCurve = curvesCacheRef.current.get(currentDelivery.id);
        if (!activeCurve) {
          activeCurve = new THREE.CatmullRomCurve3(currentDelivery.curve);
          curvesCacheRef.current.set(currentDelivery.id, activeCurve);
        }

        try {
          const pt = activeCurve.getPoint(t);
          if (pt && !isNaN(pt.x)) {
            ballMeshRef.current.position.copy(pt);
            ballMeshRef.current.rotation.x += isSlow ? 0.08 : 0.25;
            ballMeshRef.current.rotation.z += isSlow ? 0.05 : 0.15;
          }
        } catch {
          // Graceful fallback
        }

        // Visual Impact Shockwave Beacon triggering at impact (t >= 0.92)
        if (impactBeaconGroupRef.current && currentDelivery.impactInfo) {
          const cp = currentDelivery.impactInfo.contactPoint;
          if (t >= 0.92 || isFrozen) {
            impactBeaconGroupRef.current.position.set(cp.x, cp.y, cp.z);
            impactBeaconGroupRef.current.visible = true;

            // Animate shockwave ring expansion & pulse
            if (impactRingMeshRef.current) {
              const shockT = (t - 0.92) / 0.08;
              const scale = 1.0 + Math.sin(shockT * Math.PI) * 1.8;
              impactRingMeshRef.current.scale.set(scale, scale, scale);
              (impactRingMeshRef.current.material as THREE.MeshBasicMaterial).opacity = Math.max(
                0.2,
                1.0 - shockT * 0.7
              );
            }

            // Adjust vertical laser height down to pitch
            if (impactAnchorLineRef.current) {
              impactAnchorLineRef.current.scale.set(1, cp.y - 0.04, 1);
              impactAnchorLineRef.current.computeLineDistances();
            }
          } else {
            impactBeaconGroupRef.current.visible = false;
          }
        }

        // Bowled delivery stump collision & flying bails
        if (currentDelivery.hitStumps && (t > 0.94 || isFrozen) && bailsMeshRef.current.length >= 2) {
          const bStep = isSlow ? 0.015 : 0.04;
          bailsMeshRef.current[0].position.y += bStep;
          bailsMeshRef.current[0].position.x += bStep * 0.8;
          bailsMeshRef.current[0].rotation.x += isSlow ? 0.08 : 0.3;
          bailsMeshRef.current[1].position.y += bStep * 1.2;
          bailsMeshRef.current[1].position.x -= bStep * 0.9;
          bailsMeshRef.current[1].rotation.z += isSlow ? 0.1 : 0.4;
        }
      }

      // Boundary Shot Trajectory Physics & Dynamic 3D Rope Collision Detection
      if (ballMeshRef.current && currentMode === 'boundary') {
        const curBoundaryShot = selectedBoundaryShotRef.current;
        if (currentPlaying) {
          const speed = curBoundaryShot.speedKmh || 140;
          const speedFactor = isSlow ? 0.22 : 0.65;
          ballProgressRef.current += deltaTime * (speed / 140) * speedFactor;
          if (ballProgressRef.current >= 1.0) {
            ballProgressRef.current = 0;
          }
        }

        const t = Math.max(
          0,
          Math.min(1, isNaN(ballProgressRef.current) ? 0 : ballProgressRef.current)
        );

        let activeBoundaryCurve = curvesCacheRef.current.get(curBoundaryShot.id);
        if (!activeBoundaryCurve) {
          activeBoundaryCurve = new THREE.CatmullRomCurve3(curBoundaryShot.curve);
          curvesCacheRef.current.set(curBoundaryShot.id, activeBoundaryCurve);
        }

        try {
          const pt = activeBoundaryCurve.getPoint(t);
          if (pt && !isNaN(pt.x)) {
            ballMeshRef.current.position.copy(pt);
            ballMeshRef.current.rotation.x += isSlow ? 0.08 : 0.25;
            ballMeshRef.current.rotation.z += isSlow ? 0.05 : 0.15;

            // Collision check with stadium boundary perimeter (R = 38.0m)
            const horizDist = Math.sqrt(pt.x * pt.x + pt.z * pt.z);
            const hasHitRope = horizDist >= BOUNDARY_RADIUS;

            setIsBoundaryColliding(hasHitRope);
            isBoundaryCollidingRef.current = hasHitRope;

            if (boundaryImpactBeaconGroupRef.current) {
              if (hasHitRope) {
                const angle = Math.atan2(pt.z, pt.x);
                boundaryImpactBeaconGroupRef.current.position.set(
                  BOUNDARY_RADIUS * Math.cos(angle),
                  Math.max(0.12, pt.y),
                  BOUNDARY_RADIUS * Math.sin(angle)
                );
                boundaryImpactBeaconGroupRef.current.visible = true;

                // Dynamic LED perimeter glow pulses on collision
                if (boundaryLedStripRef.current) {
                  const ledMat = boundaryLedStripRef.current.material as THREE.MeshBasicMaterial;
                  ledMat.color.setHex(curBoundaryShot.expectedOutcome === 'SIX' ? 0xa855f7 : 0xef4444);
                  ledMat.opacity = 0.95;
                }
              } else {
                boundaryImpactBeaconGroupRef.current.visible = false;
                if (boundaryLedStripRef.current) {
                  const ledMat = boundaryLedStripRef.current.material as THREE.MeshBasicMaterial;
                  ledMat.color.setHex(0x00f0ff);
                  ledMat.opacity = 0.35;
                }
              }
            }
          }
        } catch {
          // Graceful fallback
        }
      }

      // Smooth camera interpolation
      if (isTransitioningCameraRef.current && camera) {
        camera.position.lerp(targetCamPosRef.current, 0.08);
        currentCamLookAtRef.current.lerp(targetCamLookAtRef.current, 0.08);
        camera.lookAt(currentCamLookAtRef.current);

        if (camera.position.distanceTo(targetCamPosRef.current) < 0.04) {
          camera.position.copy(targetCamPosRef.current);
          currentCamLookAtRef.current.copy(targetCamLookAtRef.current);
          camera.lookAt(currentCamLookAtRef.current);
          isTransitioningCameraRef.current = false;
        }
      }

      // Animate procedural grass shader micro-shimmer
      if (pitchGrassShaderRef.current) {
        pitchGrassShaderRef.current.uniforms.uTime.value = currentTime * 0.001;
      }

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        window.setTimeout(() => {
          if (!isDisposed) {
            animFrameRef.current = requestAnimationFrame(animate);
          }
        }, 50);
      } else {
        animFrameRef.current = requestAnimationFrame(animate);
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      isDisposed = true;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      container.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', onResize);

      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          if (object.geometry) object.geometry.dispose();
          if (Array.isArray(object.material)) {
            object.material.forEach((m) => m.dispose());
          } else if (object.material) {
            object.material.dispose();
          }
        }
      });
      renderer.dispose();
    };
  }, [updateHawkeyeBeam]);

  // Mode switching side-effects
  useEffect(() => {
    activeModeRef.current = activeMode;

    if (wagonLinesRef.current) {
      wagonLinesRef.current.visible = activeMode === 'wagon';
    }
    if (pitchDimensionGroupRef.current) {
      pitchDimensionGroupRef.current.visible = activeMode === 'pitch';
    }
    if (ballMeshRef.current) {
      ballMeshRef.current.visible = activeMode === 'trajectory' || activeMode === 'boundary';
    }
    if (bounceMarkerRef.current) {
      bounceMarkerRef.current.visible = activeMode === 'trajectory';
    }
    if (impactBeaconGroupRef.current) {
      impactBeaconGroupRef.current.visible = false;
    }
    if (boundaryImpactBeaconGroupRef.current) {
      boundaryImpactBeaconGroupRef.current.visible = false;
    }
    if (boundaryTrajectoryLineRef.current) {
      boundaryTrajectoryLineRef.current.visible = activeMode === 'boundary';
    }
    if (hawkeyePreLineRef.current) {
      hawkeyePreLineRef.current.visible = activeMode === 'trajectory';
    }
    if (hawkeyePostLineRef.current) {
      hawkeyePostLineRef.current.visible = activeMode === 'trajectory';
    }
    if (hawkeyeProjectedLineRef.current) {
      hawkeyeProjectedLineRef.current.visible = activeMode === 'trajectory';
    }

    if (activeMode === 'wagon') {
      handleSelectCameraView('birds_eye');
    } else if (activeMode === 'trajectory') {
      handleSelectCameraView('bowlers_end');
    } else if (activeMode === 'boundary') {
      sounds.playClick();
      updateBoundaryBeam(selectedBoundaryShot);
      ballProgressRef.current = 0;
      cameraSphericalRef.current = { radius: 34, theta: Math.PI * 0.75, phi: 1.15 };
      cameraTargetRef.current = new THREE.Vector3(0, 0.5, 0);
      targetCamPosRef.current.set(20, 14, 24);
      targetCamLookAtRef.current.set(0, 0.5, 0);
      isTransitioningCameraRef.current = true;
    } else if (activeMode === 'pitch') {
      sounds.playClick();
      cameraSphericalRef.current = { radius: 22, theta: Math.PI / 2, phi: 1.35 };
      cameraTargetRef.current = new THREE.Vector3(0, 0.5, 0);
      targetCamPosRef.current.set(22, 4.5, 0);
      targetCamLookAtRef.current.set(0, 0.5, 0);
      isTransitioningCameraRef.current = true;
    }
  }, [activeMode, updateBoundaryBeam, selectedBoundaryShot]);

  // Boundary shot change handler
  const handleSelectBoundaryShot = (shot: BoundaryShot) => {
    setSelectedBoundaryShot(shot);
    selectedBoundaryShotRef.current = shot;
    setBoundaryCollisionInfo(checkBoundaryCollision(shot.curve));
    ballProgressRef.current = 0;
    setIsSlowMo(false);
    isSlowMoRef.current = false;
    updateBoundaryBeam(shot);
    sounds.playClick();
  };

  // Delivery change handler
  const handleSelectDelivery = (delivery: DeliveryPreset) => {
    setSelectedDelivery(delivery);
    selectedDeliveryRef.current = delivery;
    ballProgressRef.current = 0;
    setIsSlowMo(false);
    isSlowMoRef.current = false;
    setIsImpactFrozen(false);
    isImpactFrozenRef.current = false;
    setIsPlaying(true);
    isPlayingRef.current = true;
    resetBails();
    updateHawkeyeBeam(delivery);
    sounds.playClick();
  };

  const drs = selectedDelivery.drs;
  const impact = selectedDelivery.impactInfo;

  return (
    <div className="relative w-full h-[620px] bg-[#070b13] rounded-xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col">
      {/* 3D WebGL Canvas Viewport */}
      <div
        ref={containerRef}
        className="w-full h-full cursor-grab active:cursor-grabbing select-none"
        aria-label="3D Cricket Stadium and Hawkeye Viewport"
      />

      {/* Floating Top Header Bar */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none z-10">
        <div className="flex items-center gap-2.5 pointer-events-auto bg-[#0b0f19]/90 backdrop-blur-md px-3.5 py-1.5 rounded-lg border border-slate-800 shadow-md">
          <span className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            3D Cricket Physics
          </span>
          <span className="text-slate-600" aria-hidden="true">·</span>
          <span className="text-[11px] text-emerald-400 font-mono font-medium">
            Hawkeye Precision Engine
          </span>
        </div>

        {/* Viewport Mode Switcher */}
        <div className="flex items-center gap-1 pointer-events-auto bg-[#0b0f19]/90 backdrop-blur-md p-1 rounded-lg border border-slate-800 shadow-md">
          <button
            type="button"
            onClick={() => setActiveMode('trajectory')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeMode === 'trajectory'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>Ball Hawkeye</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('wagon')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeMode === 'wagon'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Wagon Wheel</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('pitch')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeMode === 'pitch'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Pitch Dimensions</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveMode('boundary');
              handleSelectBoundaryShot(selectedBoundaryShot);
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeMode === 'boundary'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Boundary 3D & Collision</span>
          </button>
        </div>
      </div>

      {/* Dynamic 3D Boundary Collision Telemetry Panel (Left Flank) */}
      {activeMode === 'boundary' && (
        <div className="absolute top-16 left-4 z-10 bg-[#0b0f19]/95 backdrop-blur-md p-3.5 rounded-xl border border-slate-800 text-xs text-slate-300 w-80 shadow-2xl pointer-events-auto">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/80">
            <div>
              <div className="flex items-center gap-1.5 text-[10px] uppercase font-mono font-bold tracking-wider text-rose-400">
                <ShieldAlert className="w-3 h-3 text-rose-400" />
                <span>3D Boundary Collision Radar</span>
              </div>
              <div className="text-sm font-bold text-white">{selectedBoundaryShot.batsman}</div>
            </div>
            <div className="text-right">
              <div className="text-base font-extrabold font-sports text-rose-400 tabular-nums">
                {selectedBoundaryShot.speedKmh} <span className="text-[10px] font-sans font-normal text-slate-400">km/h</span>
              </div>
              <div className="text-[10px] font-mono text-slate-400">{selectedBoundaryShot.shotType}</div>
            </div>
          </div>

          {/* Real-time Collision Status Indicator */}
          <div className={`p-2.5 rounded-lg border mb-2.5 transition-colors ${
            isBoundaryColliding
              ? selectedBoundaryShot.expectedOutcome === 'SIX'
                ? 'bg-purple-950/70 border-purple-500/70 text-purple-200'
                : 'bg-rose-950/70 border-rose-500/70 text-rose-200'
              : 'bg-slate-900/80 border-slate-800 text-slate-400'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold flex items-center gap-1.5">
                <Sparkles className={`w-3.5 h-3.5 ${isBoundaryColliding ? 'text-amber-300 animate-spin' : 'text-slate-500'}`} />
                <span>Boundary Collision Status</span>
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                isBoundaryColliding
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-400'
              }`}>
                {isBoundaryColliding ? 'ROPE CONTACT ACTIVE' : 'IN PLAY'}
              </span>
            </div>
            <div className="text-[11px] mt-1 font-mono">
              {isBoundaryColliding ? (
                <span className="text-amber-300 font-bold">
                  💥 Ball contacting stadium perimeter at 38.0m!
                </span>
              ) : (
                <span>Tracking ball trajectory towards perimeter rope (38.0m radius)...</span>
              )}
            </div>
          </div>

          {/* Collision Telemetry Mat */}
          {boundaryCollisionInfo && (
            <div className="bg-slate-900/80 rounded-lg p-2.5 border border-slate-800 space-y-1.5 mb-2.5 text-[11px]">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Perimeter Radius</span>
                <span className="font-mono font-bold text-white">38.00 m</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Fielding Sector</span>
                <span className="font-mono font-bold text-emerald-400">{boundaryCollisionInfo.sectorName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Crossing Angle</span>
                <span className="font-mono font-bold text-slate-200">{boundaryCollisionInfo.angleDeg}°</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Rope Elevation</span>
                <span className={`font-mono font-bold ${boundaryCollisionInfo.isGroundBoundary ? 'text-emerald-400' : 'text-purple-400'}`}>
                  {boundaryCollisionInfo.elevationAtCrossing} m ({boundaryCollisionInfo.isGroundBoundary ? 'Ground Cushion' : 'Aerial Clearance'})
                </span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                <span className="text-slate-400">Collision Verdict</span>
                <span className={`font-mono font-extrabold px-1.5 py-0.5 rounded ${
                  boundaryCollisionInfo.runs === 6 ? 'bg-purple-900/60 text-purple-300 border border-purple-500/40' : 'bg-emerald-900/60 text-emerald-300 border border-emerald-500/40'
                }`}>
                  {boundaryCollisionInfo.badge}
                </span>
              </div>
            </div>
          )}

          {/* Shot Selector Quick-Pills */}
          <div className="space-y-1.5">
            <div className="text-[10px] uppercase font-mono font-semibold text-slate-400">
              Select Trajectory to Simulate:
            </div>
            <div className="grid grid-cols-1 gap-1">
              {BOUNDARY_SHOTS.map((shot) => (
                <button
                  key={shot.id}
                  type="button"
                  onClick={() => handleSelectBoundaryShot(shot)}
                  className={`w-full px-2 py-1.5 rounded text-left text-[11px] font-medium transition-all flex items-center justify-between ${
                    selectedBoundaryShot.id === shot.id
                      ? 'bg-rose-900/50 border border-rose-500/60 text-white'
                      : 'bg-slate-900/60 border border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span className="truncate">{shot.name}</span>
                  <span className={`text-[10px] font-mono px-1 rounded font-bold ${
                    shot.expectedOutcome === 'SIX' ? 'bg-purple-900/80 text-purple-300' : 'bg-emerald-900/80 text-emerald-300'
                  }`}>
                    {shot.expectedOutcome === 'SIX' ? '6 RUNS' : '4 RUNS'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Hawkeye DRS Decision Panel (Left Flank) */}
      {activeMode === 'trajectory' && (
        <div className="absolute top-16 left-4 z-10 bg-[#0b0f19]/95 backdrop-blur-md p-3.5 rounded-xl border border-slate-800 text-xs text-slate-300 w-72 shadow-2xl pointer-events-none">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/80">
            <div>
              <div className="text-[10px] uppercase font-mono font-bold tracking-wider text-emerald-400">
                Hawkeye Ball Tracking
              </div>
              <div className="text-sm font-bold text-white">{selectedDelivery.bowler}</div>
            </div>
            <div className="text-right">
              <div className="text-base font-extrabold font-sports text-emerald-400 tabular-nums">
                {selectedDelivery.speedKmh} <span className="text-[10px] font-sans font-normal text-slate-400">km/h</span>
              </div>
              <div className="text-[10px] font-mono text-slate-400">{selectedDelivery.type}</div>
            </div>
          </div>

          {/* DRS 3-Point Decision Mat */}
          <div className="bg-slate-900/80 rounded-lg p-2.5 border border-slate-800 space-y-1.5 mb-2.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Pitching</span>
              <span className={`font-mono font-bold ${drs.pitching === 'IN LINE' ? 'text-emerald-400' : 'text-amber-400'}`}>
                {drs.pitching}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Impact</span>
              <span className={`font-mono font-bold ${drs.impact === 'IN LINE' ? 'text-emerald-400' : 'text-amber-400'}`}>
                {drs.impact}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Wickets</span>
              <span className={`font-mono font-bold ${drs.wickets === 'HITTING' ? 'text-rose-400' : 'text-slate-300'}`}>
                {drs.wickets}
              </span>
            </div>

            <div className="pt-1.5 mt-1 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">DRS Verdict:</span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase tracking-wider ${
                  drs.verdict === 'OUT'
                    ? 'bg-rose-950/80 text-rose-300 border border-rose-700/60'
                    : 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/60'
                }`}
              >
                {drs.verdict}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono text-slate-400">
            <div className="p-1.5 rounded bg-slate-900/60 border border-slate-800/80">
              <span className="text-slate-500 block">Deviation</span>
              <span className="text-slate-200 font-semibold">{drs.deviation}</span>
            </div>
            <div className="p-1.5 rounded bg-slate-900/60 border border-slate-800/80">
              <span className="text-slate-500 block">Bounce Height</span>
              <span className="text-slate-200 font-semibold">{drs.bounceHeight}</span>
            </div>
          </div>
        </div>
      )}

      {/* Visual 'Impact Replay' Broadcast HUD Overlay (Top Right) */}
      {activeMode === 'trajectory' && showImpactOverlay && (
        <div className="absolute top-16 right-4 z-20 bg-[#0b0f19]/95 backdrop-blur-md p-3.5 rounded-xl border border-slate-800 text-xs text-slate-300 w-80 shadow-2xl pointer-events-auto animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/80">
            <div className="flex items-center gap-1.5">
              <div className="p-1 rounded bg-rose-500/20 text-rose-400">
                <Flame className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="text-[10px] uppercase font-mono font-bold tracking-wider text-rose-400 flex items-center gap-1.5">
                  <span>Impact Replay</span>
                  <span className="text-slate-600">·</span>
                  <span className="text-slate-400 font-normal">Wicket Cam</span>
                </div>
                <div className="text-xs font-bold text-white truncate max-w-[170px]">
                  {impact.title}
                </div>
              </div>
            </div>

            <span
              className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase tracking-wider border ${
                impact.type === 'BOWLED'
                  ? 'bg-rose-950/90 text-rose-300 border-rose-700/70 shadow-[0_0_8px_rgba(244,63,94,0.3)]'
                  : impact.type === 'LBW_PAD'
                  ? 'bg-amber-950/90 text-amber-300 border-amber-700/70'
                  : 'bg-slate-900 text-slate-400 border-slate-800'
              }`}
            >
              {impact.badge}
            </span>
          </div>

          {/* 2D Graphical Wicket Target Diagram */}
          <div className="relative bg-slate-950/80 rounded-lg p-3 border border-slate-800/90 flex items-center justify-between gap-3 mb-2.5">
            {/* Stumps Illustration */}
            <div className="relative w-28 h-20 bg-slate-900/60 rounded border border-slate-800 flex items-end justify-center pb-2 px-3 overflow-hidden">
              {/* Ground level line */}
              <div className="absolute bottom-1.5 left-2 right-2 h-0.5 bg-slate-700" />
              
              {/* Bails on top */}
              <div className="absolute top-4 left-6 right-6 h-1 bg-amber-500 rounded-sm" />

              {/* 3 Stumps */}
              <div className="flex items-end justify-between w-full h-14 z-10 px-1">
                {/* Off Stump */}
                <div className="w-2.5 h-14 bg-gradient-to-t from-amber-800 to-amber-600 rounded-t-sm relative">
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[8px] font-mono text-slate-400 font-semibold">
                    Off
                  </span>
                </div>
                {/* Middle Stump */}
                <div className="w-2.5 h-14 bg-gradient-to-t from-amber-800 to-amber-600 rounded-t-sm relative">
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[8px] font-mono text-slate-400 font-semibold">
                    Mid
                  </span>
                </div>
                {/* Leg Stump */}
                <div className="w-2.5 h-14 bg-gradient-to-t from-amber-800 to-amber-600 rounded-t-sm relative">
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[8px] font-mono text-slate-400 font-semibold">
                    Leg
                  </span>
                </div>
              </div>

              {/* Illuminated Target Crosshair Point of Impact */}
              <div
                className="absolute z-20 pointer-events-none transition-all duration-300"
                style={{
                  left: `${Math.max(10, Math.min(90, 50 + impact.normalizedStumpX * 36))}%`,
                  bottom: `${Math.max(8, Math.min(85, impact.normalizedStumpY * 70))}%`,
                  transform: 'translate(-50%, 50%)',
                }}
              >
                <div className="relative flex items-center justify-center">
                  <span className="w-5 h-5 rounded-full border-2 border-rose-500 bg-rose-500/30 animate-ping absolute" />
                  <span className="w-3.5 h-3.5 rounded-full border border-white bg-rose-500 shadow-md flex items-center justify-center">
                    <span className="w-1 h-1 bg-white rounded-full" />
                  </span>
                </div>
              </div>
            </div>

            {/* Impact Telemetry Readout */}
            <div className="flex-1 space-y-1 text-[11px] font-mono">
              <div className="text-slate-400">
                Hit Target:{' '}
                <strong className={impact.bailsFly ? 'text-rose-400' : 'text-slate-200'}>
                  {impact.stump}
                </strong>
              </div>
              <div className="text-slate-400">
                Height:{' '}
                <span className="text-emerald-400 font-bold">
                  {impact.contactPoint.y.toFixed(2)}m
                </span>
              </div>
              <div className="text-slate-400">
                Impact Speed:{' '}
                <span className="text-amber-400 font-bold">
                  {impact.impactSpeedKmh} km/h
                </span>
              </div>
              <div className="text-[10px] text-slate-500 pt-0.5">
                Coords: [{impact.contactPoint.x.toFixed(2)}, {impact.contactPoint.y.toFixed(2)}, {impact.contactPoint.z.toFixed(1)}]
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 mb-3 leading-relaxed">
            {impact.description}
          </p>

          {/* Interactive Slow-Mo & Impact Camera Controls */}
          <div className="space-y-1.5 pt-1 border-t border-slate-800/80">
            <div className="flex items-center justify-between text-[10px] uppercase font-mono text-slate-400 font-semibold px-0.5">
              <span>Replay Tools</span>
              <span className="text-emerald-400">
                {isImpactFrozen ? 'Frozen at Impact' : isSlowMo ? 'Slow-Mo 0.25x' : 'Live Speed 1.0x'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={handleTriggerImpactReplay}
                className={`px-2.5 py-1.5 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  isSlowMo && !isImpactFrozen
                    ? 'bg-rose-950 border border-rose-600 text-rose-200 shadow-sm'
                    : 'bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300'
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-rose-400" />
                <span>Slow-Mo Replay</span>
              </button>

              <button
                type="button"
                onClick={handleFreezeAtImpact}
                className={`px-2.5 py-1.5 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  isImpactFrozen
                    ? 'bg-amber-950 border border-amber-600 text-amber-200 shadow-sm'
                    : 'bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Freeze Impact</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectCameraView('stump_cam')}
                className={`px-2.5 py-1.5 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  activeCameraView === 'stump_cam'
                    ? 'bg-emerald-950 border border-emerald-600 text-emerald-300 shadow-sm'
                    : 'bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300'
                }`}
              >
                <Camera className="w-3.5 h-3.5 text-emerald-400" />
                <span>Stump Cam</span>
              </button>

              <button
                type="button"
                onClick={handleResumeNormalSpeed}
                className="px-2.5 py-1.5 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 hover:text-white transition-all"
              >
                <Play className="w-3.5 h-3.5 text-slate-400" />
                <span>Resume Normal</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Collapsible Bottom Dock (Center Floating) */}
      <div
        className="absolute z-20 transition-all duration-300 ease-out"
        style={{
          bottom: '16px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'calc(100% - 32px)',
          maxWidth: '890px',
        }}
      >
        <div className="bg-[#0b0f19]/95 backdrop-blur-md border border-slate-800 rounded-xl p-3 shadow-2xl flex flex-col gap-2">
          {/* Dock Top Handle & Collapse Toggle */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>Interactive Delivery & Camera Controls</span>
              <span className="text-slate-600" aria-hidden="true">·</span>
              <span className="text-slate-400 font-normal">
                {activeMode === 'trajectory' ? 'Select Delivery' : activeMode === 'wagon' ? 'Shot Breakdown' : 'Pitch Geometry'}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              {activeMode === 'trajectory' && (
                <button
                  type="button"
                  onClick={() => setShowImpactOverlay(!showImpactOverlay)}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors flex items-center gap-1 ${
                    showImpactOverlay
                      ? 'bg-rose-950/80 text-rose-300 border border-rose-700/60'
                      : 'bg-slate-900 text-slate-400 border border-slate-800'
                  }`}
                >
                  <Flame className="w-3 h-3 text-rose-400" />
                  <span>Impact Replay HUD</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsDockCollapsed(!isDockCollapsed)}
                aria-label={isDockCollapsed ? 'Expand 3D controls' : 'Collapse 3D controls'}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-md hover:bg-slate-850 transition-colors"
              >
                {isDockCollapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {!isDockCollapsed && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
              {/* Delivery Selector (in Trajectory Mode) */}
              {activeMode === 'trajectory' && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                  {DELIVERIES.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => handleSelectDelivery(d)}
                      className={`whitespace-nowrap px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                        selectedDelivery.id === d.id
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                      }`}
                    >
                      {d.hitStumps && <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />}
                      <span>{d.name.split(' ')[1] || d.name}</span>
                      <span className="text-[10px] font-mono opacity-80">({d.speedKmh}k)</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Wagon Wheel Legend (in Wagon Mode) */}
              {activeMode === 'wagon' && (
                <div className="flex items-center gap-3 text-xs text-slate-300 overflow-x-auto">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                    <span>Sixes (85m+)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span>Fours (Boundary)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
                    <span>1s & 2s</span>
                  </div>
                </div>
              )}

              {/* Pitch Dimensions Info (in Pitch Mode) */}
              {activeMode === 'pitch' && (
                <div className="flex items-center gap-4 text-xs text-slate-300">
                  <div>
                    <span className="text-slate-500">Pitch:</span>{' '}
                    <span className="font-semibold text-emerald-400">22 Yards (20.12m)</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Stump Height:</span>{' '}
                    <span className="font-semibold text-sky-400">28 inches (71.1cm)</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Popping Crease:</span>{' '}
                    <span className="font-semibold text-purple-400">4 Feet (1.22m)</span>
                  </div>
                </div>
              )}

              {/* Boundary Shots Selector (in Boundary Mode) */}
              {activeMode === 'boundary' && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                  {BOUNDARY_SHOTS.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => handleSelectBoundaryShot(s)}
                      className={`whitespace-nowrap px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                        selectedBoundaryShot.id === s.id
                          ? s.expectedOutcome === 'SIX'
                            ? 'bg-purple-600 text-white shadow-sm'
                            : 'bg-rose-600 text-white shadow-sm'
                          : 'bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${s.expectedOutcome === 'SIX' ? 'bg-purple-400' : 'bg-rose-400'}`} />
                      <span>{s.batsman.split(' ')[0]}: {s.name.split(' ')[1] || s.name}</span>
                      <span className="text-[10px] font-mono opacity-80">({s.expectedOutcome === 'SIX' ? '6' : '4'})</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Media & Camera Angle Controls */}
              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    const nextPlaying = !isPlaying;
                    setIsPlaying(nextPlaying);
                    isPlayingRef.current = nextPlaying;
                    sounds.playClick();
                  }}
                  className="p-2 rounded-lg bg-slate-900 hover:bg-slate-850 text-slate-200 transition-colors border border-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  title={isPlaying ? 'Pause Animation' : 'Play Animation'}
                  aria-label={isPlaying ? 'Pause ball delivery animation' : 'Play ball delivery animation'}
                >
                  {isPlaying ? <Pause className="w-4 h-4 text-amber-400" /> : <Play className="w-4 h-4 text-emerald-400" />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    ballProgressRef.current = 0;
                    resetBails();
                    sounds.playClick();
                  }}
                  className="p-2 rounded-lg bg-slate-900 hover:bg-slate-850 text-slate-200 transition-colors border border-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  title="Replay Delivery"
                  aria-label="Replay current ball delivery"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                <div className="h-4 w-[1px] bg-slate-800 mx-1" />

                {/* Quick Camera Preset Buttons */}
                <div className="hidden sm:flex items-center gap-1 text-xs">
                  <button
                    type="button"
                    onClick={() => handleSelectCameraView('bowlers_end')}
                    className={`px-2 py-1 rounded transition-colors ${
                      activeCameraView === 'bowlers_end'
                        ? 'bg-emerald-950/80 border border-emerald-600/60 text-emerald-300 font-semibold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                    }`}
                  >
                    Bowler
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectCameraView('stump_cam')}
                    className={`px-2 py-1 rounded transition-colors ${
                      activeCameraView === 'stump_cam'
                        ? 'bg-rose-950/80 border border-rose-600/60 text-rose-300 font-semibold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                    }`}
                  >
                    Stump Cam
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectCameraView('birds_eye')}
                    className={`px-2 py-1 rounded transition-colors ${
                      activeCameraView === 'birds_eye'
                        ? 'bg-emerald-950/80 border border-emerald-600/60 text-emerald-300 font-semibold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                    }`}
                  >
                    Aerial
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
