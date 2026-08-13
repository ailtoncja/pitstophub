import { useEffect, useMemo, useRef, useState } from 'react';

const WORDMARK = 'PITSTOPHUB';
const HUB_START = 7;
const LINE_COUNT = 14;
// Segundos ate a intro se fechar sozinha (a marca ja terminou de entrar por volta de 3.2s;
// o resto e so um respiro na pose "hero" do carro antes do fade).
const AUTO_FINISH_AT = 4.4;
const FADE_MS = 720;

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const clamp01 = (t: number) => Math.max(0, Math.min(1, t));
const seg = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));

interface PitstopIntroProps {
  onDone: (disableForever: boolean) => void;
}

export default function PitstopIntro({ onDone }: PitstopIntroProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const linesWrapRef = useRef<HTMLDivElement | null>(null);
  const lineRefs = useRef<Array<HTMLDivElement | null>>([]);
  const letterRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const ruleRef = useRef<HTMLDivElement | null>(null);
  const tagRef = useRef<HTMLDivElement | null>(null);
  const controlsRef = useRef<HTMLDivElement | null>(null);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  const finishRef = useRef<(() => void) | null>(null);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const dontShowAgainRef = useRef(dontShowAgain);
  dontShowAgainRef.current = dontShowAgain;

  const lineMeta = useMemo(
    () =>
      Array.from({ length: LINE_COUNT }, () => ({
        top: `${4 + Math.random() * 92}%`,
        width: `${12 + Math.random() * 28}%`,
        opacityBase: 0.25 + Math.random() * 0.75,
      })),
    []
  );

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return;

    // Quem pede menos movimento nao deveria levar 4s+ de carro em 3D girando na cara --
    // pula direto pro app.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      onDoneRef.current(dontShowAgainRef.current);
      return;
    }

    let disposed = false;
    let raf = 0;
    let done = false;

    const finish = () => {
      if (done) return;
      done = true;
      root.style.transition = `opacity ${FADE_MS}ms ease`;
      root.style.opacity = '0';
      root.style.pointerEvents = 'none';
      window.setTimeout(() => onDoneRef.current(dontShowAgainRef.current), FADE_MS);
    };
    finishRef.current = finish;

    let teardownScene = () => {};

    void (async () => {
      const THREE = await import('three');
      const { buildCar } = await import('./buildCar');
      if (disposed) return;

      const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFShadowMap;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.15;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x08090b);
      scene.fog = new THREE.Fog(0x08090b, 12, 30);
      const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);

      scene.add(new THREE.HemisphereLight(0x556070, 0x090a0c, 0.55));
      const key = new THREE.DirectionalLight(0xffffff, 2.6);
      key.position.set(4, 6, 5);
      key.castShadow = true;
      key.shadow.mapSize.set(2048, 2048);
      const shadowCam = key.shadow.camera;
      shadowCam.left = -6;
      shadowCam.right = 6;
      shadowCam.top = 6;
      shadowCam.bottom = -6;
      shadowCam.far = 25;
      scene.add(key);
      const rimR = new THREE.DirectionalLight(0xff2b3f, 3.2);
      rimR.position.set(-6, 2.2, -4);
      scene.add(rimR);
      const rimB = new THREE.DirectionalLight(0x5b8bff, 1.6);
      rimB.position.set(6, 1.6, -5);
      scene.add(rimB);
      const fillLight = new THREE.PointLight(0xffffff, 18, 14);
      fillLight.position.set(1.5, 2.4, 4);
      scene.add(fillLight);

      const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(80, 80),
        new THREE.MeshStandardMaterial({ color: 0x101216, roughness: 0.55, metalness: 0.1 })
      );
      ground.rotation.x = -Math.PI / 2;
      ground.receiveShadow = true;
      scene.add(ground);

      const car = buildCar();
      const pivot = new THREE.Group();
      pivot.add(car);
      scene.add(pivot);
      const wheels = car.children.filter((o) => o.name.startsWith('wheel_'));

      const resize = () => {
        const w = root.clientWidth || window.innerWidth;
        const h = root.clientHeight || window.innerHeight;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      };
      window.addEventListener('resize', resize);
      resize();

      const t0 = performance.now();
      let autoFinished = false;

      const tick = () => {
        raf = requestAnimationFrame(tick);
        const t = (performance.now() - t0) / 1000;

        // carro entra deslizando pela direita e se acomoda numa pose 3/4 "hero"
        const sweep = easeOut(seg(t, 0.15, 2.1));
        pivot.position.x = 16 * (1 - sweep);
        pivot.position.z = -3.2 * (1 - sweep);
        pivot.rotation.y = -0.3 - 0.55 * (1 - sweep) + 0.09 * Math.sin(seg(t, 1.6, 3.4) * Math.PI);
        pivot.position.y = 0.05 * Math.sin(t * 3.4) * (1 - sweep);

        const speed = 34 * (1 - easeOut(seg(t, 0.15, 2.6))) + 1.6;
        wheels.forEach((w) => {
          w.rotation.x -= speed * 0.016;
        });

        // camera: passagem baixa e rapida -> plano 3/4 elevado
        const camT = easeInOut(seg(t, 0.2, 3.0));
        const ang = -0.95 + 0.75 * camT;
        const dist = 11.5 - 4.2 * camT;
        camera.position.set(Math.sin(ang) * dist, 0.75 + 1.55 * camT, Math.cos(ang) * dist);
        camera.lookAt(0, 0.62 + 0.05 * camT, -0.1);

        // linhas de velocidade
        const lp = seg(t, 0, 1.9);
        if (linesWrapRef.current) {
          linesWrapRef.current.style.opacity = String(Math.sin(clamp01(lp) * Math.PI) * 0.8);
        }
        lineRefs.current.forEach((lineEl, i) => {
          if (!lineEl) return;
          const off = (lp * 1.9 + i * 0.11) % 1.4;
          lineEl.style.transform = `translateX(${off * 165}vw)`;
        });

        // wordmark
        letterRefs.current.forEach((letterEl, i) => {
          if (!letterEl) return;
          const p = easeOut(seg(t, 1.35 + i * 0.055, 1.95 + i * 0.055));
          letterEl.style.transform = `translateY(${(1 - p) * 110}%)`;
        });
        if (ruleRef.current) ruleRef.current.style.width = `${easeInOut(seg(t, 2.15, 2.85)) * 340}px`;
        if (tagRef.current) tagRef.current.style.opacity = String(seg(t, 2.5, 3.2));
        if (controlsRef.current) controlsRef.current.style.opacity = String(seg(t, 2.5, 3.2));

        // segura o quadro final com orbita leve + rodas girando em marcha lenta
        if (t > 3.2) {
          const h = t - 3.2;
          pivot.rotation.y = -0.3 + 0.16 * Math.sin(h * 0.35);
          pivot.position.y = 0.012 * Math.sin(h * 1.1);
        }

        if (!autoFinished && t > AUTO_FINISH_AT) {
          autoFinished = true;
          finish();
        }

        renderer.render(scene, camera);
      };
      tick();

      teardownScene = () => {
        window.removeEventListener('resize', resize);
        scene.traverse((obj) => {
          const asMesh = obj as THREE.Mesh;
          if (asMesh.geometry) asMesh.geometry.dispose();
          const mat = asMesh.material;
          if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
          else mat?.dispose();
        });
        renderer.dispose();
      };
    })();

    return () => {
      disposed = true;
      finishRef.current = null;
      cancelAnimationFrame(raf);
      teardownScene();
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') finishRef.current?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div ref={rootRef} className="pitstop-intro">
      <canvas ref={canvasRef} className="pitstop-intro-canvas" />
      <div ref={linesWrapRef} className="pitstop-intro-lines">
        {lineMeta.map((line, i) => (
          <div
            key={i}
            ref={(el) => {
              lineRefs.current[i] = el;
            }}
            className="pitstop-intro-line"
            style={{ top: line.top, width: line.width, opacity: line.opacityBase }}
          />
        ))}
      </div>
      <div className="pitstop-intro-glow" />
      <div className="pitstop-intro-ui">
        <div className="pitstop-intro-mark">
          {WORDMARK.split('').map((ch, i) => (
            <span
              key={i}
              ref={(el) => {
                letterRefs.current[i] = el;
              }}
              className={i >= HUB_START ? 'pitstop-intro-hub' : ''}
            >
              {ch}
            </span>
          ))}
        </div>
        <div ref={ruleRef} className="pitstop-intro-rule" />
        <div ref={tagRef} className="pitstop-intro-tag">
          Tudo sobre automobilismo
        </div>
      </div>
      <div ref={controlsRef} className="pitstop-intro-controls">
        <label className="pitstop-intro-remember">
          <input
            type="checkbox"
            checked={dontShowAgain}
            onChange={(e) => setDontShowAgain(e.target.checked)}
          />
          Não mostrar novamente
        </label>
        <button type="button" onClick={() => finishRef.current?.()} className="pitstop-intro-skip">
          Pular
        </button>
      </div>
    </div>
  );
}
