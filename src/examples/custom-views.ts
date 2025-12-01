/**
 * Example demonstrating how to create custom views and pages
 */

import { 
  Matte, 
  createEntityView, 
  createPage,
  listView,
  gridView,
} from '../framework';
import { ownedEntity, string, number, date, richtext } from '../framework/entities';

const app = new Matte({ defaultView: 'grid' });

// Define entities
const Product = ownedEntity("Product", [
  string("name").required(),
  string("category"),
  number("price").required().min(0),
  number("stock"),
  date("releaseDate"),
  richtext("description"),
]);

const Order = ownedEntity("Order", [
  string("orderNumber").required(),
  string("customerName").required(),
  number("totalAmount").required(),
  date("orderDate").required(),
  string("status"),
]);

// Example 1: Register entity with default view
// This creates a default page with the configured default view
app.register(Product);

// Example 2: Create a custom page with list view
const ordersListPage = listView(Order, {
  pageName: "All Orders",
  pagePath: "orders",
});
app.register(ordersListPage);

// Example 3: Create multiple pages for the same entity with different views
const productGridPage = gridView(Product, {
  pageName: "Products (Grid)",
  pagePath: "products-grid",
});

const productListPage = listView(Product, {
  pageName: "Products (List)",
  pagePath: "products-list",
});

app.register(productGridPage);
app.register(productListPage);

// Example 4: Create a custom view with specific configuration
// (This would be for a future custom view component)
const customAnalyticsView = createEntityView('analytics', Order, {
  displayName: 'Order Analytics',
  metadata: {
    chartType: 'bar',
    groupBy: 'status',
  },
});

const analyticsPage = createPage(
  'order-analytics',
  'Analytics',
  'analytics',
  customAnalyticsView,
  {
    icon: '📊',
    order: 10,
  }
);

// This page would show an error until we implement the 'analytics' view component
// but demonstrates how custom views can be registered
app.register(analyticsPage);

// Example 5: Page that shouldn't appear in navigation
const hiddenReportView = createEntityView('grid', Order, {
  displayName: 'Hidden Report',
});

const hiddenPage = createPage(
  'hidden-report',
  'Hidden Report',
  'internal/report',
  hiddenReportView,
  {
    showInNav: false, // This page won't appear in the navigation menu
  }
);

app.register(hiddenPage);

app.start();
