gsap.registerPlugin(ScrollTrigger);

if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}

window.addEventListener('load', () => {
  window.scrollTo(0, 0);
});

const sceneNames = ['BOOT', 'THREAT', 'DETECT', 'DECISION', 'RESPONSE', 'LEARN', 'FINAL'];
const scenes = Array.from(document.querySelectorAll('.scene'));
const bootLines = [
  'Initializing CyberFortress...',
  'Loading AI Defense Systems...',
  'Preparing autonomous protection mesh...',
];

const sceneLabel = document.getElementById('sceneLabel');
const sceneProgress = document.getElementById('sceneProgress');
const glitchFx = document.getElementById('glitchFx');
const pointerLight = document.getElementById('pointerLight');
const replayBtn = document.getElementById('replayBtn');
const ctaBtn = document.getElementById('ctaBtn');
const brandText = document.getElementById('brandText');
const bootCursor = document.querySelector('.boot-cursor');
const bootLineEls = [
  document.getElementById('bootLine0'),
  document.getElementById('bootLine1'),
  document.getElementById('bootLine2'),
];
const launchOverlay = document.getElementById('launchOverlay');
const launchProgress = document.getElementById('launchProgress');
const launchLog = document.getElementById('launchLog');
const metricValues = Array.from(document.querySelectorAll('.metric-value'));
const THREE_AVAILABLE = typeof window.THREE !== 'undefined';

// Dashboard elements
const loadingScreen = document.getElementById('loadingScreen');
const dashboard = document.getElementById('dashboard');
const liveTimeEl = document.getElementById('liveTime');
const dashboardHomeBtn = document.getElementById('dashboardHomeBtn');
const statThreatsEl = document.getElementById('statThreats');
const statBlockedEl = document.getElementById('statBlocked');
const statWarningsEl = document.getElementById('statWarnings');
const statNodesEl = document.getElementById('statNodes');
const feedScrollEl = document.getElementById('feedScroll');
const aiStatusEl = document.getElementById('aiStatus');
const threatBarEl = document.getElementById('threatBar');
const blockedBarEl = document.getElementById('blockedBar');
const warningBarEl = document.getElementById('warningBar');
const nodesBarEl = document.getElementById('nodesBar');

const lenis = window.Lenis
  ? new Lenis({ lerp: 0.09, smoothWheel: true, smoothTouch: true, syncTouch: true })
  : null;

