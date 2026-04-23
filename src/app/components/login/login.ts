import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html'
})
export class LoginComponent implements OnInit, OnDestroy {
  private auth = inject(AuthService);
  private timer: any;

  email        = '';
  password     = '';
  showPassword = false;
  isLoading    = false;

  get error() { return this.auth.authError(); }

  sessionId   = Math.random().toString(36).substring(2, 10).toUpperCase();
  currentTime = '';
  currentDate = new Date().toLocaleDateString();

  devAccounts = [
    { email: 'admin@sector7g.local',    role: 'ADMIN',    color: 'var(--status-critical)' },
    { email: 'operator@sector7g.local', role: 'OPERATOR', color: 'var(--status-warning)'  },
    { email: 'viewer@sector7g.local',   role: 'VIEWER',   color: 'var(--status-nominal)'  },
  ];

  // FIX: clock actually ticks on the login screen
  ngOnInit() {
    this.updateTime();
    this.timer = setInterval(() => this.updateTime(), 1000);
  }

  ngOnDestroy() { clearInterval(this.timer); }

  updateTime() {
    this.currentTime = new Date().toLocaleTimeString('en-US', { hour12: false });
  }

  fillCredentials(email: string) {
    this.email    = email;
    this.password = '12345678';
  }

  async handleSubmit() {
    if (!this.email || !this.password) return;
    this.isLoading = true;
    await this.auth.login(this.email, this.password);
    this.isLoading = false;
  }
}
