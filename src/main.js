import * as THREE from 'https://unpkg.com/three@0.164.1/build/three.module.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.164.1/examples/jsm/loaders/GLTFLoader.js';

const STORAGE_KEY = 'need-for-burnt-save-v3';
const WORLD_HALF = 420;

const carCatalog = [
  { id: 'swift-gt', name: 'Swift GT', price: 12000, topSpeed: 110, acceleration: 45, handling: 48, color: 0x1f6feb, modelPath: null },
  { id: 'apex-predator', name: 'Apex Predator', price: 22000, topSpeed: 140, acceleration: 62, handling: 52, color: 0xef4444, modelPath: null },
  { id: 'neon-vortex', name: 'Neon Vortex', price: 30000, topSpeed: 155, acceleration: 70, handling: 60, color: 0x7c3aed, modelPath: null },
  { id: 'porsche-test', name: 'Porsche Test Build', price: 42000, topSpeed: 172, acceleration: 82, handling: 64, color: 0xd1d5db, modelPath: '/assets/models/porsche.glb' }
];

const defaultSave = {
  cash: 22000,
  ownedCars: ['swift-gt'],
  selectedCar: 'swift-gt',
  settings: { lowGraphics: false, shadows: true, resolutionScale: 1 }
};

const loadSave = () => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return structuredClone(defaultSave);
  const parsed = JSON.parse(raw);
  return {
    ...structuredClone(defaultSave),
    ...parsed,
    settings: { ...defaultSave.settings, ...(parsed.settings || {}) }
  };
};

let state;
try {
  state = loadSave();
} catch {
  state = structuredClone(defaultSave);
}

const save = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
const getSelectedCar = () => carCatalog.find((car) => car.id === state.selectedCar) || carCatalog[0];

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9dd3ff);
scene.fog = new THREE.Fog(0x9dd3ff, 120, 700);

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1600);
camera.position.set(0, 9, 16);

scene.add(new THREE.AmbientLight(0xffffff, 0.75));
const sun = new THREE.DirectionalLight(0xffffff, 0.8);
sun.position.set(90, 120, 60);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
scene.add(sun);

const ground = new THREE.Mesh(new THREE.PlaneGeometry(WORLD_HALF * 2 + 200, WORLD_HALF * 2 + 200), new THREE.MeshStandardMaterial({ color: 0x2f7a3f }));
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

const roads = [];
const addRoad = (x, z, width, depth) => {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), new THREE.MeshStandardMaterial({ color: 0x2f3743 }));
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(x, 0.03, z);
  mesh.receiveShadow = true;
  scene.add(mesh);
  roads.push({ x, z, width, depth });
};

const laneWidth = 36;
[-260, -130, 0, 130, 260].forEach((v) => addRoad(v, 0, laneWidth, WORLD_HALF * 2));
[-260, -130, 0, 130, 260].forEach((v) => addRoad(0, v, WORLD_HALF * 2, laneWidth));
addRoad(-65, 195, 170, 32);
addRoad(200, -70, 32, 200);

const garagePosition = new THREE.Vector3(-65, 0.2, 195);
const garageHub = new THREE.Mesh(new THREE.BoxGeometry(24, 12, 16), new THREE.MeshStandardMaterial({ color: 0x334155 }));
garageHub.position.set(garagePosition.x, 6, garagePosition.z);
garageHub.castShadow = true;
garageHub.receiveShadow = true;
scene.add(garageHub);

const isRoad = (x, z, margin = 10) => roads.some((r) => Math.abs(x - r.x) <= (r.width / 2) + margin && Math.abs(z - r.z) <= (r.depth / 2) + margin);

const obstacles = [];
const buildingMaterial = new THREE.MeshStandardMaterial({ color: 0x6b7280 });
for (let i = 0; i < 170; i += 1) {
  const width = 10 + Math.random() * 20;
  const depth = 10 + Math.random() * 20;
  const height = 10 + Math.random() * 56;
  const x = -WORLD_HALF + 20 + Math.random() * (WORLD_HALF * 2 - 40);
  const z = -WORLD_HALF + 20 + Math.random() * (WORLD_HALF * 2 - 40);

  if (isRoad(x, z, 16)) continue;
  if (Math.abs(x - garagePosition.x) < 28 && Math.abs(z - garagePosition.z) < 28) continue;

  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), buildingMaterial);
  mesh.position.set(x, height / 2, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
  obstacles.push({ mesh, halfW: width / 2, halfD: depth / 2 });
}

