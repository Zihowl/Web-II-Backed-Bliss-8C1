import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { PaymentService, CreatePaypalOrderPayload } from '../../services/payment.service';
import { OrderService } from '../../services/order.service';
import { AuthService } from '../../core/services/auth.service';
import { lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './checkout.html',
  styleUrls: ['./checkout.css'],
})
export class Checkout implements OnInit {
  loading = signal(false);
  success = signal(false);
  orderId = signal<number | null>(null);
  error = signal('');

  private router = inject(Router);

  constructor(
    private cartService: CartService,
    private paymentService: PaymentService,
    private orderService: OrderService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    if (!this.authService.isAuthenticated()) {
      this.error.set('Debes iniciar sesión para completar tu compra.');
      this.router.navigate(['/login']);
      return;
    }
    if (this.products.length === 0) {
      this.error.set('El carrito está vacío. Agrega productos antes de pagar.');
      return;
    }
    this.loadPayPal();
  }

  get products() {
    return this.cartService.products();
  }

  get total() {
    return this.cartService.total();
  }

  // RF-17: desglose de costos (los precios ya incluyen IVA del 16%).
  get subtotalSinIva() {
    return this.total / 1.16;
  }

  get iva() {
    return this.total - this.subtotalSinIva;
  }

  get itemCount() {
    return this.cartService.products().length;
  }

  get uniqueCount() {
    return this.groupProducts().length;
  }

  groupProducts() {
    const products = this.cartService.products();
    const map = new Map<number, any>();

    for (const p of products) {
      const existing = map.get(p.id);
      if (existing) {
        existing.quantity += 1;
        existing.subtotal = existing.quantity * existing.price;
        continue;
      }

      map.set(p.id, {
        id: p.id,
        name: p.name,
        imageUrl: (p as any).imageUrl,
        category: (p as any).category,
        quantity: 1,
        price: p.price,
        subtotal: p.price,
      });
    }

    return Array.from(map.values());
  }

  goBack() {
    this.router.navigate(['/']);
  }

  private buildOrderPayload(): CreatePaypalOrderPayload {
    const grouped = this.groupProducts();
    const items = grouped.map(g => ({ nombre: g.name, cantidad: g.quantity, precio: g.price }));
    return {
      total: Number(this.total).toFixed(2),
      items,
    } as CreatePaypalOrderPayload;
  }

  private async loadPayPal() {
    try {
      const { clientId } = await lastValueFrom(this.paymentService.getClientId());

      // Guardar caso common: clientId no configurado o placeholder
      if (!clientId || clientId.toString().toLowerCase().includes('your_paypal') || clientId === 'undefined') {
        this.error.set('ClientId de PayPal no configurado en backend/.env. Añade PAYPAL_CLIENT_ID (sandbox) y reinicia el servidor.');
        return;
      }

      if (!(window as any).paypal) {
        await this.appendPayPalScript(clientId);
      }

      this.renderButtons();
    } catch (err: any) {
      // Mejor mensaje para eventos y errores del script
      if (err instanceof Event) {
        const ev = err as Event;
        this.error.set(`No se pudo cargar PayPal: fallo de red o bloqueo al cargar ${ev.type}. Revisa conexión o CSP.`);
      } else if (err && err.message) {
        this.error.set('No se pudo cargar PayPal: ' + err.message);
      } else {
        this.error.set('No se pudo cargar PayPal: ' + String(err));
      }
    }
  }

  private appendPayPalScript(clientId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=MXN`;
      script.onload = () => resolve();
      script.onerror = (e) => {
        // Crear un Error con más contexto
        const msg = `Error loading PayPal SDK from ${script.src}`;
        const error = new Error(msg);
        // adjuntar info del event si existe
        try {
          (error as any).event = e;
        } catch {}
        reject(error);
      };
      document.body.appendChild(script);
    });
  }

  private renderButtons() {
    const paypal = (window as any).paypal;
    if (!paypal || !paypal.Buttons) {
      this.error.set('SDK de PayPal no disponible');
      return;
    }

    paypal.Buttons({
      createOrder: async (_data: any, _actions: any) => {
        this.loading.set(true);
        try {
          const payload = this.buildOrderPayload();
          const resp = await lastValueFrom(this.paymentService.createOrder(payload));
          return resp.id;
        } finally {
          this.loading.set(false);
        }
      },
      onApprove: async (data: any) => {
        this.loading.set(true);
        try {
          await lastValueFrom(this.paymentService.captureOrder(data.orderID));
          // Persistir el pedido en la base de datos (historial del usuario), con los
          // datos del cliente y el id de transaccion de PayPal.
          const orderItems = this.cartService.buildOrderItems();
          const cd = this.cartService.getCustomerData();
          const resp = await lastValueFrom(
            this.orderService.saveOrder({
              order_data: orderItems,
              customer: cd
                ? {
                    name: cd.name,
                    phone: cd.phone,
                    address: cd.address,
                    note: cd.note,
                    deliveryType: cd.deliveryType,
                    paymentType: cd.paymentType,
                  }
                : undefined,
              paypal_txn_id: data.orderID,
            })
          );
          // IU-18: confirmacion con el numero de orden asignado.
          this.orderId.set(resp?.order?.id ?? null);
          this.cartService.vaciar();
          this.success.set(true);
        } catch (err: any) {
          this.error.set('Error procesando el pedido: ' + (err?.message || err));
        } finally {
          this.loading.set(false);
        }
      },
      onError: (err: any) => {
        this.error.set('Error PayPal: ' + JSON.stringify(err));
      },
    }).render('#paypal-button-container');
  }

}
