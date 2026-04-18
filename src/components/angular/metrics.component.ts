import { Component, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { $particleMetrics, type ParticleMetrics } from '../../stores/store';

@Component({
  selector: 'app-metrics',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="metrics-container">
      <div class="framework-badge badge-angular">
        <svg width="12" height="12" viewBox="0 0 256 272">
          <path fill="#DD0031" d="M.1 45.522L125.908.697l129.196 44.028l-20.919 166.45l-108.277 59.966l-106.583-59.169z"/>
          <path fill="#C3002F" d="M255.104 44.725L125.908.697v270.444l108.277-59.866z"/>
          <path fill="#FFF" d="M125.908 32.432L63.597 169.081l23.264.001l12.56-31.372h52.988l12.56 31.371h23.264zm.001 55.488l18.159 44.34h-36.318z"/>
        </svg>
        Angular Metrics
      </div>

      <div class="stats-grid">
        <div class="stat-card" [class.highlight]="metrics.fps >= 55">
          <span class="stat-value" [style.color]="getFpsColor()">{{ metrics.fps }}</span>
          <span class="stat-label">FPS</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">{{ metrics.particleCount }}</span>
          <span class="stat-label">Particles</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">{{ metrics.avgVelocity }}</span>
          <span class="stat-label">Avg Velocity</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">{{ formatEnergy(metrics.energy) }}</span>
          <span class="stat-label">Energy</span>
        </div>
      </div>

      <div class="chart-section">
        <span class="chart-title">FPS History</span>
        <canvas #fpsChart class="sparkline-canvas"></canvas>
      </div>

      <div class="chart-section">
        <span class="chart-title">Energy History</span>
        <canvas #energyChart class="sparkline-canvas"></canvas>
      </div>

      <div class="status-bar">
        <div class="status-dot" [style.background]="getStatusColor()"></div>
        <span class="status-text">{{ getStatusText() }}</span>
      </div>
    </div>
  `,
  styles: [`
    .metrics-container {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      height: 100%;
      overflow-y: auto;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px;
    }

    .stat-card {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 8px;
      padding: 8px 10px;
      display: flex;
      flex-direction: column;
      gap: 2px;
      transition: all 0.3s;
    }

    .stat-card.highlight {
      border-color: rgba(34, 197, 94, 0.3);
      background: rgba(34, 197, 94, 0.05);
    }

    .stat-value {
      font-size: 1.2rem;
      font-weight: 700;
      color: #e0e0ff;
      font-family: 'Courier New', monospace;
    }

    .stat-label {
      font-size: 0.6rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #8888aa;
    }

    .chart-section {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .chart-title {
      font-size: 0.65rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #8888aa;
    }

    .sparkline-canvas {
      width: 100%;
      height: 40px;
      border-radius: 6px;
      background: rgba(255, 255, 255, 0.02);
    }

    .status-bar {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 10px;
      background: rgba(255, 255, 255, 0.03);
      border-radius: 8px;
      margin-top: auto;
    }

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      animation: pulse 2s ease-in-out infinite;
    }

    .status-text {
      font-size: 0.7rem;
      color: #8888aa;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
  `],
})
export class MetricsComponent implements OnInit, OnDestroy {
  @ViewChild('fpsChart', { static: true }) fpsChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('energyChart', { static: true }) energyChartRef!: ElementRef<HTMLCanvasElement>;

  metrics: ParticleMetrics = {
    fps: 0,
    particleCount: 0,
    avgVelocity: 0,
    energy: 0,
    fpsHistory: [],
    energyHistory: [],
  };

  private unsubscribe?: () => void;

  ngOnInit() {
    this.unsubscribe = $particleMetrics.subscribe((value) => {
      this.metrics = value;
      this.drawSparkline(this.fpsChartRef?.nativeElement, value.fpsHistory, '#dd0031', 0, 80);
      this.drawSparkline(this.energyChartRef?.nativeElement, value.energyHistory, '#ff6f61', undefined, undefined);
    });
  }

  ngOnDestroy() {
    this.unsubscribe?.();
  }

  private drawSparkline(
    canvas: HTMLCanvasElement | undefined,
    data: number[],
    color: string,
    minVal?: number,
    maxVal?: number,
  ) {
    if (!canvas || data.length < 2) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const w = rect.width;
    const h = rect.height;
    const padding = 2;

    ctx.clearRect(0, 0, w, h);

    const min = minVal ?? Math.min(...data);
    const max = maxVal ?? Math.max(...data);
    const range = max - min || 1;

    // Draw filled area
    ctx.beginPath();
    ctx.moveTo(padding, h - padding);

    for (let i = 0; i < data.length; i++) {
      const x = padding + (i / (data.length - 1)) * (w - 2 * padding);
      const y = h - padding - ((data[i] - min) / range) * (h - 2 * padding);
      ctx.lineTo(x, y);
    }

    ctx.lineTo(w - padding, h - padding);
    ctx.closePath();

    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, color + '30');
    gradient.addColorStop(1, color + '05');
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw line
    ctx.beginPath();
    for (let i = 0; i < data.length; i++) {
      const x = padding + (i / (data.length - 1)) * (w - 2 * padding);
      const y = h - padding - ((data[i] - min) / range) * (h - 2 * padding);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  getFpsColor(): string {
    if (this.metrics.fps >= 55) return '#22c55e';
    if (this.metrics.fps >= 30) return '#f59e0b';
    return '#ef4444';
  }

  getStatusColor(): string {
    if (this.metrics.fps >= 55) return '#22c55e';
    if (this.metrics.fps >= 30) return '#f59e0b';
    return '#ef4444';
  }

  getStatusText(): string {
    if (this.metrics.fps >= 55) return 'System running optimally';
    if (this.metrics.fps >= 30) return 'Performance degraded';
    return 'Low performance — reduce particles';
  }

  formatEnergy(energy: number): string {
    if (energy > 10000) return (energy / 1000).toFixed(1) + 'k';
    return energy.toString();
  }
}
