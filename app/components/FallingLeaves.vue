<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";

type ElementShape =
  | "snowflake"
  | "snowflake2"
  | "leaf-frost"
  | "leaf-simple"
  | "leaf-pointy"
  | "leaf-round"
  | "ice-crystal"
  | "simple-snow";

interface FallingElement {
  id: number;
  x: number;
  y: number;
  size: number;
  rotation: number;
  rotationSpeed: number;
  speedX: number;
  speedY: number;
  opacity: number;
  color: string;
  swayPhase: number;
  swaySpeed: number;
  shape: ElementShape;
}

const canvasRef = ref<HTMLCanvasElement | null>(null);
const elements = ref<FallingElement[]>([]);
const animationId = ref<number | null>(null);

let elementIdCounter = 0;

// Couleurs hivernales
const COLORS = [
  // Blancs et gris clairs (flocons)
  "#ffffff",
  "#f5f5f5",
  "#e8e8e8",
  "#d4e5f7",
  "#e3f2fd",
  // Bleus glacés
  "#b3e5fc",
  "#81d4fa",
  "#4fc3f7",
  "#a5d6f7",
  "#c5e8f7",
  // Bleu-gris givrés
  "#b0bec5",
  "#90a4ae",
  "#cfd8dc",
  // Très peu de vert hivernal (conifères)
  "#2e7d32",
  "#388e3c",
];

function createFallingElement(
  x?: number,
  y?: number,
  burst = false,
): FallingElement {
  const canvas = canvasRef.value;
  if (!canvas) return {} as FallingElement;

  // Beaucoup moins de flocons que de feuilles
  const isSnow = Math.random() < 0.2;
  const snowShapes: ElementShape[] = [
    "snowflake",
    "snowflake2",
    "simple-snow",
    "ice-crystal",
  ];
  const leafShapes: ElementShape[] = [
    "leaf-frost",
    "leaf-simple",
    "leaf-pointy",
    "leaf-round",
  ];

  return {
    id: elementIdCounter++,
    x: x ?? Math.random() * canvas.width,
    y: y ?? (burst ? 0 : -50 - Math.random() * 150),
    size: isSnow ? 6 + Math.random() * 14 : 12 + Math.random() * 18,
    rotation: Math.random() * 360,
    rotationSpeed: (Math.random() - 0.5) * 2,
    speedX: burst ? (Math.random() - 0.5) * 3 : (Math.random() - 0.5) * 0.5,
    speedY: burst ? Math.random() * 2 + 1 : 0.5 + Math.random() * 0.8,
    opacity: isSnow ? 0.7 + Math.random() * 0.3 : 0.5 + Math.random() * 0.3,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    swayPhase: Math.random() * Math.PI * 2,
    swaySpeed: 0.01 + Math.random() * 0.02,
    shape: isSnow
      ? snowShapes[Math.floor(Math.random() * snowShapes.length)]
      : leafShapes[Math.floor(Math.random() * leafShapes.length)],
  };
}

function initElements() {
  const canvas = canvasRef.value;
  if (!canvas) return;

  const initialElements: FallingElement[] = [];
  for (let i = 0; i < 8; i++) {
    const element = createFallingElement();
    element.y = Math.random() * canvas.height;
    initialElements.push(element);
  }
  elements.value = initialElements;
}

// Flocon classique à 6 branches
function drawSnowflake(ctx: CanvasRenderingContext2D, s: number) {
  const branches = 6;
  for (let i = 0; i < branches; i++) {
    ctx.save();
    ctx.rotate((i * Math.PI * 2) / branches);

    // Branche principale
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -s);
    ctx.stroke();

    // Petites branches
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.4);
    ctx.lineTo(-s * 0.25, -s * 0.6);
    ctx.moveTo(0, -s * 0.4);
    ctx.lineTo(s * 0.25, -s * 0.6);
    ctx.moveTo(0, -s * 0.7);
    ctx.lineTo(-s * 0.15, -s * 0.85);
    ctx.moveTo(0, -s * 0.7);
    ctx.lineTo(s * 0.15, -s * 0.85);
    ctx.stroke();

    ctx.restore();
  }
}

// Flocon étoilé
function drawSnowflake2(ctx: CanvasRenderingContext2D, s: number) {
  const points = 6;
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const radius = i % 2 === 0 ? s : s * 0.4;
    const angle = (i * Math.PI) / points - Math.PI / 2;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();

  // Centre
  ctx.beginPath();
  ctx.arc(0, 0, s * 0.15, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,255,0.8)";
  ctx.fill();
}

// Flocon simple (point avec halo)
function drawSimpleSnow(ctx: CanvasRenderingContext2D, s: number) {
  // Halo
  const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, s);
  gradient.addColorStop(0, "rgba(255,255,255,0.9)");
  gradient.addColorStop(0.5, "rgba(255,255,255,0.4)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(0, 0, s, 0, Math.PI * 2);
  ctx.fill();
}

