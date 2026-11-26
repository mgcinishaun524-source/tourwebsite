import * as React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';

import { cn } from '@/lib/utils';

export interface DitherHelixItem {
  /** Cover art. Cross-origin sources must send CORS headers. */
  image: string;
  /** Shown while this card is at the front. */
  title: string;
  /** Optional category eyebrow above the active title. */
  category?: string;
  /** Optional destination/experience link for the active frame CTA. */
  href?: string;
}

export interface DitherHelixCarouselProps
  extends Omit<React.ComponentPropsWithoutRef<'section'>, 'children'> {
  items: DitherHelixItem[];
  /** Wordmark in the top-left. Omit to drop it. @default undefined */
  brand?: string;
  /** The lit tone the grain resolves to. Defaults to the theme's foreground. @default undefined */
  accent?: string;
  /** Grain lattice pitch, measured in device pixels. Larger prints coarser. @default 7 */
  cell?: number;
  /** How much of the frame's height stays sharp before the dissolve starts, 0-1. @default 0.44 */
  focusBand?: number;
  /** Turn of the helix between one card and the next, in radians. @default 0.72 */
  twist?: number;
  /** Rise of the helix between one card and the next, in card heights. @default 0.88 */
  rise?: number;
  /** Card width / height. Art is cover-fitted into it, so match your own. @default 1.62 */
  cardRatio?: number;
  /** Play the arrival - cards materialize out of the grain. @default true */
  entry?: boolean;
  /** Optional external scroll-driven progress ref (maps 0..count-1 smoothly).
      When supplied, wheel events pass straight through to Lenis/ScrollTrigger with zero scroll-lock. */
  controlledProgressRef?: React.MutableRefObject<number>;
  /** Optional callback fired when clicking a card or pressing arrows while externally scroll-driven. */
  onSelectIndex?: (index: number) => void;
  /** Extra classes on the root surface. @default undefined */
  className?: string;
}

/* Commanding, gallery-scale spiral geometry so every card fills the viewport clearly. */
const CARD_H = 2.35;
const RADIUS = 3.2;
const RADIUS_STEP = 0.055;
const CAMERA_Z = 7.8;
const FOV = 48;
const NEAR = 0.1;
const FAR = 60;

/* Navigation & gesture physics */
const WHEEL = 0.0018;
const DRAG = 0.007;
const EASE = 0.14;
const CONTROLLED_EASE = 0.22;
const SNAP_IDLE = 300;
const SNAP_EASE = 0.065;
const CLICK_SLOP = 6;

/* Bending deformation while rotating */
const BEND = 2.4;
const BEND_EASE = 0.12;
const BEND_MAX = 0.065;

/* Selective hover focus */
const HOVER_IN = 0.095;
const HOVER_OUT = 0.07;
const HOVER_SETTLE = 8;
const FOCUS_FALLOFF = 0.7;

/* Introduction dissolve sequence */
const ENTRY_MS = 950;
const ENTRY_STAGGER_MS = 50;
const ENTRY_SPIN = 7.4;
const ENTRY_SPIN_MS = 1900;

const CLICK_MS = 1000;
const THEME_EVERY = 20;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const inOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

const BAYER = /* glsl */ `
float bayer2(vec2 a) { a = floor(a); return fract(a.x / 2.0 + a.y * a.y * 0.75); }
#define bayer4(a) (bayer2(0.5 * (a)) * 0.25 + bayer2(a))
#define bayer8(a) (bayer4(0.5 * (a)) * 0.25 + bayer2(a))
`;

const CARD_VERT = /* glsl */ `#version 300 es
in vec2 aPos;

uniform float uIndex;
uniform float uProgress;
uniform float uCount;
uniform float uAngleStep;
uniform float uPitch;
uniform float uVelocity;
uniform vec2  uCard;
uniform float uFocal;
uniform float uAspect;

out vec2 vUv;
out float vDepth;

const float RADIUS = ${RADIUS.toFixed(3)};
const float RADIUS_STEP = ${RADIUS_STEP.toFixed(4)};
const float CAMERA_Z = ${CAMERA_Z.toFixed(1)};
const float NEAR = ${NEAR.toFixed(2)};
const float FAR = ${FAR.toFixed(1)};
const float BEND = ${BEND.toFixed(2)};

void main() {
  vUv = vec2(aPos.x, 1.0 - aPos.y);
  vec2 local = (aPos - 0.5) * uCard;

  float slot = mod(uIndex - uProgress, uCount) - floor(uCount * 0.5);
  float baseAngle = slot * uAngleStep;
  float baseY = slot * uPitch;

  float ty = (aPos.y - 0.5) * 2.0;
  baseAngle += uVelocity * BEND * ty * ty * uAngleStep * 0.5;

  float r = RADIUS + slot * RADIUS_STEP;
  float theta = baseAngle + local.x / r;
  vec3 p = vec3(sin(theta) * r, local.y + baseY, cos(theta) * r);

  float vz = p.z - CAMERA_Z;
  vDepth = -vz;
  gl_Position = vec4(
    p.x * uFocal / uAspect,
    p.y * uFocal,
    ((FAR + NEAR) * vz + 2.0 * FAR * NEAR) / (NEAR - FAR),
    -vz
  );
}`;

