"""
Three.js 3D Cricket Pitch & Hawkeye Viewport Generator for Streamlit
Generates an interactive WebGL viewport featuring the 3 Preset Camera Views:
- Bird's Eye (360° top-down aerial overview)
- Bowler's End (Delivery run-up vantage following ball swing & seam)
- Umpire View (1.75m eye level behind non-striker stumps evaluating LBW line)
"""

def get_threejs_pitch_html() -> str:
    return """
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; user-select: none; }
    body {
      background: #070b13;
      color: #f1f5f9;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      overflow: hidden;
      width: 100vw;
      height: 100vh;
    }
    #viewport { width: 100%; height: 100%; cursor: grab; }
    #viewport:active { cursor: grabbing; }
    
    .overlay {
      position: absolute;
      background: rgba(11, 15, 25, 0.9);
      backdrop-filter: blur(8px);
      border: 1px solid #1e293b;
      border-radius: 8px;
      color: #cbd5e1;
      font-size: 11px;
      z-index: 10;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
    }
    
    /* Top Bar */
    .top-bar {
      top: 12px;
      left: 12px;
      right: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 14px;
      pointer-events: none;
    }
    .top-brand {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 700;
      color: #10b981;
      pointer-events: auto;
    }
    .mode-pills {
      display: flex;
      gap: 4px;
      pointer-events: auto;
    }
    .mode-btn {
      background: #0f172a;
      border: 1px solid #1e293b;
      color: #94a3b8;
      padding: 4px 10px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 11px;
      transition: all 0.15s;
    }
    .mode-btn.active {
      background: #1e293b;
      color: #ffffff;
      border-color: #3b82f6;
      font-weight: 600;
    }

    /* Preset Camera Views Overlay */
    .camera-overlay {
      top: 56px;
      right: 12px;
      padding: 10px;
      width: 220px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      pointer-events: auto;
    }
    .cam-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-weight: 600;
      color: #f1f5f9;
      padding-bottom: 6px;
      border-bottom: 1px solid #1e293b;
    }
    .cam-badge {
      font-size: 9px;
      color: #10b981;
      font-family: monospace;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .pulse-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #10b981;
    }
    .cam-btn {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #0f172a;
      border: 1px solid #1e293b;
      color: #94a3b8;
      padding: 6px 10px;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.15s;
      text-align: left;
    }
    .cam-btn:hover {
      background: #1e293b;
      color: #f8fafc;
    }
    .cam-btn.active {
      background: rgba(6, 78, 59, 0.8);
      border-color: #059669;
      color: #6ee7b7;
      font-weight: 600;
    }
    .cam-tag {
      font-size: 8px;
      font-family: monospace;
      padding: 2px 5px;
      border-radius: 3px;
      background: #022c22;
      color: #a7f3d0;
      border: 1px solid #065f46;
    }
    .cam-subtext {
      font-size: 9px;
      color: #64748b;
      font-family: monospace;
      line-height: 1.2;
    }

    /* Delivery Specs Card */
    .specs-card {
      top: 56px;
      left: 12px;
      padding: 10px 14px;
      width: 200px;
      pointer-events: none;
    }
    .specs-bowler { font-weight: 700; color: #f8fafc; font-size: 12px; }
    .specs-speed { color: #10b981; font-family: monospace; font-weight: 700; }
    .specs-desc { color: #94a3b8; font-size: 10px; margin-top: 4px; }

    /* Bottom Control Bar */
    .bottom-dock {
      bottom: 12px;
      left: 50%;
      transform: translateX(-50%);
      padding: 8px 14px;
      display: flex;
      align-items: center;
      gap: 12px;
      max-width: 90%;
      pointer-events: auto;
    }
    .delivery-pill {
      background: #0f172a;
      border: 1px solid #1e293b;
      color: #94a3b8;
      padding: 4px 8px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 11px;
    }
    .delivery-pill.active {
      background: #10b981;
      color: #022c22;
      font-weight: 700;
      border-color: #10b981;
    }
  </style>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
</head>
<body>
  <div id="viewport"></div>

  <!-- Top Bar -->
  <div class="overlay top-bar">
    <div class="top-brand">
      <span>🏏 3D Hawkeye Stadium Viewport</span>
    </div>
    <div class="mode-pills">
      <button class="mode-btn active" id="btn-mode-trajectory">Ball Hawkeye</button>
      <button class="mode-btn" id="btn-mode-pitch">Pitch Geometry</button>
    </div>
  </div>

  <!-- Delivery Specs -->
  <div class="overlay specs-card">
    <div style="display:flex; justify-content:space-between;">
      <span class="specs-bowler" id="bowler-name">Jasprit Bumrah</span>
      <span class="specs-speed" id="bowler-speed">144 km/h</span>
    </div>
    <div class="specs-desc" id="bowler-desc">Pitches middle, late outswing beats edge.</div>
  </div>

  <!-- Preset Camera Views Overlay -->
  <div class="overlay camera-overlay">
    <div class="cam-header">
      <span>Preset Camera Views</span>
      <span class="cam-badge"><span class="pulse-dot"></span>Cinematic 3D</span>
    </div>
    <button class="cam-btn active" id="btn-bowlers-end">
      <span>Bowler's End</span>
      <span class="cam-tag">Trajectory</span>
    </button>
    <button class="cam-btn" id="btn-birds-eye">
      <span>Bird's Eye</span>
      <span class="cam-tag">360° Aerial</span>
    </button>
    <button class="cam-btn" id="btn-umpire-view">
      <span>Umpire View</span>
      <span class="cam-tag">LBW Cam</span>
    </button>
    <div class="cam-subtext" id="cam-desc">Behind bowler following swing & seam.</div>
  </div>

  <!-- Bottom Dock -->
  <div class="overlay bottom-dock">
    <button class="delivery-pill active" data-id="outswinger">144k Outswinger</button>
    <button class="delivery-pill" data-id="yorker">148k Yorker</button>
    <button class="delivery-pill" data-id="bouncer">142k Bouncer</button>
    <button class="delivery-pill" data-id="googly">89k Googly</button>
    <button class="mode-btn" id="btn-pause-play" style="margin-left: 8px;">⏸</button>
  </div>

  <script>
    // 1. Scene, Camera, Renderer Setup
    const container = document.getElementById('viewport');
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060c18);
    scene.fog = new THREE.FogExp2(0x060c18, 0.012);

    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 500);
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // 2. Stadium Lighting
    const dirLight = new THREE.DirectionalLight(0xfff5e0, 1.8);
    dirLight.position.set(15, 25, -15);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0x9fc5e8, 0.8);
    fillLight.position.set(-18, 18, 20);
    scene.add(fillLight);
    scene.add(new THREE.AmbientLight(0x386641, 0.6));

    // 3. Turf Field & Pitch Setup
    const fieldGeo = new THREE.CylinderGeometry(45, 45, 0.4, 64);
    const fieldMat = new THREE.MeshStandardMaterial({ color: 0x1e4822, roughness: 0.9 });
    const fieldMesh = new THREE.Mesh(fieldGeo, fieldMat);
    fieldMesh.position.y = -0.2;
    fieldMesh.receiveShadow = true;
    scene.add(fieldMesh);

    // 22-Yard Cricket Pitch (20.12m long x 3.05m wide)
    const pitchGeo = new THREE.BoxGeometry(3.05, 0.08, 20.12);
    const pitchMat = new THREE.MeshStandardMaterial({ color: 0xbfa882, roughness: 0.85 });
    const pitchMesh = new THREE.Mesh(pitchGeo, pitchMat);
    pitchMesh.position.y = 0.04;
    pitchMesh.receiveShadow = true;
    scene.add(pitchMesh);

    // Crease Lines
    function makeLine(w, h, z, color = 0xffffff) {
      const geo = new THREE.PlaneGeometry(w, h);
      const mat = new THREE.MeshBasicMaterial({ color });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(0, 0.085, z);
      scene.add(mesh);
    }
    makeLine(2.44, 0.08, 8.78);  // Striker Popping Crease
    makeLine(2.44, 0.08, -8.78); // Non-Striker Popping Crease

    // Wooden Stumps
    function createStumps(zPos) {
      const g = new THREE.Group();
      [-0.11, 0, 0.11].forEach(x => {
        const geo = new THREE.CylinderGeometry(0.02, 0.02, 0.71, 16);
        const mat = new THREE.MeshStandardMaterial({ color: 0xe29578, roughness: 0.5 });
        const stump = new THREE.Mesh(geo, mat);
        stump.position.set(x, 0.36, zPos);
        stump.castShadow = true;
        g.add(stump);
      });
      scene.add(g);
    }
    createStumps(10.0);  // Striker Wicket
    createStumps(-10.0); // Non-Striker Wicket

    // Ball Mesh
    const ballGeo = new THREE.SphereGeometry(0.12, 32, 32);
    const ballMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3 });
    const ballMesh = new THREE.Mesh(ballGeo, ballMat);
    ballMesh.castShadow = true;
    scene.add(ballMesh);

    // Deliveries
    const DELIVERIES = {
      outswinger: {
        name: "Jasprit Bumrah", speed: "144 km/h", desc: "Late away swing beats outside edge.",
        curve: [new THREE.Vector3(0, 2.1, -10), new THREE.Vector3(0.05, 1.3, -5), new THREE.Vector3(0.1, 0.08, 6.2), new THREE.Vector3(0.45, 0.65, 8.5), new THREE.Vector3(0.85, 0.72, 10)]
      },
      yorker: {
        name: "Mitchell Starc", speed: "148 km/h", desc: "Devastating inswing yorker crashes stumps.",
        curve: [new THREE.Vector3(0.2, 2.15, -10), new THREE.Vector3(0.1, 1.1, -3), new THREE.Vector3(-0.15, 0.08, 8.8), new THREE.Vector3(-0.25, 0.35, 9.8), new THREE.Vector3(-0.28, 0.45, 10.0)]
      },
      bouncer: {
        name: "Pat Cummins", speed: "142 km/h", desc: "Sharp bouncer digs into pitch over shoulder.",
        curve: [new THREE.Vector3(-0.1, 2.2, -10), new THREE.Vector3(-0.05, 1.4, -6), new THREE.Vector3(0.0, 0.08, 0.5), new THREE.Vector3(0.15, 1.6, 6.5), new THREE.Vector3(0.25, 2.1, 10)]
      },
      googly: {
        name: "Rashid Khan", speed: "89 km/h", desc: "Wrong un spins sharply between bat and pad.",
        curve: [new THREE.Vector3(0.15, 1.8, -10), new THREE.Vector3(0.25, 1.2, -4), new THREE.Vector3(0.4, 0.08, 5.5), new THREE.Vector3(-0.1, 0.45, 8.2), new THREE.Vector3(-0.25, 0.48, 10.0)]
      }
    };
    let currentDelivery = DELIVERIES.outswinger;

    // Camera Presets
    const PRESETS = {
      bowlers_end: {
        pos: new THREE.Vector3(0, 3.8, -19),
        target: new THREE.Vector3(0, 0.8, 8),
        subtext: "Behind bowler following swing & seam."
      },
      birds_eye: {
        pos: new THREE.Vector3(0, 36, 0.05),
        target: new THREE.Vector3(0, 0, 0),
        subtext: "Full 360° pitch, field circles & boundary overview."
      },
      umpire_view: {
        pos: new THREE.Vector3(0, 1.75, -12.5),
        target: new THREE.Vector3(0, 0.71, 10),
        subtext: "1.75m eye level behind non-striker stumps evaluating LBW line."
      }
    };

    let targetCamPos = PRESETS.bowlers_end.pos.clone();
    let targetCamLookAt = PRESETS.bowlers_end.target.clone();
    let currentLookAt = PRESETS.bowlers_end.target.clone();
    let isTransitioning = true;
    camera.position.copy(targetCamPos);
    camera.lookAt(targetCamLookAt);

    function setCameraPreset(id) {
      const p = PRESETS[id];
      if (!p) return;
      targetCamPos.copy(p.pos);
      targetCamLookAt.copy(p.target);
      isTransitioning = true;
      document.getElementById('cam-desc').innerText = p.subtext;

      document.querySelectorAll('.cam-btn').forEach(btn => btn.classList.remove('active'));
      const activeBtn = document.getElementById('btn-' + id.replace('_', '-'));
      if (activeBtn) activeBtn.classList.add('active');
    }

    document.getElementById('btn-bowlers-end').onclick = () => setCameraPreset('bowlers_end');
    document.getElementById('btn-birds-eye').onclick = () => setCameraPreset('birds_eye');
    document.getElementById('btn-umpire-view').onclick = () => setCameraPreset('umpire_view');

    // Bottom dock delivery switch
    document.querySelectorAll('.delivery-pill').forEach(pill => {
      pill.onclick = () => {
        document.querySelectorAll('.delivery-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        const id = pill.getAttribute('data-id');
        currentDelivery = DELIVERIES[id];
        document.getElementById('bowler-name').innerText = currentDelivery.name;
        document.getElementById('bowler-speed').innerText = currentDelivery.speed;
        document.getElementById('bowler-desc').innerText = currentDelivery.desc;
        ballProgress = 0;
      };
    });

    let isPlaying = true;
    document.getElementById('btn-pause-play').onclick = () => {
      isPlaying = !isPlaying;
      document.getElementById('btn-pause-play').innerText = isPlaying ? '⏸' : '▶';
    };

    // Mouse drag Orbit Controls
    let isDragging = false;
    let prevMouse = { x: 0, y: 0 };
    container.addEventListener('mousedown', e => { isDragging = true; isTransitioning = false; prevMouse = { x: e.clientX, y: e.clientY }; });
    window.addEventListener('mouseup', () => { isDragging = false; });
    window.addEventListener('mousemove', e => {
      if (!isDragging) return;
      isTransitioning = false;
      const dx = e.clientX - prevMouse.x;
      const dy = e.clientY - prevMouse.y;
      prevMouse = { x: e.clientX, y: e.clientY };

      const offset = camera.position.clone().sub(currentLookAt);
      let radius = offset.length();
      let theta = Math.atan2(offset.x, offset.z) - dx * 0.008;
      let phi = Math.acos(Math.max(0.05, Math.min(0.95, offset.y / radius))) - dy * 0.008;

      camera.position.x = currentLookAt.x + radius * Math.sin(phi) * Math.sin(theta);
      camera.position.y = currentLookAt.y + radius * Math.cos(phi);
      camera.position.z = currentLookAt.z + radius * Math.sin(phi) * Math.cos(theta);
      camera.lookAt(currentLookAt);
    });

    // Animation Loop
    let ballProgress = 0;
    let lastT = performance.now();
    function animate(now) {
      requestAnimationFrame(animate);
      const dt = (now - lastT) / 1000;
      lastT = now;

      // Ball Trajectory
      if (isPlaying) {
        ballProgress += dt * 0.65;
        if (ballProgress > 1.0) ballProgress = 0;
        const curve = new THREE.CatmullRomCurve3(currentDelivery.curve);
        ballMesh.position.copy(curve.getPoint(ballProgress));
      }

      // Smooth Camera Lerp
      if (isTransitioning) {
        camera.position.lerp(targetCamPos, 0.08);
        currentLookAt.lerp(targetCamLookAt, 0.08);
        camera.lookAt(currentLookAt);
        if (camera.position.distanceTo(targetCamPos) < 0.05) {
          isTransitioning = false;
        }
      }

      renderer.render(scene, camera);
    }
    requestAnimationFrame(animate);

    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });
  </script>
</body>
</html>
"""
