import { Routes } from '@angular/router';
import { CatalogComponent } from './components/catalog/catalog';
import { CartComponent } from './components/cart/cart';
import { ProductDetailComponent } from './components/product-detail/product-detail';
import { Checkout } from './components/checkout/checkout';
import { LegalComponent } from './components/legal/legal';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  { path: '', component: CatalogComponent },
  { path: 'cart', component: CartComponent },
  { path: 'checkout', canActivate: [authGuard], component: Checkout },
  { path: 'producto/:id', component: ProductDetailComponent },
  
  { path: 'login', loadComponent: () => import('./auth/login/login').then(m => m.Login) },
  { path: 'register', loadComponent: () => import('./auth/register/register').then(m => m.Register) },
  { path: 'profile', canActivate: [authGuard], loadComponent: () => import('./user/profile/profile').then(m => m.Profile) },
  { path: 'history', canActivate: [authGuard], loadComponent: () => import('./user/history/history').then(m => m.History) },
  { path: 'admin', canActivate: [adminGuard], loadComponent: () => import('./admin/admin').then(m => m.Admin) },

  { path: ':docType', component: LegalComponent },
  { path: '**', redirectTo: '' },
];