const CARD_FRAG = /* glsl */ `#version 300 es
precision highp float;

in vec2 vUv;
in float vDepth;

uniform sampler2D uMap;
uniform vec2 uImageRatio;
uniform vec3 uBackground;
uniform float uHover;
uniform float uDim;
uniform float uEntry;
uniform float uEntryScale;
uniform float uEntryAspect;

layout(location = 0) out vec4 outScene;
layout(location = 1) out vec4 outMeta;

const float FOG_NEAR = 6.2;
const float FOG_FAR = 18.0;
const float DIM_FADE = 0.67;
const float ENTRY_SOFTNESS = 0.45;

${BAYER}

bool notArrived(vec2 uv) {
  if (uEntry <= 0.0) return false;
  vec2 offset = (uv - 0.5) * vec2(uEntryAspect, 1.0);
  float d = length(offset) / length(vec2(uEntryAspect, 1.0) * 0.5);
  float front = (1.0 - uEntry) * (1.0 + ENTRY_SOFTNESS);
  return (front - d) / ENTRY_SOFTNESS <= bayer8(gl_FragCoord.xy / uEntryScale);
}

void main() {
  if (notArrived(vUv)) discard;

  vec2 uv = (vUv - 0.5) * uImageRatio + 0.5;
  vec3 color = texture(uMap, uv).rgb;

  float fog = smoothstep(FOG_NEAR, FOG_FAR, vDepth) * (1.0 - uHover);
  color = mix(color, uBackground, fog);

  color = mix(color, uBackground, 1.0 - pow(1.0 - uDim * DIM_FADE, 2.2));

  outScene = vec4(color, 1.0 - fog);
  outMeta = vec4(0.0, uDim, uHover, 1.0 - uEntry);
}`;

const QUAD_VERT = /* glsl */ `#version 300 es
in vec2 aPos;
out vec2 vUv;
void main() {
  vUv = aPos;
  gl_Position = vec4(aPos * 2.0 - 1.0, 0.0, 1.0);
}`;

const BLUR_FRAG = /* glsl */ `#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uMap;
uniform vec2 uTexel;
uniform float uSpread;
out vec4 fragColor;
void main() {
  vec2 stride = vec2(0.0, uTexel.y) * uSpread;
  vec4 sum = vec4(0.0);
  float total = 0.0;
  for (int i = -8; i <= 8; i++) {
    float fi = float(i);
    float w = exp(-fi * fi / 18.0);
    sum += texture(uMap, vUv + stride * fi) * w;
    total += w;
  }
  fragColor = sum / total;
}`;

