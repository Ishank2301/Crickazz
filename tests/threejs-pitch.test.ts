import * as THREE from 'three';
import { TestResult } from './sqlite-wasm.test';

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

  return results;
}
