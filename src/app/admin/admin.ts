import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  AdminService,
  AdminUser,
  AdminOrder,
  InventoryItem,
  ProductInput,
} from '../services/admin.service';

type Tab = 'users' | 'products' | 'orders' | 'inventory';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.html',
  styleUrl: './admin.css',
})
export class Admin implements OnInit {
  private admin = inject(AdminService);

  tab = signal<Tab>('orders');
  message = signal<string>('');

  users = signal<AdminUser[]>([]);
  orders = signal<AdminOrder[]>([]);
  estados = signal<string[]>([]);
  inventory = signal<InventoryItem[]>([]);

  // Filtros de pedidos (RNF-18).
  filters = { status: '', from: '', to: '', customer: '', minTotal: '', maxTotal: '' };

  // Confirmacion de eliminacion de usuario (RNF-07).
  userToDelete = signal<AdminUser | null>(null);

  // Formulario de alta/edicion de producto (RNF-08).
  productForm: ProductInput & { id?: number } = this.emptyProduct();

  // Ajuste de inventario (IU-26).
  adjust = { id: 0, newQty: 0, reason: '' };

  ngOnInit() {
    this.loadOrders();
  }

  setTab(t: Tab) {
    this.tab.set(t);
    this.message.set('');
    if (t === 'users') this.loadUsers();
    if (t === 'orders') this.loadOrders();
    if (t === 'inventory') this.loadInventory();
  }

  private flash(msg: string) {
    this.message.set(msg);
    setTimeout(() => this.message.set(''), 3000);
  }

  // --- Usuarios ---
  loadUsers() {
    this.admin.listUsers().subscribe({ next: (r) => this.users.set(r.users) });
  }

  askDeleteUser(u: AdminUser) {
    this.userToDelete.set(u);
  }

  confirmDeleteUser() {
    const u = this.userToDelete();
    if (!u) return;
    this.admin.deleteUser(u.id).subscribe({
      next: () => {
        this.userToDelete.set(null);
        this.loadUsers();
        this.flash('Usuario eliminado');
      },
      error: (e) => {
        this.userToDelete.set(null);
        this.flash(e?.error?.mensaje || 'No se pudo eliminar');
      },
    });
  }

  // --- Pedidos ---
  loadOrders() {
    this.admin.listOrders(this.filters as any).subscribe({
      next: (r) => {
        this.orders.set(r.orders);
        this.estados.set(r.estados || []);
      },
    });
  }

  changeStatus(order: AdminOrder, status: string) {
    if (!status || status === order.status) return;
    this.admin.updateOrderStatus(order.id, status).subscribe({
      next: () => {
        this.loadOrders();
        this.flash(`Pedido #${order.id} -> ${status}`);
      },
      error: (e) => this.flash(e?.error?.mensaje || 'Error al actualizar'),
    });
  }

  // --- Inventario ---
  loadInventory() {
    this.admin.getInventory().subscribe({ next: (r) => this.inventory.set(r.inventory) });
  }

  get lowStockItems() {
    return this.inventory().filter((i) => i.isLow);
  }

  startAdjust(item: InventoryItem) {
    this.adjust = { id: item.id, newQty: item.stock, reason: '' };
  }

  saveAdjust() {
    this.admin.adjustStock(this.adjust.id, this.adjust.newQty, this.adjust.reason).subscribe({
      next: () => {
        this.adjust = { id: 0, newQty: 0, reason: '' };
        this.loadInventory();
        this.flash('Inventario actualizado');
      },
      error: (e) => this.flash(e?.error?.mensaje || 'Error en el ajuste'),
    });
  }

  // --- Productos ---
  private emptyProduct(): ProductInput & { id?: number } {
    return { name: '', price: 0, imageUrl: '', category: '', description: '', stock: 0 };
  }

  editProduct(item: InventoryItem) {
    // Cargamos los datos basicos desde inventario; la imagen/desc se completan al editar.
    this.productForm = {
      id: item.id,
      name: item.name,
      price: item.price,
      imageUrl: '',
      category: item.category,
      description: '',
      stock: item.stock,
    };
    this.tab.set('products');
  }

  resetProductForm() {
    this.productForm = this.emptyProduct();
  }

  saveProduct() {
    const { id, ...data } = this.productForm;
    const obs = id ? this.admin.updateProduct(id, data) : this.admin.createProduct(data);
    obs.subscribe({
      next: () => {
        this.resetProductForm();
        this.loadInventory();
        this.flash(id ? 'Producto actualizado' : 'Producto creado');
      },
      error: (e) => this.flash(e?.error?.mensaje || 'Error al guardar producto'),
    });
  }

  deleteProduct(item: InventoryItem) {
    this.admin.deleteProduct(item.id).subscribe({
      next: () => {
        this.loadInventory();
        this.flash('Producto eliminado');
      },
      error: (e) => this.flash(e?.error?.mensaje || 'Error al eliminar'),
    });
  }
}
