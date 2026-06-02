import { Injectable, signal, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private apiUrl = 'http://localhost:3000/api/auth';
    private platformId = inject(PLATFORM_ID);
    
    // Signals para reactividad
    currentUser = signal<any>(null);
    isAuthenticated = signal<boolean>(false);
    
    constructor(private http: HttpClient) {
        this.checkInitialState();
    }

    private decodeJwtPayload(token: string): any | null {
        try {
            const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
            return JSON.parse(atob(b64));
        } catch {
            return null;
        }
    }

    private checkInitialState(): void {
        if (!isPlatformBrowser(this.platformId)) return;

        const token = this.getToken();
        if (!token) return;

        const payload = this.decodeJwtPayload(token);
        if (payload) {
            const now = Math.floor(Date.now() / 1000);
            if (payload.exp && payload.exp < now) {
                this.logout();
                return;
            }
            this.currentUser.set({ id: payload.id, name: payload.name, email: payload.email, role: payload.role });
            this.isAuthenticated.set(true);
        }

        this.validateToken().subscribe({
            next: (res) => {
                this.currentUser.set(res.user);
                this.isAuthenticated.set(true);
            },
            error: (err: HttpErrorResponse) => {
                if (err.status === 401) {
                    this.logout();
                }
            }
        });
    }
    
    login(data: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/login`, data).pipe(
            tap((response: any) => {
                this.saveToken(response.token);
                this.currentUser.set(response.user);
                this.isAuthenticated.set(true);
            })
        );
    }
    
    register(data: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/register`, data);
    }
    
    validateToken(): Observable<any> {
        return this.http.get(`${this.apiUrl}/validate`);
    }

    saveToken(token: string): void {
        if (isPlatformBrowser(this.platformId)) {
            localStorage.setItem('token', token);
        }
    }

    getToken(): string | null {
        if (isPlatformBrowser(this.platformId)) {
            return localStorage.getItem('token');
        }
        return null;
    }

    logout(): void {
        if (isPlatformBrowser(this.platformId)) {
            localStorage.removeItem('token');
        }
        this.currentUser.set(null);
        this.isAuthenticated.set(false);
    }
}
