import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Product } from '../../models/product.model';
import { CartService } from '../../services/cart.service';
import { ProductsService } from '../../services/product.service';
import { ProductCardComponent } from '../product/product';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, ProductCardComponent],
  templateUrl: './product-detail.html',
  styleUrls: ['./product-detail.css'],
})
export class ProductDetailComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly productsService = inject(ProductsService);
  private readonly cartService = inject(CartService);

  product = signal<Product | null>(null);
  loading = signal(true);
  error = signal('');
  quantity = signal(1);
  addedFeedback = signal(false);
  stockBlocked = signal<string | null>(null);
  relatedProducts = signal<Product[]>([]);

  stockRestante = computed(() => {
    const p = this.product();
    return p ? this.cartService.stockRestante(p) : null;
  });

  portions = computed(() => {
    const desc = this.product()?.description ?? '';
    const match = desc.match(/\b\d+\s*(porciones?|piezas?)\b/i);
    return match ? match[0] : null;
  });

  descriptionText = computed(() => {
    const desc = this.product()?.description ?? '';
    return desc.replace(/\b\d+\s*(porciones?|piezas?)\b/gi, '').trim();
  });

  private feedbackTimeout: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const idParam = params.get('id') ?? '';
      const id = Number(idParam);
      this.loadProduct(id);
    });
  }

  ngOnDestroy(): void {
    if (this.feedbackTimeout) {
      clearTimeout(this.feedbackTimeout);
    }
  }

  private loadProduct(id: number): void {
    this.loading.set(true);
    this.error.set('');
    this.product.set(null);
    this.relatedProducts.set([]);
    this.quantity.set(1);

    if (!Number.isFinite(id) || id <= 0) {
      this.error.set('ID de producto inválido.');
      this.loading.set(false);
      return;
    }

    this.productsService.getProducts().subscribe({
      next: (products) => {
        const found = products.find((p) => p.id === id) ?? null;
        if (!found) {
          this.error.set('Producto no encontrado.');
          this.loading.set(false);
          return;
        }
        this.product.set(found);
        this.relatedProducts.set(
          products.filter((p) => p.category === found.category && p.id !== found.id).slice(0, 4)
        );
        this.loading.set(false);
      },
      error: (err: unknown) => {
        console.error('Error cargando producto:', err);
        this.error.set('No se pudo cargar el producto.');
        this.loading.set(false);
      },
    });
  }

  decrement(): void {
    this.quantity.update((q) => Math.max(1, q - 1));
  }

  increment(): void {
    this.quantity.update((q) => Math.min(99, q + 1));
  }

  onQuantityInput(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    if (Number.isFinite(value) && value >= 1) {
      this.quantity.set(Math.min(99, Math.floor(value)));
    } else {
      this.quantity.set(1);
    }
  }

  addToCart(): void {
    const currentProduct = this.product();
    if (!currentProduct) return;
    const n = this.quantity();
    let agregados = 0;
    for (let i = 0; i < n; i++) {
      if (this.cartService.agregar(currentProduct)) {
        agregados++;
      }
    }

    if (this.feedbackTimeout) clearTimeout(this.feedbackTimeout);

    if (agregados === n) {
      // Todas las unidades solicitadas se agregaron.
      this.stockBlocked.set(null);
      this.addedFeedback.set(true);
    } else {
      // El stock impidio agregar todas (o ninguna) las unidades solicitadas.
      this.addedFeedback.set(false);
      this.stockBlocked.set(
        agregados > 0
          ? `Solo se agregaron ${agregados} de ${n} por stock disponible.`
          : (this.cartService.stockError() ?? 'No hay stock disponible.')
      );
    }

    this.feedbackTimeout = setTimeout(() => {
      this.addedFeedback.set(false);
      this.stockBlocked.set(null);
      this.feedbackTimeout = null;
    }, 2500);
  }

  addRelatedToCart(_product: Product): void {
    // La tarjeta de producto relacionado ya agrega al carrito y maneja su feedback.
  }

  onImageError(event: Event): void {
    (event.target as HTMLImageElement).src = '/assets/logo.png';
  }
}
