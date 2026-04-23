import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sesmag-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sesmag-view.html'
})
export class SesmagViewComponent {
  systemSpecs = [
    { category: 'SCADA Master Server', items: [
      { label: 'Model', value: 'Schneider Electric ClearSCADA' },
      { label: 'Version', value: '2023.1.2 Build 4521' },
      { label: 'OS', value: 'Windows Server 2022 Datacenter' },
      { label: 'CPU', value: 'Intel Xeon Gold 6342 (24C/48T)' },
      { label: 'Memory', value: '256 GB DDR4-3200 ECC' },
      { label: 'Storage', value: '4TB NVMe RAID-10 + 48TB SAS RAID-6' },
      { label: 'Network', value: '4x 10GbE + 2x 25GbE (Bonded)' },
      { label: 'Redundancy', value: 'Hot Standby with Auto-Failover' },
    ]},
    { category: 'PLC Controllers', items: [
      { label: 'Primary', value: 'Siemens S7-1500 CPU 1518-4' },
      { label: 'Firmware', value: 'V2.9.4' },
      { label: 'Program Memory', value: '10 MB' },
      { label: 'I/O Channels', value: '2,048 Digital + 512 Analog' },
      { label: 'Protocols', value: 'PROFINET, Modbus TCP, OPC-UA' },
      { label: 'Safety', value: 'SIL 3 / PL e Certified' },
      { label: 'Cycle Time', value: '< 1ms guaranteed' },
    ]},
    { category: 'Network Infrastructure', items: [
      { label: 'Core Switches', value: 'Cisco Nexus 9364C (2x)' },
      { label: 'Distribution', value: 'Cisco IE-4010-4S24P (12x)' },
      { label: 'Access Layer', value: 'Stratix 5700 Managed (48x)' },
      { label: 'Firewall', value: 'Palo Alto PA-5260 (HA Pair)' },
      { label: 'IDS/IPS', value: 'Claroty CTD + Nozomi Guardian' },
      { label: 'Segmentation', value: 'ISA/IEC 62443 Zone Model' },
      { label: 'Latency', value: '< 5ms end-to-end' },
    ]},
    { category: 'Security Configuration', items: [
      { label: 'Standard', value: 'IEC 62443-3-3 SL2 Certified' },
      { label: 'Authentication', value: 'RADIUS + PKI Certificates' },
      { label: 'Encryption', value: 'TLS 1.3 / AES-256-GCM' },
      { label: 'Logging', value: 'Centralized SIEM (Splunk)' },
      { label: 'Backup', value: 'Immutable + Air-Gapped (Daily)' },
      { label: 'Patch Cycle', value: '90-day OT Window' },
      { label: 'Pen Testing', value: 'Annual ICS-CERT Assessment' },
    ]},
  ];

  architectureLayers = [
    { name: 'Enterprise Zone', level: 'Level 5',
      components: [{ name: 'ERP System', type: 'SAP S/4HANA', status: 'active' }, { name: 'Business Analytics', type: 'Power BI', status: 'active' }, { name: 'Email Gateway', type: 'Exchange Online', status: 'active' }],
      description: 'Corporate IT systems and business intelligence platforms with strict access controls to lower levels.' },
    { name: 'DMZ / Industrial DMZ', level: 'Level 4',
      components: [{ name: 'Historian Server', type: 'OSIsoft PI', status: 'active' }, { name: 'Data Diode', type: 'Waterfall Unidirectional', status: 'active' }, { name: 'Jump Server', type: 'CyberArk PAM', status: 'active' }],
      description: 'Secure boundary between IT and OT networks. All data flows through data diodes and proxy servers.' },
    { name: 'Operations Zone', level: 'Level 3',
      components: [{ name: 'SCADA Server', type: 'ClearSCADA Primary', status: 'active' }, { name: 'SCADA Backup', type: 'ClearSCADA Standby', status: 'standby' }, { name: 'Engineering WS', type: 'TIA Portal V18', status: 'active' }],
      description: 'SCADA servers, engineering workstations, and operations management systems.' },
    { name: 'Control Zone', level: 'Level 2',
      components: [{ name: 'HMI Station 1', type: 'WinCC Unified', status: 'active' }, { name: 'HMI Station 2', type: 'WinCC Unified', status: 'active' }, { name: 'Alarm Server', type: 'PADS4', status: 'active' }],
      description: 'Human-machine interfaces and local control systems for operator interaction.' },
    { name: 'Field Zone', level: 'Level 1',
      components: [{ name: 'PLC-001', type: 'S7-1500 Primary', status: 'active' }, { name: 'PLC-002', type: 'S7-1500 Backup', status: 'standby' }, { name: 'RTU Array', type: 'Schneider T3530', status: 'active' }],
      description: 'Programmable logic controllers, remote terminal units, and safety controllers.' },
    { name: 'Process Zone', level: 'Level 0',
      components: [{ name: 'Sensor Network', type: 'HART/Foundation', status: 'active' }, { name: 'Actuators', type: 'PROFINET Drives', status: 'active' }, { name: 'Safety Interlocks', type: 'F-CPU', status: 'active' }],
      description: 'Physical sensors, actuators, and safety instrumented systems directly interfacing with the process.' },
  ];

  certifications = [
    { cert: 'IEC 62443-3-3', level: 'SL2', status: 'Certified' },
    { cert: 'NIST SP 800-82', level: 'Rev.3', status: 'Compliant' },
    { cert: 'NERC CIP', level: 'v7', status: 'Compliant' },
    { cert: 'ISO 27001:2022', level: 'Full', status: 'Certified' },
    { cert: 'SOC 2 Type II', level: 'Annual', status: 'Attested' },
    { cert: 'ICS-CERT', level: 'Annual', status: 'Assessed' },
  ];

  statusDot(status: string) {
    return { active: 'var(--status-nominal)', standby: 'var(--status-warning)', offline: 'var(--status-offline)' }[status] || 'var(--border)';
  }
}
