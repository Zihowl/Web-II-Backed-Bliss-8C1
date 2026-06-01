import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { OrderService } from '../../services/order.service';
import { AuthService } from '../../core/services/auth.service';

interface Order {
  id: number;
  order_xml: string;
  total: number;
  created_at: string;
  status?: string;
  items?: any[];
}

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './history.html',
  styleUrl: './history.css',
})
export class History implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private orderService = inject(OrderService);
  private authService = inject(AuthService);

  // RNF-16: etapas del pedido en orden para el stepper visual (IU-22).
  readonly ESTADOS = ['Recibido', 'En preparación', 'En camino', 'Completado'];

  orders = signal<Order[]>([]);
  loading = signal(true);
  selectedOrder = signal<Order | null>(null);
  errorMessage = '';

  // Conexiones SSE activas por pedido para limpiarlas al destruir el componente.
  private streams = new Map<number, EventSource>();

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

  ngOnDestroy() {
    // Cerramos todas las suscripciones SSE.
    for (const es of this.streams.values()) {
      es.close();
    }
    this.streams.clear();
  }

  private loadHistory() {
    this.loading.set(true);
    this.http.get<any>('http://localhost:3000/api/user/history').subscribe({
      next: (res) => {
        this.orders.set(res.orders || []);
        this.loading.set(false);
        this.subscribeToStatuses();
      },
      error: () => {
        this.errorMessage = 'Error al cargar el historial de pedidos';
        this.orders.set([]);
        this.loading.set(false);
      }
    });
  }

  // RF-26/RNF-19: abre un stream SSE por cada pedido no completado para reflejar los
  // cambios de estado en tiempo real sin recargar.
  private subscribeToStatuses() {
    const token = this.authService.getToken();
    if (!token) return;

    for (const order of this.orders()) {
      if (this.streams.has(order.id) || order.status === 'Completado') {
        continue;
      }
      const es = this.orderService.streamStatus(order.id, token);
      es.addEventListener('status', (ev: MessageEvent) => {
        try {
          const data = JSON.parse(ev.data);
          this.orders.update((list) =>
            list.map((o) => (o.id === order.id ? { ...o, status: data.status } : o))
          );
          if (data.status === 'Completado') {
            es.close();
            this.streams.delete(order.id);
          }
        } catch {
          // Ignoramos mensajes mal formados.
        }
      });
      es.onerror = () => {
        es.close();
        this.streams.delete(order.id);
      };
      this.streams.set(order.id, es);
    }
  }

  // Indice de la etapa actual para pintar el stepper (IU-22).
  stepIndex(order: Order): number {
    const idx = this.ESTADOS.indexOf(order.status || 'Recibido');
    return idx < 0 ? 0 : idx;
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
    // El backend parsea el CFDI (XML) y devuelve los conceptos ya como items.
    return order.items || [];
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
