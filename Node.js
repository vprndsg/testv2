import * as THREE from 'three';

export default class Node {
  constructor() {
    const hue = Math.random() * 360;
    this.color = new THREE.Color(`hsl(${hue}deg 80% 60%)`);
    this.mass   = THREE.MathUtils.randFloat(1, 4);
    this.charge = THREE.MathUtils.randFloat(1, 4);

    this.position = new THREE.Vector3(
      THREE.MathUtils.randFloatSpread(40),
      THREE.MathUtils.randFloatSpread(40),
      THREE.MathUtils.randFloatSpread(40)
    );
    this.velocity = new THREE.Vector3(
      THREE.MathUtils.randFloatSpread(10),
      THREE.MathUtils.randFloatSpread(10),
      THREE.MathUtils.randFloatSpread(10)
    );

    const geo = new THREE.SphereGeometry(0.6, 16, 16);
    const mat = new THREE.MeshStandardMaterial({ color: this.color });
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.userData.node = this;
    this.mesh.position.copy(this.position);
  }
}
