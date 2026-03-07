import { Component, input, OnChanges, SimpleChanges, ElementRef, viewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimelineDataPoint } from '../../models/interfaces';

@Component({
  selector: 'app-timeline-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-gray-800 rounded-xl border border-gray-700 p-6">
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-lg font-semibold text-white">{{ title() }}</h3>
        <div class="flex items-center gap-2">
          @for (period of periods; track period.value) {
            <button
              (click)="selectedPeriod = period.value; periodChange()"
              class="text-xs px-3 py-1.5 rounded-lg transition-colors"
              [class.bg-indigo-600]="selectedPeriod === period.value"
              [class.text-white]="selectedPeriod === period.value"
              [class.text-gray-400]="selectedPeriod !== period.value"
              [class.hover:text-white]="selectedPeriod !== period.value"
              [class.hover:bg-gray-700]="selectedPeriod !== period.value"
            >
              {{ period.label }}
            </button>
          }
        </div>
      </div>
      <div class="relative h-64">
        <canvas #chartCanvas class="w-full h-full"></canvas>
        @if (data().length === 0) {
          <div class="absolute inset-0 flex items-center justify-center">
            <p class="text-gray-500 text-sm">No timeline data available</p>
          </div>
        }
      </div>
    </div>
  `
})
export class TimelineChartComponent implements AfterViewInit, OnChanges {
  data = input<TimelineDataPoint[]>([]);
  title = input<string>('Event Timeline');

  chartCanvas = viewChild.required<ElementRef<HTMLCanvasElement>>('chartCanvas');

  selectedPeriod = '24h';
  periods = [
    { label: '1H', value: '1h' },
    { label: '24H', value: '24h' },
    { label: '7D', value: '7d' },
    { label: '30D', value: '30d' }
  ];

  private ctx: CanvasRenderingContext2D | null = null;

  ngAfterViewInit(): void {
    this.initCanvas();
    this.drawChart();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && this.ctx) {
      this.drawChart();
    }
  }

  periodChange(): void {
    // Parent can react via data input changes
  }

  private initCanvas(): void {
    const canvas = this.chartCanvas().nativeElement;
    const parent = canvas.parentElement;
    if (parent) {
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
    }
    this.ctx = canvas.getContext('2d');
  }

  private drawChart(): void {
    if (!this.ctx) return;

    const canvas = this.chartCanvas().nativeElement;
    const parent = canvas.parentElement;
    if (parent) {
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
    }

    const ctx = this.ctx;
    const width = canvas.width;
    const height = canvas.height;
    const padding = { top: 20, right: 20, bottom: 40, left: 50 };

    ctx.clearRect(0, 0, width, height);

    const points = this.data();
    if (points.length === 0) return;

    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const maxVal = Math.max(...points.map(p => p.count), 1);
    const minVal = 0;
    const valueRange = maxVal - minVal;

    // Draw grid lines
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 0.5;
    const gridLines = 5;
    for (let i = 0; i <= gridLines; i++) {
      const y = padding.top + (chartHeight / gridLines) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();

      // Y-axis labels
      const val = Math.round(maxVal - (valueRange / gridLines) * i);
      ctx.fillStyle = '#9ca3af';
      ctx.font = '11px Inter, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(val.toString(), padding.left - 8, y + 4);
    }

    // Draw X-axis labels
    const labelCount = Math.min(points.length, 8);
    const labelStep = Math.max(1, Math.floor(points.length / labelCount));
    ctx.fillStyle = '#9ca3af';
    ctx.font = '11px Inter, sans-serif';
    ctx.textAlign = 'center';
    for (let i = 0; i < points.length; i += labelStep) {
      const x = padding.left + (i / (points.length - 1)) * chartWidth;
      const date = new Date(points[i].timestamp);
      const label = date.getHours().toString().padStart(2, '0') + ':' + date.getMinutes().toString().padStart(2, '0');
      ctx.fillText(label, x, height - padding.bottom + 20);
    }

    // Draw gradient fill
    const gradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
    gradient.addColorStop(0, 'rgba(99, 102, 241, 0.3)');
    gradient.addColorStop(1, 'rgba(99, 102, 241, 0.0)');

    ctx.beginPath();
    ctx.moveTo(padding.left, height - padding.bottom);

    for (let i = 0; i < points.length; i++) {
      const x = padding.left + (i / (points.length - 1)) * chartWidth;
      const y = padding.top + chartHeight - ((points[i].count - minVal) / valueRange) * chartHeight;
      if (i === 0) {
        ctx.lineTo(x, y);
      } else {
        const prevX = padding.left + ((i - 1) / (points.length - 1)) * chartWidth;
        const prevY = padding.top + chartHeight - ((points[i - 1].count - minVal) / valueRange) * chartHeight;
        const cpX = (prevX + x) / 2;
        ctx.bezierCurveTo(cpX, prevY, cpX, y, x, y);
      }
    }

    const lastX = padding.left + chartWidth;
    ctx.lineTo(lastX, height - padding.bottom);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw line
    ctx.beginPath();
    for (let i = 0; i < points.length; i++) {
      const x = padding.left + (i / (points.length - 1)) * chartWidth;
      const y = padding.top + chartHeight - ((points[i].count - minVal) / valueRange) * chartHeight;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        const prevX = padding.left + ((i - 1) / (points.length - 1)) * chartWidth;
        const prevY = padding.top + chartHeight - ((points[i - 1].count - minVal) / valueRange) * chartHeight;
        const cpX = (prevX + x) / 2;
        ctx.bezierCurveTo(cpX, prevY, cpX, y, x, y);
      }
    }

    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw dots on data points
    for (let i = 0; i < points.length; i++) {
      const x = padding.left + (i / (points.length - 1)) * chartWidth;
      const y = padding.top + chartHeight - ((points[i].count - minVal) / valueRange) * chartHeight;
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#6366f1';
      ctx.fill();
      ctx.strokeStyle = '#1f2937';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }
}
