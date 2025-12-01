import type { Page } from './view-system';

/**
 * Central registry for pages in the application
 */
class PageRegistryImpl {
  private pages = new Map<string, Page>();

  /**
   * Register a page
   */
  register(page: Page): void {
    if (this.pages.has(page.id)) {
      console.warn(`Page with id "${page.id}" is already registered. Overwriting.`);
    }
    this.pages.set(page.id, page);
  }

  /**
   * Get a page by ID
   */
  get(id: string): Page | undefined {
    return this.pages.get(id);
  }

  /**
   * Get a page by path
   */
  getByPath(path: string): Page | undefined {
    return Array.from(this.pages.values()).find(p => p.path === path);
  }

  /**
   * Get all registered pages
   */
  getAll(): Page[] {
    return Array.from(this.pages.values()).sort((a, b) => {
      // Sort by order first, then by name
      if (a.order !== undefined && b.order !== undefined) {
        return a.order - b.order;
      }
      if (a.order !== undefined) return -1;
      if (b.order !== undefined) return 1;
      return a.name.localeCompare(b.name);
    });
  }

  /**
   * Get all pages that should be shown in navigation
   */
  getNavigationPages(): Page[] {
    return this.getAll().filter(p => p.showInNav !== false);
  }

  /**
   * Check if a page exists
   */
  has(id: string): boolean {
    return this.pages.has(id);
  }

  /**
   * Remove a page
   */
  remove(id: string): boolean {
    return this.pages.delete(id);
  }

  /**
   * Clear all pages
   */
  clear(): void {
    this.pages.clear();
  }

  /**
   * Get the number of registered pages
   */
  get size(): number {
    return this.pages.size;
  }
}

export const PageRegistry = new PageRegistryImpl();