// Cristal de glace
function drawIceCrystal(ctx: CanvasRenderingContext2D, s: number) {
  ctx.beginPath();
  // Hexagone
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3 - Math.PI / 2;
    const x = Math.cos(angle) * s * 0.7;
    const y = Math.sin(angle) * s * 0.7;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();

  // Lignes internes
  ctx.strokeStyle = "rgba(255,255,255,0.5)";
  ctx.lineWidth = 1;
  for (let i = 0; i < 3; i++) {
    const angle = (i * Math.PI) / 3;
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle) * s * 0.7, Math.sin(angle) * s * 0.7);
    ctx.lineTo(
      Math.cos(angle + Math.PI) * s * 0.7,
      Math.sin(angle + Math.PI) * s * 0.7,
    );
    ctx.stroke();
  }
}

// Feuille givrée (feuille avec effet frost)
function drawFrostLeaf(ctx: CanvasRenderingContext2D, s: number) {
  ctx.beginPath();
  ctx.moveTo(0, -s);
  ctx.bezierCurveTo(s * 0.5, -s * 0.7, s * 0.6, -s * 0.3, s * 0.3, 0);
  ctx.bezierCurveTo(s * 0.5, s * 0.4, s * 0.3, s * 0.7, 0, s * 0.5);
  ctx.bezierCurveTo(-s * 0.3, s * 0.7, -s * 0.5, s * 0.4, -s * 0.3, 0);
  ctx.bezierCurveTo(-s * 0.6, -s * 0.3, -s * 0.5, -s * 0.7, 0, -s);
  ctx.fill();

  // Nervures givrées
  ctx.strokeStyle = "rgba(255,255,255,0.4)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, -s * 0.8);
  ctx.lineTo(0, s * 0.4);
  ctx.moveTo(0, -s * 0.3);
  ctx.lineTo(s * 0.2, -s * 0.5);
  ctx.moveTo(0, -s * 0.3);
  ctx.lineTo(-s * 0.2, -s * 0.5);
  ctx.stroke();
}

// Feuille simple givrée
function drawSimpleFrostLeaf(ctx: CanvasRenderingContext2D, s: number) {
  ctx.beginPath();
  ctx.moveTo(0, -s);
  ctx.lineTo(s * 0.4, -s * 0.3);
  ctx.lineTo(s * 0.3, s * 0.5);
  ctx.lineTo(0, s * 0.6);
  ctx.lineTo(-s * 0.3, s * 0.5);
  ctx.lineTo(-s * 0.4, -s * 0.3);
  ctx.closePath();
  ctx.fill();

  // Nervure centrale
  ctx.strokeStyle = "rgba(255,255,255,0.4)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, -s);
  ctx.lineTo(0, s * 0.6);
  ctx.stroke();
}

// Feuille pointue
function drawPointyLeaf(ctx: CanvasRenderingContext2D, s: number) {
  // Feuille d'érable à 5 lobes
  ctx.beginPath();

  // Lobe central (haut)
  ctx.moveTo(0, -s);
  ctx.bezierCurveTo(s * 0.15, -s * 0.7, s * 0.2, -s * 0.3, s * 0.1, 0);

  // Lobe haut droit
  ctx.bezierCurveTo(s * 0.3, -s * 0.5, s * 0.5, -s * 0.4, s * 0.55, -s * 0.1);

  // Lobe bas droit
  ctx.bezierCurveTo(s * 0.6, s * 0.1, s * 0.45, s * 0.4, s * 0.25, s * 0.4);

  // Lobe bas gauche
  ctx.bezierCurveTo(s * 0.2, s * 0.5, -s * 0.2, s * 0.5, -s * 0.25, s * 0.4);

  // Lobe haut gauche
  ctx.bezierCurveTo(-s * 0.45, s * 0.4, -s * 0.6, s * 0.1, -s * 0.55, -s * 0.1);

  // Retour au centre
  ctx.bezierCurveTo(-s * 0.5, -s * 0.4, -s * 0.3, -s * 0.5, -s * 0.1, 0);

  ctx.closePath();
  ctx.fill();

  // Nervures d'érable (nervures principales)
  ctx.strokeStyle = "rgba(255,255,255,0.3)";
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  // Nervure centrale
  ctx.moveTo(0, 0);
  ctx.lineTo(0, s * 0.5);
  // Nervures latérales
  ctx.moveTo(0, 0);
  ctx.lineTo(s * 0.4, -s * 0.3);
  ctx.moveTo(0, 0);
  ctx.lineTo(s * 0.5, s * 0.1);
  ctx.moveTo(0, 0);
  ctx.lineTo(-s * 0.4, -s * 0.3);
  ctx.moveTo(0, 0);
  ctx.lineTo(-s * 0.5, s * 0.1);
  ctx.stroke();
}