if (lenis) {
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

const state = {
  activeScene: 0,
  bootIndex: 0,
  bootChars: 0,
  bootTimer: 0,
  bootComplete: false,
  pointerX: 0,
  pointerY: 0,
  targetPointerX: 0,
  targetPointerY: 0,
  intensity: 0,
  defense: 0,
  response: 0,
  learning: 0,
  finalGlow: 0,
  attackTimer: 0,
  lastSpawn: 0,
  launchRunning: false,
  dashboardActive: false,
  // Dashboard stats
  threats: 0,
  blocked: 0,
  warnings: 0,
  nodes: 0,
  threatTarget: 12834,
  blockedTarget: 10984,
  warningsTarget: 1260,
  nodesTarget: 343,
};

const sceneColors = [
  { a: '#0b1020', b: '#4ce5ff' },
  { a: '#18080d', b: '#ff4d61' },
  { a: '#09111f', b: '#9d6cff' },
  { a: '#0c140f', b: '#ffd24c' },
  { a: '#081322', b: '#4ce5ff' },
  { a: '#07131a', b: '#61ffb2' },
  { a: '#080d18', b: '#f8fbff' },
];

const metricTargets = [
  { value: 12834, suffix: '', display: 'K' },     // Threats observed
  { value: 12.4, suffix: 'ms', display: '' },     // Response latency
  { value: 98.7, suffix: '%', display: '' },      // Containment rate
  { value: 343, suffix: '', display: '' },        // Nodes protected
  { value: 10984, suffix: '', display: 'K' },     // Threats blocked
  { value: 1260, suffix: '', display: 'K' },      // Alerts warned
];

let renderer = null;
let scene3d = null;
let camera = null;
let root = null;
let fieldGroup = null;
let networkGroup = null;
let pulseGroup = null;
let coreGroup = null;
let shieldGroup = null;
let stars = null;
let introParticles = null;
let network = null;
let core = null;
let shield = null;
let pulseGeometry = null;
const pulses = [];
let lastTime = performance.now();

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function flashGlitch() {
  glitchFx.classList.remove('active');
  void glitchFx.offsetWidth;
  glitchFx.classList.add('active');
  window.setTimeout(() => glitchFx.classList.remove('active'), 540);
}

function setScene(index) {
  state.activeScene = clamp(index, 0, scenes.length - 1);
  if (sceneLabel) {
    sceneLabel.textContent = sceneNames[state.activeScene];
  }
  if (sceneProgress) {
    sceneProgress.style.width = `${14 + (state.activeScene / Math.max(scenes.length - 1, 1)) * 86}%`;
  }

  scenes.forEach((scene, sceneIndex) => {
    scene.classList.toggle('active', sceneIndex === state.activeScene);
  });

  const palette = sceneColors[state.activeScene];
  document.documentElement.style.setProperty('--scene-accent', palette.b);
  document.documentElement.style.setProperty('--scene-accent-soft', palette.a);

  if (state.activeScene === 6) {
    animateMetrics();
  }
}

function typeBootText() {
  if (state.bootComplete) return;

  state.bootTimer += 1;
  if (state.bootTimer < 1.1) return;
  state.bootTimer = 0;

  const line = bootLines[state.bootIndex];
  const element = bootLineEls[state.bootIndex];

  if (!line || !element) {
    state.bootComplete = true;
    bootLineEls.forEach((entry, index) => {
      if (entry) entry.textContent = bootLines[index] || '';
    });
    return;
  }

  state.bootChars += 1;
  element.textContent = line.slice(0, state.bootChars);
  if (state.bootChars >= line.length) {
    state.bootIndex += 1;
    state.bootChars = 0;
  }
}

function primeMetricDefaults() {
  metricValues.forEach((element, index) => {
    const target = metricTargets[index];
    if (!target) return;
    element.dataset.count = String(target.value);
    element.dataset.suffix = target.suffix;
    element.textContent = `${Number.isInteger(target.value) ? 0 : '0.0'}${target.suffix}`;
  });
}

function formatMetricValue(value, displaySuffix) {
  if (displaySuffix === 'K') {
    const formatted = (value / 1000).toFixed(1);
    return `${formatted}${displaySuffix}`;
  }
  return `${Number.isInteger(value) ? Math.round(value) : value.toFixed(1)}`;
}

function animateCount(element, target, suffix, displaySuffix, duration = 1600) {
  const startTime = performance.now();
  let animationComplete = false;

  const tick = (now) => {
    const progress = clamp((now - startTime) / duration, 0, 1);
    const value = target * easeOutCubic(progress);
    element.textContent = `${formatMetricValue(value, displaySuffix)}${suffix}`;
    
    if (progress >= 1) {
      animationComplete = true;
      element.dataset.animated = 'true';
      // Add glow pulse effect
      element.classList.add('metric-glow');
      window.setTimeout(() => element.classList.remove('metric-glow'), 600);
      // Start live fluctuation
      startMetricFluctuation(element, target, suffix, displaySuffix);
    } else {
      requestAnimationFrame(tick);
    }
  };

  requestAnimationFrame(tick);
}

function startMetricFluctuation(element, baseValue, suffix, displaySuffix) {
  // Small random fluctuation (±2% of base value)
  setInterval(() => {
    if (element.dataset.animated !== 'true') return;
    const variation = baseValue * (0.02 * (Math.random() - 0.5));
    const newValue = baseValue + variation;
    element.textContent = `${formatMetricValue(newValue, displaySuffix)}${suffix}`;
  }, 2500 + Math.random() * 1000);
}

function animateMetrics() {
  const cards = document.querySelectorAll('.metric-card');
  
  // If already animated, don't run again
  if (cards[0]?.dataset.animated === 'true') return;
  
  gsap.from(cards, {
    opacity: 0,
    scale: 0.88,
    y: 20,
    duration: 0.7,
    stagger: 0.12,
    ease: 'back.out',
  });

  metricValues.forEach((element, index) => {
    const target = metricTargets[index].value;
    const suffix = metricTargets[index].suffix || '';
    const displaySuffix = metricTargets[index].display || '';
    element.dataset.count = String(target);
    element.dataset.suffix = suffix;
    window.setTimeout(() => {
      animateCount(element, target, suffix, displaySuffix, 1800 + index * 160);
    }, index * 160);
  });
}

function setupMetricsObserver() {
  const finalScene = document.querySelector('.scene-final');
  if (!finalScene) return;
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && entry.target.dataset.metricsTriggered !== 'true') {
        entry.target.dataset.metricsTriggered = 'true';
        animateMetrics();
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });
  
  observer.observe(finalScene);
}

function writeLog(message, tone = 'ok') {
  if (!launchLog) return;
  const entry = document.createElement('div');
  entry.className = `entry ${tone}`;
  entry.textContent = message;
  launchLog.appendChild(entry);
  launchLog.scrollTop = launchLog.scrollHeight;
}

