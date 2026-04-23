import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth';
import { View } from '../sidebar-nav/sidebar-nav';
import { SidebarNavComponent } from '../sidebar-nav/sidebar-nav';
import { TopHeaderComponent } from '../top-header/top-header';
import { MobileNavComponent } from '../mobile-nav/mobile-nav';
import { ScadaDashboardComponent } from '../scada-dashboard/scada-dashboard';
import { AiLogAnalysisComponent } from '../ai-log-analysis/ai-log-analysis';
import { SesmagViewComponent } from '../sesmag-view/sesmag-view';
import { SystemHealthComponent } from '../system-health/system-health';
import { AlertsPanelComponent } from '../alerts-panel/alerts-panel';
import { SettingsPanelComponent } from '../settings-panel/settings-panel';
import { NodeManagerComponent } from '../node-manager/node-manager';
import { AiChatbotComponent } from '../ai-chatbot/ai-chatbot';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    SidebarNavComponent, TopHeaderComponent, MobileNavComponent,
    ScadaDashboardComponent, AiLogAnalysisComponent, SesmagViewComponent,
    SystemHealthComponent, AlertsPanelComponent, SettingsPanelComponent,
    NodeManagerComponent, AiChatbotComponent,
  ],
  templateUrl: './dashboard.html'
})
export class DashboardComponent {
  private authService = inject(AuthService);

  currentView: View = 'scada';
  mobileNavOpen      = false;

  // FIX: alertCount is now a signal so it can be mutated by child via callback
  alertCount = signal(3);

  currentUser = this.authService.currentUser;
  userRole    = this.authService.userRole;
  isAdmin     = this.authService.isAdmin;
  isOperator  = this.authService.isOperator;

  canAccess(view: string): boolean {
    return this.authService.canAccess(view);
  }

  setView(view: View) {
    if (this.canAccess(view)) this.currentView = view;
  }

  // Called by alerts-panel when unacknowledged count changes
  onAlertCountChange(count: number) {
    this.alertCount.set(count);
  }

  async logout() {
    await this.authService.logout();
  }
}
