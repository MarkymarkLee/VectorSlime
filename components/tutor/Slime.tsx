"use client";

import { useEffect, useRef } from "react";
import { audioPlayer } from "@/lib/audio/player";
import { Rope, SlimeBody, type SlimeNode } from "@/lib/slime/physics";
import type { TutorStatus } from "@/lib/session/store";

interface SlimeProps {
  /** Logical world size; the canvas scales it to fit, bottom-aligned. */
  width: number;
  height: number;
  radius: number;
  /** Distance from the bottom of the world to the floor. */
  floorInset?: number;
  status?: TutorStatus;
  listening?: boolean;
  /** Start above the frame and fall in. */
  dropIn?: boolean;
  /** Increment to make the slime hop. */
  hopSignal?: number;
  className?: string;
}

const C = {
  bodyTop: "#b6f5c4",
  bodyMid: "#4fd27e",
  bodyLow: "#22a456",
  skin: "rgba(14, 84, 44, 0.55)",
  eye: "#0f2418",
  mouth: "#5b1f2a",
  tongue: "#f08a9a",
  cheek: "rgba(255, 158, 182, 0.85)",
  hat: "#1f2228",
  hatTop: "#2d3139",
  hatEdge: "#3b4049",
  tassel: "#f4c74f",
};

export default function Slime({
  width,
  height,
  radius,
  floorInset = 24,
  status = "idle",
  listening = false,
  dropIn = false,
  hopSignal = 0,
  className,
}: SlimeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const live = useRef({ status, listening, hopSignal });
  live.current = { status, listening, hopSignal };

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const floor = height - floorInset;
    const body = new SlimeBody({
      cx: width / 2,
      bottom: dropIn && !reduced ? -radius * 0.6 : floor,
      radius,
      bounds: { width, floor },
    });
    const n = body.count;
    const rope = new Rope(width / 2, floor - radius * 2, 4, radius * 0.075);

    // view transform (world -> CSS px)
    let scale = 1;
    let offX = 0;
    let offY = 0;
    let dpr = 1;
    const resize = () => {
      const r = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(r.width * dpr));
      canvas.height = Math.max(1, Math.round(r.height * dpr));
      scale = Math.min(r.width / width, r.height / height);
      offX = (r.width - width * scale) / 2;
      offY = r.height - height * scale;
    };
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    const toWorld = (clientX: number, clientY: number) => {
      const r = canvas.getBoundingClientRect();
      return { x: (clientX - r.left - offX) / scale, y: (clientY - r.top - offY) / scale };
    };

    // --- pointer: look at cursor anywhere, grab and throw on the canvas
    let look = { x: width / 2, y: floor - radius * 2 };
    const onMove = (e: PointerEvent) => {
      look = toWorld(e.clientX, e.clientY);
      if (body.grabbed) body.dragTo(look.x, look.y);
    };
    const onDown = (e: PointerEvent) => {
      const p = toWorld(e.clientX, e.clientY);
      if (body.tryGrab(p.x, p.y, radius * 0.45)) {
        canvas.setPointerCapture(e.pointerId);
        canvas.style.cursor = "grabbing";
        e.preventDefault();
      }
    };
    const onUp = () => {
      if (!body.grabbed) return;
      body.release();
      canvas.style.cursor = "grab";
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    canvas.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);

    // --- behaviour state
    let last = performance.now();
    let level = 0;
    let prevLevel = 0;
    let lastBounce = 0;
    let nextHop = last + 4000 + Math.random() * 4000;
    let blinkUntil = 0;
    let nextBlink = last + 1800;
    let hatAngle = 0;
    let hatVel = 0;
    let lastHopSignal = live.current.hopSignal;
    let raf = 0;
    const topWeight = (i: number) => {
      const d = Math.min(i, n - i) / n; // 0 at the top node, 0.5 at the bottom
      return Math.max(0, 1 - d * 4);
    };

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const { status: st, listening: hearing, hopSignal: hop } = live.current;

      // speech: bounce on syllable onsets, puff up while talking
      const target = audioPlayer.getLevel();
      level += (target - level) * 0.5;
      if (!reduced && st === "speaking" && level - prevLevel > 0.07 && now - lastBounce > 110 && body.grounded) {
        body.impulse(0, -120 - level * 160, topWeight);
        lastBounce = now;
      }
      prevLevel = level;
      body.inflate = 1 + level * 0.08 + (hearing ? 0.05 : 0);

      if (!reduced && st === "thinking") {
        const sway = Math.sin(now / 260) * 26 * dt * 60;
        body.impulse(sway * 0.05, 0, topWeight);
      }
      if (hop !== lastHopSignal) {
        lastHopSignal = hop;
        body.hop(reduced ? 250 : 560, (Math.random() - 0.5) * 80);
      }
      if (!reduced && st === "idle" && !body.grabbed && now > nextHop) {
        if (body.grounded) body.hop(380 + Math.random() * 200, (Math.random() - 0.5) * 180);
        nextHop = now + 6000 + Math.random() * 7000;
      }
      if (now > nextBlink) {
        blinkUntil = now + 120;
        nextBlink = now + 2200 + Math.random() * 3800;
      }

      body.step(dt);

      // hat lags behind the head on an angular spring
      const a = body.nodes[2];
      const b = body.nodes[n - 2];
      const headAngle = Math.atan2(a.y - b.y, a.x - b.x);
      hatVel += ((headAngle - hatAngle) * 160 - hatVel * 11) * dt;
      hatAngle += hatVel * dt;

      draw(now, st, hearing, now < blinkUntil);
      raf = requestAnimationFrame(tick);
    };

    const draw = (now: number, st: TutorStatus, hearing: boolean, blinking: boolean) => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * offX, dpr * offY);

      const ns = body.nodes;
      const c = body.centroid();
      const top = avg(ns[n - 1], ns[0], ns[1]);
      let ux = top.x - c.x;
      let uy = top.y - c.y;
      const ul = Math.hypot(ux, uy) || 1;
      ux /= ul;
      uy /= ul;
      const rx = -uy;
      const ry = ux;
      const angle = Math.atan2(ry, rx);
      const half = Math.hypot(ns[n / 4 | 0].x - ns[(3 * n) / 4 | 0].x, ns[n / 4 | 0].y - ns[(3 * n) / 4 | 0].y) / 2;
      const sx = half / radius;
      const minY = Math.min(...ns.map((p) => p.y));
      const maxY = Math.max(...ns.map((p) => p.y));

      // ground shadow
      const lift = Math.max(0, floor - maxY);
      ctx.fillStyle = `rgba(8, 30, 18, ${0.28 * Math.max(0.15, 1 - lift / 220)})`;
      ctx.beginPath();
      ctx.ellipse(c.x, floor + 3, half * Math.max(0.35, 1 - lift / 300), radius * 0.09, 0, 0, Math.PI * 2);
      ctx.fill();

      // body
      ctx.beginPath();
      smoothClosedPath(ctx, ns);
      const g = ctx.createLinearGradient(0, minY, 0, maxY);
      g.addColorStop(0, C.bodyTop);
      g.addColorStop(0.45, C.bodyMid);
      g.addColorStop(1, C.bodyLow);
      ctx.fillStyle = g;
      ctx.fill();
      ctx.lineWidth = radius * 0.035;
      ctx.strokeStyle = C.skin;
      ctx.stroke();

      // glossy highlight + inner bubbles, in the body's frame
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.rotate(angle);
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.beginPath();
      ctx.ellipse(-radius * 0.5 * sx, -radius * 0.42, radius * 0.2, radius * 0.09, -0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.22)";
      for (const [bx, by, br] of [
        [0.62, 0.4, 0.05],
        [0.46, 0.52, 0.03],
        [-0.66, 0.42, 0.04],
      ]) {
        ctx.beginPath();
        ctx.arc(bx * radius * sx, by * radius, br * radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // face
      const fy = -radius * 0.05;
      const lookX = clamp((look.x - c.x) / 240, -1, 1) * radius * 0.06;
      const lookY = clamp((look.y - c.y) / 240, -1, 1) * radius * 0.05;
      const thinkingLook = st === "thinking" ? { x: radius * 0.05, y: -radius * 0.06 } : null;
      const ex = thinkingLook?.x ?? lookX;
      const ey = thinkingLook?.y ?? lookY;
      const eyeGap = radius * 0.3 * sx;
      const eyeR = radius * (hearing ? 0.105 : 0.09);
      for (const side of [-1, 1]) {
        ctx.save();
        ctx.translate(side * eyeGap + ex, fy + ey);
        ctx.scale(1, blinking ? 0.12 : 1);
        ctx.fillStyle = C.eye;
        ctx.beginPath();
        ctx.ellipse(0, 0, eyeR, eyeR * 1.3, 0, 0, Math.PI * 2);
        ctx.fill();
        if (!blinking) {
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(-eyeR * 0.3, -eyeR * 0.45, eyeR * 0.36, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(eyeR * 0.35, eyeR * 0.4, eyeR * 0.16, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
      ctx.fillStyle = C.cheek;
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.ellipse(side * radius * 0.52 * sx, fy + radius * 0.2, radius * 0.11, radius * 0.06, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      const my = fy + radius * 0.24 + ey * 0.5;
      const mx = ex * 0.6 + (st === "thinking" ? radius * 0.1 : 0);
      if (level > 0.04) {
        const open = radius * (0.04 + level * 0.2);
        ctx.fillStyle = C.mouth;
        ctx.beginPath();
        ctx.ellipse(mx, my, radius * (0.14 - level * 0.03), open, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = C.tongue;
        ctx.beginPath();
        ctx.ellipse(mx, my + open * 0.5, radius * 0.08, open * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (st === "thinking") {
        ctx.fillStyle = C.mouth;
        ctx.beginPath();
        ctx.ellipse(mx, my, radius * 0.04, radius * 0.045, 0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        const w = radius * (hearing ? 0.17 : 0.13);
        ctx.strokeStyle = C.mouth;
        ctx.lineWidth = radius * 0.04;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(mx - w, my - radius * 0.02);
        ctx.quadraticCurveTo(mx, my + radius * (hearing ? 0.14 : 0.1), mx + w, my - radius * 0.02);
        ctx.stroke();
      }
      ctx.restore();

      // mortarboard hat, sitting on the top of the head
      const hx = top.x - ux * radius * 0.06;
      const hy = top.y - uy * radius * 0.06;
      const R = radius;
      ctx.save();
      ctx.translate(hx, hy);
      ctx.rotate(hatAngle);
      const bandTop = -R * 0.3;
      ctx.fillStyle = C.hat;
      ctx.beginPath();
      ctx.moveTo(-R * 0.4, R * 0.04);
      ctx.quadraticCurveTo(0, R * 0.12, R * 0.4, R * 0.04);
      ctx.lineTo(R * 0.36, bandTop);
      ctx.lineTo(-R * 0.36, bandTop);
      ctx.closePath();
      ctx.fill();
      const board = (dy: number, fill: string) => {
        ctx.fillStyle = fill;
        ctx.beginPath();
        ctx.moveTo(-R * 0.95, bandTop + dy);
        ctx.lineTo(0, bandTop - R * 0.22 + dy);
        ctx.lineTo(R * 0.95, bandTop + dy);
        ctx.lineTo(0, bandTop + R * 0.19 + dy);
        ctx.closePath();
        ctx.fill();
      };
      board(R * 0.05, C.hat);
      board(0, C.hatTop);
      ctx.strokeStyle = C.hatEdge;
      ctx.lineWidth = R * 0.015;
      ctx.stroke();
      ctx.strokeStyle = C.tassel;
      ctx.lineWidth = R * 0.03;
      ctx.beginPath();
      ctx.moveTo(0, bandTop);
      ctx.lineTo(R * 0.9, bandTop + R * 0.01);
      ctx.stroke();
      ctx.fillStyle = C.tassel;
      ctx.beginPath();
      ctx.arc(0, bandTop, R * 0.045, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // tassel: rope anchored at the board's right corner (world space)
      const cos = Math.cos(hatAngle);
      const sin = Math.sin(hatAngle);
      const axl = R * 0.9;
      const ayl = bandTop + R * 0.01;
      rope.step(1 / 60, hx + axl * cos - ayl * sin, hy + axl * sin + ayl * cos);
      const pts = rope.points;
      ctx.strokeStyle = C.tassel;
      ctx.lineWidth = R * 0.03;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (const p of pts.slice(1)) ctx.lineTo(p.x, p.y);
      ctx.stroke();
      const end = pts[pts.length - 1];
      const prev = pts[pts.length - 2];
      ctx.save();
      ctx.translate(end.x, end.y);
      ctx.rotate(Math.atan2(end.y - prev.y, end.x - prev.x) - Math.PI / 2);
      ctx.fillStyle = C.tassel;
      ctx.beginPath();
      ctx.roundRect(-R * 0.06, 0, R * 0.12, R * 0.2, R * 0.04);
      ctx.fill();
      ctx.restore();

      // thinking bubbles
      if (st === "thinking" || st === "transcribing") {
        for (let i = 0; i < 3; i++) {
          const alpha = 0.35 + 0.65 * Math.max(0, Math.sin(now / 220 - i * 0.9));
          ctx.fillStyle = `rgba(214, 250, 224, ${alpha})`;
          ctx.beginPath();
          ctx.arc(hx + R * (1.05 + i * 0.22), hy - R * (0.35 + i * 0.2), R * (0.045 + i * 0.025), 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointerdown", onDown);
    };
  }, [width, height, radius, floorInset, dropIn]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ cursor: "grab", touchAction: "none" }}
      role="img"
      aria-label="Your tutor, a green slime wearing a graduation cap"
    />
  );
}

function avg(...ps: SlimeNode[]) {
  return { x: ps.reduce((s, p) => s + p.x, 0) / ps.length, y: ps.reduce((s, p) => s + p.y, 0) / ps.length };
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

/** Closed Catmull-Rom spline through the nodes, as cubic Béziers. */
function smoothClosedPath(ctx: CanvasRenderingContext2D, ns: SlimeNode[]) {
  const n = ns.length;
  ctx.moveTo(ns[0].x, ns[0].y);
  for (let i = 0; i < n; i++) {
    const p0 = ns[(i - 1 + n) % n];
    const p1 = ns[i];
    const p2 = ns[(i + 1) % n];
    const p3 = ns[(i + 2) % n];
    ctx.bezierCurveTo(
      p1.x + (p2.x - p0.x) / 6,
      p1.y + (p2.y - p0.y) / 6,
      p2.x - (p3.x - p1.x) / 6,
      p2.y - (p3.y - p1.y) / 6,
      p2.x,
      p2.y,
    );
  }
  ctx.closePath();
}
