import * as THREE from "./node_modules/three/build/three.module.js";
import { OrbitControls } from "./node_modules/three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "./node_modules/three/examples/jsm/loaders/GLTFLoader.js";

const stage = document.getElementById("detailThreeCanvas");
if (!stage) {
  // Not on project detail page.
} else if (window.location.protocol === "file:") {
  stage.innerHTML =
    '<p style="padding:1rem;color:#d6e5f8;">3D cannot load from <code>file://</code>. Open via <code>http://localhost:8000</code>.</p>';
} else {
  const params = new URLSearchParams(window.location.search);
  const existingDefaultModel = "3d_assets/Hitem3d-1776090506237.glb";
  const requestedModel = decodeURIComponent(params.get("model") || "").trim();
  const modelSrc = requestedModel || existingDefaultModel;

  if (!modelSrc) {
    stage.innerHTML = '<p style="padding:1rem;color:#d6e5f8;">No model source was provided.</p>';
  } else {
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
      44,
      stage.clientWidth / stage.clientHeight,
      0.01,
      5000
    );
    camera.position.set(0, 2, 7);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(stage.clientWidth, stage.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.setClearAlpha(0);
    stage.appendChild(renderer.domElement);

    const hemi = new THREE.HemisphereLight(0xffffff, 0x2c3648, 1.2);
    scene.add(hemi);
    const key = new THREE.DirectionalLight(0xffffff, 1.05);
    key.position.set(6, 10, 8);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x7bc6ff, 0.55);
    rim.position.set(-7, 4, -7);
    scene.add(rim);

    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(14, 72),
      new THREE.MeshStandardMaterial({
        color: 0x183148,
        roughness: 0.95,
        metalness: 0.06,
        transparent: true,
        opacity: 0.6,
      })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -1.55;
    scene.add(ground);

    const accentHalo = new THREE.Mesh(
      new THREE.CircleGeometry(10, 72),
      new THREE.MeshBasicMaterial({
        color: 0x59b4e6,
        transparent: true,
        opacity: 0.12,
        depthWrite: false,
      })
    );
    accentHalo.rotation.x = -Math.PI / 2;
    accentHalo.position.y = -1.5;
    scene.add(accentHalo);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.minDistance = 1.2;
    controls.maxDistance = 35;

    const loader = new GLTFLoader();
    const fitModel = (gltf) => {
      const model = gltf.scene;
      scene.add(model);

      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      const maxAxis = Math.max(size.x, size.y, size.z) || 1;
      const target = 5.2;
      const scale = target / maxAxis;

      model.scale.setScalar(scale);
      model.position.set(-center.x * scale, -center.y * scale - 0.55, -center.z * scale);

      const fit = size.clone().multiplyScalar(scale);
      const dist = Math.max(fit.x, fit.y, fit.z) * 1.35 + 2.4;
      camera.position.set(dist * 0.7, dist * 0.58, dist);
      controls.target.set(0, 0.35, 0);
      controls.update();
    };

    const showLoadError = (error, attemptedPath) => {
      stage.innerHTML =
        `<p style="padding:1rem;color:#d6e5f8;">Failed to load model from <code>${attemptedPath}</code>: ${String(error?.message || error)}</p>`;
    };

    const loadModel = (path, fallbackPath) => {
      loader.load(
        path,
        fitModel,
        undefined,
        (error) => {
          if (fallbackPath && fallbackPath !== path) {
            loadModel(fallbackPath);
            return;
          }
          showLoadError(error, path);
        }
      );
    };

    loadModel(modelSrc, modelSrc !== existingDefaultModel ? existingDefaultModel : undefined);

    const animate = () => {
      controls.update();
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };
    animate();

    window.addEventListener("resize", () => {
      const w = stage.clientWidth;
      const h = stage.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
  }
}