const carGroup = new THREE.Group();
const fallbackBody = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.8, 4.4), new THREE.MeshStandardMaterial({ color: 0x1f6feb }));
fallbackBody.position.y = 0.8;
fallbackBody.castShadow = true;
const fallbackCabin = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.6, 2), new THREE.MeshStandardMaterial({ color: 0xc8d1db }));
fallbackCabin.position.set(0, 1.35, -0.15);
fallbackCabin.castShadow = true;
carGroup.add(fallbackBody, fallbackCabin);
carGroup.position.y = 0.1;
scene.add(carGroup);

const loadedModelByCar = new Map();
const loader = new GLTFLoader();
const setFallbackVisible = (isVisible) => {
  fallbackBody.visible = isVisible;
  fallbackCabin.visible = isVisible;
};

const speedEl = document.getElementById('speed-value');
const cashEl = document.getElementById('cash-value');
const carEl = document.getElementById('car-value');
const pauseMenu = document.getElementById('pause-menu');
const settingsMenu = document.getElementById('settings-menu');
const garageMenu = document.getElementById('garage-menu');
const mapMenu = document.getElementById('map-menu');
const garageList = document.getElementById('garage-list');
const lowGraphicsInput = document.getElementById('low-graphics');
const shadowsInput = document.getElementById('shadows-toggle');
const resolutionScaleInput = document.getElementById('resolution-scale');
const garageCarName = document.getElementById('garage-car-name');
const garageCarPrice = document.getElementById('garage-car-price');
const statSpeed = document.getElementById('stat-speed');
const statAccel = document.getElementById('stat-accel');
const statHandling = document.getElementById('stat-handling');
const minimap = document.getElementById('minimap');
const minimapCtx = minimap.getContext('2d');
const fullmap = document.getElementById('fullmap');
const fullmapCtx = fullmap.getContext('2d');

let isPaused = false;
const inputs = new Set();
let velocity = 0;

const setOverlay = (el, open) => el.classList.toggle('hidden', !open);
const anyMenuOpen = () => !pauseMenu.classList.contains('hidden') || !settingsMenu.classList.contains('hidden') || !garageMenu.classList.contains('hidden') || !mapMenu.classList.contains('hidden');

const showGarageStats = (car) => {
  garageCarName.textContent = car.name;
  garageCarPrice.textContent = `Price: $${car.price}`;
  statSpeed.style.width = `${Math.min(100, (car.topSpeed / 180) * 100)}%`;
  statAccel.style.width = `${Math.min(100, (car.acceleration / 90) * 100)}%`;
  statHandling.style.width = `${Math.min(100, (car.handling / 90) * 100)}%`;
};

const applyCarVisual = () => {
  const selected = getSelectedCar();
  fallbackBody.material.color.setHex(selected.color);
  carEl.textContent = selected.name;
  showGarageStats(selected);

  for (const [carId, model] of loadedModelByCar.entries()) {
    model.visible = carId === selected.id;
  }

  if (!selected.modelPath) {
    setFallbackVisible(true);
    return;
  }

  if (loadedModelByCar.has(selected.id)) {
    setFallbackVisible(false);
    return;
  }

  loader.load(
    selected.modelPath,
    (gltf) => {
      const model = gltf.scene;
      model.scale.setScalar(1.2);
      model.rotation.y = Math.PI;
      model.traverse((node) => {
        if (node.isMesh) {
          node.castShadow = true;
          node.receiveShadow = true;
        }
      });
      carGroup.add(model);
      loadedModelByCar.set(selected.id, model);
      setFallbackVisible(false);
    },
    undefined,
    () => {
      setFallbackVisible(true);
    }
  );
};

