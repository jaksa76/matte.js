import type { EntityDefinition } from './entities';

/**
 * Base interface for all views
 */
export interface BaseView {
  /**
   * Unique identifier for the view type (e.g., 'grid', 'list', 'detail', 'form', 'custom-chart')
   */
  viewId: string;

  /**
   * Human-readable name for the view
   */
  displayName?: string;

  /**
   * Optional component name/path for client-side rendering
   * If not provided, the viewId will be used to look up the component
   */
  componentName?: string;

  /**
   * Additional metadata that can be passed to the view component
   */
  metadata?: Record<string, any>;
}

/**
 * View that displays a single entity instance (e.g., Detail view, Form view)
 */
export interface InstanceView extends BaseView {
  viewType: 'instance';
  
  /**
   * The entity this view displays
   */
  entity: EntityDefinition;
}

/**
 * View that displays a collection of entity instances (e.g., List view, Grid view)
 */
export interface EntityView extends BaseView {
  viewType: 'entity';
  
  /**
   * The entity this view displays
   */
  entity: EntityDefinition;
}

/**
 * Union type for all views
 */
export type View = InstanceView | EntityView;

/**
 * A page represents a navigation target in the application
 */
export interface Page {
  /**
   * Unique identifier for the page
   */
  id: string;

  /**
   * Display name in navigation menu
   */
  name: string;

  /**
   * URL path (without leading slash)
   */
  path: string;

  /**
   * The view to display on this page
   */
  view: View;

  /**
   * Optional icon for navigation menu
   */
  icon?: string;

  /**
   * Whether to show in navigation menu (default: true)
   */
  showInNav?: boolean;

  /**
   * Order in navigation menu (lower numbers first)
   */
  order?: number;
}

/**
 * Factory function to create an EntityView
 */
export function createEntityView(
  viewId: string,
  entity: EntityDefinition,
  options?: {
    displayName?: string;
    componentName?: string;
    metadata?: Record<string, any>;
  }
): EntityView {
  return {
    viewType: 'entity',
    viewId,
    entity,
    displayName: options?.displayName,
    componentName: options?.componentName,
    metadata: options?.metadata,
  };
}

/**
 * Factory function to create an InstanceView
 */
export function createInstanceView(
  viewId: string,
  entity: EntityDefinition,
  options?: {
    displayName?: string;
    componentName?: string;
    metadata?: Record<string, any>;
  }
): InstanceView {
  return {
    viewType: 'instance',
    viewId,
    entity,
    displayName: options?.displayName,
    componentName: options?.componentName,
    metadata: options?.metadata,
  };
}

/**
 * Factory function to create a Page
 */
export function createPage(
  id: string,
  name: string,
  path: string,
  view: View,
  options?: {
    icon?: string;
    showInNav?: boolean;
    order?: number;
  }
): Page {
  return {
    id,
    name,
    path,
    view,
    icon: options?.icon,
    showInNav: options?.showInNav ?? true,
    order: options?.order,
  };
}
