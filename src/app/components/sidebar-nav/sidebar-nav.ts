import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppUser, UserRole } from '../../services/auth';

export type View = 'scada' | 'logs' | 'sesmag' | 'health' | 'alerts' | 'settings' | 'nodes';

@Component({
  selector: 'app-sidebar-nav',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidebar-nav.html'
})
export class SidebarNavComponent {
  @Input() currentView: View = 'scada';
  @Input() alertCount  = 3;
  @Input() userRole: UserRole = 'viewer';
  @Input() currentUser: AppUser | null = null;
  @Output() viewChange  = new EventEmitter<View>();
  @Output() logoutClick = new EventEmitter<void>();

  mainItems = [
    { id: 'scada'  as View, label: 'SCADA Dashboard', icon: '⊞', roles: ['admin','operator','viewer'] },
    { id: 'logs'   as View, label: 'AI Log Analysis',  icon: '⌨', roles: ['admin','operator'] },
    { id: 'sesmag' as View, label: 'SESMag View',      icon: '📄', roles: ['admin','operator','viewer'] },
  ];

  systemItems = [
    { id: 'health'   as View, label: 'System Health', icon: '⚡', roles: ['admin','operator'] },
    { id: 'alerts'   as View, label: 'Alerts',        icon: '🔔', roles: ['admin','operator'] },
    { id: 'settings' as View, label: 'Settings',      icon: '⚙', roles: ['admin'] },
  ];

  canSee(roles: string[]): boolean {
    return roles.includes(this.userRole);
  }

  roleColor(role: UserRole): string {
    return { admin:'var(--status-critical)', operator:'var(--status-warning)', viewer:'var(--status-nominal)' }[role] || 'var(--muted-foreground)';
  }

  initials(): string {
    const name = this.currentUser?.displayName || this.currentUser?.email || 'OP';
    return name.substring(0, 2).toUpperCase();
  }
}
