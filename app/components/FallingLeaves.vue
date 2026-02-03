<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";

type LeafShape = "maple" | "oak" | "simple" | "round" | "long";

interface Leaf {
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
  shape: LeafShape;
}

const canvasRef = ref<HTMLCanvasElement | null>(null);
const leaves = ref<Leaf[]>([]);
const animationId = ref<number | null>(null);

let leafIdCounter = 0;

// Couleurs naturelles automne
const COLORS = [
  // Verts
  "#6ec977",
  "#8ed591",
  "#5fa769",
  "#a8e6ae",
  "#81c784",
  "#66bb6a",
  // Jaunes
  "#ffd54f",
  "#ffcc80",
  "#ffe082",
  "#fff176",
  "#dce775",
  // Oranges
  "#ffb74d",
  "#ff8a65",
  "#ffa726",
  "#fb8c00",
  // Rouges doux
  "#e57373",
  "#ef5350",
  "#ff7043",
  "#d4574a",
  // Marrons
  "#8d6e63",
  "#a1887f",
  "#795548",
  "#6d4c41",
  "#bcaaa4",
];

const SHAPES: LeafShape[] = ["maple", "oak", "simple", "round", "long"];

function createLeaf(x?: number, y?: number, burst = false): Leaf {
  const canvas = canvasRef.value;
  if (!canvas) return {} as Leaf;

  return {
    id: leafIdCounter++,
    x: x ?? Math.random() * canvas.width,
    y: y ?? (burst ? 0 : -50 - Math.random() * 150),
    size: 10 + Math.random() * 20,
    rotation: Math.random() * 360,
    rotationSpeed: (Math.random() - 0.5) * 3,
    speedX: burst ? (Math.random() - 0.5) * 6 : (Math.random() - 0.5) * 1,
    speedY: burst ? Math.random() * 2 + 0.8 : 0.4 + Math.random() * 0.8,
    opacity: 0.6 + Math.random() * 0.35,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    swayPhase: Math.random() * Math.PI * 2,
    swaySpeed: 0.015 + Math.random() * 0.025,
    shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
  };
}

function initLeaves() {
  const canvas = canvasRef.value;
  if (!canvas) return;

  // Créer beaucoup de feuilles initiales réparties sur tout l'écran
  const initialLeaves: Leaf[] = [];
  for (let i = 0; i < 60; i++) {
    const leaf = createLeaf();
    leaf.y = Math.random() * canvas.height;
    initialLeaves.push(leaf);
  }
  leaves.value = initialLeaves;
}

// Dessiner une feuille d'érable
function drawMapleLeaf(ctx: CanvasRenderingContext2D, s: number) {
  ctx.beginPath();
  ctx.moveTo(0, -s);
  // Pointe gauche haute
  ctx.lineTo(-s * 0.3, -s * 0.6);
  ctx.lineTo(-s * 0.7, -s * 0.5);
  ctx.lineTo(-s * 0.4, -s * 0.3);
  // Pointe gauche basse
  ctx.lineTo(-s * 0.8, 0);
  ctx.lineTo(-s * 0.3, -s * 0.1);
  ctx.lineTo(-s * 0.4, s * 0.3);
  ctx.lineTo(-s * 0.15, s * 0.2);
  // Tige
  ctx.lineTo(0, s * 0.6);
  // Côté droit (symétrique)
  ctx.lineTo(s * 0.15, s * 0.2);
  ctx.lineTo(s * 0.4, s * 0.3);
  ctx.lineTo(s * 0.3, -s * 0.1);
  ctx.lineTo(s * 0.8, 0);
  ctx.lineTo(s * 0.4, -s * 0.3);
  ctx.lineTo(s * 0.7, -s * 0.5);
  ctx.lineTo(s * 0.3, -s * 0.6);
  ctx.closePath();
  ctx.fill();
}

// Dessiner une feuille de chêne
function drawOakLeaf(ctx: CanvasRenderingContext2D, s: number) {
  ctx.beginPath();
  ctx.moveTo(0, -s);
  // Lobes ondulés
  ctx.quadraticCurveTo(-s * 0.2, -s * 0.8, -s * 0.5, -s * 0.7);
  ctx.quadraticCurveTo(-s * 0.3, -s * 0.5, -s * 0.6, -s * 0.3);
  ctx.quadraticCurveTo(-s * 0.3, -s * 0.1, -s * 0.5, s * 0.1);
  ctx.quadraticCurveTo(-s * 0.2, s * 0.2, -s * 0.4, s * 0.4);
  ctx.quadraticCurveTo(-s * 0.15, s * 0.5, 0, s * 0.7);
  // Côté droit
  ctx.quadraticCurveTo(s * 0.15, s * 0.5, s * 0.4, s * 0.4);
  ctx.quadraticCurveTo(s * 0.2, s * 0.2, s * 0.5, s * 0.1);
  ctx.quadraticCurveTo(s * 0.3, -s * 0.1, s * 0.6, -s * 0.3);
  ctx.quadraticCurveTo(s * 0.3, -s * 0.5, s * 0.5, -s * 0.7);
  ctx.quadraticCurveTo(s * 0.2, -s * 0.8, 0, -s);
  ctx.closePath();
  ctx.fill();
}

