import { useRef, useEffect, useCallback } from 'react';
import { useStore } from '@nanostores/react';
import {
  $particleConfig,
  $particleMetrics,
  $isPaused,
  $resetTrigger,
  togglePause,
  randomize,
  type ParticleConfig,
} from '../../stores/store';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
}

function createParticle(width: number, height: number, config: ParticleConfig): Particle {
  const angle = Math.random() * Math.PI * 2;
  return {
    x: Math.random() * width,
    y: Math.random() * height,
    vx: Math.cos(angle) * config.speed * (0.5 + Math.random()),
    vy: Math.sin(angle) * config.speed * (0.5 + Math.random()),
    life: 0,
    maxLife: 200 + Math.random() * 300,
    size: config.size * (0.5 + Math.random()),
  };
}

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [102, 126, 234];
}

function getCanvasBgRgb(): string {
  return getComputedStyle(document.documentElement)
    .getPropertyValue('--canvas-bg-rgb')
    .trim() || '10, 10, 15';
}

function drawShape(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  shape: string,
) {
  switch (shape) {
    case 'square':
      ctx.fillRect(x - size / 2, y - size / 2, size, size);
      break;
    case 'star': {
      const spikes = 5;
      const outerRadius = size;
      const innerRadius = size / 2;
      ctx.beginPath();
      for (let i = 0; i < spikes * 2; i++) {
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const angle = (i * Math.PI) / spikes - Math.PI / 2;
        const px = x + Math.cos(angle) * radius;
        const py = y + Math.sin(angle) * radius;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'triangle': {
      ctx.beginPath();
      ctx.moveTo(x, y - size);
      ctx.lineTo(x - size * 0.866, y + size * 0.5);
      ctx.lineTo(x + size * 0.866, y + size * 0.5);
      ctx.closePath();
      ctx.fill();
      break;
    }
    default:
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
  }
}

const quickBtnStyle: React.CSSProperties = {
  padding: '7px 14px',
  fontSize: '0.72rem',
  fontWeight: 500,
  fontFamily: 'inherit',
  color: 'var(--text-secondary)',
  background: 'var(--surface-overlay)',
  border: '1px solid var(--border-color)',
  borderRadius: '8px',
  cursor: 'pointer',
  transition: 'all 0.15s',
};

export default function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: -1000, y: -1000, active: false });
  const animRef = useRef<number>(0);
  const fpsRef = useRef({ frames: 0, lastTime: performance.now(), current: 0 });
  const lastRealFpsRef = useRef(0);

  const config = useStore($particleConfig);
  const isPaused = useStore($isPaused);
  const resetTrigger = useStore($resetTrigger);
  const metrics = useStore($particleMetrics);
  const configRef = useRef(config);
  configRef.current = config;

  // Track the last real FPS before pausing
  useEffect(() => {
    if (!isPaused && metrics.fps > 0) {
      lastRealFpsRef.current = metrics.fps;
    }
  }, [isPaused, metrics.fps]);

  const lastFps = isPaused ? lastRealFpsRef.current : metrics.fps;
  const wasLowFps = lastFps > 0 && lastFps < 30;

  const initParticles = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cfg = configRef.current;
    particlesRef.current = Array.from({ length: cfg.count }, () =>
      createParticle(canvas.width, canvas.height, cfg),
    );
  }, []);

  // Reset on trigger
  useEffect(() => {
    initParticles();
  }, [resetTrigger, initParticles]);

  // Resize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (!rect) return;
      canvas.width = rect.width;
      canvas.height = rect.height;
    };

    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  // Main animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const animate = () => {
      animRef.current = requestAnimationFrame(animate);
      const cfg = configRef.current;

      if ($isPaused.get()) return;

      // FPS calculation
      fpsRef.current.frames++;
      const now = performance.now();
      if (now - fpsRef.current.lastTime >= 500) {
        fpsRef.current.current = Math.round(
          (fpsRef.current.frames * 1000) / (now - fpsRef.current.lastTime),
        );
        fpsRef.current.frames = 0;
        fpsRef.current.lastTime = now;
      }

      // Trail effect — reads CSS variable for theme-aware background
      const bgRgb = getCanvasBgRgb();
      ctx.fillStyle = `rgba(${bgRgb}, ${1 - cfg.trail})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const particles = particlesRef.current;
      const [r, g, b] = hexToRgb(cfg.color);
      const mouse = mouseRef.current;

      // Adjust particle count
      while (particles.length < cfg.count) {
        particles.push(createParticle(canvas.width, canvas.height, cfg));
      }
      while (particles.length > cfg.count) {
        particles.pop();
      }

      let totalVelocity = 0;
      let totalEnergy = 0;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Gravity
        p.vy += cfg.gravity;

        // Mouse attraction/repulsion
        if (mouse.active) {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 200 && dist > 1) {
            const force = (cfg.attraction * 50) / (dist * dist);
            p.vx += dx * force;
            p.vy += dy * force;
          }
        }

        // Friction
        p.vx *= cfg.friction;
        p.vy *= cfg.friction;

        // Update position
        p.x += p.vx;
        p.y += p.vy;
        p.life++;

        // Wrap around edges
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        // Respawn dead particles
        if (p.life > p.maxLife) {
          const newP = createParticle(canvas.width, canvas.height, cfg);
          particles[i] = newP;
          continue;
        }

        // Calculate opacity based on life
        const lifeRatio = p.life / p.maxLife;
        const opacity = lifeRatio < 0.1
          ? lifeRatio * 10
          : lifeRatio > 0.8
            ? (1 - lifeRatio) * 5
            : 1;

        const vel = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        totalVelocity += vel;
        totalEnergy += 0.5 * vel * vel;

        // Draw particle
        const glow = Math.min(vel * 2, 15);
        ctx.shadowBlur = glow;
        ctx.shadowColor = `rgba(${r}, ${g}, ${b}, 0.6)`;
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${opacity * 0.85})`;

        drawShape(ctx, p.x, p.y, p.size * cfg.size * 0.5, cfg.shape);
      }

      ctx.shadowBlur = 0;

      // Update metrics in store
      const prev = $particleMetrics.get();
      const fpsHistory = [...prev.fpsHistory, fpsRef.current.current].slice(-60);
      const energyHistory = [...prev.energyHistory, totalEnergy / Math.max(particles.length, 1)].slice(-60);

      $particleMetrics.set({
        fps: fpsRef.current.current,
        particleCount: particles.length,
        avgVelocity: Math.round((totalVelocity / Math.max(particles.length, 1)) * 100) / 100,
        energy: Math.round(totalEnergy),
        fpsHistory,
        energyHistory,
      });
    };

    initParticles();
    animate();

    return () => cancelAnimationFrame(animRef.current);
  }, [initParticles]);

  // Mouse handlers
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    mouseRef.current.x = e.clientX - rect.left;
    mouseRef.current.y = e.clientY - rect.top;
  }, []);

  const handleMouseDown = useCallback(() => {
    mouseRef.current.active = true;
  }, []);

  const handleMouseUp = useCallback(() => {
    mouseRef.current.active = false;
  }, []);

  const handleMouseLeave = useCallback(() => {
    mouseRef.current.active = false;
    mouseRef.current.x = -1000;
    mouseRef.current.y = -1000;
  }, []);

  const handleReduceParticles = () => {
    const current = $particleConfig.get().count;
    $particleConfig.setKey('count', Math.max(50, Math.round(current * 0.5)));
  };

  const handleLowerGravity = () => {
    $particleConfig.setKey('gravity', 0.02);
  };

  const handleTryRandom = () => {
    randomize();
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          cursor: 'crosshair',
          borderRadius: '8px',
        }}
      />
      {isPaused && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: `rgba(var(--canvas-bg-rgb), 0.55)`,
            borderRadius: '8px',
            gap: '0.9rem',
          }}
        >
          <div
            style={{
              fontSize: '1.4rem',
              fontWeight: 700,
              color: 'var(--text-secondary)',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
            }}
          >
            Paused
          </div>

          {wasLowFps && (
            <div
              style={{
                fontSize: '0.78rem',
                color: '#f59e0b',
                fontFamily: "'Courier New', monospace",
                fontWeight: 600,
              }}
            >
              Last FPS: {lastFps}
            </div>
          )}

          <button
            onClick={() => togglePause()}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '12px 32px',
              fontSize: '0.9rem',
              fontWeight: 600,
              fontFamily: 'inherit',
              color: 'var(--text-primary)',
              background: 'rgba(102, 126, 234, 0.2)',
              border: '1px solid rgba(102, 126, 234, 0.4)',
              borderRadius: '12px',
              cursor: 'pointer',
              letterSpacing: '0.05em',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(102, 126, 234, 0.35)';
              e.currentTarget.style.borderColor = 'rgba(102, 126, 234, 0.6)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(102, 126, 234, 0.2)';
              e.currentTarget.style.borderColor = 'rgba(102, 126, 234, 0.4)';
            }}
          >
            &#9654; Resume
          </button>

          {wasLowFps && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.5rem',
                marginTop: '0.25rem',
              }}
            >
              <p
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-secondary)',
                  opacity: 0.7,
                  margin: 0,
                }}
              >
                Try one of these before resuming:
              </p>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                <button
                  onClick={handleReduceParticles}
                  style={quickBtnStyle}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--surface-overlay-hover)';
                    e.currentTarget.style.color = 'var(--text-primary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--surface-overlay)';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }}
                >
                  Halve Particles
                </button>
                <button
                  onClick={handleLowerGravity}
                  style={quickBtnStyle}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--surface-overlay-hover)';
                    e.currentTarget.style.color = 'var(--text-primary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--surface-overlay)';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }}
                >
                  Lower Gravity
                </button>
                <button
                  onClick={handleTryRandom}
                  style={quickBtnStyle}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--surface-overlay-hover)';
                    e.currentTarget.style.color = 'var(--text-primary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--surface-overlay)';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }}
                >
                  Try Random
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
