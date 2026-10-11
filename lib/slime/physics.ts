/**
 * 2D soft-body slime: a ring of point masses where every node is connected
 * to every other node by a damped spring, plus an internal gas pressure that
 * keeps the volume. Integrated with semi-implicit Euler in fixed substeps.
 *
 * - perimeter springs (i, i+1): stiff, define the skin
 * - skip springs (i, i+2): resist sharp creases
 * - all other pairs: soft, give the blob its shape memory and jiggle
 * - pressure: pushes each edge outward along its normal, proportional to
 *   how much the current area is below the target area
 */

export interface SlimeNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export interface Spring {
  a: number;
  b: number;
  rest: number;
  k: number;
  c: number;
}

export interface SlimeBounds {
  /** World width; nodes stay within [0, width]. */
  width: number;
  /** y coordinate of the floor. */
  floor: number;
}

export interface SlimeOptions {
  cx: number;
  /** y of the slime's bottom edge at rest. */
  bottom: number;
  radius: number;
  bounds: SlimeBounds;
  count?: number;
}

const GRAVITY = 1500;
const SUBSTEPS = 10;
const PERIMETER_K = 40;
const PERIMETER_C = 0.45;
const SKIP_K = 40;
const SKIP_C = 0.45;
const INTERNAL_K = 40;
const INTERNAL_C = 0.45;
const PRESSURE_K = 420;
const AIR_DRAG = 0.55;
const FLOOR_FRICTION = 6;
const FLOOR_BOUNCE = 0.12;
/** Whole-body grab: every node is pulled toward its spot relative to the hand. */
const GRAB_K = 170;
const GRAB_C = 11;
/** How much the far side of the body follows the hand (1 = rigidly, lower = it drapes). */
const GRAB_FAR = 0.45;

export class SlimeBody {
  readonly nodes: SlimeNode[] = [];
  readonly springs: Spring[] = [];
  readonly count: number;
  readonly radius: number;
  readonly restArea: number;
  bounds: SlimeBounds;
  /** Multiplies the target area: >1 inflates, <1 deflates. */
  inflate = 1;
  private grab: {
    x: number;
    y: number;
    /** Hand velocity, smoothed, so nodes match it and a release throws the body. */
    vx: number;
    vy: number;
    t: number;
    /** Each node's offset from the hand when grabbed, and how firmly it follows. */
    ox: Float64Array;
    oy: Float64Array;
    w: Float64Array;
  } | null = null;
  private fx: Float64Array;
  private fy: Float64Array;

  constructor(o: SlimeOptions) {
    const n = (this.count = o.count ?? 22);
    this.radius = o.radius;
    this.bounds = o.bounds;
    this.fx = new Float64Array(n);
    this.fy = new Float64Array(n);

    // A circle resting on the floor; gravity only squashes it slightly.
    const r = o.radius;
    const cy = o.bottom - r;
    for (let i = 0; i < n; i++) {
      const t = -Math.PI / 2 + (i / n) * Math.PI * 2;
      this.nodes.push({ x: o.cx + Math.cos(t) * r, y: cy + Math.sin(t) * r, vx: 0, vy: 0 });
    }

    for (let a = 0; a < n; a++) {
      for (let b = a + 1; b < n; b++) {
        const gap = Math.min(b - a, n - (b - a));
        const [k, c] = gap === 1 ? [PERIMETER_K, PERIMETER_C] : gap === 2 ? [SKIP_K, SKIP_C] : [INTERNAL_K, INTERNAL_C];
        this.springs.push({ a, b, rest: this.dist(a, b), k, c });
      }
    }
    this.restArea = Math.abs(this.signedArea());
  }

  // ---------------------------------------------------------------- geometry

  private dist(a: number, b: number) {
    const p = this.nodes[a];
    const q = this.nodes[b];
    return Math.hypot(q.x - p.x, q.y - p.y);
  }