// Feuille arrondie
function drawRoundFrostLeaf(ctx: CanvasRenderingContext2D, s: number) {
  ctx.beginPath();
  ctx.moveTo(0, -s);
  ctx.bezierCurveTo(s * 0.3, -s * 0.7, s * 0.4, -s * 0.2, s * 0.35, s * 0.3);
  ctx.bezierCurveTo(s * 0.3, s * 0.6, s * 0.1, s * 0.7, 0, s * 0.5);
  ctx.bezierCurveTo(-s * 0.1, s * 0.7, -s * 0.3, s * 0.6, -s * 0.35, s * 0.3);
  ctx.bezierCurveTo(-s * 0.4, -s * 0.2, -s * 0.3, -s * 0.7, 0, -s);
  ctx.fill();

  // Nervures givrées légères
  ctx.strokeStyle = "rgba(255,255,255,0.25)";
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(0, -s * 0.8);
  ctx.lineTo(0, s * 0.3);
  ctx.stroke();
}

function drawElement(ctx: CanvasRenderingContext2D, element: FallingElement) {
  ctx.save();

  ctx.translate(element.x, element.y);
  ctx.rotate((element.rotation * Math.PI) / 180);
  ctx.globalAlpha = element.opacity;
  ctx.fillStyle = element.color;
  ctx.strokeStyle = element.color;
  ctx.lineWidth = 1.5;

  const s = element.size;

  // Ajouter un léger glow pour les feuilles (pas les flocons purs)
  if (!element.shape.includes("snowflake") && element.shape !== "simple-snow") {
    ctx.shadowColor = element.color;
    ctx.shadowBlur = s * 0.25;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  }

  switch (element.shape) {
    case "snowflake":
      drawSnowflake(ctx, s);
      break;
    case "snowflake2":
      drawSnowflake2(ctx, s);
      break;
    case "simple-snow":
      drawSimpleSnow(ctx, s);
      break;
    case "ice-crystal":
      drawIceCrystal(ctx, s);
      break;
    case "leaf-frost":
      drawFrostLeaf(ctx, s);
      break;
    case "leaf-simple":
      drawSimpleFrostLeaf(ctx, s);
      break;
    case "leaf-pointy":
      drawPointyLeaf(ctx, s);
      break;
    case "leaf-round":
      drawRoundFrostLeaf(ctx, s);
      break;
  }

  ctx.restore();
}

function updateElements() {
  const canvas = canvasRef.value;
  if (!canvas) return;

  elements.value = elements.value
    .map((el) => {
      el.swayPhase += el.swaySpeed;
      const sway = Math.sin(el.swayPhase) * 1.5;

      el.x += el.speedX + sway;
      el.y += el.speedY;
      el.rotation += el.rotationSpeed;
      el.speedX *= 0.995;

      return el;
    })
    .filter((el) => {
      return (
        el.y < canvas.height + 50 && el.x > -50 && el.x < canvas.width + 50
      );
    });

  // Ajouter de nouveaux éléments en continu (moins pour la fluidité)
  const targetCount = 15;
  const spawnRate = 0.08;

  if (elements.value.length < targetCount && Math.random() < spawnRate) {
    elements.value.push(createFallingElement());
  }

  // S'assurer qu'il y a toujours quelques éléments
  if (elements.value.length < 5) {
    elements.value.push(createFallingElement());
  }
}

function render() {
  const canvas = canvasRef.value;
  const ctx = canvas?.getContext("2d");
  if (!canvas || !ctx) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (const element of elements.value) {
    drawElement(ctx, element);
  }

  updateElements();
  animationId.value = requestAnimationFrame(render);
}

function handleResize() {
  const canvas = canvasRef.value;
  if (!canvas) return;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function handleClick(e: MouseEvent) {
  const burstCount = 5 + Math.floor(Math.random() * 4);
  for (let i = 0; i < burstCount; i++) {
    const element = createFallingElement(e.clientX, e.clientY, true);
    const angle = (i / burstCount) * Math.PI * 2 + Math.random() * 0.5;
    const speed = 1.5 + Math.random() * 2.5;
    element.speedX = Math.cos(angle) * speed * 0.6;
    element.speedY = Math.sin(angle) * speed + 1;
    elements.value.push(element);
  }
}

onMounted(() => {
  handleResize();
  window.addEventListener("resize", handleResize);
  window.addEventListener("click", handleClick);
  initElements();
  render();
});

onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
  window.removeEventListener("click", handleClick);
  if (animationId.value) {
    cancelAnimationFrame(animationId.value);
  }
});
</script>

<template>
  <canvas ref="canvasRef" class="falling-snow-canvas" />
</template>

<style scoped>
.falling-snow-canvas {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}
</style>
