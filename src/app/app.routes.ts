import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './services/auth';
import { LoginComponent } from './components/login/login';
import { DashboardComponent } from './components/dashboard/dashboard';

// ── Auth guard: must be logged in ──────────────────────────────────────────
const authGuard = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);
  if (auth.isAuthenticated()) return true;
  return router.createUrlTree(['/login']);
};

// ── Guest guard: redirect logged-in users away from login page ─────────────
const guestGuard = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);
  if (!auth.isAuthenticated()) return true;
  return router.createUrlTree(['/dashboard']);
};

export const routes: Routes = [
  { path: 'login',     component: LoginComponent,     canActivate: [guestGuard] },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard]  },
  { path: '',          redirectTo: '/login', pathMatch: 'full' },
  { path: '**',        redirectTo: '/login' },
];
