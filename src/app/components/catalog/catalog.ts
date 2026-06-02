import { isPlatformBrowser } from '@angular/common';
import { Component, computed, OnInit, signal } from '@angular/core';
import { inject, PLATFORM_ID } from '@angular/core';
import { Product } from '../../models/product.model';
import { ProductsService } from '../../services/product.service';
import { SearchService } from '../../services/search.service';
import { ProductCardComponent } from '../product/product';
import { FilterMenuComponent, FilterKey } from '../filter-menu/filter-menu';
import { CarouselComponent } from '../carousel/carousel';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [ProductCardComponent, FilterMenuComponent, CarouselComponent],
  templateUrl: './catalog.html',
  styleUrls: ['./catalog.css'],
})
export class CatalogComponent implements OnInit {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly productsService = inject(ProductsService);
  private readonly searchService = inject(SearchService);
  products = signal<Product[]>([]);
  selectedFilter = signal<FilterKey>('todos');
  inStockCount = computed(() => this.products().filter(p => p.inStock).length);
  filteredProducts = computed(() => {
    const filter = this.selectedFilter();
    const query = this.searchService.query().trim().toLowerCase();
    let list = this.products();

    if (filter !== 'todos') {
      list = list.filter(product => this.matchesFilter(product.category, filter));
    }

    if (!query) {
      return list;
    }

    return list.filter(product => {
      const searchableText = [
        product.name,
        product.category,
        product.description,
      ].join(' ').toLowerCase();

      return searchableText.includes(query);
    });
  });

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.productsService.getProducts().subscribe({
      next: (data: Product[]) => {
        this.products.set(data);
        console.log('Productos recibidos', data);
      },
      error: (err: any) => console.error('Error cargando productos desde API:', err),
    });
  }

  addToCart(_product: Product) {
    // La tarjeta (ProductCardComponent) ya agrega el producto al carrito y maneja el
    // feedback de stock; este handler se conserva por compatibilidad del @Output.
  }

  onFilterChange(filter: FilterKey) {
    this.selectedFilter.set(filter);
  }

  private normalizeCategory(value: string): string {
    return value.trim().toLowerCase();
  }

  private matchesFilter(category: string, filter: Exclude<FilterKey, 'todos'>): boolean {
    const normalizedCategory = this.normalizeCategory(category);
    const aliases: Record<Exclude<FilterKey, 'todos'>, string[]> = {
      pasteles: ['pastel', 'pasteles'],
      gelatinas: ['gelatina', 'gelatinas'],
      galletas: ['galleta', 'galletas'],
      pays: ['pie', 'pies', 'pay', 'payes', 'tarta', 'tartas'],
      otros: ['otro', 'otros'],
    };

    return aliases[filter].includes(normalizedCategory);
  }

}

