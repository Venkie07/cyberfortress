gsap.registerPlugin(ScrollTrigger);

const sceneLabels = ['BOOT', 'THREAT', 'CORE', 'DEFEND', 'MODULES', 'GLOBAL', 'FINAL'];
const scenes = Array.from(document.querySelectorAll('.scene'));
const progressFill = document.getElementById('progressFill');
const progressLabel = document.getElementById('progressLabel');
const attackBtn = document.getElementById('attackBtn');
const terminalLines = Array.from(document.querySelectorAll('.terminal-line'));
const moduleCards = Array.from(document.querySelectorAll('.module-card'));
const sceneCount = scenes.length;

const state = {
  scene: 0,
  attackBurst: 0,
  modulePulse: -1,
  chaos: 0,
  defense: 0,
  coreGlow: 0,
  globalBlue: 0,
  bootDone: false,
  attackTriggered: false,
};

const bootScript = [
  'Initializing CyberFortress...',
  'Loading AI Defense Systems...',
  'Establishing autonomous threat mesh...',
];

let bootIndex = 0;
let bootChar = 0;
let bootTimer = 0;
let lastTime = performance.now();

function typeBoot(delta) {
  if (state.bootDone) return;
  bootTimer += delta;
  if (bootTimer < 35) return;
  bootTimer = 0;

  const line = bootScript[bootIndex];
  const target = terminalLines[bootIndex];
  if (!line || !target) {
    state.bootDone = true;
    terminalLines.forEach((el, index) => {
      if (bootScript[index]) el.textContent = bootScript[index];
    });
    return;
  }

  bootChar += 1;
  target.textContent = line.slice(0, bootChar);
  if (bootChar >= line.length) {
    bootIndex += 1;
    bootChar = 0;
  }
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function setScene(index) {
  state.scene = clamp(index, 0, sceneCount - 1);
  progressLabel.textContent = sceneLabels[state.scene] || 'CYBERFORTRESS';
  progressFill.style.width = `${12 + (state.scene / Math.max(sceneCount - 1, 1)) * 88}%`;

  scenes.forEach((scene, sceneIndex) => {
    const active = sceneIndex === state.scene;
    scene.classList.toggle('active', active);
    scene.style.zIndex = active ? 2 : 1;
  });

  if (state.scene === 0) {
    state.chaos = lerp(state.chaos, 0, 0.35);
    state.defense = lerp(state.defense, 0, 0.25);
  }

  if (state.scene === 1) {
    state.chaos = 1;
    state.defense = lerp(state.defense, 0.05, 0.25);
  }

  if (state.scene === 2) {
    state.coreGlow = 1;
  }

  if (state.scene === 3) {
    state.defense = 1;
  }

  if (state.scene === 4) {
    animateModules();
  }

  if (state.scene === 5) {
    state.globalBlue = 1;
  }
}

function animateModules() {
  moduleCards.forEach((card, index) => {
    gsap.killTweensOf(card);
    gsap.fromTo(
      card,
      { opacity: 0.45, y: 28, scale: 0.96 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.7,
        delay: index * 0.18,
        ease: 'power3.out',
        onStart: () => {
          moduleCards.forEach((otherCard) => otherCard.classList.remove('active'));
          card.classList.add('active');
          state.modulePulse = index;
        },
      }
    );
  });
}

scenes.forEach((scene, index) => {
  ScrollTrigger.create({
    trigger: scene,
    start: 'top center',
    end: 'bottom center',
    onEnter: () => setScene(index),
    onEnterBack: () => setScene(index),
  });
});

const bootTrigger = ScrollTrigger.create({
  trigger: scenes[0],
  start: 'top top',
  end: 'bottom center',
  onEnter: () => setScene(0),
});

attackBtn.addEventListener('mouseenter', () => {
  gsap.to(attackBtn, { scale: 1.05, duration: 0.2, ease: 'power2.out' });
});

attackBtn.addEventListener('mouseleave', () => {
  gsap.to(attackBtn, { scale: 1, duration: 0.2, ease: 'power2.out' });
});

attackBtn.addEventListener('click', () => {
  state.attackTriggered = true;
  state.attackBurst = 1;
  state.chaos = 1;
  state.defense = 0.35;
  setScene(Math.max(state.scene, 3));
  gsap.fromTo(
    attackBtn,
    { boxShadow: '0 0 0 rgba(0,0,0,0)' },
    { boxShadow: '0 0 50px rgba(255,77,97,0.18)', duration: 0.18, yoyo: true, repeat: 1 }
  );
});

const canvas = document.getElementById('stage');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
renderer.setSize(window.innerWidth, window.innerHeight, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.35;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x04070d, 0.018);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 0.2, 14);

