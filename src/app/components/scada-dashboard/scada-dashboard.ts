import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { NodeDataService, NodeStatus } from '../../services/node-data';

type FilterStatus = NodeStatus | 'all';

@Component({
  selector: 'app-scada-dashboard',
  standalone: true,
  imports: [CommonModule, TitleCasePipe],
  templateUrl: './scada-dashboard.html'
})
export class ScadaDashboardComponent {
  private dataService = inject(NodeDataService);

  // FIX: filterStatus must be a signal for computed() to react to it
  filterStatus = signal<FilterStatus>('all');
  filterOptions: FilterStatus[] = ['all', 'critical', 'warning', 'nominal', 'offline'];

  nodes = this.dataService.nodes;

  filteredNodes = computed(() => {
    const all  = this.nodes();
    const filt = this.filterStatus();
    return filt === 'all' ? all : all.filter(n => n.status === filt);
  });

  stats = computed(() => {
    const all = this.nodes();
    return [
      { label: 'Nominal',  value: all.filter(n => n.status === 'nominal').length,  status: 'nominal'  as NodeStatus },
      { label: 'Warning',  value: all.filter(n => n.status === 'warning').length,  status: 'warning'  as NodeStatus },
      { label: 'Critical', value: all.filter(n => n.status === 'critical').length, status: 'critical' as NodeStatus },
      { label: 'Offline',  value: all.filter(n => n.status === 'offline').length,  status: 'offline'  as NodeStatus },
    ];
  });

  setFilter(f: string) { this.filterStatus.set(f as FilterStatus); }

  statusColor(s: string) {
    return ({ nominal:'var(--status-nominal)', warning:'var(--status-warning)', critical:'var(--status-critical)', offline:'var(--status-offline)' } as any)[s] || 'var(--muted-foreground)';
  }
  statusIcon(s: string) {
    return ({ nominal:'✓', warning:'⚠', critical:'✕', offline:'○' } as any)[s] || '?';
  }
  typeIcon(t: string) {
    return ({ PLC:'⚙', RTU:'📡', HMI:'🖥', Server:'💾', Sensor:'🌡' } as any)[t] || '📦';
  }
  trendIcon(trend?: string) {
    return ({ up:'↑', down:'↓', stable:'→' } as any)[trend ?? ''] || '';
  }
  trendColor(trend?: string) {
    return trend === 'up' ? 'var(--status-warning)' : trend === 'down' ? 'var(--status-nominal)' : 'transparent';
  }
}
