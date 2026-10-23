import React, { useEffect, useRef, useState } from 'react';
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
  Maximize2,
  Wind,
  Target,
  Sparkles,
  Camera,
  UserCheck,
  Video,
} from 'lucide-react';
import { sounds } from '../utils/audio';

export type PresetCameraView = 'birds_eye' | 'bowlers_end' | 'umpire_view';

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
];

interface DeliveryPreset {
  id: string;
  name: string;
  speedKmh: number;
  type: string;
  bowler: string;
  description: string;
  curve: THREE.Vector3[];
  bounceIndex: number;
  hitStumps: boolean;
}

interface WagonShot {
  id: string;
  runs: number;
  shotName: string;
  distanceMeters: number;
  angleRad: number;
  color: number;
  height: number;
  batsman: string;
}

const DELIVERIES: DeliveryPreset[] = [
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
  },
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
  },
];

const WAGON_SHOTS: WagonShot[] = [
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

export function CricketPitch3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeMode, setActiveMode] = useState<'pitch' | 'trajectory' | 'wagon'>('trajectory');
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryPreset>(DELIVERIES[0]);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isDockCollapsed, setIsDockCollapsed] = useState<boolean>(false);
  const [selectedShot, setSelectedShot] = useState<WagonShot | null>(null);
  const [cameraPreset, setCameraPreset] = useState<'bowler' | 'batsman' | 'side' | 'overhead'>('bowler');
  const [activeCameraView, setActiveCameraView] = useState<PresetCameraView>('bowlers_end');

  // Animation & Three.js refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const ballMeshRef = useRef<THREE.Mesh | null>(null);
  const trajectoryTrailRef = useRef<THREE.Line | null>(null);
  const wagonLinesRef = useRef<THREE.Group | null>(null);
  const stumpsGroupRef = useRef<THREE.Group | null>(null);
  const bailsMeshRef = useRef<THREE.Mesh[]>([]);
  const ballProgressRef = useRef<number>(0);
  const bounceMarkerRef = useRef<THREE.Mesh | null>(null);

  // Mouse orbit dragging state
  const isMouseDownRef = useRef<boolean>(false);
  const mousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const cameraTargetRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0.8, 8));
  const cameraSphericalRef = useRef<{ radius: number; theta: number; phi: number }>({
    radius: 24,
    theta: Math.PI,
    phi: 1.25,
  });

  // Cinematic smooth camera glide interpolation refs
  const targetCamPosRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 3.8, -19));
  const targetCamLookAtRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0.8, 8));
  const currentCamLookAtRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0.8, 8));
  const isTransitioningCameraRef = useRef<boolean>(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 520;

    // 1. Scene Setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x060c18);
    scene.fog = new THREE.FogExp2(0x060c18, 0.015);

    // 2. Camera Setup
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 500);
    cameraRef.current = camera;
    updateCameraPosition();

    // 3. Renderer Setup conforming to Three.js constitutional standards
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;

    container.replaceChildren(renderer.domElement);

    // 4. Studio & Stadium Lighting (Warm Key + Cool Fill + Floodlights)
    const keyLight = new THREE.DirectionalLight(0xfff5e0, 1.8);
    keyLight.position.set(15, 25, -15);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 100;
    keyLight.shadow.camera.left = -20;
    keyLight.shadow.camera.right = 20;
    keyLight.shadow.camera.top = 20;
    keyLight.shadow.camera.bottom = -20;
    keyLight.shadow.bias = -0.0005;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x9fc5e8, 0.9);
    fillLight.position.set(-18, 18, 20);
    scene.add(fillLight);

    const hemiLight = new THREE.HemisphereLight(0x386641, 0x0f172a, 0.7);
    scene.add(hemiLight);

    // 5. Procedural Textures (Grass with stripes & Pitch Creases)
    const turfCanvas = document.createElement('canvas');
    turfCanvas.width = 512;
    turfCanvas.height = 512;
    const ctx = turfCanvas.getContext('2d');
    if (ctx) {
      // Concentric lawn mowing rings
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

    // 6. Ground Oval & Pitch Geometry
    const fieldGeo = new THREE.CylinderGeometry(40, 41, 0.4, 64);
    const fieldMat = new THREE.MeshStandardMaterial({
      map: turfTexture,
      roughness: 0.85,
      metalness: 0.05,
    });
    const field = new THREE.Mesh(fieldGeo, fieldMat);
    field.position.y = -0.2;
    field.receiveShadow = true;
    scene.add(field);

    // Boundary Rope Ring
    const boundaryGeo = new THREE.TorusGeometry(38, 0.22, 16, 100);
    const boundaryMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      roughness: 0.5,
      metalness: 0.2,
    });
    const boundaryRope = new THREE.Mesh(boundaryGeo, boundaryMat);
    boundaryRope.rotation.x = Math.PI / 2;
    boundaryRope.position.y = 0.05;
    scene.add(boundaryRope);

    // 30-Yard Circle Inner Arc
    const circle30Geo = new THREE.RingGeometry(18.5, 18.7, 64);
    const circle30Mat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.4,
    });
    const circle30 = new THREE.Mesh(circle30Geo, circle30Mat);
    circle30.rotation.x = -Math.PI / 2;
    circle30.position.y = 0.02;
    scene.add(circle30);

    // 22-Yard Central Pitch (Scaled length ~20.12 units, width ~3.05 units)
    const pitchGeo = new THREE.BoxGeometry(3.2, 0.05, 20.2);
    const pitchMat = new THREE.MeshStandardMaterial({
      color: 0xc49a45,
      roughness: 0.9,
      metalness: 0.02,
    });
    const pitch = new THREE.Mesh(pitchGeo, pitchMat);
    pitch.position.y = 0.02;
    pitch.receiveShadow = true;
    scene.add(pitch);

    // Painted Pitch Crease Markings (Popping, Bowling & Return Creases)
    const createCreaseMarking = (width: number, length: number, x: number, z: number) => {
      const geo = new THREE.PlaneGeometry(width, length);
      const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
      const crease = new THREE.Mesh(geo, mat);
      crease.rotation.x = -Math.PI / 2;
      crease.position.set(x, 0.046, z);
      scene.add(crease);
    };

    // Batsman End Creases (z = 10)
    createCreaseMarking(2.6, 0.08, 0, 10.0); // Bowling crease
    createCreaseMarking(3.0, 0.08, 0, 8.8); // Popping crease
    createCreaseMarking(0.08, 2.4, -1.3, 9.4); // Return crease left
    createCreaseMarking(0.08, 2.4, 1.3, 9.4); // Return crease right

    // Bowler End Creases (z = -10)
    createCreaseMarking(2.6, 0.08, 0, -10.0);
    createCreaseMarking(3.0, 0.08, 0, -8.8);
    createCreaseMarking(0.08, 2.4, -1.3, -9.4);
    createCreaseMarking(0.08, 2.4, 1.3, -9.4);

    // 7. Stumps & Bails Group (Procedural composite models)
    const buildWicketGroup = (zPos: number, isTarget: boolean) => {
      const wicketGroup = new THREE.Group();
      const woodMat = new THREE.MeshStandardMaterial({
        color: 0xe0a96d,
        roughness: 0.4,
        metalness: 0.1,
      });

      const stumpGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.72, 16);
      const spacing = 0.12;

      // 3 Stumps (Off, Middle, Leg)
      for (let i = -1; i <= 1; i++) {
        const stump = new THREE.Mesh(stumpGeo, woodMat);
        stump.position.set(i * spacing, 0.36, 0);
        stump.castShadow = true;
        wicketGroup.add(stump);
      }

      // 2 Bails
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

    buildWicketGroup(10.0, true); // Batsman end
    buildWicketGroup(-10.0, false); // Bowler end

    // 8. Sight Screens at both ends
    const buildSightScreen = (zPos: number) => {
      const group = new THREE.Group();
      const screenGeo = new THREE.BoxGeometry(4.2, 2.8, 0.1);
      const screenMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.7 });
      const board = new THREE.Mesh(screenGeo, screenMat);
      board.position.y = 1.6;
      group.add(board);

      const poleGeo = new THREE.CylinderGeometry(0.06, 0.06, 3.2, 8);
      const poleMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5 });
      const pole1 = new THREE.Mesh(poleGeo, poleMat);
      pole1.position.set(-1.8, 1.6, 0);
      group.add(pole1);
      const pole2 = new THREE.Mesh(poleGeo, poleMat);
      pole2.position.set(1.8, 1.6, 0);
      group.add(pole2);

      group.position.set(0, 0, zPos);
      scene.add(group);
    };

    buildSightScreen(36);
    buildSightScreen(-36);

    // 9. Stadium Floodlight Towers (4 corners, multi-part steel frame & light array)
    const towerPositions = [
      { x: 30, z: 25 },
      { x: -30, z: 25 },
      { x: 30, z: -25 },
      { x: -30, z: -25 },
    ];

    towerPositions.forEach((pos) => {
      const towerGroup = new THREE.Group();
      // Pylon
      const pylonGeo = new THREE.CylinderGeometry(0.4, 0.8, 22, 6);
      const pylonMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8, roughness: 0.3 });
      const pylon = new THREE.Mesh(pylonGeo, pylonMat);
      pylon.position.y = 11;
      towerGroup.add(pylon);

      // Light Head Array
      const headGeo = new THREE.BoxGeometry(3.5, 2.0, 0.8);
      const headMat = new THREE.MeshStandardMaterial({
        color: 0xfffbe8,
        emissive: 0xfff1aa,
        emissiveIntensity: 1.8,
        roughness: 0.2,
      });
      const head = new THREE.Mesh(headGeo, headMat);
      head.position.y = 22;
      head.lookAt(0, 5, 0);
      towerGroup.add(head);

      towerGroup.position.set(pos.x, 0, pos.z);
      scene.add(towerGroup);
    });

    // 10. Cricket Ball with Seam
    const ballCanvas = document.createElement('canvas');
    ballCanvas.width = 128;
    ballCanvas.height = 128;
    const bCtx = ballCanvas.getContext('2d');
    if (bCtx) {
      bCtx.fillStyle = '#dc2626'; // cricket red leather
      bCtx.fillRect(0, 0, 128, 128);
      bCtx.fillStyle = '#f8fafc'; // white seam
      bCtx.fillRect(60, 0, 8, 128);
    }
    const ballTexture = new THREE.CanvasTexture(ballCanvas);
    const ballGeo = new THREE.SphereGeometry(0.12, 32, 32);
    const ballMat = new THREE.MeshStandardMaterial({
      map: ballTexture,
      roughness: 0.3,
      metalness: 0.1,
    });
    const ballMesh = new THREE.Mesh(ballGeo, ballMat);
    ballMesh.castShadow = true;
    scene.add(ballMesh);
    ballMeshRef.current = ballMesh;

    // Pitch Bounce Contact Marker
    const bounceMarkerGeo = new THREE.RingGeometry(0.08, 0.35, 32);
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

    // 11. Wagon Wheel Group Initialization
    const wagonGroup = new THREE.Group();
    WAGON_SHOTS.forEach((shot) => {
      const radius = shot.distanceMeters * 0.36; // scale to field
      const targetX = Math.cos(shot.angleRad) * radius;
      const targetZ = 10.0 + Math.sin(shot.angleRad) * radius;

      // Arc curve from batsman crease
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

      // Landing point pin
      const pinGeo = new THREE.SphereGeometry(0.2, 16, 16);
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

    // 12. Mouse Drag Event Listeners for Orbiting
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
        0.1,
        Math.min(Math.PI / 2 - 0.05, cameraSphericalRef.current.phi - deltaY * 0.008)
      );
      updateCameraPosition();
    };

    const onMouseUp = () => {
      isMouseDownRef.current = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      cameraSphericalRef.current.radius = Math.max(
        8,
        Math.min(60, cameraSphericalRef.current.radius + e.deltaY * 0.03)
      );
      updateCameraPosition();
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    container.addEventListener('wheel', onWheel, { passive: false });

    // 13. Window Resize Handler
    const onResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    // 14. Render Animation Loop
    let lastTime = performance.now();
    const animate = (currentTime: number) => {
      const deltaTime = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      // Handle ball animation in trajectory mode
      if (ballMeshRef.current && activeMode === 'trajectory' && isPlaying) {
        ballProgressRef.current += deltaTime * (selectedDelivery.speedKmh / 140) * 0.65;
        if (ballProgressRef.current > 1.0) {
          ballProgressRef.current = 0;
          // Reset bails
          if (bailsMeshRef.current.length > 0) {
            bailsMeshRef.current[0].position.set(-0.06, 0.73, 0);
            bailsMeshRef.current[0].rotation.set(0, 0, Math.PI / 2);
            bailsMeshRef.current[1].position.set(0.06, 0.73, 0);
            bailsMeshRef.current[1].rotation.set(0, 0, Math.PI / 2);
          }
        }

        const t = ballProgressRef.current;
        const curve = new THREE.CatmullRomCurve3(selectedDelivery.curve);
        const pt = curve.getPoint(t);
        ballMeshRef.current.position.copy(pt);
        ballMeshRef.current.rotation.x += 0.25;
        ballMeshRef.current.rotation.z += 0.15;

        // Animate bails flying on bowled delivery
        if (selectedDelivery.hitStumps && t > 0.95 && bailsMeshRef.current.length > 0) {
          bailsMeshRef.current[0].position.y += 0.04;
          bailsMeshRef.current[0].position.x += 0.03;
          bailsMeshRef.current[0].rotation.x += 0.3;
          bailsMeshRef.current[1].position.y += 0.05;
          bailsMeshRef.current[1].position.x -= 0.04;
          bailsMeshRef.current[1].rotation.z += 0.4;
        }

        // Place bounce ring marker
        if (bounceMarkerRef.current && selectedDelivery.curve.length > 2) {
          const bouncePt = selectedDelivery.curve[selectedDelivery.bounceIndex];
          bounceMarkerRef.current.position.set(bouncePt.x, 0.04, bouncePt.z);
          bounceMarkerRef.current.visible = true;
        }
      }

      // Smooth cinematic camera gliding between preset views
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

      renderer.render(scene, camera);
      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    // 15. WebGL Context Loss & Restoration Safety
    const handleContextLost = (event: Event) => {
      event.preventDefault();
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
    const handleContextRestored = () => {
      renderer.setSize(container.clientWidth || 800, container.clientHeight || 520);
      animFrameRef.current = requestAnimationFrame(animate);
    };
    renderer.domElement.addEventListener('webglcontextlost', handleContextLost, false);
    renderer.domElement.addEventListener('webglcontextrestored', handleContextRestored, false);

    // Cleanup on unmount
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      container.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', handleContextRestored);
      
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
  }, []);

  // Update camera coordinates based on spherical coordinates
  const updateCameraPosition = () => {
    if (!cameraRef.current) return;
    const { radius, theta, phi } = cameraSphericalRef.current;
    const target = cameraTargetRef.current;

    cameraRef.current.position.x = target.x + radius * Math.sin(phi) * Math.sin(theta);
    cameraRef.current.position.y = target.y + radius * Math.cos(phi);
    cameraRef.current.position.z = target.z + radius * Math.sin(phi) * Math.cos(theta);
    cameraRef.current.lookAt(target);
  };

  // Select one of the broadcast preset camera views ('Bird's Eye', 'Bowler's End', 'Umpire View')
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

  // Switch camera angle presets
  const handleCameraPreset = (preset: 'bowler' | 'batsman' | 'side' | 'overhead') => {
    setCameraPreset(preset);
    if (preset === 'bowler') {
      handleSelectCameraView('bowlers_end');
    } else if (preset === 'overhead') {
      handleSelectCameraView('birds_eye');
    } else if (preset === 'batsman') {
      handleSelectCameraView('umpire_view');
    } else if (preset === 'side') {
      sounds.playClick();
      cameraSphericalRef.current = { radius: 20, theta: Math.PI / 2, phi: 1.3 };
      cameraTargetRef.current = new THREE.Vector3(0, 0.5, 0);
      targetCamPosRef.current.set(20, 4.5, 0);
      targetCamLookAtRef.current.set(0, 0.5, 0);
      isTransitioningCameraRef.current = true;
    }
  };

  // Toggle modes
  useEffect(() => {
    if (wagonLinesRef.current) {
      wagonLinesRef.current.visible = activeMode === 'wagon';
    }
    if (ballMeshRef.current) {
      ballMeshRef.current.visible = activeMode === 'trajectory';
    }
    if (bounceMarkerRef.current) {
      bounceMarkerRef.current.visible = activeMode === 'trajectory';
    }

    if (activeMode === 'wagon') {
      handleCameraPreset('overhead');
    } else if (activeMode === 'trajectory') {
      handleCameraPreset('bowler');
    }
  }, [activeMode]);

  return (
    <div className="relative w-full h-[580px] bg-[#070b13] rounded-lg overflow-hidden border border-slate-800 shadow-xl flex flex-col">
      {/* 3D WebGL Canvas Viewport */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing select-none" />

      {/* Floating Top Header Overlay */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto bg-[#0b0f19]/90 backdrop-blur-md px-3.5 py-1.5 rounded-md border border-slate-800 shadow-md">
          <span className="text-xs font-semibold text-slate-100">
            Cricket 3D Physics Viewport
          </span>
          <span className="text-slate-600" aria-hidden="true">·</span>
          <span className="text-[11px] text-slate-400 font-mono">
            Interactive Hawkeye
          </span>
        </div>

        {/* Mode Switcher Buttons */}
        <div className="flex items-center gap-1 pointer-events-auto bg-[#0b0f19]/90 backdrop-blur-md p-1 rounded-md border border-slate-800 shadow-md">
          <button
            type="button"
            onClick={() => setActiveMode('trajectory')}
            className={`px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1.5 transition-colors ${
              activeMode === 'trajectory'
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>Ball Hawkeye</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('wagon')}
            className={`px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1.5 transition-colors ${
              activeMode === 'wagon'
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Wagon Wheel</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('pitch')}
            className={`px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1.5 transition-colors ${
              activeMode === 'pitch'
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Pitch View</span>
          </button>
        </div>
      </div>

      {/* Trajectory / Shot Active Specs Card */}
      {activeMode === 'trajectory' && (
        <div className="absolute top-16 left-4 bg-[#0b0f19]/90 backdrop-blur-md p-3.5 rounded-md border border-slate-800 text-xs text-slate-300 w-64 shadow-lg pointer-events-none">
          <div className="flex items-center justify-between mb-1">
            <span className="font-semibold text-slate-100">{selectedDelivery.bowler}</span>
            <span className="font-mono text-emerald-400 font-semibold tabular-nums">{selectedDelivery.speedKmh} km/h</span>
          </div>
          <div className="text-[11px] text-slate-400 mb-2 leading-relaxed">{selectedDelivery.description}</div>
          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
            <span>Length: Good</span>
            <span className="text-slate-600" aria-hidden="true">·</span>
            <span className={selectedDelivery.hitStumps ? 'text-rose-400' : 'text-slate-400'}>
              {selectedDelivery.hitStumps ? 'Wicket: Bowled' : 'Line: Outside Off'}
            </span>
          </div>
        </div>
      )}

      {/* Preset Camera Views Overlay */}
      <div className="absolute top-16 right-4 z-10 bg-[#0b0f19]/90 backdrop-blur-md p-2.5 rounded-lg border border-slate-800 shadow-xl pointer-events-auto flex flex-col gap-2 w-64">
        <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/80 px-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
            <Camera className="w-3.5 h-3.5 text-emerald-400" />
            <span>Preset Camera Views</span>
          </div>
          <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Cinematic 3D</span>
          </span>
        </div>

        <div className="grid grid-cols-1 gap-1.5">
          {PRESET_CAMERA_VIEWS.map((view) => {
            const isActive = activeCameraView === view.id;
            return (
              <button
                key={view.id}
                type="button"
                onClick={() => handleSelectCameraView(view.id)}
                className={`flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-all ${
                  isActive
                    ? 'bg-emerald-950/80 border border-emerald-600/60 text-emerald-300 font-semibold shadow-[0_0_12px_rgba(16,185,129,0.15)]'
                    : 'bg-slate-900/70 hover:bg-slate-850 border border-slate-800/80 text-slate-400 hover:text-slate-200'
                }`}
                title={view.sublabel}
              >
                <div className="flex items-center gap-2">
                  {view.id === 'birds_eye' && (
                    <Eye className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                  )}
                  {view.id === 'bowlers_end' && (
                    <Target className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                  )}
                  {view.id === 'umpire_view' && (
                    <UserCheck className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                  )}
                  <span>{view.label}</span>
                </div>
                <span
                  className={`text-[9px] font-mono px-1.5 py-0.5 rounded uppercase tracking-wider ${
                    isActive
                      ? 'bg-emerald-900/90 text-emerald-200 border border-emerald-700/80'
                      : 'bg-slate-950 text-slate-500'
                  }`}
                >
                  {view.badge}
                </span>
              </button>
            );
          })}
        </div>

        <div className="text-[10px] text-slate-400 font-mono px-1 leading-tight">
          {PRESET_CAMERA_VIEWS.find((v) => v.id === activeCameraView)?.sublabel}
        </div>
      </div>

      {/* Collapsible Bottom Dock (Floating above canvas) */}
      <div
        className="absolute z-20 transition-all duration-300 ease-out"
        style={{
          bottom: '16px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'calc(100% - 32px)',
          maxWidth: '820px',
        }}
      >
        <div className="bg-[#0b0f19]/95 backdrop-blur-md border border-slate-800 rounded-lg p-3 shadow-xl flex flex-col gap-2">
          {/* Dock Top Handle & Collapse Toggle */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              <span>Interactive Controls</span>
              <span className="text-slate-600" aria-hidden="true">·</span>
              <span className="text-slate-400 font-normal">Presets & Camera</span>
            </div>
            <button
              type="button"
              onClick={() => setIsDockCollapsed(!isDockCollapsed)}
              className="text-slate-400 hover:text-slate-200 p-1 rounded hover:bg-slate-850 transition-colors"
            >
              {isDockCollapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          {!isDockCollapsed && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1 border-t border-slate-800/80">
              {/* Delivery Selector (in Trajectory Mode) */}
              {activeMode === 'trajectory' && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                  {DELIVERIES.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => {
                        setSelectedDelivery(d);
                        ballProgressRef.current = 0;
                      }}
                      className={`whitespace-nowrap px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                        selectedDelivery.id === d.id
                          ? 'bg-slate-800 text-white font-semibold'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                      }`}
                    >
                      {d.name.split(' ')[1] || d.name}
                    </button>
                  ))}
                </div>
              )}

              {/* Wagon Wheel Legend (in Wagon Mode) */}
              {activeMode === 'wagon' && (
                <div className="flex items-center gap-3 text-xs text-slate-300 overflow-x-auto">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-500" />
                    <span>Sixes (85m+)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Fours (Boundary)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-sky-400" />
                    <span>1s & 2s</span>
                  </div>
                </div>
              )}

              {/* Camera Presets & Play/Pause */}
              <div className="flex items-center gap-1.5 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 transition-colors border border-slate-800"
                  title={isPlaying ? 'Pause Animation' : 'Play Animation'}
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    ballProgressRef.current = 0;
                  }}
                  className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 transition-colors border border-slate-800"
                  title="Replay Delivery"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>

                <div className="h-4 w-[1px] bg-slate-800 mx-1" />

                <span className="text-[11px] text-slate-500 font-medium">Angle:</span>
                <button
                  type="button"
                  onClick={() => handleSelectCameraView('bowlers_end')}
                  className={`px-2.5 py-0.5 rounded text-xs transition-colors ${
                    activeCameraView === 'bowlers_end'
                      ? 'bg-emerald-950/80 border border-emerald-600/60 text-emerald-300 font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  Bowler's End
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectCameraView('birds_eye')}
                  className={`px-2.5 py-0.5 rounded text-xs transition-colors ${
                    activeCameraView === 'birds_eye'
                      ? 'bg-emerald-950/80 border border-emerald-600/60 text-emerald-300 font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  Bird's Eye
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectCameraView('umpire_view')}
                  className={`px-2.5 py-0.5 rounded text-xs transition-colors ${
                    activeCameraView === 'umpire_view'
                      ? 'bg-emerald-950/80 border border-emerald-600/60 text-emerald-300 font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  Umpire View
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