const COMPOSITE_FRAG = /* glsl */ `#version 300 es
precision highp float;

in vec2 vUv;

uniform sampler2D uScene;
uniform sampler2D uMeta;
uniform sampler2D uBlur1;
uniform sampler2D uBlur2;
uniform sampler2D uBlur3;
uniform sampler2D uBlur4;

uniform vec2  uResolution;
uniform vec3  uBackground;
uniform vec3  uAccent;
uniform float uFocusSize;
uniform float uDitherScale;
uniform float uEntryScale;

out vec4 fragColor;

const float EDGE_POWER = 1.7;
const float BLUR_STRENGTH = 0.44;
const float FADE_STRENGTH = 0.36;
const float DITHER_AMOUNT = 0.75;
const float DITHER_START = 0.70;
const float DITHER_POWER = 1.25;
const float LEVELS = 8.0;
const float GAMMA = 1.8;
const float MONO = 0.22;

const float STAGING = 0.55;
const float SMEAR_END = 0.62;
const float GRAIN_BEGIN = 0.52;
const float YIELD = 0.75;

const float HOVER_BLUR = 0.13;
const float HOVER_DITHER = 0.3;
const float HOVER_CURVE = 1.9;
const float HOVER_LEVELS = 8.0;
const float HOVER_CUTOFF = 0.22;
const float HOVER_GAMMA = 1.8;
const float ENTRY_DITHER = 0.45;
const float ENTRY_LEVELS = 4.0;
const float ENTRY_GAMMA = 1.5;

${BAYER}

float luma(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }

vec3 blurStack(vec2 uv, float lvl) {
  vec3 c = texture(uScene, uv).rgb;
  c = mix(c, texture(uBlur1, uv).rgb, clamp(lvl - 0.0, 0.0, 1.0));
  c = mix(c, texture(uBlur2, uv).rgb, clamp(lvl - 1.0, 0.0, 1.0));
  c = mix(c, texture(uBlur3, uv).rgb, clamp(lvl - 2.0, 0.0, 1.0));
  c = mix(c, texture(uBlur4, uv).rgb, clamp(lvl - 3.0, 0.0, 1.0));
  return c;
}

vec3 towardPage(vec3 c, float fade) { return mix(c, uBackground, fade); }

vec2 latticeUv(float cell) {
  return (floor(gl_FragCoord.xy / cell) + 0.5) * cell / uResolution;
}

vec3 toneScale(float t) {
  return t < 0.5
    ? mix(uBackground, uAccent, t * 2.0)
    : mix(uAccent, uBackground, (t - 0.5) * 2.0);
}

vec3 quantise(vec3 c, float threshold, float levels, float gamma) {
  float steps = max(levels - 1.0, 1.0);
  vec3 toned = toneScale(floor(pow(clamp(luma(c), 0.0, 1.0), gamma) * steps + threshold) / steps);
  vec3 quantized = floor(c * steps + threshold) / steps;
  return mix(quantized, toned, MONO);
}

void main() {
  float d = abs(vUv.y - 0.5) * 2.0;
  float edge = pow(smoothstep(uFocusSize, 1.0, d), EDGE_POWER);

  vec4 scene = texture(uScene, vUv);
  vec4 meta = texture(uMeta, vUv);
  float dim = meta.g;
  float entry = 1.0 - meta.a;
  float keep = 1.0 - meta.b;

  float distance = 1.0 - scene.a;
  float dissolve = max(edge, distance);

  float grainFree = pow(smoothstep(DITHER_START, 1.0, max(d, distance)), DITHER_POWER);
  float grainStaged = pow(smoothstep(GRAIN_BEGIN, 1.0, dissolve), DITHER_POWER);
  float smearStaged = smoothstep(0.0, SMEAR_END, dissolve) * (1.0 - grainStaged * YIELD);

  float blurDrive = mix(dissolve, smearStaged, STAGING);
  float ditherDrive = mix(grainFree, grainStaged, STAGING);

  float softness = max(blurDrive, dim * HOVER_BLUR) * keep;
  float lvl = softness * BLUR_STRENGTH * 4.0;
  float fade = edge * FADE_STRENGTH * keep;

  vec3 c = towardPage(blurStack(vUv, lvl), fade);

  float threshold = bayer8(gl_FragCoord.xy / uDitherScale);
  vec3 source = uDitherScale > 1.0
    ? towardPage(blurStack(latticeUv(uDitherScale), lvl), fade)
    : c;
  vec3 result = mix(c, quantise(source, threshold, LEVELS, GAMMA), DITHER_AMOUNT * ditherDrive * keep);

  float hoverRamp = smoothstep(HOVER_CUTOFF, 1.0, pow(dim, HOVER_CURVE)) * HOVER_DITHER;
  float hoverThreshold = bayer8(gl_FragCoord.xy / (uDitherScale * 1.35));
  vec3 hoverSource = towardPage(blurStack(latticeUv(uDitherScale * 1.35), lvl), fade);
  result = mix(result, quantise(hoverSource, hoverThreshold, HOVER_LEVELS, HOVER_GAMMA), hoverRamp);

  float entryThreshold = bayer8(gl_FragCoord.xy / uEntryScale);
  vec3 entrySource = towardPage(blurStack(latticeUv(uEntryScale), lvl), fade);
  result = mix(
    result,
    quantise(entrySource, entryThreshold, ENTRY_LEVELS, ENTRY_GAMMA),
    entry * ENTRY_DITHER
  );

  fragColor = vec4(clamp(result, 0.0, 1.0), 1.0);
}`;

