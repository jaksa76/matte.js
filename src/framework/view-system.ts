import type { EntityDefinition } from './entities';

/**
 * Base interface for all displays
 */
export interface BaseDisplay {
  /**
   * Unique identifier for the display type (e.g., 'grid', 'list', 'detail', 'form', 'custom-chart')
   */
  displayId: string;

  /**
   * Human-readable name for the display
   */
  displayName?: string;

  /**
   * Optional component name/path for client-side rendering
   * If not provided, the displayId will be used to look up the component
   */
  componentName?: string;

  /**
   * Additional metadata that can be passed to the display component
   */
  metadata?: Record<string, any>;
}

/**
 * Display that shows a single entity instance (e.g., Detail view, Form view)
 */
export interface InstanceDisplay extends BaseDisplay {
  displayType: 'instance';
  
  /**
   * The entity this display shows
   */
  entity: EntityDefinition;
}

/**
 * Display that shows a collection of entity instances (e.g., List view, Grid view)
 */
export interface EntityDisplay extends BaseDisplay {
  displayType: 'entity';
  
  /**
   * The entity this display shows
   */
  entity: EntityDefinition;
}

/**
 * Union type for all displays
 */
export type Display = InstanceDisplay | EntityDisplay;

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
   * The display to show on this page
   */
  display: Display;

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
 * Factory function to create an EntityDisplay
 */
export function createEntityDisplay(
  displayId: string,
  entity: EntityDefinition,
  options?: {
    displayName?: string;
    componentName?: string;
    metadata?: Record<string, any>;
  }
): EntityDisplay {
  return {
    displayType: 'entity',
    displayId,
    entity,
    displayName: options?.displayName,
    componentName: options?.componentName,
    metadata: options?.metadata,
  };
}

/**
 * Factory function to create an InstanceDisplay
 */
export function createInstanceDisplay(
  displayId: string,
  entity: EntityDefinition,
  options?: {
    displayName?: string;
    componentName?: string;
    metadata?: Record<string, any>;
  }
): InstanceDisplay {
  return {
    displayType: 'instance',
    displayId,
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
  display: Display,
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
    display,
    icon: options?.icon,
    showInNav: options?.showInNav ?? true,
    order: options?.order,
  };
}
