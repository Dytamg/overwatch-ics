import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NodeDataService, ICSNode, NodeStatus, SEED_NODES } from '../../services/node-data';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-node-manager',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './node-manager.html'
})
export class NodeManagerComponent {
  private dataService = inject(NodeDataService);
  private auth        = inject(AuthService);

  nodes         = this.dataService.nodes;
  isAdmin       = this.auth.isAdmin;
  showForm      = false;
  editingId: string | null = null;
  saving        = false;
  seeding       = false;
  toast         = '';
  toastType     = 'success';

  // FIX: replace browser confirm() with in-component confirm dialog
  confirmDialog: { show: boolean; message: string; onConfirm: () => void } = {
    show: false, message: '', onConfirm: () => {}
  };

  statusOptions: NodeStatus[] = ['nominal','warning','critical','offline'];
  typeOptions   = ['PLC','RTU','HMI','Server','Sensor'];

  form: Partial<ICSNode> = this.blank();

  blank(): Partial<ICSNode> {
    return { nodeId:'', name:'', type:'PLC', location:'', status:'nominal', metrics:[], lastUpdate:'just now' };
  }

  openCreate() { this.form = this.blank(); this.editingId = null; this.showForm = true; }

  openEdit(node: ICSNode) {
    this.form = { ...node };
    this.editingId = node.id ?? null;
    this.showForm = true;
  }

  async save() {
    if (!this.form.nodeId || !this.form.name) return;
    this.saving = true;
    try {
      if (this.editingId) {
        await this.dataService.updateNode(this.editingId, this.form);
        this.showToast('Node updated ✓');
      } else {
        await this.dataService.addNode(this.form as Omit<ICSNode,'id'>);
        this.showToast('Node created ✓');
      }
      this.showForm = false;
    } catch { this.showToast('Error saving node', 'error'); }
    this.saving = false;
  }

  async setStatus(node: ICSNode, status: NodeStatus) {
    if (!node.id) return;
    await this.dataService.updateNodeStatus(node.id, status);
    this.showToast(`${node.nodeId} → ${status}`);
  }

  // FIX: use in-component confirm dialog instead of browser confirm()
  remove(node: ICSNode) {
    this.confirmDialog = {
      show: true,
      message: `Delete node ${node.nodeId}? This cannot be undone.`,
      onConfirm: async () => {
        this.confirmDialog.show = false;
        if (!node.id) return;
        await this.dataService.removeNode(node.id);
        this.showToast('Node deleted');
      }
    };
  }

  seedDb() {
    this.confirmDialog = {
      show: true,
      message: 'Seed database with 8 sample nodes?',
      onConfirm: async () => {
        this.confirmDialog.show = false;
        this.seeding = true;
        await this.dataService.seedDatabase();
        this.seeding = false;
        this.showToast('Database seeded ✓');
      }
    };
  }

  showToast(msg: string, type = 'success') {
    this.toast     = msg;
    this.toastType = type;
    setTimeout(() => this.toast = '', 3000);
  }

  statusColor(s: string) {
    return ({nominal:'var(--status-nominal)',warning:'var(--status-warning)',critical:'var(--status-critical)',offline:'var(--status-offline)'} as any)[s];
  }
}
