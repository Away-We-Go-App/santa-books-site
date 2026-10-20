// One clay pose supplies every frame. The body never changes shape or texture.
const STRIDE = 56;
const STANCE = 0.65;
// Left hind → left fore → right hind → right fore, with overlapping swings.
export const LEG_PHASES = [0.25, 0, 0.75, 0.5];

// During stance, dx falls exactly as far as the body advances, so the hoof's
// world position stays fixed. A smooth return arc has matching contact velocity.
export function footAt(distance, offset, activity = 1) {
  const phase = ((distance / STRIDE + offset) % 1 + 1) % 1;
  if (phase <= STANCE)
    return { dx: STRIDE * (STANCE / 2 - phase), lift: 0, planted: true };
  const u = (phase - STANCE) / (1 - STANCE);
  const returnStep = u ** 3 * (10 - 15 * u + 6 * u * u);
  return {
    dx: STRIDE * (STANCE / 2 - phase + returnStep),
    lift: activity * 9 * Math.sin(Math.PI * u) ** 2,
    planted: activity === 0,
  };
}

// Source coordinates belong to the first 362px cell of the approved atlas.
// Far legs render first; the unchanged torso covers the overlapping hip roots.
const FRONT = [[199,252],[258,252],[260,284],[266,329],[271,339],[275,349],[272,356],[263,361],[231,362],[221,358],[217,348],[211,333],[203,297]];
const HIND = [[108,249],[166,253],[168,282],[145,303],[135,326],[135,355],[80,357],[80,326],[96,289]];
const LEGS = [
  { top: 252, hip: 279, ankle: 339, bottom: 362, phase: LEG_PHASES[0], outline: FRONT, x: -45, y: 22, scale: .9, far: true },
  { top: 252, hip: 279, ankle: 339, bottom: 362, phase: LEG_PHASES[1], outline: FRONT, x: 65, y: 22, scale: .9, far: true },
  { top: 249, hip: 265, ankle: 329, bottom: 357, phase: LEG_PHASES[2], outline: HIND, x: 0, y: 0, scale: 1 },
  { top: 252, hip: 279, ankle: 339, bottom: 362, phase: LEG_PHASES[3], outline: FRONT, x: 0, y: 0, scale: 1 },
];

function path(ctx, points) {
  ctx.beginPath();
  ctx.moveTo(...points[0]);
  for (const p of points.slice(1)) ctx.lineTo(...p);
  ctx.closePath();
}
function surface() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 362;
  return canvas;
}

export function createLegRig(image) {
  const body = surface(), bodyCtx = body.getContext('2d');
  // Clip a continuous belly silhouette, so no original leg fragments remain.
  bodyCtx.beginPath();
  bodyCtx.moveTo(0,0); bodyCtx.lineTo(362,0); bodyCtx.lineTo(362,300);
  bodyCtx.lineTo(300,300); bodyCtx.lineTo(286,284); bodyCtx.lineTo(280,274);
  bodyCtx.bezierCurveTo(263,294,235,298,206,296);
  bodyCtx.bezierCurveTo(163,294,136,284,109,267);
  bodyCtx.lineTo(0,267); bodyCtx.closePath(); bodyCtx.clip();
  bodyCtx.drawImage(image, 0, 0, 362, 362, 0, 0, 362, 362);
  const layers = LEGS.map(leg => {
    const canvas = surface(), ctx = canvas.getContext('2d');
    path(ctx, leg.outline);
    ctx.clip();
    if (leg.far) ctx.filter = "brightness(.88)";
    ctx.drawImage(image, 0, 0, 362, 362, 0, 0, 362, 362);
    return canvas;
  });
  return {
    draw(ctx, distance, activity = 1) {
      LEGS.forEach((leg, i) => {
        const foot = footAt(distance, leg.phase, activity);
        const dx = foot.dx / (.816 * leg.scale), dy = -foot.lift / (.816 * leg.scale);
        ctx.save();
        ctx.translate(leg.x, leg.y);
        ctx.scale(leg.scale, leg.scale);
        const weight = y => {
          const u = Math.max(0, Math.min(1, (y - leg.hip) / (leg.ankle - leg.hip)));
          return u * u * (3 - 2 * u);
        };
        for (let y = leg.top; y < leg.bottom; y += 2) {
          const h = Math.min(2, leg.bottom - y), a = weight(y), b = weight(y + h);
          ctx.save();
          ctx.transform(1, 0, dx * (b-a) / h, 1 + dy * (b-a) / h, dx*a, y + dy*a);
          ctx.drawImage(layers[i], 0, y, 362, h + 1, 0, 0, 362, h + 1);
          ctx.restore();
        }
        ctx.restore();
      });
      ctx.drawImage(body, 0, 0);
    },
  };
}