  signedArea() {
    let s = 0;
    const ns = this.nodes;
    for (let i = 0; i < ns.length; i++) {
      const p = ns[i];
      const q = ns[(i + 1) % ns.length];
      s += p.x * q.y - q.x * p.y;
    }
    return s / 2;
  }

  centroid() {
    let x = 0;
    let y = 0;
    for (const p of this.nodes) {
      x += p.x;
      y += p.y;
    }
    return { x: x / this.count, y: y / this.count };
  }

  velocity() {
    let vx = 0;
    let vy = 0;
    for (const p of this.nodes) {
      vx += p.vx;
      vy += p.vy;
    }
    return { vx: vx / this.count, vy: vy / this.count };
  }

  /** True when the bottom of the slime is touching the floor. */
  get grounded() {
    const floor = this.bounds.floor - 0.5;
    return this.nodes.some((p) => p.y >= floor);
  }

  get grabbed() {
    return this.grab !== null;
  }

  // ---------------------------------------------------------------- control

  /** Add velocity to nodes, optionally weighted per node (0..1). */
  impulse(vx: number, vy: number, weight?: (i: number, p: SlimeNode) => number) {
    this.nodes.forEach((p, i) => {
      const w = weight ? weight(i, p) : 1;
      p.vx += vx * w;
      p.vy += vy * w;
    });
  }

  /** Hop: launch upward, with a slight sideways drift. */
  hop(strength: number, drift = 0) {
    this.impulse(drift, -strength);
  }

  /** Grab the whole body at (x, y) when the pointer is on or near it. */
  tryGrab(x: number, y: number, reach: number) {
    const n = this.count;
    const ds = this.nodes.map((p) => Math.hypot(p.x - x, p.y - y));
    if (Math.min(...ds) > reach && !this.contains(x, y)) return false;
    const ox = new Float64Array(n);
    const oy = new Float64Array(n);
    const w = new Float64Array(n);
    const far = Math.max(...ds) || 1;
    this.nodes.forEach((p, i) => {
      ox[i] = p.x - x;
      oy[i] = p.y - y;
      // Nodes near the hand follow firmly; the far side lags and wobbles.
      w[i] = GRAB_FAR + (1 - GRAB_FAR) * (1 - ds[i] / far);
    });
    this.grab = { x, y, vx: 0, vy: 0, t: performance.now(), ox, oy, w };
    return true;
  }

  dragTo(x: number, y: number) {
    const g = this.grab;
    if (!g) return;
    const now = performance.now();
    const dt = Math.max(1, now - g.t) / 1000;
    const a = Math.min(1, dt * 18);
    g.vx += ((x - g.x) / dt - g.vx) * a;
    g.vy += ((y - g.y) / dt - g.vy) * a;
    g.x = x;
    g.y = y;
    g.t = now;
  }

  release() {
    this.grab = null;
  }

  contains(x: number, y: number) {
    let inside = false;
    const ns = this.nodes;
    for (let i = 0, j = ns.length - 1; i < ns.length; j = i++) {
      const a = ns[i];
      const b = ns[j];
      if (a.y > y !== b.y > y && x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x) inside = !inside;
    }
    return inside;
  }

  // ---------------------------------------------------------------- simulate

  step(dt: number) {
    const h = Math.min(dt, 1 / 30) / SUBSTEPS;
    for (let s = 0; s < SUBSTEPS; s++) this.substep(h);
  }