const applySettings = () => {
  const { lowGraphics, shadows, resolutionScale } = state.settings;
  lowGraphicsInput.checked = lowGraphics;
  shadowsInput.checked = shadows;
  resolutionScaleInput.value = String(resolutionScale);

  const effectiveShadows = shadows && !lowGraphics;
  renderer.shadowMap.enabled = effectiveShadows;
  sun.castShadow = effectiveShadows;

  const scale = lowGraphics ? 0.5 : Number(resolutionScale);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, scale));
};

const refreshHud = () => {
  cashEl.textContent = Math.floor(state.cash).toString();
  applyCarVisual();
};

const rebuildGarage = () => {
  garageList.innerHTML = '';
  carCatalog.forEach((car) => {
    const owned = state.ownedCars.includes(car.id);
    const selected = state.selectedCar === car.id;

    const card = document.createElement('article');
    card.className = `car-card${selected ? ' active' : ''}`;
    card.innerHTML = `<strong>${car.name}</strong><div class="car-sub">Top ${car.topSpeed} | Accel ${car.acceleration} | Handling ${car.handling}</div><div>Price: $${car.price}</div>`;
    card.onmouseenter = () => showGarageStats(car);

    const row = document.createElement('div');
    row.className = 'car-row';

    if (!owned) {
      const buy = document.createElement('button');
      buy.textContent = 'Buy';
      buy.disabled = state.cash < car.price;
      buy.onclick = () => {
        if (state.cash < car.price) return;
        state.cash -= car.price;
        state.ownedCars.push(car.id);
        state.selectedCar = car.id;
        save();
        refreshHud();
        rebuildGarage();
      };
      row.appendChild(buy);
    } else {
      const equip = document.createElement('button');
      equip.textContent = selected ? 'Equipped' : 'Equip';
      equip.disabled = selected;
      equip.onclick = () => {
        state.selectedCar = car.id;
        save();
        refreshHud();
        rebuildGarage();
      };
      row.appendChild(equip);

      if (car.id !== 'swift-gt') {
        const sell = document.createElement('button');
        sell.textContent = `Sell (+$${Math.floor(car.price * 0.7)})`;
        sell.onclick = () => {
          state.cash += Math.floor(car.price * 0.7);
          state.ownedCars = state.ownedCars.filter((ownedCarId) => ownedCarId !== car.id);
          if (state.selectedCar === car.id) state.selectedCar = 'swift-gt';
          save();
          refreshHud();
          rebuildGarage();
        };
        row.appendChild(sell);
      }
    }

    card.appendChild(row);
    garageList.appendChild(card);
  });
};

const openGarage = () => {
  setOverlay(garageMenu, true);
  setOverlay(pauseMenu, false);
  setOverlay(mapMenu, false);
  rebuildGarage();
};

const openSettings = () => {
  setOverlay(settingsMenu, true);
  setOverlay(pauseMenu, false);
};

const openMap = () => {
  setOverlay(mapMenu, true);
  setOverlay(pauseMenu, false);
};

const togglePause = () => {
  isPaused = !isPaused;
  setOverlay(pauseMenu, isPaused);
};

const resetSave = () => {
  state = structuredClone(defaultSave);
  carGroup.position.set(0, 0.1, 0);
  carGroup.rotation.set(0, 0, 0);
  velocity = 0;
  save();
  applySettings();
  refreshHud();
  rebuildGarage();
};

document.getElementById('pause-toggle').onclick = togglePause;
document.getElementById('garage-toggle').onclick = openGarage;
document.getElementById('settings-toggle').onclick = openSettings;
document.getElementById('map-toggle').onclick = openMap;
document.getElementById('resume-btn').onclick = () => { isPaused = false; setOverlay(pauseMenu, false); };
document.getElementById('pause-open-settings').onclick = openSettings;
document.getElementById('pause-open-garage').onclick = openGarage;
document.getElementById('pause-open-map').onclick = openMap;
document.getElementById('reset-save-btn').onclick = resetSave;
document.getElementById('close-garage').onclick = () => setOverlay(garageMenu, false);
document.getElementById('close-settings').onclick = () => setOverlay(settingsMenu, false);
document.getElementById('close-map').onclick = () => setOverlay(mapMenu, false);

