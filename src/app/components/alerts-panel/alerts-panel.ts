import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';

interface Alert {
  id: number;
  type: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  source: string;
  time: string;
  acknowledged: boolean;
}

@Component({
  selector: 'app-alerts-panel',
  standalone: true,
  imports: [CommonModule, TitleCasePipe],
  templateUrl: './alerts-panel.html'
})
export class AlertsPanelComponent implements OnInit {
  // FIX: emit unacknowledged count to parent (dashboard) so badge stays in sync
  @Output() unacknowledgedChange = new EventEmitter<number>();

  filter = 'all';

  alerts: Alert[] = [
    { id: 1, type: 'critical', title: 'RTU-012 Communication Failure',         message: 'Remote Terminal Unit 12 at Sector C has lost communication. Last seen 12 seconds ago.',                        source: 'RTU-012',  time: '2m ago',  acknowledged: false },
    { id: 2, type: 'critical', title: 'Unauthorized Access Attempt Blocked',   message: 'Firewall blocked 3 unauthorized connection attempts from 203.0.113.45 to SCADA port 502.',                     source: 'PA-5260',  time: '12m ago', acknowledged: false },
    { id: 3, type: 'warning',  title: 'Temperature Threshold Approaching',     message: 'Reactor Vessel 2 temperature at 187°F — threshold is 200°F. Rate: +12°F/hr.',                                source: 'SENSOR-B2',time: '5m ago',  acknowledged: false },
    { id: 4, type: 'warning',  title: 'RTU-007 Signal Degradation',            message: 'RTU-007 signal dropped to -67 dBm. Packet loss at 2.3%. Check antenna alignment.',                            source: 'RTU-007',  time: '18m ago', acknowledged: true  },
    { id: 5, type: 'warning',  title: 'SCADA Server Memory Elevated',          message: 'SCADA Master Server memory usage at 67%. Monitor for further increase.',                                       source: 'SCADA-01', time: '34m ago', acknowledged: true  },
    { id: 6, type: 'info',     title: 'Scheduled Maintenance Window',          message: 'PLC-002 entering scheduled standby maintenance window. Duration: 4 hours.',                                    source: 'PLC-002',  time: '1h ago',  acknowledged: true  },
    { id: 7, type: 'info',     title: 'Firewall Rule Update Applied',          message: '12 new block rules added from ICS-CERT advisory ICS-2024-001.',                                               source: 'PA-5260',  time: '2h ago',  acknowledged: true  },
  ];

  ngOnInit() {
    // Emit initial count on mount
    this.unacknowledgedChange.emit(this.unacknowledged);
  }

  get filtered() {
    return this.filter === 'all' ? this.alerts : this.alerts.filter(a => a.type === this.filter);
  }
  get unacknowledged() { return this.alerts.filter(a => !a.acknowledged).length; }
  countByType(t: string) { return this.alerts.filter(a => a.type === t).length; }

  acknowledge(id: number) {
    this.alerts = this.alerts.map(a => a.id === id ? { ...a, acknowledged: true } : a);
    this.unacknowledgedChange.emit(this.unacknowledged);
  }

  acknowledgeAll() {
    this.alerts = this.alerts.map(a => ({ ...a, acknowledged: true }));
    this.unacknowledgedChange.emit(0);
  }

  typeColor(t: string) {
    return ({ critical:'var(--status-critical)', warning:'var(--status-warning)', info:'var(--neon-cyan)' } as any)[t] || 'var(--muted-foreground)';
  }
  typeBg(t: string) {
    return ({ critical:'oklch(0.65 0.28 25 / 0.1)', warning:'oklch(0.8 0.18 85 / 0.1)', info:'oklch(0.75 0.15 195 / 0.1)' } as any)[t] || 'transparent';
  }
  typeIcon(t: string) { return ({ critical:'✕', warning:'⚠', info:'ℹ' } as any)[t] || '?'; }
}
