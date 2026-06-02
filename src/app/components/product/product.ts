import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Product } from '../../models/product.model';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './product.html',
  styleUrls: ['./product.css'],
})
export class ProductCardComponent {
  private readonly cartService = inject(CartService);
  @Input({ required: true }) product!: Product;
  @Output() add = new EventEmitter<Product>();
  recentlyAdded = signal(false);
  // Mensaje de error de stock para esta tarjeta (null si no hay bloqueo).
  stockBlocked = signal<string | null>(null);
  private feedbackTimeoutId: ReturnType<typeof setTimeout> | null = null;

  // Unidades disponibles segun el stock del producto (null si no aplica).
  get stockRestante(): number | null {
    return this.cartService.stockRestante(this.product);
  }

  get portions(): string | null {
    const match = this.product?.description?.match(/\b\d+\s*(porciones?|piezas?)\b/i);
    return match ? match[0] : null;
  }

  get descriptionWithoutPortions(): string {
    return this.product?.description?.replace(/\b\d+\s*(porciones?|piezas?)\b/gi, '').trim() || '';
  }

  onAdd() {
    // Agregamos directamente y solo mostramos "Agregado" si tuvo exito; si el stock
    // lo impide, mostramos un aviso de error en vez de un falso positivo.
    const ok = this.cartService.agregar(this.product);

    if (this.feedbackTimeoutId) {
      clearTimeout(this.feedbackTimeoutId);
    }

    if (ok) {
      this.stockBlocked.set(null);
      this.recentlyAdded.set(true);
      this.add.emit(this.product);
    } else {
      this.recentlyAdded.set(false);
      this.stockBlocked.set(this.cartService.stockError());
    }

    this.feedbackTimeoutId = setTimeout(() => {
      this.recentlyAdded.set(false);
      this.stockBlocked.set(null);
      this.feedbackTimeoutId = null;
    }, ok ? 900 : 2200);
  }

  onImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.src = '/assets/logo.png';
  }
}