const root = new THREE.Group();
scene.add(root);

const networkGroup = new THREE.Group();
root.add(networkGroup);

const coreGroup = new THREE.Group();
root.add(coreGroup);

const globeGroup = new THREE.Group();
globeGroup.visible = false;
root.add(globeGroup);

const ambient = new THREE.AmbientLight(0x9ec6ff, 0.4);
scene.add(ambient);

const keyLight = new THREE.DirectionalLight(0x7fc8ff, 1.4);
keyLight.position.set(5, 6, 8);
scene.add(keyLight);

const threatColor = new THREE.Color('#ff4d61');
const defenseColor = new THREE.Color('#53dcff');
const deepColor = new THREE.Color('#081120');
const coreColor = new THREE.Color('#9c6bff');

const nodeCount = 72;
const nodes = [];
const nodeGeometry = new THREE.SphereGeometry(0.12, 12, 12);
const nodeMaterial = new THREE.MeshStandardMaterial({
  color: 0x93bfff,
  emissive: 0x1d355e,
  emissiveIntensity: 1.1,
  roughness: 0.35,
  metalness: 0.2,
});

function buildNetwork() {
  const positions = [];
  const colors = [];
  const indices = [];

  for (let i = 0; i < nodeCount; i += 1) {
    const theta = Math.random() * Math.PI * 2;
    const radius = 4 + Math.random() * 5.5;
    const y = (Math.random() - 0.5) * 5.8;
    const x = Math.cos(theta) * radius + (Math.random() - 0.5) * 1.6;
    const z = Math.sin(theta) * radius + (Math.random() - 0.5) * 1.6;
    const mesh = new THREE.Mesh(nodeGeometry, nodeMaterial.clone());
    mesh.position.set(x, y, z);
    mesh.scale.setScalar(0.8 + Math.random() * 0.9);
    networkGroup.add(mesh);
    nodes.push({
      mesh,
      base: mesh.position.clone(),
      infection: Math.random() * 0.1,
      threat: 0,
      defense: 0,
      pulse: Math.random() * Math.PI * 2,
    });
  }

  for (let i = 0; i < nodeCount; i += 1) {
    const a = nodes[i];
    const links = 2 + Math.floor(Math.random() * 2);
    for (let j = 0; j < links; j += 1) {
      const targetIndex = Math.floor(Math.random() * nodeCount);
      if (targetIndex === i) continue;
      const b = nodes[targetIndex];
      positions.push(a.base.x, a.base.y, a.base.z, b.base.x, b.base.y, b.base.z);
      indices.push(i, targetIndex);
      colors.push(0.3, 0.5, 0.9, 0.3, 0.5, 0.9);
    }
  }

  const lineGeometry = new THREE.BufferGeometry();
  lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  lineGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

  const lineMaterial = new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.22,
  });

  const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
  networkGroup.add(lines);

  return { lines };
}

const network = buildNetwork();

const coreMesh = new THREE.Mesh(
  new THREE.IcosahedronGeometry(1.6, 5),
  new THREE.MeshStandardMaterial({
    color: 0x9c6bff,
    emissive: 0x2d65ff,
    emissiveIntensity: 2.0,
    roughness: 0.12,
    metalness: 0.75,
    wireframe: false,
  })
);
coreGroup.add(coreMesh);

const coreShell = new THREE.Mesh(
  new THREE.TorusKnotGeometry(2.1, 0.11, 256, 32),
  new THREE.MeshStandardMaterial({
    color: 0x53dcff,
    emissive: 0x53dcff,
    emissiveIntensity: 1.9,
    roughness: 0.2,
    metalness: 0.4,
    transparent: true,
    opacity: 0.45,
  })
);
coreShell.rotation.x = 1.2;
coreGroup.add(coreShell);

const coreRings = [];
for (let i = 0; i < 4; i += 1) {
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(2.8 + i * 0.38, 0.03 + i * 0.01, 8, 120),
    new THREE.MeshBasicMaterial({
      color: i < 2 ? 0x53dcff : 0x9c6bff,
      transparent: true,
      opacity: 0.32,
      blending: THREE.AdditiveBlending,
    })
  );
  ring.rotation.x = Math.PI / 2 + i * 0.12;
  ring.rotation.y = i * 0.42;
  coreRings.push(ring);
  coreGroup.add(ring);
}

const globe = new THREE.Mesh(
  new THREE.SphereGeometry(4.2, 48, 32),
  new THREE.MeshBasicMaterial({
    color: 0x53dcff,
    wireframe: true,
    transparent: true,
    opacity: 0.08,
  })
);
globeGroup.add(globe);

