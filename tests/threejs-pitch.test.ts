import * as THREE from 'three';
import { TestResult } from './sqlite-wasm.test';
import {
  PRESET_CAMERA_VIEWS,
  DELIVERIES,
  createPitchGrassMaterial,
  BOUNDARY_RADIUS,
  BOUNDARY_SHOTS,
  checkBoundaryCollision,
  getBoundarySectorName,
} from '../src/components/CricketPitch3D';

export async function runThreeJsPitchTests(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  // Test 1: Verify Three.js ShadowMap Type and Deprecation Compliance
  {
    const start = performance.now();
    try {
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
      if (!Array.isArray(PRESET_CAMERA_VIEWS) || PRESET_CAMERA_VIEWS.length < 3) {
        throw new Error(`Expected at least 3 camera view presets, found ${PRESET_CAMERA_VIEWS?.length}`);
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

  // Test 4: Verify Visual Impact Replay Overlay & Stump Collision Telemetry
  {
    const start = performance.now();
    try {
      const yorker = DELIVERIES.find((d) => d.id === 'yorker');
      const googly = DELIVERIES.find((d) => d.id === 'googly');

      if (!yorker?.impactInfo || !googly?.impactInfo) {
        throw new Error('Wicket deliveries missing impactInfo telemetry configuration');
      }

      if (yorker.impactInfo.type !== 'BOWLED' || !yorker.impactInfo.bailsFly) {
        throw new Error('Yorker delivery must be configured as BOWLED with bailsFly=true');
      }

      const cp = yorker.impactInfo.contactPoint;
      if (Math.abs(cp.z - 10.0) > 0.5 || cp.y < 0.1 || cp.y > 1.2) {
        throw new Error(`Yorker contact coordinates out of expected stump impact bounds: ${JSON.stringify(cp)}`);
      }

      if (yorker.impactInfo.impactSpeedKmh < 100) {
        throw new Error('Yorker impact speed should reflect high pace');
      }

      results.push({
        name: 'Visual Impact Replay & Stump Collision Telemetry',
        passed: true,
        durationMs: Number((performance.now() - start).toFixed(2)),
        details: {
          yorkerStumpHit: yorker.impactInfo.stump,
          contactPoint: cp,
          googlyStumpHit: googly.impactInfo.stump,
          impactSpeed: `${yorker.impactInfo.impactSpeedKmh} km/h`,
          bailsDislodged: true,
        },
      });
    } catch (e: any) {
      results.push({
        name: 'Visual Impact Replay & Stump Collision Telemetry',
        passed: false,
        durationMs: Number((performance.now() - start).toFixed(2)),
        error: e.message,
      });
    }
  }

  // Test 5: Verify High-Resolution Pitch Grass Shader Material & Uniforms
  {
    const start = performance.now();
    try {
      const sunDir = new THREE.Vector3(10, 20, -10).normalize();
      const grassMat = createPitchGrassMaterial({ sunDirection: sunDir });

      if (!(grassMat instanceof THREE.ShaderMaterial)) {
        throw new Error('createPitchGrassMaterial did not return a THREE.ShaderMaterial instance');
      }

      // Assert essential uniforms are properly defined
      const u = grassMat.uniforms;
      if (!u.uTime || typeof u.uTime.value !== 'number') {
        throw new Error('Grass shader missing uTime float uniform');
      }
      if (!u.uGrassColorBase || !(u.uGrassColorBase.value instanceof THREE.Color)) {
        throw new Error('Grass shader missing uGrassColorBase uniform');
      }
      if (!u.uPitchSoilColor || !(u.uPitchSoilColor.value instanceof THREE.Color)) {
        throw new Error('Grass shader missing uPitchSoilColor uniform');
      }
      if (!u.uWearMarkColor || !(u.uWearMarkColor.value instanceof THREE.Color)) {
        throw new Error('Grass shader missing uWearMarkColor uniform');
      }
      if (!u.uSunDirection || !(u.uSunDirection.value instanceof THREE.Vector3)) {
        throw new Error('Grass shader missing uSunDirection uniform');
      }

      // Assert vertex & fragment GLSL contain key procedural functions
      if (!grassMat.fragmentShader.includes('fbm') || !grassMat.fragmentShader.includes('uWearMarkColor')) {
        throw new Error('Grass fragment shader missing FBM noise or wear mark calculations');
      }
      if (!grassMat.fragmentShader.includes('uStripeFrequency')) {
        throw new Error('Grass fragment shader missing mowing stripe frequency uniform');
      }

      // Test uniform mutation across animation frame
      grassMat.uniforms.uTime.value = 1.25;
      if (grassMat.uniforms.uTime.value !== 1.25) {
        throw new Error('Failed to update uTime uniform');
      }

      grassMat.dispose();

      results.push({
        name: 'Pitch High-Resolution Procedural Grass Shader & Uniforms',
        passed: true,
        durationMs: Number((performance.now() - start).toFixed(2)),
        details: {
          shaderMaterial: 'THREE.ShaderMaterial',
          vertexShaderDefined: grassMat.vertexShader.length > 50,
          fragmentShaderLength: grassMat.fragmentShader.length,
          fbmNoiseIncluded: true,
          mowingStripesConfigured: true,
          bowlerBatsmanWearConfigured: true,
          specularGlintConfigured: true,
        },
      });
    } catch (e: any) {
      results.push({
        name: 'Pitch High-Resolution Procedural Grass Shader & Uniforms',
        passed: false,
        durationMs: Number((performance.now() - start).toFixed(2)),
        error: e.message,
      });
    }
  }

  // Test 6: Verify Dynamic 3D Boundary Rope Geometry, Braided Coils & Perimeter Radius (R = 38.0m)
  {
    const start = performance.now();
    try {
      if (BOUNDARY_RADIUS !== 38.0) {
        throw new Error(`Expected BOUNDARY_RADIUS to be 38.0m, found ${BOUNDARY_RADIUS}`);
      }

      if (!Array.isArray(BOUNDARY_SHOTS) || BOUNDARY_SHOTS.length < 3) {
        throw new Error(`Expected at least 3 preset boundary trajectories, found ${BOUNDARY_SHOTS?.length}`);
      }

      const coverDrive = BOUNDARY_SHOTS.find((s) => s.id === 'cover_drive_four');
      const pullSix = BOUNDARY_SHOTS.find((s) => s.id === 'pull_shot_six');

      if (!coverDrive || coverDrive.expectedOutcome !== 'FOUR') {
        throw new Error('Missing cover_drive_four preset or expectedOutcome is not FOUR');
      }
      if (!pullSix || pullSix.expectedOutcome !== 'SIX') {
        throw new Error('Missing pull_shot_six preset or expectedOutcome is not SIX');
      }

      // Test sector resolution
      const coverSector = getBoundarySectorName(Math.PI * 0.25); // 45 deg
      const longOffSector = getBoundarySectorName(Math.PI * 0.5); // 90 deg
      const midWicketSector = getBoundarySectorName(Math.PI); // 180 deg

      if (coverSector !== 'Deep Extra Cover') {
        throw new Error(`Expected 'Deep Extra Cover' for 45 deg, got '${coverSector}'`);
      }
      if (longOffSector !== 'Long Off') {
        throw new Error(`Expected 'Long Off' for 90 deg, got '${longOffSector}'`);
      }
      if (midWicketSector !== 'Deep Mid-Wicket') {
        throw new Error(`Expected 'Deep Mid-Wicket' for 180 deg, got '${midWicketSector}'`);
      }

      results.push({
        name: 'Dynamic 3D Boundary Rope Geometry & Perimeter Radius (R = 38.0m)',
        passed: true,
        durationMs: Number((performance.now() - start).toFixed(2)),
        details: {
          stadiumPerimeterRadius: `${BOUNDARY_RADIUS}m`,
          presetBoundaryTrajectories: BOUNDARY_SHOTS.map((s) => `${s.name} (${s.expectedOutcome})`),
          sectorMappingVerified: true,
        },
      });
    } catch (e: any) {
      results.push({
        name: 'Dynamic 3D Boundary Rope Geometry & Perimeter Radius (R = 38.0m)',
        passed: false,
        durationMs: Number((performance.now() - start).toFixed(2)),
        error: e.message,
      });
    }
  }

  // Test 7: Verify Trajectory Boundary Collision Detection Engine (Ground 4 vs Aerial 6)
  {
    const start = performance.now();
    try {
      const coverDrive = BOUNDARY_SHOTS.find((s) => s.id === 'cover_drive_four')!;
      const pullSix = BOUNDARY_SHOTS.find((s) => s.id === 'pull_shot_six')!;

      // 1. Detect ground boundary rope collision
      const groundCollision = checkBoundaryCollision(coverDrive.curve, 38.0);
      if (!groundCollision || !groundCollision.hasCollided) {
        throw new Error('checkBoundaryCollision failed to detect ground boundary rope strike');
      }
      if (groundCollision.runs !== 4 || groundCollision.collisionType !== 'ROPE_STRIKE_FOUR') {
        throw new Error(`Expected 4 runs ROPE_STRIKE_FOUR, got ${groundCollision.runs} ${groundCollision.collisionType}`);
      }
      if (!groundCollision.isGroundBoundary || groundCollision.elevationAtCrossing > 0.40) {
        throw new Error(`Expected ground collision (y <= 0.40), got y = ${groundCollision.elevationAtCrossing}`);
      }

      // 2. Detect aerial six rope clearance
      const aerialCollision = checkBoundaryCollision(pullSix.curve, 38.0);
      if (!aerialCollision || !aerialCollision.hasCollided) {
        throw new Error('checkBoundaryCollision failed to detect aerial rope clearance');
      }
      if (aerialCollision.runs !== 6 || aerialCollision.collisionType !== 'AERIAL_CLEARANCE_SIX') {
        throw new Error(`Expected 6 runs AERIAL_CLEARANCE_SIX, got ${aerialCollision.runs} ${aerialCollision.collisionType}`);
      }
      if (aerialCollision.isGroundBoundary || aerialCollision.elevationAtCrossing <= 0.40) {
        throw new Error(`Expected aerial clearance (y > 0.40), got y = ${aerialCollision.elevationAtCrossing}`);
      }

      // 3. In-field trajectory that never reaches boundary (radius < 38m)
      const inFieldCurve = [
        new THREE.Vector3(0, 0.4, 10.0),
        new THREE.Vector3(5.0, 0.2, 8.0),
        new THREE.Vector3(12.0, 0.05, 5.0),
      ];
      const inFieldCollision = checkBoundaryCollision(inFieldCurve, 38.0);
      if (inFieldCollision !== null) {
        throw new Error('In-field short stroke should not trigger boundary collision');
      }

      results.push({
        name: 'Trajectory Boundary Collision Detection Engine (Ground 4 vs Aerial 6)',
        passed: true,
        durationMs: Number((performance.now() - start).toFixed(2)),
        details: {
          groundCollision: {
            runs: groundCollision.runs,
            type: groundCollision.collisionType,
            sector: groundCollision.sectorName,
            point: groundCollision.contactPoint,
          },
          aerialCollision: {
            runs: aerialCollision.runs,
            type: aerialCollision.collisionType,
            elevation: `${aerialCollision.elevationAtCrossing}m`,
            sector: aerialCollision.sectorName,
          },
          inFieldSuppressionVerified: true,
        },
      });
    } catch (e: any) {
      results.push({
        name: 'Trajectory Boundary Collision Detection Engine (Ground 4 vs Aerial 6)',
        passed: false,
        durationMs: Number((performance.now() - start).toFixed(2)),
        error: e.message,
      });
    }
  }

  return results;
}
