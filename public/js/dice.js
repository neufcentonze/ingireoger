import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js';

const canvas = document.getElementById('diceCanvas');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setSize(canvas.clientWidth, canvas.clientHeight);
renderer.setPixelRatio(window.devicePixelRatio);

camera.position.set(4, 4, 4); // ✅ Vue centrée
camera.lookAt(0, 0, 0);

const loader = new THREE.TextureLoader();
const textures = [
    loader.load('/images/dice-3.png'), // +X
    loader.load('/images/dice-4.png'), // -X
    loader.load('/images/dice-1.png'), // +Y
    loader.load('/images/dice-6.png'), // -Y
    loader.load('/images/dice-2.png'), // +Z
    loader.load('/images/dice-5.png')  // -Z
];

const materials = textures.map(tex => new THREE.MeshBasicMaterial({ map: tex }));
const cube = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), materials);
scene.add(cube);

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
animate();

export function animateDiceWithSpin(targetFace) {
    const faceRotations = {
        1: new THREE.Euler(0, 0, 0),
        2: new THREE.Euler(-Math.PI / 2, 0, 0),
        3: new THREE.Euler(0, 0, Math.PI / 2),
        4: new THREE.Euler(0, 0, -Math.PI / 2),
        5: new THREE.Euler(Math.PI / 2, 0, 0),
        6: new THREE.Euler(Math.PI, 0, 0)
    };

    const finalRotation = faceRotations[targetFace];
    if (!finalRotation) return;

    let elapsed = 0;
    const duration = 1.6;
    const clock = new THREE.Clock();

    const startRotation = new THREE.Euler(
        Math.random() * 4 * Math.PI,
        Math.random() * 4 * Math.PI,
        Math.random() * 4 * Math.PI
    );

    function spin() {
        const delta = clock.getDelta();
        elapsed += delta;
        const t = Math.min(elapsed / duration, 1);
        const easeOut = 1 - Math.pow(1 - t, 3);

        cube.rotation.x = THREE.MathUtils.lerp(startRotation.x, finalRotation.x, easeOut);
        cube.rotation.y = THREE.MathUtils.lerp(startRotation.y, finalRotation.y, easeOut);
        cube.rotation.z = THREE.MathUtils.lerp(startRotation.z, finalRotation.z, easeOut);

        if (t < 1) requestAnimationFrame(spin);
    }

    spin();
}
