import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import Node from './Node.js';
import { initFluid } from './fluid.js';

/* ---------- DOM / CANVAS ---------- */
const fluidCanvas = document.getElementById('fluidCanvas');
const threeCanvas = document.getElementById('threeCanvas');

/* ---------- THREE SCENE ---------- */
const scene   = new THREE.Scene();
const camera  = new THREE.PerspectiveCamera(55, innerWidth/innerHeight, 0.1, 1000);
camera.position.set(0, 0, 55);

const renderer = new THREE.WebGLRenderer({ canvas: threeCanvas, alpha:true, antialias:true });
renderer.setPixelRatio(devicePixelRatio);
renderer.setSize(innerWidth, innerHeight);
renderer.setClearColor(0x000000, 0);

const controls = new OrbitControls(camera, threeCanvas);
controls.enableDamping = true;

/* Lighting */
scene.add(new THREE.AmbientLight(0xffffff, 0.4));
const keyLight = new THREE.PointLight(0xffffff, 1);
keyLight.position.set(50, 50, 50);
scene.add(keyLight);

/* ---------- FLUID SIM ---------- */
const fluid = initFluid(fluidCanvas);

/* ---------- NODES + PHYSICS ---------- */
const N        = 25;
const repK     = 45;
const centerK  = 0.25;
const drag     = 0.98;
const nodes    = Array.from({ length:N }, () => new Node());
nodes.forEach(n => scene.add(n.mesh));

/* ---------- INTERACTION (drag + fling) ---------- */
const raycaster = new THREE.Raycaster();
const mouseNDC  = new THREE.Vector2();
let dragged = null, dragPlane = new THREE.Plane(), lastDrag = new THREE.Vector3(), lastT = 0;

function pointerToNDC(e) {
  const rect = threeCanvas.getBoundingClientRect();
  mouseNDC.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  mouseNDC.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
}

window.addEventListener('pointerdown', (e) => {
  pointerToNDC(e);
  raycaster.setFromCamera(mouseNDC, camera);
  const hit = raycaster.intersectObjects(scene.children)[0];
  if (hit && hit.object.userData.node) {
    dragged = hit.object.userData.node;
    const nrm = camera.getWorldDirection(new THREE.Vector3());
    dragPlane.setFromNormalAndCoplanarPoint(nrm, dragged.position);
    lastDrag.copy(dragged.position);
    lastT = performance.now();
  }
});

window.addEventListener('pointermove', (e) => {
  if (!dragged) return;
  pointerToNDC(e);
  raycaster.setFromCamera(mouseNDC, camera);
  const p = new THREE.Vector3();
  raycaster.ray.intersectPlane(dragPlane, p);
  const now = performance.now();
  const dt  = (now - lastT) / 1000;
  dragged.velocity.copy(p.clone().sub(lastDrag).multiplyScalar(1/dt));
  dragged.position.copy(p);
  dragged.mesh.position.copy(p);
  lastDrag.copy(p); lastT = now;
});

window.addEventListener('pointerup', () => { dragged = null; });

/* ---------- MAIN LOOP ---------- */
let prev = performance.now();
function animate() {
  requestAnimationFrame(animate);
  const now = performance.now();
  const dt  = (now - prev)/1000;
  prev = now;

  // physics
  for (let i=0;i<nodes.length;i++) {
    const ni = nodes[i];
    if (ni === dragged) continue;
    const acc = new THREE.Vector3();
    for (let j=i+1;j<nodes.length;j++){
      const nj = nodes[j];
      const dir = nj.position.clone().sub(ni.position);
      const dist2 = Math.max(dir.lengthSq(), 1e-4);
      const force = dir.normalize().multiplyScalar(repK * ni.charge * nj.charge / dist2);
      acc.addScaledVector(force, -1/ni.mass);
      nj.velocity.addScaledVector(force,  1/nj.mass * dt);
    }
    acc.addScaledVector(ni.position, -centerK/ni.mass);
    ni.velocity.addScaledVector(acc, dt);
    ni.velocity.multiplyScalar(drag);
    ni.position.addScaledVector(ni.velocity, dt);
    ni.mesh.position.copy(ni.position);
  }

  // fluid splats
  nodes.forEach(n=>{
    const p = n.position.clone().project(camera);
    if (p.z < -1 || p.z > 1) return;
    const x = (p.x*0.5+0.5), y = (p.y*0.5+0.5);
    const vScreen = n.velocity.clone().project(camera).multiplyScalar(0.5);
    fluid.splat(x, y, vScreen.x, vScreen.y, n.color);
  });

  controls.update();
  renderer.render(scene, camera);
}
animate();

/* ---------- RESIZE ---------- */
window.addEventListener('resize', ()=>{
  camera.aspect = innerWidth/innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth,innerHeight);
});
