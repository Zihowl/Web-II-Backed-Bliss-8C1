import { Injectable, signal, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Product } from '../models/product.model';

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
  private platformId = inject(PLATFORM_ID);

  // Reactive list of cart products
  private productsSignal = signal<Product[]>([]);
  private isCartOpenSignal = signal(false);
  private customerDataSignal = signal<CustomerData | null>(null);

  // Expose readonly signals
  products = this.productsSignal.asReadonly();
  isCartOpen = this.isCartOpenSignal.asReadonly();
  customerData = this.customerDataSignal.asReadonly();

  agregar(product: Product) {
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

  exportarXML(customer?: CustomerData, paypalData?: { orderId: string; status: string }) {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const products = this.productsSignal();
    const now = new Date().toISOString();
    const groupedProducts = this.groupProducts(products);
    const safeCustomer: CustomerData = {
      name: customer?.name?.trim() ?? '',
      phone: customer?.phone?.trim() ?? '',
      note: customer?.note?.trim() ?? '',
      deliveryType: customer?.deliveryType ?? 'home',
      address: customer?.address?.trim() ?? '',
      paymentType: customer?.paymentType ?? 'card',
    };

    // Estructura XML manual
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<recibo>\n`;

    xml += `  <folio>${Date.now()}</folio>\n`;
    xml += `  <fecha>${now}</fecha>\n`;
    xml += `  <cliente>\n`;
    xml += `    <nombre>${this.escapeXml(safeCustomer.name)}</nombre>\n`;
    xml += `    <telefono>${this.escapeXml(safeCustomer.phone)}</telefono>\n`;
    xml += `    <nota>${this.escapeXml(safeCustomer.note)}</nota>\n`;
    xml += `  </cliente>\n`;
    xml += `  <entrega>\n`;
    xml += `    <tipo>${this.getDeliveryLabel(safeCustomer.deliveryType)}</tipo>\n`;
    xml += `    <direccion>${this.escapeXml(safeCustomer.deliveryType === 'home' ? safeCustomer.address : '')}</direccion>\n`;
    xml += `  </entrega>\n`;
    xml += `  <pago>\n`;
    xml += `    <tipo>${this.getPaymentLabel(safeCustomer.paymentType)}</tipo>\n`;
    if (paypalData) {
      xml += `    <paypalOrderId>${this.escapeXml(paypalData.orderId)}</paypalOrderId>\n`;
      xml += `    <paypalStatus>${this.escapeXml(paypalData.status)}</paypalStatus>\n`;
    }
    xml += `  </pago>\n`;
    xml += `  <productos>\n`;

    for (const p of groupedProducts) {
      xml += `    <product>\n`;
      xml += `      <id>${p.id}</id>\n`;
      xml += `      <nombre>${this.escapeXml(p.name)}</nombre>\n`;
      xml += `      <categoria>${this.escapeXml(p.category)}</categoria>\n`;
      xml += `      <cantidad>${p.quantity}</cantidad>\n`;
      xml += `      <precioUnitario>${p.price}</precioUnitario>\n`;
      xml += `      <subtotal>${p.subtotal}</subtotal>\n`;
      if (p.description) {
        xml += `      <descripcion>${this.escapeXml(p.description)}</descripcion>\n`;
      }
      xml += `    </product>\n`;
    }

    xml += `  </productos>\n`;
    xml += `  <resumen>\n`;
    xml += `    <articulos>${this.countItems()}</articulos>\n`;
    xml += `    <lineas>${groupedProducts.length}</lineas>\n`;
    xml += `    <total>${this.total()}</total>\n`;
    xml += `  </resumen>\n`;

    xml += `</recibo>`;

    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'recibo.xml';
    a.click();

    URL.revokeObjectURL(url);
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

  private getDeliveryLabel(deliveryType: DeliveryType): string {
    return 'Domicilio';
  }

  private getPaymentLabel(paymentType: PaymentType): string {
    return 'Tarjeta';
  }

  private escapeXml(value: string): string {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&apos;');
  }
}
