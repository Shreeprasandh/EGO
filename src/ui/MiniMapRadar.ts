import * as THREE from 'three';

export class MiniMapRadar {
  public canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private trackPoints: { x: number; y: number }[] = [];

  // Bounding box for track normalization
  private minX = Infinity;
  private maxX = -Infinity;
  private minY = Infinity;
  private maxY = -Infinity;
  private scale = 1.0;
  private offsetX = 0;
  private offsetY = 0;

  constructor(trackPoints: { x: number; y: number }[]) {
    this.canvas = document.createElement('canvas');
    this.canvas.width = 160;
    this.canvas.height = 160;
    this.canvas.className = 'minimap-radar-canvas';

    const context = this.canvas.getContext('2d');
    if (!context) throw new Error('Could not create 2D context for MiniMapRadar');
    this.ctx = context;

    this.setTrackPoints(trackPoints);
  }

  public setTrackPoints(points: { x: number; y: number }[]): void {
    this.trackPoints = points;
    if (points.length === 0) return;

    this.minX = Infinity;
    this.maxX = -Infinity;
    this.minY = Infinity;
    this.maxY = -Infinity;

    for (const p of points) {
      if (p.x < this.minX) this.minX = p.x;
      if (p.x > this.maxX) this.maxX = p.x;
      if (p.y < this.minY) this.minY = p.y;
      if (p.y > this.maxY) this.maxY = p.y;
    }

    const trackW = this.maxX - this.minX || 1;
    const trackH = this.maxY - this.minY || 1;

    const padding = 24;
    const availW = this.canvas.width - padding * 2;
    const availH = this.canvas.height - padding * 2;

    this.scale = Math.min(availW / trackW, availH / trackH);
    this.offsetX = this.canvas.width * 0.5 - ((this.minX + this.maxX) * 0.5) * this.scale;
    this.offsetY = this.canvas.height * 0.5 - ((this.minY + this.maxY) * 0.5) * this.scale;
  }

  /**
   * Render MiniMap Frame
   */
  public update(playerPos: THREE.Vector3, playerYaw: number, rivalsProgress: number[] = []): void {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const cx = w * 0.5;
    const cy = h * 0.5;
    const r = w * 0.5 - 3;

    // Clear frame
    ctx.clearRect(0, 0, w, h);

    // 1. Radar Glass Background
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(6, 10, 18, 0.75)';
    ctx.fill();

    // Radar Concentric Grid Rings
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.5, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.85, 0, Math.PI * 2);
    ctx.stroke();

    // Crosshairs
    ctx.beginPath();
    ctx.moveTo(cx, cy - r);
    ctx.lineTo(cx, cy + r);
    ctx.moveTo(cx - r, cy);
    ctx.lineTo(cx + r, cy);
    ctx.stroke();
    ctx.restore();

    // 2. Draw Circuit Track Ribbon
    if (this.trackPoints.length > 2) {
      ctx.save();
      ctx.beginPath();
      const p0 = this.worldToRadar(this.trackPoints[0].x, this.trackPoints[0].y);
      ctx.moveTo(p0.x, p0.y);

      for (let i = 1; i < this.trackPoints.length; i++) {
        const pt = this.worldToRadar(this.trackPoints[i].x, this.trackPoints[i].y);
        ctx.lineTo(pt.x, pt.y);
      }
      ctx.closePath();

      // Outer Glow
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 8;
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.85)';
      ctx.lineWidth = 3.5;
      ctx.stroke();

      // Inner Core Line
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Start / Finish Line Gold Notch
      ctx.fillStyle = '#ffe277';
      ctx.shadowColor = '#ffe277';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(p0.x, p0.y, 3.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    // 3. Draw Player Arrow with Live Heading
    const plRadar = this.worldToRadar(playerPos.x, playerPos.z);
    ctx.save();
    ctx.translate(plRadar.x, plRadar.y);
    // Heading rotation: in radar 2D, yaw 0 is -Z, yaw pi/2 is +X
    ctx.rotate(-playerYaw);

    // Glowing Arrowhead
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(4.5, 5);
    ctx.lineTo(0, 3);
    ctx.lineTo(-4.5, 5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 3b. Draw Rivals on Radar
    if (rivalsProgress && rivalsProgress.length > 0 && this.trackPoints.length > 0) {
      ctx.save();
      ctx.fillStyle = '#ff9900';
      ctx.shadowColor = '#ff9900';
      ctx.shadowBlur = 6;
      rivalsProgress.forEach((prog) => {
        const normT = ((prog % 1.0) + 1.0) % 1.0;
        const ptIdx = Math.floor(normT * (this.trackPoints.length - 1));
        const rPt = this.trackPoints[ptIdx];
        if (rPt) {
          const rRadar = this.worldToRadar(rPt.x, rPt.y);
          ctx.beginPath();
          ctx.arc(rRadar.x, rRadar.y, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      });
      ctx.restore();
    }

    // 4. Radar Outer Rim Ring
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }

  private worldToRadar(x: number, z: number): { x: number; y: number } {
    return {
      x: x * this.scale + this.offsetX,
      y: z * this.scale + this.offsetY,
    };
  }
}
