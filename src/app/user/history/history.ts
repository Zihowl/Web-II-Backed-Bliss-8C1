import { Component, inject, signal, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

interface Order {
  id: number;
  order_data: string;
  total: number;
  created_at: string;
  items?: any[];
}

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './history.html',
  styleUrl: './history.css',
})
export class History implements OnInit {
  private http = inject(HttpClient);

  orders = signal<Order[]>([]);
  loading = signal(true);
  selectedOrder = signal<Order | null>(null);
  errorMessage = '';

  readonly CFDI_EMISOR = {
    rfc: 'BKBL000000000',
    razonSocial: 'Backed Bliss SA de CV',
    regimen: '601 - General de Ley Personas Morales'
  };

  readonly CFDI_RECEPTOR = {
    rfc: 'XAXX010101000',
    usoCFDI: 'G03 - Gastos en general'
  };

  readonly CFDI_PAGO = {
    metodoPago: 'PPD - Pago en Parcialidades o Diferido',
    formaPago: 'PayPal'
  };

  ngOnInit() {
    this.loadHistory();
  }

  private loadHistory() {
    this.loading.set(true);
    this.http.get<any>('http://localhost:3000/api/user/history').subscribe({
      next: (res) => {
        this.orders.set(res.orders || []);
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage = 'Error al cargar el historial de pedidos';
        this.orders.set([]);
        this.loading.set(false);
      }
    });
  }

  openInvoice(order: Order) {
    this.selectedOrder.set(order);
  }

  closeInvoice() {
    this.selectedOrder.set(null);
  }

  printInvoice() {
    window.print();
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

  formatTime(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  }

  getOrderItems(order: Order): any[] {
    try {
      if (typeof order.order_data === 'string') {
        return JSON.parse(order.order_data);
      }
      return order.order_data || [];
    } catch {
      return [];
    }
  }

  getSubtotal(total: number): number {
    return total / 1.16;
  }

  getIVA(total: number): number {
    return total - (total / 1.16);
  }

  countItems(order: Order): number {
    const items = this.getOrderItems(order);
    return items.reduce((sum, item) => sum + (item.quantity || 1), 0);
  }
}
