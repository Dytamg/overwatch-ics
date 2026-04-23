import { Injectable, signal, computed, inject, NgZone } from '@angular/core';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import {
  doc, getDoc, setDoc
} from 'firebase/firestore';
import { Router } from '@angular/router';
import { FirebaseService } from './firebase';

export type UserRole = 'admin' | 'operator' | 'viewer';

export interface AppUser {
  uid:         string;
  email:       string;
  displayName: string;
  role:        UserRole;
  facility:    string;
  lastLogin:   string;
}

// ── Role permission matrix ──────────────────────────────────────────────────
const PERMISSIONS: Record<UserRole, string[]> = {
  admin:    ['scada','logs','sesmag','health','alerts','settings','nodes','crud'],
  operator: ['scada','logs','sesmag','health','alerts'],
  viewer:   ['scada','sesmag'],
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private fb     = inject(FirebaseService);
  private router = inject(Router);
  private zone   = inject(NgZone);

  private _user    = signal<AppUser | null>(null);
  private _loading = signal(true);
  private _error   = signal('');

  readonly currentUser     = this._user.asReadonly();
  readonly isLoading       = this._loading.asReadonly();
  readonly authError       = this._error.asReadonly();
  readonly isAuthenticated = computed(() => this._user() !== null);
  readonly userRole        = computed(() => this._user()?.role ?? 'viewer');
  readonly isAdmin         = computed(() => this._user()?.role === 'admin');
  readonly isOperator      = computed(() => ['admin','operator'].includes(this._user()?.role ?? ''));

  constructor() {
    onAuthStateChanged(this.fb.auth, async (u: User | null) => {
      if (u) {
        const profile = await this.loadProfile(u);
        this.zone.run(() => {
          this._user.set(profile);
          this._loading.set(false);
        });
      } else {
        this.zone.run(() => {
          this._user.set(null);
          this._loading.set(false);
        });
      }
    });
  }

  // ── Load role from Firestore users collection ───────────────────────────
  private async loadProfile(u: User): Promise<AppUser> {
    const ref  = doc(this.fb.firestore, 'users', u.uid);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const d = snap.data() as Partial<AppUser>;
      return {
        uid:         u.uid,
        email:       u.email ?? '',
        displayName: d.displayName ?? u.email?.split('@')[0] ?? 'User',
        role:        d.role ?? 'viewer',
        facility:    d.facility ?? 'SECTOR-7G',
        lastLogin:   new Date().toISOString(),
      };
    }
    // First login — auto-create viewer profile
    const profile: AppUser = {
      uid: u.uid, email: u.email ?? '',
      displayName: u.email?.split('@')[0] ?? 'User',
      role: 'viewer', facility: 'SECTOR-7G',
      lastLogin: new Date().toISOString(),
    };
    await setDoc(ref, profile);
    return profile;
  }

  // ── Login — Firebase bcrypt handles password security automatically ──────
  async login(email: string, password: string): Promise<boolean> {
    this._error.set('');
    try {
      // 1. Authenticate with Firebase
      const cred = await signInWithEmailAndPassword(this.fb.auth, email, password);
      
      // 2. THE FIX: Wait for Firestore profile to load BEFORE navigating
      const profile = await this.loadProfile(cred.user);
      
      this.zone.run(() => {
        // 3. Set the signal so authGuard passes instantly
        this._user.set(profile);
        this.router.navigate(['/dashboard']);
      });
      
      return true;
    } catch (err: any) {
      this.zone.run(() => {
        this._error.set(this.friendlyError(err.code));
      });
      return false;
    }
  }

  async logout(): Promise<void> {
    await signOut(this.fb.auth);
    this.zone.run(() => {
      this._user.set(null);
      this.router.navigate(['/login']);
    });
  }

  canAccess(view: string): boolean {
    return PERMISSIONS[this._user()?.role ?? 'viewer']?.includes(view) ?? false;
  }

  private friendlyError(code: string): string {
    return ({
      'auth/invalid-credential':    'Invalid email or password.',
      'auth/user-not-found':        'No account found with this email.',
      'auth/wrong-password':        'Incorrect password.',
      'auth/too-many-requests':     'Too many attempts. Please wait.',
      'auth/network-request-failed':'Network error. Check your connection.',
      'auth/invalid-email':         'Invalid email format.',
    } as any)[code] ?? 'Authentication failed. Please try again.';
  }
}