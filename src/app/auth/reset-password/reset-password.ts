import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.css',
})
export class ResetPassword implements OnInit {
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  token = '';
  password = '';
  confirmPassword = '';
  message = signal('');
  error = signal('');
  loading = signal(false);

  // Mismo criterio que el registro: min 8, 1 mayuscula, 1 numero (RNF-02).
  private passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;

  ngOnInit() {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
    if (!this.token) {
      this.error.set('Enlace inválido: falta el token de recuperación.');
    }
  }

  submit() {
    this.message.set('');
    this.error.set('');

    if (!this.passwordRegex.test(this.password)) {
      this.error.set('La contraseña debe tener mínimo 8 caracteres, 1 mayúscula y 1 número.');
      return;
    }
    if (this.password !== this.confirmPassword) {
      this.error.set('Las contraseñas no coinciden.');
      return;
    }

    this.loading.set(true);
    this.authService.resetPassword(this.token, this.password).subscribe({
      next: () => {
        this.message.set('Contraseña actualizada. Redirigiendo al inicio de sesión...');
        this.loading.set(false);
        setTimeout(() => this.router.navigate(['/login']), 1800);
      },
      error: (err) => {
        this.error.set(err?.error?.mensaje || 'No se pudo actualizar la contraseña.');
        this.loading.set(false);
      },
    });
  }
}
