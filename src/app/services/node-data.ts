import { Injectable, signal, inject, NgZone } from '@angular/core';
import {
  collection, query, orderBy,
  addDoc, updateDoc, deleteDoc, doc, serverTimestamp,
  onSnapshot, QuerySnapshot, DocumentData
} from 'firebase/firestore';
import { FirebaseService } from './firebase';

export type NodeStatus = 'nominal' | 'warning' | 'critical' | 'offline';

export interface ICSNode {
  id?:        string;
  nodeId:     string;
  name:       string;
  type:       string;
  location:   string;
  status:     NodeStatus;
  metrics:    { label: string; value: string; unit: string; trend?: 'up'|'down'|'stable' }[];
  lastUpdate: string;
  createdAt?: any;
}

export interface LogEntry {
  timestamp: string; source: string; destination: string;
  protocol: string; action: string;
  severity: 'info'|'warning'|'critical'; raw: string;
}

export interface ThreatSummary {
  id: string; title: string; severity: 'low'|'medium'|'high'|'critical';
  confidence: number; description: string;
  indicators: string[]; recommendation: string; timestamp: string;
}

export const SEED_NODES: Omit<ICSNode,'id'>[] = [
  { nodeId:'PLC-001', name:'Primary PLC Controller',   type:'PLC',    location:'Sector A - Control Room',  status:'nominal',
    metrics:[{label:'CPU Load',value:'34',unit:'%',trend:'stable'},{label:'Memory',value:'2.4',unit:'GB',trend:'up'},{label:'I/O Cycles',value:'1,247',unit:'/s',trend:'stable'}], lastUpdate:'2s ago'},
  { nodeId:'RTU-007', name:'Remote Terminal Unit 7',   type:'RTU',    location:'Sector B - Field Station', status:'warning',
    metrics:[{label:'Signal',value:'-67',unit:'dBm',trend:'down'},{label:'Latency',value:'145',unit:'ms',trend:'up'},{label:'Packet Loss',value:'2.3',unit:'%',trend:'up'}], lastUpdate:'5s ago'},
  { nodeId:'HMI-003', name:'HMI Workstation 3',        type:'HMI',    location:'Sector A - Ops Center',    status:'nominal',
    metrics:[{label:'CPU',value:'28',unit:'%',trend:'stable'},{label:'Display',value:'4K',unit:'',trend:'stable'},{label:'Uptime',value:'47',unit:'days',trend:'up'}], lastUpdate:'1s ago'},
  { nodeId:'SCADA-01',name:'SCADA Master Server',      type:'Server', location:'Data Center - Rack 12',    status:'nominal',
    metrics:[{label:'CPU',value:'52',unit:'%',trend:'up'},{label:'Memory',value:'64',unit:'GB',trend:'stable'},{label:'Connections',value:'847',unit:'',trend:'up'}], lastUpdate:'1s ago'},
  { nodeId:'PLC-002', name:'Backup PLC Controller',    type:'PLC',    location:'Sector A - Control Room',  status:'offline',
    metrics:[{label:'CPU Load',value:'--',unit:''},{label:'Memory',value:'--',unit:''},{label:'Status',value:'STANDBY',unit:''}], lastUpdate:'Offline'},
  { nodeId:'RTU-012', name:'Remote Terminal Unit 12',  type:'RTU',    location:'Sector C - Pump Station',  status:'critical',
    metrics:[{label:'Signal',value:'-89',unit:'dBm',trend:'down'},{label:'Latency',value:'890',unit:'ms',trend:'up'},{label:'Errors',value:'147',unit:'',trend:'up'}], lastUpdate:'12s ago'},
  { nodeId:'SENSOR-A1',name:'Pressure Sensor Array A', type:'Sensor', location:'Pipeline Junction 4',      status:'nominal',
    metrics:[{label:'Pressure',value:'142',unit:'PSI',trend:'stable'},{label:'Flow Rate',value:'1,847',unit:'GPM',trend:'up'},{label:'Temp',value:'67',unit:'F',trend:'stable'}], lastUpdate:'1s ago'},
  { nodeId:'SENSOR-B2',name:'Temperature Monitor B',   type:'Sensor', location:'Reactor Vessel 2',         status:'warning',
    metrics:[{label:'Temp',value:'187',unit:'F',trend:'up'},{label:'Delta',value:'+12',unit:'F/hr',trend:'up'},{label:'Threshold',value:'85',unit:'%',trend:'up'}], lastUpdate:'2s ago'},
];

@Injectable({ providedIn: 'root' })
export class NodeDataService {
  private fb   = inject(FirebaseService);
  private zone = inject(NgZone);
  private col  = collection(this.fb.firestore, 'nodes');

  // ── Reactive signal — updated via Firestore real-time listener ──────────
  readonly nodes = signal<ICSNode[]>(SEED_NODES as ICSNode[]);