function openLaunchOverlay() {
  if (!launchOverlay || state.launchRunning) return;
  state.launchRunning = true;
  launchOverlay.classList.add('active');
  launchOverlay.setAttribute('aria-hidden', 'false');
  launchLog.innerHTML = '';
  launchProgress.style.width = '0%';

  const panel = launchOverlay.querySelector('.launch-panel');
  if (panel) {
    gsap.fromTo(panel, { opacity: 0, scale: 0.92, y: 40 }, { opacity: 1, scale: 1, y: 0, duration: 0.6, ease: 'back.out' });
  }

  const steps = [
    ['Booting adaptive threat engine...', 'ok'],
    ['Initializing CyberFortress defense grid', 'ok'],
    ['Deploying SOC nodes: 247 instances', 'ok'],
    ['Calibrating behavioral anomaly detectors: 99.4%', 'ok'],
    ['Seeding deception network and honeypots: 1,284', 'ok'],
    ['Analyzing threat landscape: 847,264 IOCs processed', 'ok'],
    ['Scanning inbound traffic: 1.2M packets/sec', 'warn'],
    ['Detected suspicious activity: 18,746 events flagged', 'warn'],
    ['Blocking malicious payloads: 4,328 threats neutralized', 'bad'],
    ['Activating advanced response automation system', 'ok'],
    ['Engaging IP reputation filtering: 92.1% coverage', 'ok'],
    ['Deploying micro-segmentation ruleset', 'ok'],
    ['Real-time threat intelligence feeds: ENABLED', 'ok'],
    ['Threat correlation engine: ACTIVE', 'ok'],
    ['Predictive attack modeling: 97.8% accuracy', 'ok'],
    ['Defense mesh fully operational. All systems engaged.', 'ok'],
  ];

  let index = 0;
  const totalSteps = steps.length;
  
  const runStep = () => {
    if (index >= totalSteps) {
      gsap.to(launchProgress.querySelector('span'), {
        width: '100%',
        duration: 0.28,
        ease: 'power2.inOut',
        onComplete: () => {
          window.setTimeout(() => {
            gsap.to(panel, { opacity: 0, scale: 0.96, y: -20, duration: 0.5, ease: 'power2.in' });
            window.setTimeout(() => {
              launchOverlay.classList.remove('active');
              launchOverlay.setAttribute('aria-hidden', 'true');
              state.launchRunning = false;
            }, 500);
          }, 400);
        },
      });
      return;
    }

    const progress = ((index + 1) / totalSteps) * 100;
    gsap.to(launchProgress.querySelector('span'), {
      width: `${progress}%`,
      duration: 0.24,
      ease: 'power1.inOut',
    });

    writeLog(steps[index][0], steps[index][1]);
    index += 1;
    window.setTimeout(runStep, 140 + Math.random() * 80);
  };

  window.setTimeout(runStep, 240);
}

