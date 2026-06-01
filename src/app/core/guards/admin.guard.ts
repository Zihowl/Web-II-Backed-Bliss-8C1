import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

// Restringe el acceso al panel administrativo a usuarios con rol 'admin'.
export const adminGuard: CanActivateFn = () => {
  const router = inject(Router);
  const authService = inject(AuthService);

  const user = authService.currentUser();
  if (authService.getToken() && user?.role === 'admin') {
    return true;
  }

  router.navigate(['/']);
  return false;
};