  constructor() {
    // Real-time listener: updates signal whenever Firestore changes
    const q = query(this.col, orderBy('nodeId'));
    onSnapshot(q, (snap: QuerySnapshot<DocumentData>) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as ICSNode));
      this.zone.run(() => this.nodes.set(data.length ? data : SEED_NODES as ICSNode[]));
    }, () => {
      // On error (e.g. config not set yet) keep mock data
    });
  }

  // ── CREATE ────────────────────────────────────────────────────────────────
  async addNode(node: Omit<ICSNode,'id'>): Promise<void> {
    await addDoc(this.col, { ...node, createdAt: serverTimestamp() });
  }

  // ── UPDATE ────────────────────────────────────────────────────────────────
  async updateNode(id: string, partial: Partial<ICSNode>): Promise<void> {
    await updateDoc(doc(this.fb.firestore, 'nodes', id), {
      ...partial, lastUpdate: new Date().toLocaleTimeString()
    });
  }

  // ── UPDATE STATUS ─────────────────────────────────────────────────────────
  async updateNodeStatus(id: string, status: NodeStatus): Promise<void> {
    await this.updateNode(id, { status });
  }

  // ── DELETE ────────────────────────────────────────────────────────────────
  async removeNode(id: string): Promise<void> {
    await deleteDoc(doc(this.fb.firestore, 'nodes', id));
  }

  // ── SEED — populates Firestore with sample nodes ──────────────────────────
  async seedDatabase(): Promise<void> {
    for (const node of SEED_NODES) {
      await addDoc(this.col, { ...node, createdAt: serverTimestamp() });
    }
  }

  // ── Mock log feed ─────────────────────────────────────────────────────────
  readonly mockLogs: LogEntry[] = [
    { timestamp:'2024-01-15T14:32:47.123Z', source:'192.168.1.45',  destination:'10.0.0.12', protocol:'MODBUS', action:'READ_COILS',        severity:'info',    raw:'[14:32:47.123] MODBUS/TCP 192.168.1.45 -> 10.0.0.12:502 FC=01 READ_COILS addr=0x0000 qty=16' },
    { timestamp:'2024-01-15T14:32:47.456Z', source:'192.168.1.45',  destination:'10.0.0.12', protocol:'MODBUS', action:'READ_HOLDING_REG',  severity:'info',    raw:'[14:32:47.456] MODBUS/TCP 192.168.1.45 -> 10.0.0.12:502 FC=03 READ_HOLDING_REG addr=0x0100 qty=8' },
    { timestamp:'2024-01-15T14:32:48.012Z', source:'10.0.0.50',     destination:'10.0.0.12', protocol:'DNP3',   action:'UNSOLICITED_RESP',  severity:'warning', raw:'[14:32:48.012] DNP3 10.0.0.50 -> 10.0.0.12:20000 UNSOLICITED_RESPONSE Class1=YES IIN=0x8100' },
    { timestamp:'2024-01-15T14:32:48.234Z', source:'172.16.5.99',   destination:'10.0.0.12', protocol:'MODBUS', action:'WRITE_SINGLE_COIL', severity:'critical',raw:'[14:32:48.234] MODBUS/TCP 172.16.5.99 -> 10.0.0.12:502 FC=05 WRITE_SINGLE_COIL addr=0x00FF val=0xFF00 [ANOMALY]' },
    { timestamp:'2024-01-15T14:32:48.567Z', source:'192.168.1.45',  destination:'10.0.0.13', protocol:'OPC-UA', action:'BROWSE_REQUEST',    severity:'info',    raw:'[14:32:48.567] OPC-UA 192.168.1.45 -> 10.0.0.13:4840 BROWSE_REQUEST nodeId=ns=2;s=Channel1' },
    { timestamp:'2024-01-15T14:32:49.001Z', source:'172.16.5.99',   destination:'10.0.0.14', protocol:'MODBUS', action:'WRITE_MULTIPLE_REG',severity:'critical',raw:'[14:32:49.001] MODBUS/TCP 172.16.5.99 -> 10.0.0.14:502 FC=16 WRITE_MULTIPLE_REG addr=0x0200 qty=10 [ANOMALY]' },
    { timestamp:'2024-01-15T14:32:49.345Z', source:'10.0.0.12',     destination:'192.168.1.45',protocol:'MODBUS',action:'RESPONSE',         severity:'info',    raw:'[14:32:49.345] MODBUS/TCP 10.0.0.12 -> 192.168.1.45:52341 RESPONSE FC=03 byte_count=16 data=[0x00,0x64,...]' },
    { timestamp:'2024-01-15T14:32:49.789Z', source:'192.168.1.100', destination:'10.0.0.12', protocol:'ICMP',   action:'ECHO_REQUEST',      severity:'info',    raw:'[14:32:49.789] ICMP 192.168.1.100 -> 10.0.0.12 ECHO_REQUEST seq=1 ttl=64' },
    { timestamp:'2024-01-15T14:32:50.123Z', source:'172.16.5.99',   destination:'10.0.0.15', protocol:'MODBUS', action:'FORCE_LISTEN_ONLY', severity:'critical',raw:'[14:32:50.123] MODBUS/TCP 172.16.5.99 -> 10.0.0.15:502 FC=08 FORCE_LISTEN_ONLY_MODE [CRITICAL ANOMALY]' },
  ];
}