function build(gl: WebGL2RenderingContext, vert: string, frag: string) {
  const program = gl.createProgram();
  if (!program) return null;
  for (const [type, source] of [
    [gl.VERTEX_SHADER, vert],
    [gl.FRAGMENT_SHADER, frag],
  ] as const) {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(shader));
      return null;
    }
    gl.attachShader(program, shader);
    gl.deleteShader(shader);
  }
  gl.bindAttribLocation(program, 0, 'aPos');
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(program));
    return null;
  }
  return program;
}

function uniforms(gl: WebGL2RenderingContext, program: WebGLProgram) {
  const cache = new Map<string, WebGLUniformLocation | null>();
  return (name: string) => {
    let loc = cache.get(name);
    if (loc === undefined) {
      loc = gl.getUniformLocation(program, name);
      cache.set(name, loc);
    }
    return loc;
  };
}

function colorReader() {
  const probe = document.createElement('canvas');
  probe.width = probe.height = 1;
  const ctx = probe.getContext('2d', { willReadFrequently: true });
  return (css: string): [number, number, number] => {
    if (!ctx) return [1, 1, 1];
    ctx.fillStyle = '#FFFFFF';
    ctx.fillStyle = css;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
    return [r / 255, g / 255, b / 255];
  };
}

function texture(gl: WebGL2RenderingContext, w: number, h: number) {
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return tex;
}

