import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.165.0/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.165.0/examples/jsm/controls/OrbitControls.js';

const canvas = document.querySelector('#church');
const status = document.querySelector('#status');
const zoomSection = document.querySelector('#acercamiento');

function showError(error) {
  console.error('Error al cargar la parroquia:', error);
  status.textContent = 'No se pudo cargar el modelo. Revisá la consola (F12).';
  status.style.color = '#9b352b';
}

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const smoothstep = (value) => {
  const t = clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
};

try {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    38, window.innerWidth / window.innerHeight, 0.1, 500
  );

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  renderer.shadowMap.enabled = true;

  scene.add(new THREE.HemisphereLight(0xfff3df, 0x76614a, 2.1));

  const sun = new THREE.DirectionalLight(0xffe4b8, 3.0);
  sun.position.set(-8, 14, 10);
  sun.castShadow = true;
  scene.add(sun);

  const fill = new THREE.DirectionalLight(0xffffff, 1.3);
  fill.position.set(8, 7, -9);
  scene.add(fill);

  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(30, 64),
    new THREE.MeshStandardMaterial({ color: 0xd9cbb5, roughness: 1 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.03;
  ground.receiveShadow = true;
  scene.add(ground);

  const controls = new OrbitControls(camera, canvas);
  // Permite que el gesto vertical siga desplazando la página en celulares;
  // los arrastres horizontales sobre el modelo siguen rotándolo.
  canvas.style.touchAction = 'pan-y';
  controls.enableDamping = true;
  controls.dampingFactor = 0.07;
  controls.enablePan = false;
  controls.enableRotate = true;
  controls.enableZoom = true;
  controls.minDistance = 3;
  controls.maxDistance = 15;
  controls.minPolarAngle = 0.18;
  controls.maxPolarAngle = Math.PI * 0.49;
  controls.rotateSpeed = 0.72;
  controls.zoomSpeed = 0.8;
  controls.target.set(0, 1.1, 0);

  // Un gesto manual toma el control. El próximo desplazamiento de página
  // devuelve suavemente la cámara al recorrido narrativo.
  let manualCamera = false;
  controls.addEventListener('start', () => {
    manualCamera = true;
  });

  let modelLoaded = false;
  let cameraStart = new THREE.Vector3(8.5, 4.5, 10.5);
  let cameraFront = new THREE.Vector3(0, 3.0, 6.8);
  let focusTarget = new THREE.Vector3(0, 1.35, 0);
  let startTarget = new THREE.Vector3(0, 1.35, 0);

  function getScrollCamera() {
    if (!zoomSection) {
      return { position: cameraStart, target: startTarget };
    }

    const sectionTop = zoomSection.offsetTop;
    const sectionHeight = zoomSection.offsetHeight;
    const viewportFocus = window.scrollY + window.innerHeight * 0.56;

    // La cámara se acerca al entrar en la sección y termina mirando de frente
    // cuando el título "Una historia que nos reúne" ocupa el centro visual.
    const progress = clamp(
      (viewportFocus - sectionTop) / Math.max(1, sectionHeight * 0.58),
      0,
      1
    );
    const eased = smoothstep(progress);

    return {
      position: new THREE.Vector3().lerpVectors(cameraStart, cameraFront, eased),
      target: new THREE.Vector3().lerpVectors(startTarget, focusTarget, eased)
    };
  }

  window.addEventListener('scroll', () => {
    if (manualCamera) manualCamera = false;
  }, { passive: true });

  const loader = new GLTFLoader();

  loader.load(
    './public/modelo-parroquia.glb',
    (gltf) => {
      const model = gltf.scene;
      const bounds = new THREE.Box3().setFromObject(model);
      const size = bounds.getSize(new THREE.Vector3());
      const center = bounds.getCenter(new THREE.Vector3());

      // Conservamos el modelo original y lo centramos sin modificar el GLB.
      const largestDimension = Math.max(size.x, size.y, size.z) || 1;
      const scale = 10 / largestDimension;
      model.scale.setScalar(scale);
      model.position.set(
        -center.x * scale,
        -bounds.min.y * scale,
        -center.z * scale
      );

      model.traverse((object) => {
        if (!object.isMesh) return;
        object.castShadow = true;
        object.receiveShadow = true;

        if (object.material) {
          const materials = Array.isArray(object.material)
            ? object.material
            : [object.material];
          materials.forEach((material) => {
            material.side = THREE.DoubleSide;
          });
        }
      });

      scene.add(model);
      modelLoaded = true;

      const scaledSize = size.clone().multiplyScalar(scale);
      const modelHeight = scaledSize.y;
      const modelWidth = scaledSize.x;

      // En el GLB, la fachada principal está orientada hacia +Z.
      // Por eso la cámara frontal se coloca sobre ese eje.
      focusTarget.set(0, Math.max(1.0, modelHeight * 0.47), 0);
      startTarget.copy(focusTarget);
      cameraStart.set(
        Math.max(5.5, modelWidth * 0.72),
        focusTarget.y + Math.max(2.0, modelHeight * 0.65),
        Math.max(7.5, modelWidth * 0.85)
      );

      // Vista frontal, centrada y con espacio suficiente para ver la torre.
      const frontDistance = Math.max(5.8, modelHeight * 1.95);
      cameraFront.set(
        0,
        focusTarget.y + modelHeight * 0.18,
        frontDistance
      );

      camera.position.copy(cameraStart);
      controls.target.copy(startTarget);
      controls.update();

      status.textContent = 'Parroquia cargada · arrastrá para explorar';
      window.setTimeout(() => {
        if (status.isConnected) status.remove();
      }, 4200);
    },
    (event) => {
      if (event.total) {
        const percent = Math.round((event.loaded / event.total) * 100);
        status.textContent = `Cargando la parroquia en 3D… ${percent}%`;
      }
    },
    showError
  );

  function render() {
    requestAnimationFrame(render);

    if (modelLoaded && !manualCamera) {
      const desired = getScrollCamera();
      // Interpolación amortiguada para evitar saltos al desplazarse.
      camera.position.lerp(desired.position, 0.055);
      controls.target.lerp(desired.target, 0.055);
    }

    controls.update();
    renderer.render(scene, camera);
  }

  render();

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

} catch (error) {
  showError(error);
}