lowGraphicsInput.onchange = () => { state.settings.lowGraphics = lowGraphicsInput.checked; if (state.settings.lowGraphics) state.settings.resolutionScale = 0.5; save(); applySettings(); };
shadowsInput.onchange = () => { state.settings.shadows = shadowsInput.checked; save(); applySettings(); };
resolutionScaleInput.onchange = () => { state.settings.resolutionScale = Number(resolutionScaleInput.value); save(); applySettings(); };

window.addEventListener('keydown', (e) => {
  const lower = e.key.toLowerCase();
  if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(lower)) inputs.add(lower);
  if (lower === 'escape') togglePause();
  if (lower === 'm') openMap();
});
window.addEventListener('keyup', (e) => inputs.delete(e.key.toLowerCase()));
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

const collidesWithBuilding = (x, z) => {
  const halfCar = 1.6;
  if (Math.abs(x) > WORLD_HALF || Math.abs(z) > WORLD_HALF) return true;
  return obstacles.some(({ mesh, halfW, halfD }) => Math.abs(x - mesh.position.x) < halfW + halfCar && Math.abs(z - mesh.position.z) < halfD + halfCar);
};

const routePoints = (fromX, fromZ, toX, toZ) => [
  { x: fromX, z: fromZ },
  { x: toX, z: fromZ },
  { x: toX, z: toZ }
];

const worldToMap = (x, z, width, height) => {
  const nx = (x + WORLD_HALF) / (WORLD_HALF * 2);
  const nz = (z + WORLD_HALF) / (WORLD_HALF * 2);
  return {
    x: nx * width,
    y: nz * height
  };
};

const drawPlayer = (ctx, x, y, heading, size = 7) => {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-heading);
  ctx.fillStyle = '#38bdf8';
  ctx.beginPath();
  ctx.moveTo(0, -size);
  ctx.lineTo(size * 0.6, size);
  ctx.lineTo(-size * 0.6, size);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
};

const drawFullMap = () => {
  fullmapCtx.fillStyle = '#040912';
  fullmapCtx.fillRect(0, 0, fullmap.width, fullmap.height);

  fullmapCtx.strokeStyle = '#1e293b';
  fullmapCtx.lineWidth = 1;
  fullmapCtx.strokeRect(8, 8, fullmap.width - 16, fullmap.height - 16);

  fullmapCtx.fillStyle = '#1f2937';
  roads.forEach((r) => {
    const p = worldToMap(r.x, r.z, fullmap.width, fullmap.height);
    const w = (r.width / (WORLD_HALF * 2)) * fullmap.width;
    const h = (r.depth / (WORLD_HALF * 2)) * fullmap.height;
    fullmapCtx.fillRect(p.x - w / 2, p.y - h / 2, w, h);
  });

  fullmapCtx.fillStyle = '#4b5563';
  obstacles.forEach(({ mesh, halfW, halfD }) => {
    const p = worldToMap(mesh.position.x, mesh.position.z, fullmap.width, fullmap.height);
    const w = (halfW * 2 / (WORLD_HALF * 2)) * fullmap.width;
    const h = (halfD * 2 / (WORLD_HALF * 2)) * fullmap.height;
    fullmapCtx.fillRect(p.x - w / 2, p.y - h / 2, w, h);
  });

  const route = routePoints(carGroup.position.x, carGroup.position.z, garagePosition.x, garagePosition.z);
  fullmapCtx.strokeStyle = '#facc15';
  fullmapCtx.lineWidth = 2;
  fullmapCtx.beginPath();
  route.forEach((pt, idx) => {
    const p = worldToMap(pt.x, pt.z, fullmap.width, fullmap.height);
    if (idx === 0) fullmapCtx.moveTo(p.x, p.y);
    else fullmapCtx.lineTo(p.x, p.y);
  });
  fullmapCtx.stroke();

  const garage = worldToMap(garagePosition.x, garagePosition.z, fullmap.width, fullmap.height);
  fullmapCtx.fillStyle = '#22d3ee';
  fullmapCtx.fillRect(garage.x - 5, garage.y - 5, 10, 10);

  const player = worldToMap(carGroup.position.x, carGroup.position.z, fullmap.width, fullmap.height);
  drawPlayer(fullmapCtx, player.x, player.y, carGroup.rotation.y, 8);
};

