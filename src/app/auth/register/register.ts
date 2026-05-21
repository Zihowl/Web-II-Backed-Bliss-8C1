import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  private authService = inject(AuthService);
  private router = inject(Router);

  name = '';
  phone = '';
  address = '';
  email = '';
  password = '';
  confirmPassword = '';
  errorMessage = '';
  successMessage = '';
  fieldErrors = {
    name: '',
    phone: '',
    address: '',
    email: '',
    password: '',
    confirmPassword: ''
  };
  loading = signal(false);

  private emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  private phoneRegex = /^\d{10}$/;
  private passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;

  register() {
    this.clearErrors();

    if (!this.validateFields()) {
      return;
    }

    this.loading.set(true);
    this.authService.register({
      name: this.name,
      phone: this.phone,
      address: this.address,
      email: this.email,
      password: this.password
    }).subscribe({
      next: () => {
        this.successMessage = 'Cuenta creada exitosamente. Redirigiendo...';
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 1500);
      },
      error: (err) => {
        this.errorMessage = err.error?.mensaje || 'Error en el registro. Intenta de nuevo.';
        this.loading.set(false);
      },
      complete: () => {
        this.loading.set(false);
      }
    });
  }

  private validateFields(): boolean {
    let isValid = true;

    if (!this.name.trim()) {
      this.fieldErrors['name'] = 'El nombre es requerido';
      isValid = false;
    }

    if (!this.phone.trim()) {
      this.fieldErrors['phone'] = 'El teléfono es requerido';
      isValid = false;
    } else if (!this.phoneRegex.test(this.phone)) {
      this.fieldErrors['phone'] = 'Teléfono debe tener 10 dígitos (ej: 5512345678)';
      isValid = false;
    }

    if (!this.address.trim()) {
      this.fieldErrors['address'] = 'La dirección es requerida';
      isValid = false;
    }

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
    } else if (!this.passwordRegex.test(this.password)) {
      this.fieldErrors['password'] = 'Mínimo 8 caracteres, 1 mayúscula y 1 número';
      isValid = false;
    }

    if (!this.confirmPassword.trim()) {
      this.fieldErrors['confirmPassword'] = 'Confirma tu contraseña';
      isValid = false;
    } else if (this.password !== this.confirmPassword) {
      this.fieldErrors['confirmPassword'] = 'Las contraseñas no coinciden';
      isValid = false;
    }

    return isValid;
  }

  private clearErrors() {
    this.errorMessage = '';
    this.successMessage = '';
    this.fieldErrors = {
      name: '',
      phone: '',
      address: '',
      email: '',
      password: '',
      confirmPassword: ''
    };
  }
}