const globeHalo = new THREE.Mesh(
  new THREE.SphereGeometry(4.35, 32, 24),
  new THREE.MeshBasicMaterial({
    color: 0x3d7dff,
    transparent: true,
    opacity: 0.08,
    blending: THREE.AdditiveBlending,
  })
);
globeGroup.add(globeHalo);

globeGroup.position.set(-5.5, 0.1, -3.5);
coreGroup.position.set(0, 0.2, 0);
networkGroup.position.set(0, 0, 0);

const pulseGeometry = new THREE.SphereGeometry(0.06, 10, 10);
const pulses = [];

function spawnPulse(from, to, color, speed = 1, life = 1, targetGroup = networkGroup) {
  const pulse = new THREE.Mesh(
    pulseGeometry,
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending,
    })
  );
  pulse.position.copy(from);
  targetGroup.add(pulse);
  pulses.push({
    mesh: pulse,
    from: from.clone(),
    to: to.clone(),
    t: 0,
    speed,
    life,
    color: new THREE.Color(color),
  });
}

function randomNode() {
  return nodes[Math.floor(Math.random() * nodes.length)];
}

function triggerAttackBurst(strength = 1) {
  for (let i = 0; i < 10 + strength * 10; i += 1) {
    const source = randomNode().base.clone();
    const target = randomNode().base.clone();
    spawnPulse(source, target, threatColor.getHex(), 0.6 + Math.random() * 0.8, 1.8);
  }
  state.attackBurst = Math.max(state.attackBurst, strength);
}

function updateNodeState(delta, elapsed) {
  nodes.forEach((node, index) => {
    const wave = Math.sin(elapsed * 0.9 + node.pulse) * 0.08;
    const threatLift = state.chaos * (0.55 + 0.45 * Math.sin(elapsed * 2 + index));
    const defenseLift = state.defense * (0.5 + 0.5 * Math.cos(elapsed * 1.6 + index * 0.3));
    const infection = clamp(node.infection + threatLift * delta * 0.45 - defenseLift * delta * 0.6, 0, 1);
    node.infection = infection;
    node.threat = lerp(node.threat, state.chaos * infection, 0.08);
    node.defense = lerp(node.defense, state.defense * (1 - infection), 0.08);

    const mesh = node.mesh;
    const scalePulse = 1 + wave + node.threat * 0.5 - node.defense * 0.22;
    mesh.scale.setScalar(clamp(scalePulse, 0.55, 1.8));

    const color = new THREE.Color();
    color.lerpColors(deepColor, threatColor, node.threat);
    color.lerp(defenseColor, node.defense * 0.75);
    mesh.material.emissive.copy(color).multiplyScalar(0.92 + node.defense * 1.3);
    mesh.material.color.copy(color).lerp(coreColor, node.defense * 0.12);
    mesh.material.opacity = 0.88 + node.defense * 0.12;

    const offset = wave * 0.28 + node.threat * 0.75 - node.defense * 0.55;
    mesh.position.copy(node.base).multiplyScalar(1 + offset * 0.04);
  });
}

function updatePulses(delta) {
  for (let i = pulses.length - 1; i >= 0; i -= 1) {
    const pulse = pulses[i];
    pulse.t += delta * pulse.speed;
    const eased = easeInOutCubic(clamp(pulse.t / pulse.life, 0, 1));
    pulse.mesh.position.lerpVectors(pulse.from, pulse.to, eased);
    pulse.mesh.material.color.copy(pulse.color);
    pulse.mesh.material.opacity = 1 - eased;
    pulse.mesh.scale.setScalar(1 + eased * 2.8);

    if (pulse.t >= pulse.life) {
      pulse.mesh.parent?.remove(pulse.mesh);
      pulses.splice(i, 1);
    }
  }
}

function updateNetworkLines(elapsed) {
  const attr = network.lines.geometry.attributes.color;
  const positions = network.lines.geometry.attributes.position.array;
  const color = new THREE.Color();

  for (let i = 0; i < attr.count; i += 2) {
    const aIndex = i / 2;
    const nx = positions[i * 3];
    const ny = positions[i * 3 + 1];
    const nz = positions[i * 3 + 2];
    const threat = state.chaos * 0.82 + state.attackBurst * 0.2 + Math.sin(elapsed + aIndex * 0.4) * 0.03;
    const defense = state.defense * 0.9 + state.globalBlue * 0.45;
    color.setRGB(0.2 + defense * 0.2, 0.35 + defense * 0.45, 0.7 + defense * 0.25);
    color.lerp(threatColor, clamp(threat, 0, 1));
    color.lerp(defenseColor, clamp(defense, 0, 1));
    attr.setXYZ(i, color.r, color.g, color.b);
    attr.setXYZ(i + 1, color.r, color.g, color.b);
  }
  attr.needsUpdate = true;
}

