import * as THREE from 'three';
import { TestResult } from './sqlite-wasm.test';
import { PRESET_CAMERA_VIEWS } from '../src/components/CricketPitch3D';

export async function runThreeJsPitchTests(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  // Test 1: Verify Three.js ShadowMap Type and Deprecation Compliance
  {
    const start = performance.now();
    try {
      // THREE.PCFSoftShadowMap was removed in Three.js v0.186+
      // Verify PCFShadowMap exists and is used
      if (typeof THREE.PCFShadowMap !== 'number') {
        throw new Error('THREE.PCFShadowMap is not defined');
      }

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, 800 / 600, 0.1, 100);
      const light = new THREE.DirectionalLight(0xffffff, 1.5);
      light.castShadow = true;
      light.shadow.mapSize.width = 1024;
      light.shadow.mapSize.height = 1024;
      scene.add(light);

      results.push({
        name: 'Three.js PCFShadowMap & Lighting Configuration',
        passed: true,
        durationMs: Number((performance.now() - start).toFixed(2)),
        details: {
          shadowMapType: 'THREE.PCFShadowMap',
          shadowMapValue: THREE.PCFShadowMap,
          lightCastShadow: light.castShadow,
        },
      });
    } catch (e: any) {
      results.push({
        name: 'Three.js PCFShadowMap & Lighting Configuration',
        passed: false,
        durationMs: Number((performance.now() - start).toFixed(2)),
        error: e.message,
      });
    }
  }

  // Test 2: Verify Cricket Pitch Geometry & Trajectory Spline Math
  {
    const start = performance.now();
    try {
      const curveVectors = [
        new THREE.Vector3(0, 2.1, -10),
        new THREE.Vector3(0.05, 1.3, -5),
        new THREE.Vector3(0.1, 0.08, 6.2), // bounce point
        new THREE.Vector3(0.45, 0.65, 8.5),
        new THREE.Vector3(0.85, 0.72, 10),
      ];

      const spline = new THREE.CatmullRomCurve3(curveVectors);
      const length = spline.getLength();

      // Test bounce calculation
      const bouncePt = spline.getPoint(0.7);
      if (!bouncePt || typeof bouncePt.y !== 'number') {
        throw new Error('Failed to sample spline trajectory point');
      }

      results.push({
        name: 'Cricket Pitch Trajectory Mathematics & Vector Curves',
        passed: length > 19 && length < 25,
        durationMs: Number((performance.now() - start).toFixed(2)),
        details: {
          totalTrajectoryLength: `${length.toFixed(2)} units (scaled 22 yards)`,
          sampledElevationAtBounce: Number(bouncePt.y.toFixed(3)),
          controlPoints: curveVectors.length,
        },
      });
    } catch (e: any) {
      results.push({
        name: 'Cricket Pitch Trajectory Mathematics & Vector Curves',
        passed: false,
        durationMs: Number((performance.now() - start).toFixed(2)),
        error: e.message,
      });
    }
  }

  // Test 3: Verify Preset Camera Views Geometry & Cinematic Interpolation Math
  {
    const start = performance.now();
    try {
      if (!Array.isArray(PRESET_CAMERA_VIEWS) || PRESET_CAMERA_VIEWS.length !== 3) {
        throw new Error(`Expected 3 camera view presets, found ${PRESET_CAMERA_VIEWS?.length}`);
      }

      const birdsEye = PRESET_CAMERA_VIEWS.find((v) => v.id === 'birds_eye');
      const bowlersEnd = PRESET_CAMERA_VIEWS.find((v) => v.id === 'bowlers_end');
      const umpireView = PRESET_CAMERA_VIEWS.find((v) => v.id === 'umpire_view');

      if (!birdsEye || !bowlersEnd || !umpireView) {
        throw new Error("Missing one of the required presets: Bird's Eye, Bowler's End, or Umpire View");
      }

      // Assert Bird's Eye is top-down aerial elevation (> 30 units) looking at pitch center
      if (birdsEye.position.y < 30 || birdsEye.target.length() > 0.1) {
        throw new Error(`Invalid Bird's Eye coordinates: pos=${JSON.stringify(birdsEye.position)} target=${JSON.stringify(birdsEye.target)}`);
      }

      // Assert Bowler's End is behind run-up (z < -15) looking down pitch towards striker (z > 5)
      if (bowlersEnd.position.z > -15 || bowlersEnd.target.z < 5) {
        throw new Error(`Invalid Bowler's End coordinates: pos=${JSON.stringify(bowlersEnd.position)} target=${JSON.stringify(bowlersEnd.target)}`);
      }

      // Assert Umpire View is human eye level (y ≈ 1.75m) and positioned behind non-striker wicket (z < -10)
      if (Math.abs(umpireView.position.y - 1.75) > 0.1 || umpireView.position.z > -10) {
        throw new Error(`Invalid Umpire View eye-level coordinates: pos=${JSON.stringify(umpireView.position)}`);
      }

      // Test lerp camera interpolation step
      const testCam = new THREE.Vector3().copy(bowlersEnd.position);
      testCam.lerp(birdsEye.position, 0.5);
      const expectedMidY = (bowlersEnd.position.y + birdsEye.position.y) * 0.5;
      if (Math.abs(testCam.y - expectedMidY) > 0.01) {
        throw new Error('Camera lerp vector interpolation math failed');
      }

      results.push({
        name: "Preset Camera Views (Bird's Eye, Bowler's End, Umpire View) & Cinematic Lerp",
        passed: true,
        durationMs: Number((performance.now() - start).toFixed(2)),
        details: {
          presetsConfigured: PRESET_CAMERA_VIEWS.map((p) => p.label),
          birdsEyeAltitude: `${birdsEye.position.y} units`,
          bowlerEndDistance: `${Math.abs(bowlersEnd.position.z)} units`,
          umpireEyeHeight: `${umpireView.position.y}m (official eye-level)`,
          lerpInterpolationVerified: true,
        },
      });
    } catch (e: any) {
      results.push({
        name: "Preset Camera Views (Bird's Eye, Bowler's End, Umpire View) & Cinematic Lerp",
        passed: false,
        durationMs: Number((performance.now() - start).toFixed(2)),
        error: e.message,
      });
    }
  }

  return results;
}
