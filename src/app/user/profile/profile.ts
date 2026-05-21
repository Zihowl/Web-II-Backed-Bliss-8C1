import { Component, inject, signal, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile implements OnInit {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private router = inject(Router);

  activeTab: 'view' | 'edit' = 'view';
  user = signal<any>(null);
  editForm = { name: '', phone: '', address: '' };
  fieldErrors = { name: '', phone: '', address: '' };
  loading = signal(false);
  loadingEdit = signal(false);
  successMessage = '';
  errorMessage = '';

  ngOnInit() {
    this.loadProfile();
  }

  private loadProfile() {
    this.loading.set(true);
    this.http.get<any>('http://localhost:3000/api/user/profile').subscribe({
      next: (res) => {
        this.user.set(res.profile);
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage = 'Error al cargar el perfil';
        this.loading.set(false);
      }
    });
  }

  switchTab(tab: 'view' | 'edit') {
    this.clearMessages();
    this.activeTab = tab;
    if (tab === 'edit' && this.user()) {
      const u = this.user();
      this.editForm = {
        name: u.name || '',
        phone: u.phone || '',
        address: u.address || ''
      };
    }
  }

  saveProfile() {
    this.fieldErrors = { name: '', phone: '', address: '' };

    if (!this.validateEditForm()) {
      return;
    }

    this.loadingEdit.set(true);
    this.http.put<any>('http://localhost:3000/api/user/profile', this.editForm).subscribe({
      next: (res) => {
        this.user.set(res.profile);
        this.successMessage = 'Perfil actualizado exitosamente';
        this.loadingEdit.set(false);
        setTimeout(() => {
          this.switchTab('view');
        }, 1500);
      },
      error: (err) => {
        this.errorMessage = err.error?.mensaje || 'Error al actualizar el perfil';
        this.loadingEdit.set(false);
      }
    });
  }

  private validateEditForm(): boolean {
    let isValid = true;

    if (!this.editForm.name.trim()) {
      this.fieldErrors['name'] = 'El nombre es requerido';
      isValid = false;
    }

    if (!this.editForm.phone.trim()) {
      this.fieldErrors['phone'] = 'El teléfono es requerido';
      isValid = false;
    } else if (!/^\d{10}$/.test(this.editForm.phone)) {
      this.fieldErrors['phone'] = 'Teléfono debe tener 10 dígitos';
      isValid = false;
    }

    if (!this.editForm.address.trim()) {
      this.fieldErrors['address'] = 'La dirección es requerida';
      isValid = false;
    }

    return isValid;
  }

  logOut() {
    this.authService.logout();
    this.router.navigate(['/']);
  }

  private clearMessages() {
    this.successMessage = '';
    this.errorMessage = '';
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getInitials(): string {
    if (!this.user()) return '?';
    const name = this.user().name || '';
    return name.split(' ').map((part: string) => part[0]).join('').toUpperCase().slice(0, 2);
  }
}
