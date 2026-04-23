import { Component, inject, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NodeDataService, LogEntry, ThreatSummary } from '../../services/node-data';

@Component({
  selector: 'app-ai-log-analysis',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ai-log-analysis.html'
})
export class AiLogAnalysisComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('terminalRef') terminalRef!: ElementRef<HTMLDivElement>;

  private dataService = inject(NodeDataService);
  private allLogs = this.dataService.mockLogs;
  private logInterval: any;
  private currentIndex = 0;
  private shouldScroll = false;

  visibleLogs: LogEntry[] = [];
  isStreaming = true;

  threats: ThreatSummary[] = [
    {
      id: 'THREAT-001',
      title: 'Potential MODBUS Command Injection Attack',
      severity: 'critical',
      confidence: 94,
      description: 'Analysis detected unauthorized write operations originating from IP 172.16.5.99 targeting multiple PLCs in Sector A. The attack pattern matches known ICS-specific malware signatures associated with the TRITON framework.',
      indicators: [
        'Unauthorized source IP (172.16.5.99) not in whitelist',
        'Write commands to safety-critical coils (addr 0x00FF)',
        'Rapid sequential writes across multiple targets',
        'Force Listen Only Mode command detected',
      ],
      recommendation: 'Immediately isolate IP 172.16.5.99 from the network. Initiate incident response protocol ICS-IR-001. Verify integrity of affected PLC configurations.',
      timestamp: '2024-01-15T14:32:50.500Z'
    },
    {
      id: 'THREAT-002',
      title: 'DNP3 Protocol Anomaly - Unusual IIN Flags',
      severity: 'medium',
      confidence: 72,
      description: 'Unsolicited response from RTU at 10.0.0.50 contains Internal Indications (IIN) flags suggesting device tampering or configuration changes. IIN byte 0x8100 indicates device restart and configuration corrupt flags.',
      indicators: [
        'IIN flags indicate device restart (0x80)',
        'Configuration corrupt flag set (0x01)',
        'Unsolicited response without polling',
      ],
      recommendation: 'Investigate RTU at 10.0.0.50 for unauthorized changes. Compare current configuration against baseline. Check for physical access attempts.',
      timestamp: '2024-01-15T14:32:48.500Z'
    }
  ];

  ngOnInit() {
    this.startStreaming();
  }

  ngOnDestroy() {
    this.stopStreaming();
  }

  ngAfterViewChecked() {
    if (this.shouldScroll && this.terminalRef) {
      const el = this.terminalRef.nativeElement;
      el.scrollTop = el.scrollHeight;
      this.shouldScroll = false;
    }
  }

  toggleStreaming() {
    this.isStreaming = !this.isStreaming;
    if (this.isStreaming) this.startStreaming();
    else this.stopStreaming();
  }

  private startStreaming() {
    this.logInterval = setInterval(() => {
      const entry = this.allLogs[this.currentIndex];
      if (entry) {
        const newEntry: LogEntry = { ...entry, timestamp: new Date().toISOString() };
        this.visibleLogs = [...this.visibleLogs, newEntry].slice(-50);
        this.shouldScroll = true;
      }
      this.currentIndex = (this.currentIndex + 1) % this.allLogs.length;
    }, 800);
  }

  private stopStreaming() {
    clearInterval(this.logInterval);
  }

  severityColor(severity: string): string {
    return { info: 'var(--neon-cyan)', warning: 'var(--neon-amber)', critical: 'var(--neon-red)' }[severity] || 'var(--muted-foreground)';
  }

  threatBorderColor(severity: string): string {
    return { low: 'oklch(0.75 0.2 145 / 0.3)', medium: 'oklch(0.8 0.18 85 / 0.3)', high: 'oklch(0.8 0.18 85 / 0.3)', critical: 'oklch(0.65 0.28 25 / 0.5)' }[severity] || 'var(--border)';
  }

  threatBgColor(severity: string): string {
    return { low: 'oklch(0.75 0.2 145 / 0.1)', medium: 'oklch(0.8 0.18 85 / 0.1)', high: 'oklch(0.8 0.18 85 / 0.1)', critical: 'oklch(0.65 0.28 25 / 0.1)' }[severity] || 'transparent';
  }

  threatTextColor(severity: string): string {
    return { low: 'var(--status-nominal)', medium: 'var(--neon-amber)', high: 'var(--status-warning)', critical: 'var(--status-critical)' }[severity] || 'var(--foreground)';
  }
}