export function DitherHelixCarousel({
  items,
  brand,
  accent,
  cell = 7,
  focusBand = 0.44,
  twist = 0.72,
  rise = 0.88,
  cardRatio = 1.62,
  entry: playEntry = true,
  controlledProgressRef,
  onSelectIndex,
  className,
  ...props
}: DitherHelixCarouselProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const sectionRef = React.useRef<HTMLElement>(null);
  const [active, setActive] = React.useState(0);
  const [reduced, setReduced] = React.useState(false);
  const [supported, setSupported] = React.useState(true);
  const [nearViewport, setNearViewport] = React.useState(false);

  const settings = React.useRef({
    accent,
    cell,
    focusBand,
    twist,
    rise,
    cardRatio,
  });
  settings.current = { accent, cell, focusBand, twist, rise, cardRatio };

  const step = React.useRef<(by: number) => void>(() => {});
  const count = items.length;
  const sources = items.map((item) => item.image).join(' ');

  React.useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const read = () => setReduced(query.matches);
    read();
    query.addEventListener('change', read);
    return () => query.removeEventListener('change', read);
  }, []);

  React.useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    if (!('IntersectionObserver' in window)) {
      setNearViewport(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setNearViewport(true);
          observer.disconnect();
        }
      },
      { rootMargin: '320px 0px' },
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !count || !nearViewport) return;
    const gl = canvas.getContext('webgl2', { alpha: false, antialias: false });
    if (!gl) {
      setSupported(false);
      return;
    }

    const readColor = colorReader();
    const cardProgram = build(gl, CARD_VERT, CARD_FRAG);
    const blurProgram = build(gl, QUAD_VERT, BLUR_FRAG);
    const compositeProgram = build(gl, QUAD_VERT, COMPOSITE_FRAG);
    if (!cardProgram || !blurProgram || !compositeProgram) {
      setSupported(false);
      return;
    }
    const cardU = uniforms(gl, cardProgram);
    const blurU = uniforms(gl, blurProgram);
    const compositeU = uniforms(gl, compositeProgram);

    const COLS = 40;
    const ROWS = 8;
    const verts: number[] = [];
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const x0 = x / COLS;
        const x1 = (x + 1) / COLS;
        const y0 = y / ROWS;
        const y1 = (y + 1) / ROWS;
        verts.push(x0, y0, x1, y0, x0, y1, x0, y1, x1, y0, x1, y1);
      }
    }
    const cardMesh = gl.createVertexArray();
    gl.bindVertexArray(cardMesh);
    const cardBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cardBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    const cardVertexCount = verts.length / 2;

    const quad = gl.createVertexArray();
    gl.bindVertexArray(quad);
    const quadBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1]),
      gl.STATIC_DRAW,
    );
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    const sceneFbo = gl.createFramebuffer();
    let sceneTex = texture(gl, 1, 1);
    let metaTex = texture(gl, 1, 1);
    const depth = gl.createRenderbuffer();
    const blurFbos = [0, 1, 2, 3].map(() => gl.createFramebuffer());
    let blurTex = [0, 1, 2, 3].map(() => texture(gl, 1, 1));

    const attach = (w: number, h: number) => {
      gl.bindFramebuffer(gl.FRAMEBUFFER, sceneFbo);
      gl.deleteTexture(sceneTex);
      gl.deleteTexture(metaTex);
      sceneTex = texture(gl, w, h);
      metaTex = texture(gl, w, h);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, sceneTex, 0);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT1, gl.TEXTURE_2D, metaTex, 0);
      gl.bindRenderbuffer(gl.RENDERBUFFER, depth);
      gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, w, h);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depth);
      gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]);

      blurTex.forEach((tex) => gl.deleteTexture(tex));
      blurTex = blurFbos.map((fbo, i) => {
        const tex = texture(gl, Math.max(1, w >> (i + 1)), Math.max(1, h >> (i + 1)));
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
        return tex;
      });
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    };

    const cards = items.map(() => ({
      texture: null as WebGLTexture | null,
      aspect: 1.5,
      settled: false,
    }));
    const images = items.map((item, i) => {
      const image = new Image();
      image.crossOrigin = 'anonymous';
      image.decoding = 'async';
      image.onload = () => {
        const tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.generateMipmap(gl.TEXTURE_2D);
        cards[i].texture = tex;
        cards[i].aspect = image.naturalWidth / Math.max(image.naturalHeight, 1);
        cards[i].settled = true;
      };
      image.onerror = () => {
        cards[i].settled = true;
      };
      image.src = item.image;
      return image;
    });

    const focal = 1 / Math.tan((FOV * Math.PI) / 360);
    const FRONT = Math.floor(count / 2);

    let width = 0;
    let height = 0;
    let progress = controlledProgressRef ? controlledProgressRef.current - FRONT : 0;
    let goal = progress;
    let smoothed = 0;
    let lastInput = 0;
    let snapped = true;
    let hovered = -1;
    let pointerX = -1;
    let pointerY = -1;
    let pointerSpeed = 0;
    let ticks = 0;
    let frame = 0;
    let entryStart = 0;
    let background: [number, number, number] = [1, 1, 1];
    let accentRgb: [number, number, number] = [0.15, 0.2, 0.18];

    let tween: { from: number; to: number; at: number } | null = null;

    const dim = new Float32Array(count);
    const hover = new Float32Array(count);
    const isScrollDriven = Boolean(controlledProgressRef);
    const entryOf = new Float32Array(count).fill(
      playEntry && !reduced && !isScrollDriven ? 1 : 0,
    );
    const order = items.map((_, i) => i).sort(() => Math.random() - 0.5);

    const resize = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (!w || !h) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = w;
      height = h;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      attach(canvas.width, canvas.height);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    const getResponsiveCardHeight = () => {
      const aspect = width / Math.max(height, 1);
      const scale = aspect < 1.15 ? clamp(aspect / 1.15, 0.56, 1) : 1;
      return CARD_H * scale;
    };

    const project = (index: number) => {
      const cardH = getResponsiveCardHeight();
      const slot = ((((index - progress) % count) + count) % count) - FRONT;
      const angle = slot * settings.current.twist;
      const y = slot * settings.current.rise * cardH;
      const z = Math.cos(angle) * (RADIUS + slot * RADIUS_STEP);
      const away = CAMERA_Z - z;
      if (away <= NEAR) return null;
      const aspect = width / Math.max(height, 1);
      const sx =
        ((Math.sin(angle) * (RADIUS + slot * RADIUS_STEP) * focal) / aspect / away) * 0.5 + 0.5;
      const sy = 0.5 - ((y * focal) / away) * 0.5;
      return {
        x: sx * width,
        y: sy * height,
        halfW: ((cardH * settings.current.cardRatio * focal) / aspect / away) * 0.5 * width * 0.5,
        halfH: ((cardH * focal) / away) * 0.5 * height * 0.5,
        away,
      };
    };

    const pick = (px: number, py: number) => {
      let best = -1;
      let bestAway = Infinity;
      for (let i = 0; i < count; i++) {
        const at = project(i);
        if (!at) continue;
        if (Math.abs(px - at.x) > at.halfW || Math.abs(py - at.y) > at.halfH) continue;
        if (at.away < bestAway) {
          bestAway = at.away;
          best = i;
        }
      }
      return best;
    };

    const onWheel = (event: WheelEvent) => {
      if (controlledProgressRef) return;
      tween = null;
      goal += event.deltaY * WHEEL;
      lastInput = performance.now();
      snapped = false;
    };
    if (!controlledProgressRef) {
      canvas.addEventListener('wheel', onWheel, { passive: true });
    }

    step.current = (by: number) => {
      if (controlledProgressRef && onSelectIndex) {
        const currentIdx = (((Math.round(goal) + FRONT) % count) + count) % count;
        onSelectIndex(clamp(currentIdx + by, 0, count - 1));
        return;
      }
      tween = { from: goal, to: Math.round(goal) + by, at: performance.now() };
      lastInput = performance.now();
      snapped = true;
    };

    let dragFrom: number | null = null;
    let dragTravel = 0;
    const onDown = (event: PointerEvent) => {
      dragFrom = event.clientY;
      dragTravel = 0;
      if (!controlledProgressRef) {
        tween = null;
        canvas.setPointerCapture(event.pointerId);
      }
    };
    const onMove = (event: PointerEvent) => {
      const box = canvas.getBoundingClientRect();
      const nx = event.clientX - box.left;
      const ny = event.clientY - box.top;
      pointerSpeed = Math.hypot(nx - pointerX, ny - pointerY);
      pointerX = nx;
      pointerY = ny;
      if (dragFrom !== null && !controlledProgressRef) {
        const travel = dragFrom - event.clientY;
        dragTravel += Math.abs(travel);
        dragFrom = event.clientY;
        goal += travel * DRAG;
        lastInput = performance.now();
        snapped = false;
      } else if (dragFrom !== null) {
        dragTravel += Math.abs(dragFrom - event.clientY);
        dragFrom = event.clientY;
      }
    };
    const onUp = () => {
      const wasClick = dragFrom !== null && dragTravel < CLICK_SLOP;
      dragFrom = null;
      if (!wasClick) return;
      const hit = pick(pointerX, pointerY);
      if (hit >= 0) {
        if (controlledProgressRef && onSelectIndex) {
          onSelectIndex(hit);
          return;
        }
        const want = (((hit - FRONT) % count) + count) % count;
        const to = want + Math.round((goal - want) / count) * count;
        tween = { from: goal, to, at: performance.now() };
        snapped = true;
      }
    };
    const onLeave = () => {
      pointerX = -1;
      pointerY = -1;
      hovered = -1;
    };

    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', onUp);
    canvas.addEventListener('pointerleave', onLeave);

    const drawQuad = () => {
      gl.bindVertexArray(quad);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    };

    const draw = (now: number) => {
      frame = requestAnimationFrame(draw);
      if (!width || !height) return;
      const {
        cell: cellPx,
        focusBand: band,
        twist: turn,
        rise: pitch,
        cardRatio: ratio,
      } = settings.current;
      const cardH = getResponsiveCardHeight();
      const cardW = cardH * ratio;

      if (ticks++ % THEME_EVERY === 0) {
        background = readColor(getComputedStyle(canvas).backgroundColor);
        accentRgb = readColor(settings.current.accent ?? getComputedStyle(canvas).color);
      }

      const ready = cards.every((card) => card.settled);
      if (ready && !entryStart) entryStart = now;
      const elapsed = entryStart ? now - entryStart : 0;

      if (ready && playEntry && !reduced && !isScrollDriven) {
        for (let rank = 0; rank < count; rank++) {
          const t = (elapsed - rank * ENTRY_STAGGER_MS) / ENTRY_MS;
          entryOf[order[rank]] = 1 - clamp(t, 0, 1);
        }
        const spin = clamp(elapsed / ENTRY_SPIN_MS, 0, 1);
        progress = goal - ENTRY_SPIN * (1 - inOutCubic(spin));
      } else if (ready) {
        entryOf.fill(0);
      }
      const arriving = playEntry && !reduced && !isScrollDriven && ready && elapsed < ENTRY_SPIN_MS;

      if (controlledProgressRef) {
        goal = controlledProgressRef.current - FRONT;
      } else if (tween) {
        const t = clamp((now - tween.at) / CLICK_MS, 0, 1);
        goal = tween.from + (tween.to - tween.from) * inOutCubic(t);
        if (t >= 1) tween = null;
      } else if (!snapped && now - lastInput > SNAP_IDLE) {
        goal = Math.round(goal);
        snapped = true;
      }

      const before = progress;
      if (!arriving) {
        const rate = reduced ? 1 : controlledProgressRef ? CONTROLLED_EASE : snapped ? SNAP_EASE : EASE;
        progress += (goal - progress) * rate;
      }
      const velocity = progress - before;
      smoothed += (clamp(velocity, -BEND_MAX, BEND_MAX) - smoothed) * BEND_EASE;

      const near = (((Math.round(goal) + FRONT) % count) + count) % count;
      setActive((prev) => (prev === near ? prev : near));

      if (pointerX >= 0 && pointerSpeed < HOVER_SETTLE) hovered = pick(pointerX, pointerY);
      pointerSpeed *= 0.8;
      for (let i = 0; i < count; i++) {
        const isHovered = i === hovered;
        const wantHover = isHovered ? 1 : 0;
        hover[i] += (wantHover - hover[i]) * (wantHover > hover[i] ? HOVER_IN : HOVER_OUT);
        let wantDim = 0;
        if (hovered >= 0) {
          let gapTo = Math.abs(i - hovered);
          gapTo = Math.min(gapTo, count - gapTo);
          wantDim = clamp(gapTo / FOCUS_FALLOFF, 0, 1);
        }
        dim[i] += (wantDim - dim[i]) * (wantDim > dim[i] ? HOVER_IN : HOVER_OUT);
      }

      gl.bindFramebuffer(gl.FRAMEBUFFER, sceneFbo);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.enable(gl.DEPTH_TEST);
      gl.clearBufferfv(gl.COLOR, 0, [background[0], background[1], background[2], 1]);
      gl.clearBufferfv(gl.COLOR, 1, [0, 0, 0, 1]);
      gl.clear(gl.DEPTH_BUFFER_BIT);
      gl.useProgram(cardProgram);
      gl.bindVertexArray(cardMesh);
      gl.uniform1f(cardU('uCount'), count);
      gl.uniform1f(cardU('uProgress'), progress);
      gl.uniform1f(cardU('uAngleStep'), turn);
      gl.uniform1f(cardU('uPitch'), pitch * cardH);
      gl.uniform1f(cardU('uVelocity'), smoothed);
      gl.uniform2f(cardU('uCard'), cardW, cardH);
      gl.uniform1f(cardU('uFocal'), focal);
      gl.uniform1f(cardU('uAspect'), width / height);
      gl.uniform3fv(cardU('uBackground'), background);
      gl.uniform1i(cardU('uMap'), 0);
      gl.uniform1f(cardU('uEntryScale'), 9.5);
      gl.uniform1f(cardU('uEntryAspect'), ratio);
      gl.activeTexture(gl.TEXTURE0);

      for (let i = 0; i < count; i++) {
        const card = cards[i];
        if (!card.texture) continue;
        gl.bindTexture(gl.TEXTURE_2D, card.texture);
        gl.uniform1f(cardU('uIndex'), i);
        gl.uniform1f(cardU('uHover'), hover[i]);
        gl.uniform1f(cardU('uDim'), dim[i]);
        gl.uniform1f(cardU('uEntry'), entryOf[i]);
        gl.uniform2f(
          cardU('uImageRatio'),
          card.aspect < ratio ? 1 : ratio / card.aspect,
          card.aspect < ratio ? card.aspect / ratio : 1,
        );
        gl.drawArrays(gl.TRIANGLES, 0, cardVertexCount);
      }
      gl.disable(gl.DEPTH_TEST);

      gl.useProgram(blurProgram);
      gl.uniform1i(blurU('uMap'), 0);
      gl.uniform1f(blurU('uSpread'), 4.5);
      let source = sceneTex;
      for (let i = 0; i < 4; i++) {
        const w = Math.max(1, canvas.width >> (i + 1));
        const h = Math.max(1, canvas.height >> (i + 1));
        gl.bindFramebuffer(gl.FRAMEBUFFER, blurFbos[i]);
        gl.viewport(0, 0, w, h);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, source);
        gl.uniform2f(blurU('uTexel'), 1 / w, 1 / h);
        drawQuad();
        source = blurTex[i];
      }

      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.useProgram(compositeProgram);
      const bound = [sceneTex, metaTex, ...blurTex];
      const names = ['uScene', 'uMeta', 'uBlur1', 'uBlur2', 'uBlur3', 'uBlur4'];
      bound.forEach((tex, unit) => {
        gl.activeTexture(gl.TEXTURE0 + unit);
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.uniform1i(compositeU(names[unit]), unit);
      });
      gl.uniform2f(compositeU('uResolution'), canvas.width, canvas.height);
      gl.uniform3fv(compositeU('uBackground'), background);
      gl.uniform3fv(compositeU('uAccent'), accentRgb);
      gl.uniform1f(compositeU('uFocusSize'), band);
      gl.uniform1f(compositeU('uDitherScale'), cellPx);
      gl.uniform1f(compositeU('uEntryScale'), 9.5);
      drawQuad();
      gl.activeTexture(gl.TEXTURE0);
    };
    frame = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      if (!controlledProgressRef) {
        canvas.removeEventListener('wheel', onWheel);
      }
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onUp);
      canvas.removeEventListener('pointerleave', onLeave);
      for (const image of images) {
        image.onload = null;
        image.onerror = null;
      }
      for (const card of cards) if (card.texture) gl.deleteTexture(card.texture);
      gl.deleteTexture(sceneTex);
      gl.deleteTexture(metaTex);
      blurTex.forEach((tex) => gl.deleteTexture(tex));
      blurFbos.forEach((fbo) => gl.deleteFramebuffer(fbo));
      gl.deleteFramebuffer(sceneFbo);
      gl.deleteRenderbuffer(depth);
      gl.deleteBuffer(cardBuffer);
      gl.deleteBuffer(quadBuffer);
      gl.deleteVertexArray(cardMesh);
      gl.deleteVertexArray(quad);
      gl.deleteProgram(cardProgram);
      gl.deleteProgram(blurProgram);
      gl.deleteProgram(compositeProgram);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sources, count, reduced, playEntry, Boolean(controlledProgressRef), nearViewport]);

  const activeItem = items[active];

  if (!supported) {
    return (
      <section
        ref={sectionRef}
        aria-roledescription="carousel"
        aria-label={brand ?? 'Gallery'}
        className={cn('bg-[#FFFFFF] text-[#102D25] relative h-full w-full', className)}
        {...props}
      >
        <ul className="flex h-full snap-y snap-mandatory flex-col items-center gap-4 overflow-y-auto py-16">
          {items.map((entry) => (
            <li key={entry.title} className="w-[78%] max-w-3xl shrink-0 snap-center">
              <img
                src={entry.image}
                alt={entry.title}
                loading="lazy"
                decoding="async"
                className="bg-muted w-full rounded-xl object-cover"
                style={{ aspectRatio: cardRatio }}
              />
            </li>
          ))}
        </ul>
      </section>
    );
  }

  return (
    <section
      ref={sectionRef}
      aria-roledescription="carousel"
      aria-label={brand ?? 'Gallery'}
      className={cn(
        'bg-[#FFFFFF] text-[#102D25] relative h-full w-full overflow-hidden select-none',
        className,
      )}
      {...props}
    >
      <canvas
        ref={canvasRef}
        tabIndex={0}
        role="listbox"
        aria-label={brand ?? 'Gallery'}
        aria-activedescendant={`dither-helix-${active}`}
        className="bg-inherit text-inherit focus-visible:outline-foreground absolute inset-0 h-full w-full cursor-pointer touch-pan-y outline-none focus-visible:outline-2 focus-visible:-outline-offset-4"
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown') step.current(1);
          else if (event.key === 'ArrowUp') step.current(-1);
          else return;
          event.preventDefault();
        }}
      />

      <ul className="sr-only">
        {items.map((item, i) => (
          <li
            key={item.title}
            id={`dither-helix-${i}`}
            role="option"
            aria-selected={i === active}
          >
            {item.title}
          </li>
        ))}
      </ul>

      {brand ? (
        <div className="pointer-events-none absolute top-[6%] left-[5%] text-xs uppercase tracking-[0.22em] font-semibold opacity-75">
          {brand}
        </div>
      ) : null}

      <div className="absolute bottom-7 left-6 sm:left-10 right-24 flex flex-wrap items-end gap-4 z-20">
        <div className="pointer-events-none">
          {activeItem?.category ? (
            <span className="block text-[10px] uppercase tracking-[0.2em] text-[#244B3A] font-semibold mb-1">
              {activeItem.category}
            </span>
          ) : null}
          <div className="font-logo text-2xl sm:text-4xl leading-none font-normal tracking-[0.02em] text-[#102D25]">
            {activeItem?.title}
          </div>
        </div>

        {activeItem?.href ? (
          <Link
            to={activeItem.href}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#102D25] text-[#F6F4ED] hover:bg-[#18392F] text-[11px] uppercase tracking-[0.14em] font-semibold transition-colors shadow-sm"
          >
            <span>Explore</span>
            <ArrowUpRight className="w-3.5 h-3.5 stroke-[1.75]" aria-hidden="true" />
          </Link>
        ) : null}
      </div>

      <div className="text-[#788078] pointer-events-none absolute right-6 sm:right-10 bottom-8 text-sm tabular-nums font-medium z-20">
        {String(active + 1).padStart(2, '0')}
        <span className="opacity-50"> / {String(count).padStart(2, '0')}</span>
      </div>
    </section>
  );
}

export default DitherHelixCarousel;
