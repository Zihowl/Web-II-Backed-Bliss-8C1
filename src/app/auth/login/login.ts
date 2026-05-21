import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private authService = inject(AuthService);
  private router = inject(Router);

  email = '';
  password = '';
  errorMessage = '';
  fieldErrors = { email: '', password: '' };
  loading = signal(false);

  private emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  login() {
    this.clearErrors();

    if (!this.validateFields()) {
      return;
    }

    this.loading.set(true);
    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: () => {
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.errorMessage = err.error?.mensaje || 'Credenciales incorrectas';
        this.loading.set(false);
      },
      complete: () => {
        this.loading.set(false);
      }
    });
  }

  private validateFields(): boolean {
    let isValid = true;

    if (!this.email.trim()) {
      this.fieldErrors['email'] = 'El email es requerido';
      isValid = false;
    } else if (!this.emailRegex.test(this.email)) {
      this.fieldErrors['email'] = 'Email inválido';
      isValid = false;
    }

    if (!this.password.trim()) {
      this.fieldErrors['password'] = 'La contraseña es requerida';
      isValid = false;
    }

    return isValid;
  }

  private clearErrors() {
    this.errorMessage = '';
    this.fieldErrors = { email: '', password: '' };
  }
}
