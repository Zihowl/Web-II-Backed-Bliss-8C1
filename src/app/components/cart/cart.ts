import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CartService, CustomerData } from '../../services/cart.service';
import { Product } from '../../models/product.model';
import { Signal } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';

type CartLine = Product & { quantity: number; subtotal: number };

@Component({
  selector: 'app-cart',
  standalone: true,
  templateUrl: './cart.html',
  styleUrls: ['./cart.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartComponent {
  private cartService = inject(CartService);
  private router = inject(Router);
  private authService = inject(AuthService);

  items: Signal<Product[]>;
  isOpen: Signal<boolean>;
  groupedItems = computed<CartLine[]>(() => {
    const map = new Map<number, CartLine>();

    for (const product of this.items()) {
      const existing = map.get(product.id);
      if (existing) {
        existing.quantity += 1;
        existing.subtotal = existing.quantity * existing.price;
        continue;
      }

      map.set(product.id, {
        ...product,
        quantity: 1,
        subtotal: product.price,
      });
    }

    return Array.from(map.values());
  });

  total = computed(() => this.cartService.total());
  validationErrors = signal<string[]>([]);
  customer: CustomerData = {
    name: '',
    phone: '',
    note: '',
    deliveryType: 'home',
    address: '',
    paymentType: 'card',
  };

  constructor() {
    this.items = this.cartService.products;
    this.isOpen = this.cartService.isCartOpen;
    this.prefillNameFromAuth();

    effect(() => {
      const user = this.authService.currentUser();
      if (user?.name && this.isOpen()) {
        this.customer.name = user.name;
      }
    });
  }

  private prefillNameFromAuth(): void {
    const user = this.authService.currentUser();
    if (user?.name) {
      this.customer.name = user.name;
    }
  }

  decreaseQuantity(id: number) {
    this.cartService.decrementarCantidad(id);
  }

  increaseQuantity(id: number) {
    this.cartService.incrementarCantidad(id);
  }

  removeItem(id: number) {
    this.cartService.eliminarLinea(id);
  }

  clearCart() {
    this.cartService.vaciar();
  }

  closeCart() {
    this.cartService.closeCart();
  }

  exportXml() {
    console.log('CartComponent.exportXml invoked');
    this.cartService.exportarXML(this.customer);
  }

  exportOrder() {
    const errors = this.validateForm();
    if (errors.length > 0) {
      this.validationErrors.set(errors);
      return;
    }

    this.validationErrors.set([]);
    // Guardar datos del cliente en el servicio para usar en checkout
    this.cartService.setCustomerData(this.customer);
    // Cerrar el carrito antes de redirigir al checkout
    this.closeCart();
    // Navegar a la vista de checkout donde se muestran los botones PayPal
    this.router.navigate(['/checkout']);
  }

  private validateForm(): string[] {
    const errors: string[] = [];
    const customer = {
      name: this.customer.name.trim(),
      phone: this.customer.phone.trim(),
      note: this.customer.note.trim(),
      address: this.customer.address.trim(),
    };

    if (this.items().length === 0) {
      errors.push('Agrega al menos un producto al carrito.');
    }

    if (!customer.name) {
      errors.push('El nombre es obligatorio.');
    }

    if (!customer.phone) {
      errors.push('El teléfono es obligatorio.');
    }


    if (this.customer.deliveryType === 'home' && !customer.address) {
      errors.push('La dirección es obligatoria para envío a domicilio.');
    }

    return errors;
  }
  
}

