import { effect, Injectable, signal } from '@angular/core';
import { Product } from '../models/product.model';

const CART_STORAGE_KEY = 'bb_cart';

export type DeliveryType = 'home';
export type PaymentType = 'card';

export interface CustomerData {
  name: string;
  phone: string;
  note: string;
  deliveryType: DeliveryType;
  address: string;
  paymentType: PaymentType;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  // Reactive list of cart products
  private productsSignal = signal<Product[]>(this.loadFromStorage());
  private isCartOpenSignal = signal(false);
  private customerDataSignal = signal<CustomerData | null>(null);
  // Ultimo mensaje de error de stock para mostrar feedback en la UI (RNF-11).
  private stockErrorSignal = signal<string | null>(null);

  // Expose readonly signals
  products = this.productsSignal.asReadonly();
  isCartOpen = this.isCartOpenSignal.asReadonly();
  customerData = this.customerDataSignal.asReadonly();
  stockError = this.stockErrorSignal.asReadonly();

  constructor() {
    // RF-16: persistimos el carrito en localStorage para conservar su estado tras
    // recargar la pagina.
    effect(() => {
      const productos = this.productsSignal();
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(productos));
      } catch {
        // Ignoramos errores de almacenamiento (modo privado, cuota, etc.).
      }
    });
  }

  private loadFromStorage(): Product[] {
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Product[]) : [];
    } catch {
      return [];
    }
  }

  // Devuelve cuantas unidades de un producto hay actualmente en el carrito.
  private cantidadEnCarrito(id: number): number {
    return this.productsSignal().filter(p => p.id === id).length;
  }

  // RNF-11: valida contra el stock disponible antes de añadir una unidad mas.
  private puedeAgregar(product: Product): boolean {
    if (typeof product.stock !== 'number') {
      return true; // sin dato de stock, no bloqueamos (se valida en checkout).
    }
    if (this.cantidadEnCarrito(product.id) >= product.stock) {
      this.stockErrorSignal.set(
        `Solo hay ${product.stock} unidad(es) disponibles de "${product.name}".`
      );
      return false;
    }
    return true;
  }

  clearStockError() {
    this.stockErrorSignal.set(null);
  }

  agregar(product: Product) {
    if (!this.puedeAgregar(product)) {
      return;
    }
    this.stockErrorSignal.set(null);
    this.productsSignal.update(lista => [...lista, product]);
  }

  quitar(id: number) {
    this.productsSignal.update(lista => {
      const index = lista.findIndex(p => p.id === id);
      if (index === -1) {
        return lista;
      }

      return [...lista.slice(0, index), ...lista.slice(index + 1)];
    });
  }

  incrementarCantidad(id: number) {
    const product = this.productsSignal().find(p => p.id === id);
    if (!product) {
      return;
    }

    this.agregar(product);
  }

  decrementarCantidad(id: number) {
    this.quitar(id);
  }

  eliminarLinea(id: number) {
    this.productsSignal.update(lista => lista.filter(p => p.id !== id));
  }

  vaciar() {
    this.productsSignal.set([]);
  }

  setCustomerData(data: CustomerData) {
    this.customerDataSignal.set(data);
  }

  getCustomerData(): CustomerData | null {
    return this.customerDataSignal();
  }

  toggleCart() {
    this.isCartOpenSignal.update(isOpen => !isOpen);
  }

  closeCart() {
    this.isCartOpenSignal.set(false);
  }

  countItems(): number {
    return this.productsSignal().length;
  }

  total(): number {
    return this.productsSignal().reduce((acc, p) => acc + p.price, 0);
  }

  // Devuelve los productos del carrito agrupados por id, listos para persistir
  // como order_data en la base de datos.
  buildOrderItems(): Array<{
    id: number;
    name: string;
    category: string;
    quantity: number;
    price: number;
    subtotal: number;
    description?: string;
  }> {
    return this.groupProducts(this.productsSignal()).map(p => ({
      id: p.id,
      name: p.name,
      category: p.category,
      quantity: p.quantity,
      price: p.price,
      subtotal: p.subtotal,
      ...(p.description ? { description: p.description } : {}),
    }));
  }

  private groupProducts(products: Product[]): Array<Product & { quantity: number; subtotal: number }> {
    const map = new Map<number, Product & { quantity: number; subtotal: number }>();

    for (const product of products) {
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
  }

}
