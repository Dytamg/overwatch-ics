import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { View } from '../sidebar-nav/sidebar-nav';
import { UserRole } from '../../services/auth';

@Component({
  selector: 'app-mobile-nav',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mobile-nav.html'
})
export class MobileNavComponent {
  @Input() currentView: View = 'scada';
  @Input() isOpen = false;
  // FIX: accept userRole so we can show/hide role-gated items
  @Input() userRole: UserRole = 'viewer';
  @Output() viewChange = new EventEmitter<View>();
  @Output() closeNav   = new EventEmitter<void>();

  mainItems = [
    { id: 'scada'  as View, label: 'SCADA Dashboard', icon: '⊞', roles: ['admin','operator','viewer'] },
    { id: 'logs'   as View, label: 'AI Log Analysis',  icon: '⌨', roles: ['admin','operator'] },
    { id: 'sesmag' as View, label: 'SESMag View',      icon: '📄', roles: ['admin','operator','viewer'] },
  ];
  systemItems = [
    { id: 'health'   as View, label: 'System Health', icon: '⚡', roles: ['admin','operator'] },
    { id: 'alerts'   as View, label: 'Alerts',        icon: '🔔', roles: ['admin','operator'] },
    { id: 'nodes'    as View, label: 'Node Manager',  icon: '🗄', roles: ['admin'] },
    { id: 'settings' as View, label: 'Settings',      icon: '⚙',  roles: ['admin'] },
  ];

  canSee(roles: string[]): boolean { return roles.includes(this.userRole); }
  selectView(id: View) { this.viewChange.emit(id); this.closeNav.emit(); }
}
