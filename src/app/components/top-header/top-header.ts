import { Component, Output, EventEmitter, OnInit, OnDestroy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface HeaderAlert {
  id: number;
  type: 'critical' | 'warning';
  message: string;
  time: string;
}

@Component({
  selector: 'app-top-header',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './top-header.html'
})
export class TopHeaderComponent implements OnInit, OnDestroy {
  @Output() menuClick    = new EventEmitter<void>();
  // FIX: accept live alertCount from dashboard so badge is always accurate
  @Input()  alertCount   = 0;

  currentTime = '';
  showAlerts  = false;
  searchQuery = '';
  private timer: any;

  alerts: HeaderAlert[] = [
    { id: 1, type: 'critical', message: 'RTU-012 communication failure detected',           time: '2m ago'  },
    { id: 2, type: 'warning',  message: 'Temperature threshold approaching on Sensor-B2',   time: '5m ago'  },
    { id: 3, type: 'critical', message: 'Unauthorized access attempt blocked',              time: '12m ago' },
  ];

  // FIX: keep badge in sync with Input alertCount (parent owns source of truth)
  get visibleAlertCount() { return this.alertCount > 0 ? this.alertCount : this.alerts.length; }

  ngOnInit() {
    this.updateTime();
    this.timer = setInterval(() => this.updateTime(), 1000);
  }

  ngOnDestroy() { clearInterval(this.timer); }

  updateTime() {
    this.currentTime = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }
}
