import { Component, HostListener, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter } from 'rxjs/operators';
import { CartService } from '../../services/cart.service';
import { SearchService } from '../../services/search.service';
import { AuthService } from '../../core/services/auth.service';
import { CartComponent } from '../cart/cart';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CartComponent, RouterLink],
  templateUrl: './topbar.html',
  styleUrls: ['./topbar.css'],
})
export class TopbarComponent {
  private readonly cartService = inject(CartService);
  private readonly searchService = inject(SearchService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  searchIsOpen = this.searchService.isOpen;
  searchQuery = this.searchService.query;
  isAuthenticated = this.authService.isAuthenticated;
  currentUser = this.authService.currentUser;
  isMinimal = signal(this.computeMinimal(this.router.url));
  dropdownOpen = signal(false);

  constructor() {
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(e => {
        this.isMinimal.set(this.computeMinimal(e.urlAfterRedirects));
        this.closeDropdown();
      });
  }

  goBack() {
    this.router.navigate(['/']);
  }

  private computeMinimal(url: string): boolean {
    const path = url.split('?')[0].split('#')[0];
    return path === '/checkout' || path === '/terminos' || path === '/privacidad';
  }

  countItems() {
    return this.cartService.countItems();
  }

  cartIsOpen() {
    return this.cartService.isCartOpen();
  }

  toggleCart() {
    this.cartService.toggleCart();
  }

  toggleSearch() {
    const willOpen = !this.searchService.isOpen();
    this.searchService.toggle();
    if (willOpen && this.router.url !== '/') {
      this.router.navigate(['/']);
    }
  }

  updateSearch(event: Event) {
    const input = event.target as HTMLInputElement;
    this.searchService.setQuery(input.value);
  }

  handleProfileClick() {
    this.toggleDropdown();
  }

  toggleDropdown() {
    this.dropdownOpen.set(!this.dropdownOpen());
  }

  closeDropdown() {
    this.dropdownOpen.set(false);
  }

  logOut() {
    this.authService.logout();
    this.router.navigate(['/']);
    this.closeDropdown();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.profile-container')) {
      this.closeDropdown();
    }
  }
}