function setupSceneAnimations() {
  gsap.from('.hud', { opacity: 0, y: -18, duration: 0.9, ease: 'power3.out' });
  gsap.from('.scene-indicator', { opacity: 0, y: 18, duration: 1, ease: 'power3.out', delay: 0.1 });

  scenes.forEach((scene, index) => {
    const copy = scene.querySelector('.scene-copy');
    if (!copy) return;

    ScrollTrigger.create({
      trigger: scene,
      start: 'top 68%',
      end: 'bottom 32%',
      onEnter: () => {
        gsap.fromTo(copy, { opacity: 0, y: 34, filter: 'blur(14px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1, ease: 'power3.out' });
        
        if (index === 6) {
          gsap.from('.cta-button', { opacity: 0, scale: 0.88, duration: 0.8, delay: 0.4, ease: 'elastic.out(1.2, 0.6)' });
          
          const cards = scene.querySelectorAll('.metric-card');
          gsap.from(cards, {
            opacity: 0,
            scale: 0.82,
            y: 28,
            duration: 0.8,
            stagger: 0.14,
            ease: 'back.out',
            delay: 0.2,
          });
        }
        
        const visuals = scene.querySelectorAll('.scene-visual');
        visuals.forEach(visual => {
          gsap.from(visual, { opacity: 0, x: 40, filter: 'blur(12px)', duration: 0.9, ease: 'power3.out', delay: 0.1 });
        });
      },
      onEnterBack: () => {
        gsap.fromTo(copy, { opacity: 0, y: 28, filter: 'blur(14px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.9, ease: 'power3.out' });
      },
    });
  });
}

function createTypingIntro() {
  const phrase = 'CyberFortress';
  let cursor = 0;

  const tick = () => {
    brandText.textContent = phrase.slice(0, Math.min(cursor, phrase.length));
    cursor += 1;
    if (cursor <= phrase.length) {
      window.setTimeout(tick, cursor < phrase.length ? 70 : 520);
    } else if (bootCursor) {
      bootCursor.classList.add('boot-cursor-hidden');
    }
  };

  tick();
}

function initThreeScene() {
  if (!THREE_AVAILABLE) return false;

  const canvas = document.getElementById('world');
  renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;

  scene3d = new THREE.Scene();
  scene3d.fog = new THREE.FogExp2(0x05080f, 0.02);

  camera = new THREE.PerspectiveCamera(46, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0.1, 15);

  root = new THREE.Group();
  fieldGroup = new THREE.Group();
  networkGroup = new THREE.Group();
  pulseGroup = new THREE.Group();
  coreGroup = new THREE.Group();
  shieldGroup = new THREE.Group();
  root.add(fieldGroup, networkGroup, pulseGroup, coreGroup, shieldGroup);
  scene3d.add(root);

  const ambient = new THREE.AmbientLight(0x9cc7ff, 0.35);
  const keyLight = new THREE.DirectionalLight(0x74cfff, 1.35);
  keyLight.position.set(5, 6, 10);
  const backLight = new THREE.PointLight(0x9d6cff, 1.2, 80);
  backLight.position.set(-7, 2, -10);
  scene3d.add(ambient, keyLight, backLight);

  stars = createStarField();
  introParticles = createIntroTextParticles();
  network = createNetwork();
  core = createCore();
  shield = createShield();
  pulseGeometry = new THREE.SphereGeometry(0.05, 12, 12);

  return true;
}

function createStarField() {
  const count = 1200;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  for (let index = 0; index < count; index += 1) {
    const radius = 28 * Math.random() + 6;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[index * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[index * 3 + 1] = radius * Math.cos(phi);
    positions[index * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
    colors[index * 3] = 0.6;
    colors[index * 3 + 1] = 0.8;
    colors[index * 3 + 2] = 1;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 0.05,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.74,
    vertexColors: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const points = new THREE.Points(geometry, material);
  fieldGroup.add(points);
  return points;
}

function createIntroTextParticles() {
  const sampleCanvas = document.createElement('canvas');
  const sampleContext = sampleCanvas.getContext('2d');
  const width = 1200;
  const height = 320;
  sampleCanvas.width = width;
  sampleCanvas.height = height;
  sampleContext.clearRect(0, 0, width, height);
  sampleContext.fillStyle = '#fff';
  sampleContext.textAlign = 'center';
  sampleContext.textBaseline = 'middle';
  sampleContext.font = '800 150px Orbitron, sans-serif';
  sampleContext.fillText('CyberFortress', width / 2, height / 2);

  const pixels = sampleContext.getImageData(0, 0, width, height).data;
  const positions = [];
  const targets = [];

  for (let y = 0; y < height; y += 8) {
    for (let x = 0; x < width; x += 8) {
      const alpha = pixels[(y * width + x) * 4 + 3];
      if (alpha > 20) {
        targets.push((x / width - 0.5) * 14, -(y / height - 0.5) * 4.2, (Math.random() - 0.5) * 2.4);
        positions.push((Math.random() - 0.5) * 34, (Math.random() - 0.5) * 14, (Math.random() - 0.5) * 26);
      }
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
  geometry.setAttribute('target', new THREE.BufferAttribute(new Float32Array(targets), 3));

  const material = new THREE.PointsMaterial({
    size: 0.08,
    color: 0x4ce5ff,
    transparent: true,
    opacity: 0.96,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const points = new THREE.Points(geometry, material);
  fieldGroup.add(points);
  return points;
}

function createNetwork() {
  const nodes = [];
  const nodeGeometry = new THREE.SphereGeometry(0.11, 12, 12);
  const nodeMaterial = new THREE.MeshStandardMaterial({
    color: 0x5f8dfc,
    emissive: 0x16335d,
    emissiveIntensity: 1,
    roughness: 0.28,
    metalness: 0.18,
  });

  const count = 56;
  for (let index = 0; index < count; index += 1) {
    const theta = (index / count) * Math.PI * 2;
    const radius = 4.8 + Math.sin(index * 0.7) * 0.9;
    const y = Math.sin(index * 0.35) * 2.4;
    const x = Math.sin(theta) * radius;
    const z = Math.cos(theta) * radius;
    const mesh = new THREE.Mesh(nodeGeometry, nodeMaterial.clone());
    mesh.position.set(x, y, z);
    mesh.scale.setScalar(0.8 + Math.random() * 0.8);
    networkGroup.add(mesh);
    nodes.push({ mesh, base: mesh.position.clone(), threat: Math.random() * 0.1, defense: 0, pulse: Math.random() * Math.PI * 2 });
  }

  const positions = [];
  for (let index = 0; index < count; index += 1) {
    const next = (index + 1) % count;
    const skip = (index + 7) % count;
    [next, skip].forEach((targetIndex) => {
      const a = nodes[index].base;
      const b = nodes[targetIndex].base;
      positions.push(a.x, a.y, a.z, b.x, b.y, b.z);
    });
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array((positions.length / 3) * 3), 3));

  const material = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.22 });
  const lines = new THREE.LineSegments(geometry, material);
  networkGroup.add(lines);

  return { nodes, lines };
}

function createCore() {
  const coreMesh = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.7, 4),
    new THREE.MeshStandardMaterial({
      color: 0x9d6cff,
      emissive: 0x295fff,
      emissiveIntensity: 1.8,
      roughness: 0.14,
      metalness: 0.72,
    })
  );
  const shell = new THREE.Mesh(
    new THREE.TorusGeometry(2.2, 0.1, 10, 180),
    new THREE.MeshStandardMaterial({
      color: 0x4ce5ff,
      emissive: 0x4ce5ff,
      emissiveIntensity: 1.4,
      roughness: 0.25,
      metalness: 0.5,
      transparent: true,
      opacity: 0.42,
    })
  );
  const halo = new THREE.Mesh(
    new THREE.TorusGeometry(3.05, 0.05, 10, 220),
    new THREE.MeshBasicMaterial({ color: 0x4ce5ff, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending })
  );

  coreGroup.add(coreMesh, shell, halo);
  shell.rotation.x = Math.PI / 2;
  halo.rotation.x = Math.PI / 2;
  return { coreMesh, shell, halo };
}

function createShield() {
  const shieldA = new THREE.Mesh(
    new THREE.TorusGeometry(3.6, 0.06, 10, 160),
    new THREE.MeshBasicMaterial({ color: 0x4ce5ff, transparent: true, opacity: 0.14, blending: THREE.AdditiveBlending })
  );
  const shieldB = new THREE.Mesh(
    new THREE.TorusGeometry(4.45, 0.08, 10, 160),
    new THREE.MeshBasicMaterial({ color: 0x61ffb2, transparent: true, opacity: 0.1, blending: THREE.AdditiveBlending })
  );
  shieldGroup.add(shieldA, shieldB);
  shieldGroup.visible = false;
  return { shieldA, shieldB };
}

function randomNode() {
  return network ? network.nodes[Math.floor(Math.random() * network.nodes.length)] : null;
}

function spawnPulse(from, to, color, speed = 1, life = 1.2) {
  if (!THREE_AVAILABLE || !pulseGeometry || !pulseGroup || !from || !to) return;
  const pulse = new THREE.Mesh(
    pulseGeometry,
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 1, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  pulse.position.copy(from);
  pulseGroup.add(pulse);
  pulses.push({ mesh: pulse, from: from.clone(), to: to.clone(), progress: 0, speed, life, color: new THREE.Color(color) });
}

function updateNetwork(delta, elapsed) {
  if (!THREE_AVAILABLE || !network) return;
  const { nodes, lines } = network;
  const colors = lines.geometry.attributes.color;

  nodes.forEach((node, index) => {
    const wave = Math.sin(elapsed * 1.8 + node.pulse) * 0.08;
    const threatBoost = state.activeScene === 1 ? 1 : state.activeScene === 2 ? 0.28 : 0.08;
    const defenseBoost = state.activeScene >= 3 ? 1 : state.activeScene >= 2 ? 0.45 : 0.1;
    node.threat = lerp(node.threat, threatBoost, 0.04);
    node.defense = lerp(node.defense, defenseBoost, 0.04);
    node.mesh.scale.setScalar(0.68 + node.defense * 0.54 + node.threat * 0.38 + wave);
    node.mesh.material.emissive.copy(new THREE.Color('#4ce5ff')).lerp(new THREE.Color('#ff4d61'), node.threat);
    node.mesh.material.color.copy(new THREE.Color('#4ce5ff')).lerp(new THREE.Color('#61ffb2'), node.defense * 0.8);
    node.mesh.material.emissiveIntensity = 0.8 + node.defense * 1.3 + node.threat * 0.7;
  });

  for (let index = 0; index < colors.count; index += 2) {
    const defense = state.activeScene >= 3 ? 0.72 : state.activeScene >= 2 ? 0.42 : 0.16;
    const threat = state.activeScene === 1 ? 0.8 : state.activeScene === 2 ? 0.36 : 0.12;
    const color = new THREE.Color().setRGB(0.2 + defense * 0.2, 0.34 + defense * 0.42, 0.74 + defense * 0.22);
    color.lerp(new THREE.Color('#ff4d61'), threat * 0.9);
    color.lerp(new THREE.Color('#4ce5ff'), defense * 0.85);
    colors.setXYZ(index, color.r, color.g, color.b);
    colors.setXYZ(index + 1, color.r, color.g, color.b);
  }

  colors.needsUpdate = true;
}

function updatePulses(delta) {
  if (!THREE_AVAILABLE) return;
  for (let index = pulses.length - 1; index >= 0; index -= 1) {
    const pulse = pulses[index];
    pulse.progress += delta * pulse.speed;
    const eased = easeOutCubic(clamp(pulse.progress / pulse.life, 0, 1));
    pulse.mesh.position.lerpVectors(pulse.from, pulse.to, eased);
    pulse.mesh.scale.setScalar(1 + eased * 2.8);
    pulse.mesh.material.opacity = 1 - eased;
    if (pulse.progress >= pulse.life) {
      pulse.mesh.parent?.remove(pulse.mesh);
      pulses.splice(index, 1);
    }
  }
}

function updateCore(elapsed, delta) {
  if (!THREE_AVAILABLE || !core || !coreGroup) return;
  coreGroup.scale.setScalar(1 + Math.sin(elapsed * 2.1) * 0.05 + (state.activeScene === 6 ? 0.28 : 0));
  core.coreMesh.rotation.x += delta * 0.22;
  core.coreMesh.rotation.y += delta * 0.34;
  core.shell.rotation.z += delta * 0.4;
  core.halo.rotation.z -= delta * 0.22;
  core.coreMesh.material.emissiveIntensity = 1.2 + state.activeScene * 0.22 + state.learning * 0.9;

  if (state.activeScene >= 2) {
    shieldGroup.visible = true;
    shieldGroup.scale.setScalar(1 + state.response * 0.12 + Math.sin(elapsed * 1.6) * 0.02);
    shield.shieldA.rotation.z += delta * 0.22;
    shield.shieldB.rotation.z -= delta * 0.18;
  } else {
    shieldGroup.visible = false;
  }
}

function updateField(elapsed) {
  if (!THREE_AVAILABLE || !fieldGroup || !stars || !introParticles) return;
  fieldGroup.rotation.y = Math.sin(elapsed * 0.07) * 0.14;
  fieldGroup.rotation.x = Math.sin(elapsed * 0.04) * 0.08;
  stars.material.opacity = 0.45 + state.finalGlow * 0.35;

  if (state.activeScene === 0) {
    const positions = introParticles.geometry.attributes.position;
    const targets = introParticles.geometry.attributes.target;
    for (let index = 0; index < positions.count; index += 1) {
      positions.setX(index, lerp(positions.getX(index), targets.getX(index), 0.02));
      positions.setY(index, lerp(positions.getY(index), targets.getY(index), 0.02));
      positions.setZ(index, lerp(positions.getZ(index), targets.getZ(index), 0.02));
    }
    positions.needsUpdate = true;
  } else {
    introParticles.material.opacity = 0.18;
  }
}

function updateSceneBehaviors(elapsed, delta) {
  state.intensity = lerp(state.intensity, state.activeScene === 1 ? 1 : 0, 0.04);
  state.defense = lerp(state.defense, state.activeScene >= 2 ? 1 : 0, 0.04);
  state.response = lerp(state.response, state.activeScene >= 3 ? 1 : 0, 0.05);
  state.learning = lerp(state.learning, state.activeScene >= 5 ? 1 : 0, 0.05);
  state.finalGlow = lerp(state.finalGlow, state.activeScene === 6 ? 1 : 0, 0.05);

  if (state.activeScene === 1) {
    state.attackTimer += delta;
    if (state.attackTimer > 0.16) {
      state.attackTimer = 0;
      const source = randomNode();
      const target = randomNode();
      if (source && target) spawnPulse(source.base.clone(), target.base.clone(), 0xff4d61, 0.9 + Math.random() * 0.8, 1.1 + Math.random() * 0.6);
    }
  }

  if (state.activeScene >= 2 && state.activeScene <= 5 && elapsed - state.lastSpawn > 0.34) {
    state.lastSpawn = elapsed;
    const source = randomNode();
    if (source && coreGroup) {
      spawnPulse(source.base.clone(), coreGroup.position.clone(), state.activeScene >= 4 ? 0x4ce5ff : 0x9d6cff, 0.95 + Math.random() * 0.6, 1.2);
    }
  }

  if (network && network.lines) {
    network.lines.material.opacity = state.activeScene >= 4 ? 0.34 : 0.22 + state.intensity * 0.18;
  }
}

function updateCamera(elapsed) {
  if (!THREE_AVAILABLE || !camera || !root) return;
  state.pointerX = lerp(state.pointerX, state.targetPointerX, 0.06);
  state.pointerY = lerp(state.pointerY, state.targetPointerY, 0.06);
  camera.position.x = state.pointerX * 0.55 + Math.sin(elapsed * 0.1) * 0.2;
  camera.position.y = 0.14 + -state.pointerY * 0.38 + Math.cos(elapsed * 0.13) * 0.12;
  camera.position.z = 15 - state.response * 0.4 - state.finalGlow * 0.75;
  camera.lookAt(0, 0, 0);
  root.rotation.y = Math.sin(elapsed * 0.06) * 0.1 + state.pointerX * 0.08;
  root.rotation.x = Math.sin(elapsed * 0.04) * 0.05 - state.pointerY * 0.06;
}

function maybeSpawnIntroMotion(elapsed) {
  if (!THREE_AVAILABLE || !introParticles || state.activeScene !== 0 || elapsed < 0.8) return;
  const positions = introParticles.geometry.attributes.position;
  const targets = introParticles.geometry.attributes.target;
  for (let index = 0; index < positions.count; index += 1) {
    positions.setX(index, lerp(positions.getX(index), targets.getX(index), 0.015));
    positions.setY(index, lerp(positions.getY(index), targets.getY(index), 0.015));
    positions.setZ(index, lerp(positions.getZ(index), targets.getZ(index), 0.015));
  }
  positions.needsUpdate = true;
}

function animate(now) {
  const delta = Math.min((now - lastTime) / 1000, 0.033);
  lastTime = now;
  const elapsed = now / 1000;

  typeBootText();
  updateSceneBehaviors(elapsed, delta);
  updateNetwork(delta, elapsed);
  updatePulses(delta);
  updateCore(elapsed, delta);
  updateField(elapsed);
  updateCamera(elapsed);
  maybeSpawnIntroMotion(elapsed);

  if (renderer && scene3d && camera) renderer.render(scene3d, camera);
  requestAnimationFrame(animate);
}

setupMetricsObserver();
setupSceneAnimations();
createTypingIntro();
initThreeScene();
setScene(0);
requestAnimationFrame(animate);

replayBtn.addEventListener('click', () => {
  if (lenis) {
    lenis.scrollTo(0, { immediate: false, duration: 1.2 });
  } else {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  flashGlitch();
});

ctaBtn.addEventListener('click', () => {
  startLoadingTransition();
  flashGlitch();
});

if (dashboardHomeBtn) {
  dashboardHomeBtn.addEventListener('click', returnToLandingPage);
}

window.addEventListener('pointermove', (event) => {
  state.targetPointerX = (event.clientX / window.innerWidth) * 2 - 1;
  state.targetPointerY = (event.clientY / window.innerHeight) * 2 - 1;
  pointerLight.style.setProperty('--px', `${event.clientX}px`);
  pointerLight.style.setProperty('--py', `${event.clientY}px`);
});

window.addEventListener('resize', () => {
  if (camera) {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  }
  if (renderer) {
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  }
  ScrollTrigger.refresh();
});

/* ========================================
   LOADING TRANSITION & DASHBOARD FUNCTIONS
   ======================================== */

function startLoadingTransition() {
  // Clear previous fade-out inline styles so the loading view can fully render again.
  gsap.set(loadingScreen, { clearProps: 'opacity,visibility' });
  loadingScreen.classList.add('active');
  loadingScreen.setAttribute('aria-hidden', 'false');
  
  const logEntries = document.querySelectorAll('.loading-logs .log-entry');
  const progressFill = document.querySelector('.progress-fill');
  
  logEntries.forEach((entry, index) => {
    entry.style.animationDelay = `${index * 400}ms`;
  });

  if (progressFill) {
    gsap.killTweensOf(progressFill);
    gsap.set(progressFill, { width: '0%' });

    gsap.to(progressFill, {
      width: '100%',
      duration: 2.2,
      ease: 'power1.inOut',
      onComplete: () => {
        window.setTimeout(() => {
          transitionToDashboard();
        }, 300);
      },
    });
    return;
  }

  // Fallback when progress element is unavailable.
  window.setTimeout(() => {
    transitionToDashboard();
  }, 2200);
}

function transitionToDashboard() {
  gsap.to(loadingScreen, {
    opacity: 0,
    duration: 0.8,
    ease: 'power2.inOut',
    onComplete: () => {
      loadingScreen.classList.remove('active');
      loadingScreen.setAttribute('aria-hidden', 'true');
      showDashboard();
    },
  });
}

function showDashboard() {
  state.dashboardActive = true;
  dashboard.classList.add('active');
  dashboard.setAttribute('aria-hidden', 'false');
  
  initializeDashboard();
  animateDashboardEntrance();
  startDashboardUpdates();
  drawNetworkVisualization();
  populateAttackFeed();
  startAIStatusCycle();
  startLiveTime();
}

function returnToLandingPage() {
  state.dashboardActive = false;
  dashboard.classList.remove('active');
  dashboard.setAttribute('aria-hidden', 'true');

  setScene(0);

  if (lenis) {
    lenis.scrollTo(0, { immediate: true });
  } else {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

function animateDashboardEntrance() {
  const stats = document.querySelectorAll('.stat-card');
  const header = document.querySelector('.dashboard-header');
  
  gsap.from(header, { opacity: 0, y: -20, duration: 0.7, ease: 'power3.out' });
  gsap.from(stats, {
    opacity: 0,
    x: -20,
    duration: 0.7,
    stagger: 0.1,
    ease: 'power3.out',
  });
}

function initializeDashboard() {
  state.threats = state.threatTarget;
  state.blocked = state.blockedTarget;
  state.warnings = state.warningsTarget;
  state.nodes = state.nodesTarget;

  // Start stat counters
  animateCounter(statThreatsEl, state.threatTarget, 2000);
  animateCounter(statBlockedEl, state.blockedTarget, 2000);
  animateCounter(statWarningsEl, state.warningsTarget, 2000);
  animateCounter(statNodesEl, state.nodesTarget, 2000);
  
  // Animate progress bars
  gsap.to(threatBarEl, { width: '92%', duration: 2.2, ease: 'power1.inOut' });
  gsap.to(blockedBarEl, { width: '87%', duration: 2.2, ease: 'power1.inOut' });
  gsap.to(warningBarEl, { width: '65%', duration: 2.2, ease: 'power1.inOut' });
  gsap.to(nodesBarEl, { width: '98%', duration: 2.2, ease: 'power1.inOut' });
}

function animateCounter(element, target, duration = 2000) {
  let current = 0;
  const startTime = performance.now();
  
  const tick = (now) => {
    const progress = Math.min((now - startTime) / duration, 1);
    current = Math.floor(target * easeOutCubic(progress));
    element.textContent = current.toLocaleString();
    
    if (progress < 1) requestAnimationFrame(tick);
  };
  
  requestAnimationFrame(tick);
}

function startDashboardUpdates() {
  setInterval(() => {
    // Simulate upward-only growth so the counters never move backward.
    state.threats = Math.max(state.threats || state.threatTarget, state.threatTarget) + 6 + Math.floor(Math.random() * 13);
    state.blocked = Math.max(state.blocked || state.blockedTarget, state.blockedTarget) + 4 + Math.floor(Math.random() * 9);
    state.warnings = Math.max(state.warnings || state.warningsTarget, state.warningsTarget) + 1 + Math.floor(Math.random() * 4);
    state.nodes = Math.max(state.nodes || state.nodesTarget, state.nodesTarget) + (Math.random() > 0.7 ? 1 : 0);
    
    statThreatsEl.textContent = state.threats.toLocaleString();
    statBlockedEl.textContent = state.blocked.toLocaleString();
    statWarningsEl.textContent = state.warnings.toLocaleString();
    statNodesEl.textContent = state.nodes.toLocaleString();
  }, 1500);
}

function startLiveTime() {
  setInterval(() => {
    const now = new Date();
    const time = now.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    if (liveTimeEl) liveTimeEl.textContent = time;
  }, 1000);
}

const aiStatusMessages = [
  'Analyzing traffic patterns...',
  'Detecting anomalies...',
  'Updating threat models...',
  'System learning...',
  'Evaluating risk vectors...',
  'Processing security events...',
  'Correlating indicators...',
  'Refining defense strategies...',
];

let aiMessageIndex = 0;

function startAIStatusCycle() {
  setInterval(() => {
    aiStatusEl.textContent = aiStatusMessages[aiMessageIndex];
    aiMessageIndex = (aiMessageIndex + 1) % aiStatusMessages.length;
  }, 3500);
}

const attackLogs = [
  { text: '[ALERT] Suspicious login attempt - Russia', type: 'blocked' },
  { text: '[BLOCKED] Malware injection detected - USA', type: 'blocked' },
  { text: '[WARNING] Unusual traffic spike - India', type: 'warned' },
  { text: '[ALERT] Brute force attack from China', type: 'blocked' },
  { text: '[WARNING] Port scan activity detected - UK', type: 'warned' },
  { text: '[BLOCKED] SQL injection payload - Brazil', type: 'blocked' },
  { text: '[ALERT] DDoS attack pattern - Vietnam', type: 'blocked' },
  { text: '[WARNING] Privilege escalation attempt - Germany', type: 'warned' },
  { text: '[BLOCKED] Ransomware signature detected - France', type: 'blocked' },
  { text: '[ALERT] Authentication bypass attempt - Japan', type: 'blocked' },
];

function populateAttackFeed() {
  let logIndex = 0;
  
  setInterval(() => {
    const log = attackLogs[logIndex % attackLogs.length];
    const entry = document.createElement('div');
    entry.className = `feed-entry ${log.type}`;
    entry.textContent = log.text;
    
    feedScrollEl.appendChild(entry);
    feedScrollEl.scrollTop = feedScrollEl.scrollHeight;
    
    // Keep only last 8 entries
    while (feedScrollEl.children.length > 6) {
      feedScrollEl.removeChild(feedScrollEl.firstChild);
    }
    
    logIndex++;
  }, 2200);
}

function drawNetworkVisualization() {
  const canvas = document.getElementById('networkCanvas');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  const container = canvas.parentElement;
  
  canvas.width = container.clientWidth;
  canvas.height = container.clientHeight;
  
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = Math.min(canvas.width, canvas.height) * 0.25;
  const nodeCount = 24;
  
  // Create node positions
  const nodes = [];
  for (let i = 0; i < nodeCount; i++) {
    const angle = (i / nodeCount) * Math.PI * 2;
    nodes.push({
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius,
      angle,
      pulse: Math.random() * Math.PI * 2,
    });
  }
  
  let animationFrame = 0;
  
  const drawFrame = () => {
    ctx.fillStyle = 'rgba(2, 3, 7, 0.3)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw connections
    ctx.strokeStyle = 'rgba(76, 229, 255, 0.15)';
    ctx.lineWidth = 1;
    for (let i = 0; i < nodes.length; i++) {
      const nextIndex = (i + 1) % nodes.length;
      ctx.beginPath();
      ctx.moveTo(nodes[i].x, nodes[i].y);
      ctx.lineTo(nodes[nextIndex].x, nodes[nextIndex].y);
      ctx.stroke();
      
      // Random cross connections
      if (i % 2 === 0) {
        const randIndex = Math.floor(Math.random() * nodes.length);
        ctx.strokeStyle = 'rgba(76, 229, 255, 0.08)';
        ctx.beginPath();
        ctx.moveTo(nodes[i].x, nodes[i].y);
        ctx.lineTo(nodes[randIndex].x, nodes[randIndex].y);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(76, 229, 255, 0.15)';
      }
    }
    
    // Draw center core
    ctx.fillStyle = 'rgba(157, 108, 255, 0.4)';
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(76, 229, 255, 0.6)';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw nodes
    nodes.forEach((node, i) => {
      const pulseIntensity = Math.sin(animationFrame * 0.04 + node.pulse) * 0.5 + 0.5;
      const size = 4 + pulseIntensity * 3;
      
      ctx.fillStyle = `rgba(76, 229, 255, ${0.6 + pulseIntensity * 0.4})`;
      ctx.beginPath();
      ctx.arc(node.x, node.y, size, 0, Math.PI * 2);
      ctx.fill();
      
      // Node glow
      ctx.strokeStyle = `rgba(76, 229, 255, ${0.3 + pulseIntensity * 0.3})`;
      ctx.lineWidth = 1 + pulseIntensity;
      ctx.beginPath();
      ctx.arc(node.x, node.y, size + 4, 0, Math.PI * 2);
      ctx.stroke();
      
      // Occasional attack pulse
      if (Math.random() < 0.02) {
        ctx.fillStyle = 'rgba(255, 77, 97, 0.6)';
        ctx.beginPath();
        ctx.arc(node.x, node.y, size + 2, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    
    animationFrame++;
    if (state.dashboardActive) requestAnimationFrame(drawFrame);
  };
  
  drawFrame();
}