const drawMinimap = () => {
  minimapCtx.fillStyle = '#03060d';
  minimapCtx.fillRect(0, 0, minimap.width, minimap.height);

  const px = carGroup.position.x;
  const pz = carGroup.position.z;
  const zoom = 0.42;

  minimapCtx.save();
  minimapCtx.translate(minimap.width / 2, minimap.height / 2);

  minimapCtx.fillStyle = '#1f2937';
  roads.forEach((r) => {
    const x = (r.x - px) * zoom;
    const y = (r.z - pz) * zoom;
    minimapCtx.fillRect(x - (r.width * zoom) / 2, y - (r.depth * zoom) / 2, r.width * zoom, r.depth * zoom);
  });

  minimapCtx.fillStyle = '#4b5563';
  obstacles.forEach(({ mesh }) => {
    const x = (mesh.position.x - px) * zoom;
    const y = (mesh.position.z - pz) * zoom;
    if (Math.abs(x) < minimap.width && Math.abs(y) < minimap.height) {
      minimapCtx.fillRect(x - 1.5, y - 1.5, 3, 3);
    }
  });

  const route = routePoints(px, pz, garagePosition.x, garagePosition.z);
  minimapCtx.strokeStyle = '#facc15';
  minimapCtx.lineWidth = 2;
  minimapCtx.beginPath();
  route.forEach((pt, idx) => {
    const x = (pt.x - px) * zoom;
    const y = (pt.z - pz) * zoom;
    if (idx === 0) minimapCtx.moveTo(x, y);
    else minimapCtx.lineTo(x, y);
  });
  minimapCtx.stroke();

  minimapCtx.fillStyle = '#22d3ee';
  minimapCtx.fillRect((garagePosition.x - px) * zoom - 3, (garagePosition.z - pz) * zoom - 3, 6, 6);

  drawPlayer(minimapCtx, 0, 0, carGroup.rotation.y, 7);
  minimapCtx.restore();

  minimapCtx.strokeStyle = '#334155';
  minimapCtx.strokeRect(6, 6, minimap.width - 12, minimap.height - 12);
};

const clock = new THREE.Clock();
refreshHud();
applySettings();
rebuildGarage();

const animate = () => {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.033);

  if (!isPaused && !anyMenuOpen()) {
    const selected = getSelectedCar();
    const maxSpeed = selected.topSpeed * 0.42;
    const accel = selected.acceleration * 0.13;
    const turnSpeed = 1.3 + selected.handling / 90;

    const forward = inputs.has('w') || inputs.has('arrowup');
    const reverse = inputs.has('s') || inputs.has('arrowdown');
    const left = inputs.has('a') || inputs.has('arrowleft');
    const right = inputs.has('d') || inputs.has('arrowright');

    if (forward) velocity += accel * dt;
    if (reverse) velocity -= accel * dt;

    velocity *= 0.985;
    velocity = Math.max(-maxSpeed * 0.4, Math.min(maxSpeed, velocity));

    if (Math.abs(velocity) > 0.05) {
      if (left) carGroup.rotation.y += turnSpeed * dt * Math.sign(velocity);
      if (right) carGroup.rotation.y -= turnSpeed * dt * Math.sign(velocity);
    }

    const moveX = Math.sin(carGroup.rotation.y) * velocity * dt;
    const moveZ = Math.cos(carGroup.rotation.y) * velocity * dt;
    const nextX = carGroup.position.x + moveX;
    const nextZ = carGroup.position.z + moveZ;

    if (!collidesWithBuilding(nextX, nextZ)) {
      carGroup.position.x = nextX;
      carGroup.position.z = nextZ;
    } else {
      velocity *= -0.24;
    }

    speedEl.textContent = Math.abs(Math.round(velocity * 12));
  }

  drawMinimap();
  if (!mapMenu.classList.contains('hidden')) drawFullMap();

  const camOffset = new THREE.Vector3(0, 8, -14).applyAxisAngle(new THREE.Vector3(0, 1, 0), carGroup.rotation.y);
  camera.position.lerp(carGroup.position.clone().add(camOffset), 0.08);
  camera.lookAt(carGroup.position.x, carGroup.position.y + 1.5, carGroup.position.z);
  renderer.render(scene, camera);
};

animate();
