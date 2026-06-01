import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

const API = 'http://localhost:3000/api';

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: string;
  created_at: string;
}

export interface AdminOrder {
  id: number;
  status: string;
  total: number;
  customerName: string;
  userEmail: string;
  created_at: string;
}

export interface InventoryItem {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  lowStockThreshold: number;
  inStock: boolean;
  isLow: boolean;
}

export interface ProductInput {
  name: string;
  price: number;
  imageUrl: string;
  category: string;
  description: string;
  stock: number;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private http = inject(HttpClient);

  // --- Usuarios ---
  listUsers(): Observable<{ users: AdminUser[] }> {
    return this.http.get<{ users: AdminUser[] }>(`${API}/admin/users`);
  }

  deleteUser(id: number): Observable<any> {
    return this.http.delete(`${API}/admin/users/${id}`);
  }

  // --- Productos ---
  createProduct(data: ProductInput): Observable<any> {
    return this.http.post(`${API}/admin/products`, data);
  }

  updateProduct(id: number, data: ProductInput): Observable<any> {
    return this.http.put(`${API}/admin/products/${id}`, data);
  }

  deleteProduct(id: number): Observable<any> {
    return this.http.delete(`${API}/admin/products/${id}`);
  }

  // --- Pedidos ---
  listOrders(filters: Record<string, string> = {}): Observable<{ orders: AdminOrder[]; estados: string[] }> {
    let params = new HttpParams();
    for (const [k, v] of Object.entries(filters)) {
      if (v) params = params.set(k, v);
    }
    return this.http.get<{ orders: AdminOrder[]; estados: string[] }>(`${API}/orders`, { params });
  }

  updateOrderStatus(id: number, status: string): Observable<any> {
    return this.http.put(`${API}/orders/${id}/status`, { status });
  }

  // --- Inventario ---
  getInventory(): Observable<{ inventory: InventoryItem[] }> {
    return this.http.get<{ inventory: InventoryItem[] }>(`${API}/inventory`);
  }

  adjustStock(id: number, newQty: number, reason: string): Observable<any> {
    return this.http.put(`${API}/inventory/${id}/adjust`, { newQty, reason });
  }
}