function updateCore(elapsed, delta) {
  const corePulse = 1 + Math.sin(elapsed * 2.3) * 0.06 + state.coreGlow * 0.18 + state.defense * 0.12;
  coreGroup.scale.setScalar(corePulse);
  coreMesh.rotation.x += delta * 0.28;
  coreMesh.rotation.y += delta * 0.35;
  coreShell.rotation.z += delta * 0.42;
  coreShell.material.emissiveIntensity = 1.3 + state.coreGlow * 1.4 + state.defense * 0.8;

  coreRings.forEach((ring, index) => {
    ring.rotation.z += delta * (0.12 + index * 0.05);
    ring.scale.setScalar(1 + Math.sin(elapsed * 0.7 + index) * 0.02 + state.coreGlow * 0.12);
    ring.material.opacity = 0.12 + state.coreGlow * 0.2 + state.defense * 0.08;
  });
}

function updateGlobe(delta, elapsed) {
  globeGroup.visible = state.scene >= 5 || state.globalBlue > 0.1;
  globe.rotation.y += delta * 0.18;
  globe.rotation.x = Math.sin(elapsed * 0.22) * 0.08;
  globeHalo.rotation.y -= delta * 0.08;
  globeGroup.scale.setScalar(lerp(0.9, 1.18, state.globalBlue));
  globe.material.opacity = 0.05 + state.globalBlue * 0.09;
  globeHalo.material.opacity = 0.03 + state.globalBlue * 0.08;
}

function maybeAutoTrigger(elapsed) {
  if (!state.attackTriggered && state.scene >= 1 && elapsed > 3.5) {
    state.attackTriggered = true;
    triggerAttackBurst(1);
  }
}

function animate(now) {
  const delta = Math.min((now - lastTime) / 1000, 0.033);
  lastTime = now;
  const elapsed = now / 1000;

  typeBoot(delta * 1000);
  maybeAutoTrigger(elapsed);

  if (state.scene === 1) {
    state.chaos = lerp(state.chaos, 1, 0.04);
  } else if (state.scene > 1) {
    state.chaos = lerp(state.chaos, 0.15, 0.03);
  }

  if (state.scene >= 3) {
    state.defense = lerp(state.defense, 1, 0.02);
  } else {
    state.defense = lerp(state.defense, 0.1, 0.03);
  }

  state.coreGlow = lerp(state.coreGlow, state.scene >= 2 ? 1 : 0, 0.05);
  state.globalBlue = lerp(state.globalBlue, state.scene >= 5 ? 1 : 0, 0.04);
  state.attackBurst = lerp(state.attackBurst, state.attackTriggered ? 1 : 0, 0.02);

  updateNodeState(delta, elapsed);
  updatePulses(delta);
  updateNetworkLines(elapsed);
  updateCore(elapsed, delta);
  updateGlobe(delta, elapsed);

  if (state.scene === 1 || state.attackTriggered) {
    if (Math.random() > 0.68) {
      const source = randomNode().base.clone();
      const target = randomNode().base.clone();
      const color = state.defense > 0.4 ? defenseColor.getHex() : threatColor.getHex();
      spawnPulse(source, target, color, 0.65 + Math.random() * 0.6, 1.4 + Math.random() * 0.5);
    }
  }

  if (state.scene >= 3 && Math.random() > 0.72) {
    const source = randomNode().base.clone();
    const target = coreGroup.position.clone();
    spawnPulse(source, target, defenseColor.getHex(), 0.9 + Math.random() * 0.5, 1.3);
  }

  root.rotation.y = Math.sin(elapsed * 0.08) * 0.08;
  root.rotation.x = Math.sin(elapsed * 0.05) * 0.05;

  camera.position.x = Math.sin(elapsed * 0.12) * 0.22;
  camera.position.y = Math.cos(elapsed * 0.15) * 0.15;
  camera.lookAt(0, 0, 0);

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

requestAnimationFrame(animate);
setScene(0);

gsap.set('.scene-copy, .terminal-window, .hud, .progress-shell', { willChange: 'transform, opacity, filter' });

gsap.from('.hud', { opacity: 0, y: -18, duration: 1, ease: 'power3.out' });
gsap.from('.progress-shell', { opacity: 0, y: 20, duration: 1.1, delay: 0.15, ease: 'power3.out' });

gsap.to('.scene-boot .terminal-window', {
  opacity: 1,
  duration: 1,
  delay: 0.25,
  ease: 'power2.out',
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  ScrollTrigger.refresh();
});
