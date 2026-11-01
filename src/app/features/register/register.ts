import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { Message } from 'primeng/message';
import { PassengerApi } from '../passengers/passenger-api';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-register',
  imports: [FormsModule, RouterLink, ButtonModule, InputTextModule, PasswordModule, Message],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  private readonly passengerApi = inject(PassengerApi);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  name = signal('');
  email = signal('');
  phone = signal('');
  address = signal('');
  password = signal('');
  confirmPassword = signal('');

  loading = signal(false);
  error = signal('');
  successMessage = signal('');

  onSubmit(): void {
    this.error.set('');
    this.successMessage.set('');

    const nameVal = this.name().trim();
    const emailVal = this.email().trim();
    const phoneVal = this.phone().trim();
    const passVal = this.password();
    const confirmVal = this.confirmPassword();

    if (!nameVal || !emailVal || !phoneVal || !passVal) {
      this.error.set('Por favor completa todos los campos obligatorios.');
      return;
    }

    if (passVal.length < 6) {
      this.error.set('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (passVal !== confirmVal) {
      this.error.set('Las contraseñas no coinciden.');
      return;
    }

    this.loading.set(true);

    this.passengerApi
      .register({
        name: nameVal,
        email: emailVal,
        password: passVal,
        phone: phoneVal,
        address: this.address().trim() || undefined,
      })
      .subscribe({
        next: () => {
          this.successMessage.set('¡Registro exitoso! Iniciando sesión automáticamente...');
          // Auto login tras registro exitoso
          this.auth.login({ identifier: emailVal, password: passVal }).subscribe({
            next: () => {
              this.router.navigate(['/passenger/request']);
            },
            error: () => {
              // Si falla el auto-login, enviar a login
              this.router.navigate(['/login'], { queryParams: { registered: '1' } });
            },
          });
        },
        error: (err) => {
          this.loading.set(false);
          const detail =
            err?.error?.error ||
            err?.error?.message ||
            err?.error?.detail ||
            'Error al procesar el registro. Intenta nuevamente.';
          this.error.set(detail);
        },
      });
  }
}

