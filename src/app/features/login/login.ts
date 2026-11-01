import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { Message } from 'primeng/message';
import { AuthService } from '../../core/auth/auth.service';
import { SessionStore } from '../../core/auth/session.store';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink, ButtonModule, InputTextModule, PasswordModule, Message],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly session = inject(SessionStore);
  private readonly router = inject(Router);

  email = signal('');
  password = signal('');
  loading = signal(false);
  error = signal('');

  onSubmit(): void {
    this.loading.set(true);
    this.error.set('');

    this.auth.login({ identifier: this.email(), password: this.password() }).subscribe({
      next: () => {
        // Redirigir según el rol predominante del usuario
        if (this.session.isPassenger() && !this.session.isDespacho()) {
          this.router.navigate(['/passenger/request']);
        } else if (this.session.isDriver() && !this.session.isDespacho()) {
          this.router.navigate(['/driver/panel']);
        } else if (this.session.hasRole('DESPACHO') && !this.session.isAdmin()) {
          this.router.navigate(['/dispatch']);
        } else {
          this.router.navigate(['/dashboard']);
        }
      },
      error: (err) => {
        this.error.set(
          err?.error?.detail ??
            err?.error?.error ??
            err?.error?.message ??
            'Credenciales incorrectas o usuario inactivo'
        );
        this.loading.set(false);
      },
    });
  }
}
