import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css',
})
export class ForgotPassword {
  private authService = inject(AuthService);

  email = '';
  message = signal('');
  error = signal('');
  loading = signal(false);

  private emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  submit() {
    this.message.set('');
    this.error.set('');
    if (!this.emailRegex.test(this.email)) {
      this.error.set('Ingresa un correo válido.');
      return;
    }
    this.loading.set(true);
    this.authService.forgotPassword(this.email).subscribe({
      next: (res) => {
        this.message.set(res?.mensaje || 'Revisa tu correo para continuar.');
        this.loading.set(false);
      },
      error: () => {
        // No revelamos si el correo existe; mostramos el mismo mensaje generico.
        this.message.set('Si el correo está registrado, recibirás un enlace de recuperación.');
        this.loading.set(false);
      },
    });
  }
}