  private substep(h: number) {
    const { nodes, springs, fx, fy } = this;
    const n = this.count;
    fx.fill(0);
    fy.fill(0);

    for (let i = 0; i < n; i++) fy[i] += GRAVITY;

    for (const s of springs) {
      const p = nodes[s.a];
      const q = nodes[s.b];
      const dx = q.x - p.x;
      const dy = q.y - p.y;
      const d = Math.hypot(dx, dy) || 1e-6;
      const ux = dx / d;
      const uy = dy / d;
      const rel = (q.vx - p.vx) * ux + (q.vy - p.vy) * uy;
      const f = s.k * (d - s.rest) + s.c * rel;
      fx[s.a] += f * ux;
      fy[s.a] += f * uy;
      fx[s.b] -= f * ux;
      fy[s.b] -= f * uy;
    }

    // Gas pressure along outward edge normals.
    const signed = this.signedArea();
    const area = Math.abs(signed) || 1;
    const pressure = PRESSURE_K * ((this.restArea * this.inflate) / area - 1);
    const orient = Math.sign(signed) || 1;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      const p = nodes[i];
      const q = nodes[j];
      const ex = q.x - p.x;
      const ey = q.y - p.y;
      // Outward normal scaled by edge length: pressure * L * n̂ = pressure * (ey, -ex)
      const nx = orient * ey * pressure * 0.5;
      const ny = -orient * ex * pressure * 0.5;
      fx[i] += nx;
      fy[i] += ny;
      fx[j] += nx;
      fy[j] += ny;
    }

    const g = this.grab;
    if (g) {
      // Hand velocity fades when the pointer stops moving.
      if (performance.now() - g.t > 60) {
        g.vx *= 0.9;
        g.vy *= 0.9;
      }
      for (let i = 0; i < n; i++) {
        const p = nodes[i];
        const k = GRAB_K * g.w[i];
        const c = GRAB_C * g.w[i];
        fx[i] += k * (g.x + g.ox[i] - p.x) + c * (g.vx - p.vx);
        // Cancel most of gravity so the body hangs from the hand instead of sagging off it.
        fy[i] += k * (g.y + g.oy[i] - p.y) + c * (g.vy - p.vy) - GRAVITY * 0.85 * g.w[i];
      }
    }

    const drag = 1 - AIR_DRAG * h;
    const { floor, width } = this.bounds;
    for (let i = 0; i < n; i++) {
      const p = nodes[i];
      p.vx = (p.vx + fx[i] * h) * drag;
      p.vy = (p.vy + fy[i] * h) * drag;
      p.x += p.vx * h;
      p.y += p.vy * h;

      if (p.y > floor) {
        p.y = floor;
        if (p.vy > 0) p.vy = -p.vy * FLOOR_BOUNCE;
        p.vx *= 1 - Math.min(1, FLOOR_FRICTION * h);
      }
      if (p.x < 2) {
        p.x = 2;
        if (p.vx < 0) p.vx = -p.vx * 0.3;
      } else if (p.x > width - 2) {
        p.x = width - 2;
        if (p.vx > 0) p.vx = -p.vx * 0.3;
      }
      if (p.y < -this.radius * 4) {
        p.y = -this.radius * 4;
        if (p.vy < 0) p.vy = 0;
      }
    }
  }
}

/** A hanging chain of particles (the hat's tassel), solved with Verlet + distance constraints. */
export class Rope {
  readonly points: { x: number; y: number; px: number; py: number }[] = [];

  constructor(x: number, y: number, readonly segments: number, readonly length: number) {
    for (let i = 0; i <= segments; i++) this.points.push({ x, y: y + i * length, px: x, py: y + i * length });
  }

  step(dt: number, anchorX: number, anchorY: number) {
    const pts = this.points;
    const g = GRAVITY * 0.6 * dt * dt;
    for (let i = 1; i < pts.length; i++) {
      const p = pts[i];
      const vx = (p.x - p.px) * 0.96;
      const vy = (p.y - p.py) * 0.96;
      p.px = p.x;
      p.py = p.y;
      p.x += vx;
      p.y += vy + g;
    }
    pts[0].x = anchorX;
    pts[0].y = anchorY;
    for (let iter = 0; iter < 6; iter++) {
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i];
        const b = pts[i + 1];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const d = Math.hypot(dx, dy) || 1e-6;
        const diff = (d - this.length) / d;
        if (i === 0) {
          b.x -= dx * diff;
          b.y -= dy * diff;
        } else {
          a.x += dx * diff * 0.5;
          a.y += dy * diff * 0.5;
          b.x -= dx * diff * 0.5;
          b.y -= dy * diff * 0.5;
        }
      }
    }
  }
}
