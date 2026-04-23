import { Component, OnInit, OnDestroy, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

interface HealthMetric {
  label: string;
  value: number;
  unit: string;
  status: 'nominal' | 'warning' | 'critical';
  history: number[];
}

@Component({
  selector: 'app-system-health',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './system-health.html'
})
export class SystemHealthComponent implements OnInit, OnDestroy {
  private timer: any;

  // FIX: use signal so template computed works reactively
  metrics = signal<HealthMetric[]>([
    { label: 'SCADA Server CPU',      value: 52,  unit: '%',   status: 'nominal', history: [44,48,51,49,52,53,52] },
    { label: 'SCADA Server Memory',   value: 67,  unit: '%',   status: 'warning', history: [60,63,65,66,67,67,67] },
    { label: 'Network Throughput',    value: 847, unit: 'Mbps',status: 'nominal', history: [820,830,845,840,847,855,847] },
    { label: 'Database Read Latency', value: 12,  unit: 'ms',  status: 'nominal', history: [10,11,12,11,12,13,12] },
    { label: 'Active Connections',    value: 847, unit: '',    status: 'nominal', history: [800,820,835,840,845,847,847] },
    { label: 'Packet Loss Rate',      value: 0.2, unit: '%',   status: 'nominal', history: [0.1,0.2,0.1,0.2,0.2,0.3,0.2] },
    { label: 'IDS Alert Rate',        value: 3,   unit: '/hr', status: 'warning', history: [1,1,2,2,3,3,3] },
    { label: 'Firewall Blocks',       value: 127, unit: '/hr', status: 'nominal', history: [90,100,110,115,120,125,127] },
  ]);

  // FIX: computed banner — reflects real metric state instead of hardcoded string
  bannerStatus = computed(() => {
    const all = this.metrics();
    const critical = all.filter(m => m.status === 'critical').length;
    const warning  = all.filter(m => m.status === 'warning').length;
    const issues   = critical + warning;
    if (issues === 0) return null;
    const worstMetrics = all.filter(m => m.status !== 'nominal').map(m => m.label).join(' — ');
    return {
      count: issues,
      level: critical > 0 ? 'critical' : 'warning',
      color: critical > 0 ? 'var(--status-critical)' : 'var(--status-warning)',
      bg:    critical > 0 ? 'oklch(0.65 0.28 25 / 0.05)' : 'oklch(0.8 0.18 85 / 0.05)',
      border:critical > 0 ? 'oklch(0.65 0.28 25 / 0.4)'  : 'oklch(0.8 0.18 85 / 0.4)',
      text: worstMetrics,
    };
  });

  uptime = { days: 47, hours: 14, minutes: 32 };
  lastScan = '2026-04-19 22:40:00';

  ngOnInit() {
    this.timer = setInterval(() => {
      this.metrics.update(list => list.map(m => {
        const delta   = (Math.random() - 0.48) * (m.unit === '%' ? 2 : m.unit === 'ms' ? 1 : 5);
        const newVal  = Math.max(0, parseFloat((m.value + delta).toFixed(1)));
        const status: 'nominal'|'warning'|'critical' =
          m.unit === '%' && newVal > 85 ? 'critical' :
          m.unit === '%' && newVal > 70 ? 'warning' : 'nominal';
        return { ...m, value: newVal, status, history: [...m.history.slice(-6), newVal] };
      }));
      // Tick uptime minutes
      this.uptime = { ...this.uptime, minutes: (this.uptime.minutes + 1) % 60 };
    }, 2000);
  }

  ngOnDestroy() { clearInterval(this.timer); }

  statusColor(s: string) {
    return { nominal:'var(--status-nominal)', warning:'var(--status-warning)', critical:'var(--status-critical)' }[s] || 'var(--muted-foreground)';
  }

  barWidth(val: number, unit: string): string {
    if (unit === '%') return Math.min(val, 100) + '%';
    if (unit === 'ms') return Math.min((val / 100) * 100, 100) + '%';
    return '60%';
  }

  sparkLine(history: number[]): string {
    if (!history.length) return '';
    const max = Math.max(...history) || 1;
    const min = Math.min(...history);
    const range = max - min || 1;
    const w = 60, h = 24;
    const pts = history.map((v, i) => {
      const x = (i / (history.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x},${y}`;
    }).join(' ');
    return `M ${pts.split(' ').join(' L ')}`;
  }
}
