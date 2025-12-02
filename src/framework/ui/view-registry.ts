/**
 * View Component Registry
 * 
 * Provides a centralized registry for view components, eliminating the need
 * for manual switch statements when adding new views.
 */

import type { ComponentType } from 'react';

export interface ViewComponentProps {
  entity: any;
  apiUrl?: string;
  [key: string]: any;
}

/**
 * Registry for mapping view IDs to React components
 */
class ViewComponentRegistry {
  private entityViews = new Map<string, ComponentType<any>>();
  private instanceViews = new Map<string, ComponentType<any>>();

  /**
   * Register a view component for entity collections
   */
  registerEntityView(viewId: string, component: ComponentType<any>): void {
    this.entityViews.set(viewId, component);
  }

  /**
   * Register a view component for single instances
   */
  registerInstanceView(viewId: string, component: ComponentType<any>): void {
    this.instanceViews.set(viewId, component);
  }

  /**
   * Get an entity view component by ID
   */
  getEntityView(viewId: string): ComponentType<any> | undefined {
    return this.entityViews.get(viewId);
  }

  /**
   * Get an instance view component by ID
   */
  getInstanceView(viewId: string): ComponentType<any> | undefined {
    return this.instanceViews.get(viewId);
  }

  /**
   * Check if an entity view is registered
   */
  hasEntityView(viewId: string): boolean {
    return this.entityViews.has(viewId);
  }

  /**
   * Check if an instance view is registered
   */
  hasInstanceView(viewId: string): boolean {
    return this.instanceViews.has(viewId);
  }

  /**
   * Get all registered entity view IDs
   */
  getEntityViewIds(): string[] {
    return Array.from(this.entityViews.keys());
  }

  /**
   * Get all registered instance view IDs
   */
  getInstanceViewIds(): string[] {
    return Array.from(this.instanceViews.keys());
  }

  /**
   * Get all entity views as a map
   */
  getAllEntityViews(): Map<string, ComponentType<any>> {
    return new Map(this.entityViews);
  }

  /**
   * Get all instance views as a map
   */
  getAllInstanceViews(): Map<string, ComponentType<any>> {
    return new Map(this.instanceViews);
  }
}

/**
 * Global view registry instance
 */
export const viewRegistry = new ViewComponentRegistry();

/**
 * Decorator for auto-registering view components
 */
export function registerEntityView(viewId: string) {
  return function <T extends ComponentType<any>>(component: T): T {
    viewRegistry.registerEntityView(viewId, component);
    return component;
  };
}

/**
 * Decorator for auto-registering instance view components
 */
export function registerInstanceView(viewId: string) {
  return function <T extends ComponentType<any>>(component: T): T {
    viewRegistry.registerInstanceView(viewId, component);
    return component;
  };
}