// Feuille simple ovale
function drawSimpleLeaf(ctx: CanvasRenderingContext2D, s: number) {
  ctx.beginPath();
  ctx.moveTo(0, -s);
  ctx.bezierCurveTo(s * 0.5, -s * 0.7, s * 0.6, -s * 0.3, s * 0.3, 0);
  ctx.bezierCurveTo(s * 0.5, s * 0.4, s * 0.3, s * 0.7, 0, s * 0.5);
  ctx.bezierCurveTo(-s * 0.3, s * 0.7, -s * 0.5, s * 0.4, -s * 0.3, 0);
  ctx.bezierCurveTo(-s * 0.6, -s * 0.3, -s * 0.5, -s * 0.7, 0, -s);
  ctx.fill();
}

// Feuille ronde
function drawRoundLeaf(ctx: CanvasRenderingContext2D, s: number) {
  ctx.beginPath();
  ctx.ellipse(0, 0, s * 0.6, s * 0.7, 0, 0, Math.PI * 2);
  ctx.fill();
  // Petite tige
  ctx.beginPath();
  ctx.moveTo(0, s * 0.7);
  ctx.lineTo(0, s);
  ctx.strokeStyle = "rgba(0,0,0,0.3)";
  ctx.lineWidth = 2;
  ctx.stroke();
}

// Feuille longue (saule)
function drawLongLeaf(ctx: CanvasRenderingContext2D, s: number) {
  ctx.beginPath();
  ctx.moveTo(0, -s);
  ctx.bezierCurveTo(s * 0.25, -s * 0.5, s * 0.25, s * 0.5, 0, s);
  ctx.bezierCurveTo(-s * 0.25, s * 0.5, -s * 0.25, -s * 0.5, 0, -s);
  ctx.fill();
}

function drawLeaf(
  ctx: CanvasRenderingContext2D,
  leaf: Leaf,
  mouseInfluence: { dx: number; dy: number },
) {
  ctx.save();

  const drawX = leaf.x + mouseInfluence.dx;
  const drawY = leaf.y + mouseInfluence.dy;

  ctx.translate(drawX, drawY);
  ctx.rotate((leaf.rotation * Math.PI) / 180);
  ctx.globalAlpha = leaf.opacity;
  ctx.fillStyle = leaf.color;

  const s = leaf.size;

  // Dessiner selon la forme
  switch (leaf.shape) {
    case "maple":
      drawMapleLeaf(ctx, s);
      break;
    case "oak":
      drawOakLeaf(ctx, s);
      break;
    case "round":
      drawRoundLeaf(ctx, s);
      break;
    case "long":
      drawLongLeaf(ctx, s);
      break;
    default:
      drawSimpleLeaf(ctx, s);
  }

  // Nervure centrale (sauf pour round)
  if (leaf.shape !== "round") {
    ctx.beginPath();
    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.lineWidth = 1;
    ctx.moveTo(0, -s * 0.7);
    ctx.lineTo(0, s * 0.4);
    ctx.stroke();
  }

  ctx.restore();
}

function updateLeaves() {
  const canvas = canvasRef.value;
  if (!canvas) return;

  leaves.value = leaves.value
    .map((leaf) => {
      leaf.swayPhase += leaf.swaySpeed;
      const sway = Math.sin(leaf.swayPhase) * 2;

      leaf.x += leaf.speedX + sway;
      leaf.y += leaf.speedY;
      leaf.rotation += leaf.rotationSpeed;
      leaf.speedX *= 0.995;

      return leaf;
    })
    .filter((leaf) => {
      return (
        leaf.y < canvas.height + 50 &&
        leaf.x > -50 &&
        leaf.x < canvas.width + 50
      );
    });

  // Ajouter de nouvelles feuilles en continu
  const targetCount = 70;
  const spawnRate = 0.15; // Plus de chances de spawn

  if (leaves.value.length < targetCount && Math.random() < spawnRate) {
    leaves.value.push(createLeaf());
  }

  // Spawn multiple si vraiment peu de feuilles
  if (leaves.value.length < 40) {
    for (let i = 0; i < 3; i++) {
      leaves.value.push(createLeaf());
    }
  }
}

function render() {
  const canvas = canvasRef.value;
  const ctx = canvas?.getContext("2d");
  if (!canvas || !ctx) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Dessiner toutes les feuilles sans effet d'évitement
  for (const leaf of leaves.value) {
    drawLeaf(ctx, leaf, { dx: 0, dy: 0 });
  }

  updateLeaves();
  animationId.value = requestAnimationFrame(render);
}

function handleResize() {
  const canvas = canvasRef.value;
  if (!canvas) return;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function handleClick(e: MouseEvent) {
  const burstCount = 10 + Math.floor(Math.random() * 8);
  for (let i = 0; i < burstCount; i++) {
    const leaf = createLeaf(e.clientX, e.clientY, true);
    const angle = (i / burstCount) * Math.PI * 2 + Math.random() * 0.5;
    const speed = 3 + Math.random() * 5;
    leaf.speedX = Math.cos(angle) * speed;
    leaf.speedY = Math.sin(angle) * speed + 1;
    leaves.value.push(leaf);
  }
}

onMounted(() => {
  handleResize();
  window.addEventListener("resize", handleResize);
  window.addEventListener("click", handleClick);
  initLeaves();
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
  <canvas ref="canvasRef" class="falling-leaves-canvas" />
</template>

<style scoped>
.falling-leaves-canvas {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}
</style>
