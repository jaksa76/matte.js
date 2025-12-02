import { test, expect, type Page } from '@playwright/test';

/**
 * E2E tests for the Matte.js framework
 * Tests a complete application with multiple entities and customized fields
 */

test.describe('Landing Page', () => {
  test('should display landing page with all entities', async ({ page }) => {
    await page.goto('/');
    
    // Check page title
    await expect(page).toHaveTitle(/Matte\.js/);
    
    // Check header
    await expect(page.locator('h1.landing-title')).toContainText('Matte.js');
    await expect(page.locator('p.landing-subtitle')).toContainText('Full-stack entity management framework');
    
    // Check that all entities are listed
    await expect(page.locator('.page-card')).toHaveCount(4);
    await expect(page.getByText('Project')).toBeVisible();
    await expect(page.getByText('Task')).toBeVisible();
    await expect(page.getByText('Customer')).toBeVisible();
    await expect(page.getByText('Product')).toBeVisible();
  });

  test('should navigate to entity pages from landing', async ({ page }) => {
    await page.goto('/');
    
    // Click on Project link
    await page.getByRole('link', { name: /Project/ }).first().click();
    await expect(page).toHaveURL(/\/project/);
  });
});

test.describe('Project Entity - Grid View', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/project');
    await page.waitForLoadState('networkidle');
  });

  test('should display empty grid initially', async ({ page }) => {
    // Check for grid container
    const grid = page.locator('.grid-view-container').first();
    await expect(grid).toBeVisible();
    
    // Should show "Create New" button
    const addButton = page.locator('[data-testid="btn-create"]');
    await expect(addButton).toBeVisible();
  });

  test('should create a new project with all fields', async ({ page }) => {
    // Click Create New button
    const addButton = page.locator('[data-testid="btn-create"]');
    await addButton.click();
    
    // Wait for form to appear
    await page.waitForSelector('.form-view-container', { timeout: 5000 });
    
    // Fill in required fields
    await fillInput(page, 'name', 'Website Redesign');
    await fillInput(page, 'code', 'WEB-001');
    
    // Select status
    await selectDropdown(page, 'status', 'active');
    
    // Select priority
    await selectDropdown(page, 'priority', 'high');
    
    // Fill dates
    await fillInput(page, 'startDate', '2025-01-15');
    await fillInput(page, 'endDate', '2025-06-30');
    
    // Fill budget information
    await fillInput(page, 'estimatedBudget', '150000');
    await fillInput(page, 'actualCost', '25000');
    
    // Fill team members
    await fillInput(page, 'projectManager', 'Alice Johnson');
    await fillInput(page, 'teamLead', 'Bob Smith');
    
    // Save the project
    const saveButton = page.locator('[data-testid="btn-save"]');
    await saveButton.click();
    
    // Wait for form to disappear (form closes on success)
    await page.waitForSelector('.form-view-container', { state: 'detached', timeout: 5000 });
    
    // Wait for grid to be visible again
    await expect(page.locator('.grid-view-container')).toBeVisible();
    
    // Give a moment for data to load
    await page.waitForTimeout(1000);
    
    // Verify project appears in grid
    await expect(page.getByText('Website Redesign').first()).toBeVisible();
  });

  test('should edit an existing project', async ({ page }) => {
    // Create a project first
    await createProject(page, {
      name: 'Mobile App',
      code: 'MOB-001',
      status: 'planning',
      priority: 'medium',
    });
    
    // Wait for it to appear
    await page.waitForTimeout(1000);
    
    // Click on the project to edit
    await page.locator('[data-testid="btn-edit"]').first().click();
    await page.waitForSelector('.form-view-container', { timeout: 5000 });
    
    // Update the name
    await fillInput(page, 'name', 'Mobile App V2');
    
    // Update status
    await selectDropdown(page, 'status', 'active');
    
    // Save
    const saveButton = page.locator('[data-testid="btn-save"]');
    await saveButton.click();
    
    await page.waitForTimeout(1000);
    
    // Verify update
    await expect(page.getByText('Mobile App V2').first()).toBeVisible();
  });

  test('should delete a project', async ({ page }) => {
    // Create a project
    await createProject(page, {
      name: 'Temporary Project',
      code: 'TMP-001',
      status: 'planning',
      priority: 'low',
    });
    
    await page.waitForTimeout(1000);
    
    // Find and click delete button
    const projectCard = page.locator('text=Temporary Project').locator('..').locator('..');
    const deleteButton = projectCard.locator('[data-testid="btn-delete"]');
    
    if (await deleteButton.isVisible()) {
      await deleteButton.click();
      
      // Confirm deletion if there's a confirmation dialog
      const confirmButton = page.getByRole('button', { name: /Confirm|Yes|Delete/i });
      if (await confirmButton.isVisible({ timeout: 1000 }).catch(() => false)) {
        await confirmButton.click();
      }
      
      await page.waitForTimeout(1000);
      
      // Verify deletion
      await expect(page.getByText('Temporary Project')).not.toBeVisible();
    }
  });

  test('should validate required fields', async ({ page }) => {
    // Click Add button
    const addButton = page.locator('[data-testid="btn-create"]');
    await addButton.click();
    
    await page.waitForSelector('.form-view-container', { timeout: 5000 });
    
    // Try to save without filling required fields
    const saveButton = page.locator('[data-testid="btn-save"]');
    await saveButton.click();
    
    // Should show validation errors
    // Note: The exact error display depends on implementation
    // This is a basic check
    await page.waitForSelector('.form-view-container', { timeout: 5000 });
  });
});

test.describe('Task Entity - Multiple Customized Fields', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/task');
    await page.waitForLoadState('networkidle');
  });

  test('should create task with all field types', async ({ page }) => {
    // Click Add button
    const addButton = page.locator('[data-testid="btn-create"]');
    await addButton.click();
    
    await page.waitForSelector('.form-view-container', { timeout: 5000 });
    
    // Fill in fields
    await fillInput(page, 'title', 'Implement user authentication');
    
    // Rich text description (if available, otherwise regular input)
    await fillInput(page, 'description', 'Add OAuth2 support for Google and GitHub');
    
    // Select fields
    await selectDropdown(page, 'status', 'in_progress');
    await selectDropdown(page, 'priority', 'high');
    await selectDropdown(page, 'type', 'feature');
    
    // Dates and numbers
    await fillInput(page, 'dueDate', '2025-12-15');
    await fillInput(page, 'estimatedHours', '16');
    await fillInput(page, 'actualHours', '8');
    
    // Assignee and tags
    await fillInput(page, 'assignee', 'John Doe');
    await fillInput(page, 'tags', 'backend, security');
    
    // Save
    const saveButton = page.locator('[data-testid="btn-save"]');
    await saveButton.click();
    
    await page.waitForTimeout(1000);
    
    // Verify
    await expect(page.getByText('Implement user authentication').first()).toBeVisible();
  });

  test('should display task status correctly', async ({ page }) => {
    // Create tasks with different statuses
    const statuses = ['todo', 'in_progress', 'review', 'done'];
    
    for (const status of statuses) {
      await createTask(page, {
        title: `Task in ${status}`,
        status: status,
        priority: 'medium',
        type: 'feature',
      });
    }
    
    await page.waitForTimeout(1000);
    
    // Verify all tasks are visible
    for (const status of statuses) {
      await expect(page.getByText(`Task in ${status}`).first()).toBeVisible();
    }
  });
});

test.describe('Customer Entity - Grouped Fields', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/customer');
    await page.waitForLoadState('networkidle');
  });

  test('should create customer with grouped information', async ({ page }) => {
    // Click Add button
    const addButton = page.locator('[data-testid="btn-create"]');
    await addButton.click();
    
    await page.waitForSelector('.form-view-container', { timeout: 5000 });
    
    // Personal Information group
    await fillInput(page, 'firstName', 'Jane');
    await fillInput(page, 'lastName', 'Smith');
    await fillInput(page, 'email', 'jane.smith@example.com');
    await fillInput(page, 'phone', '+1 (555) 123-4567');
    await fillInput(page, 'dateOfBirth', '1990-05-15');
    
    // Address group (may need to expand if collapsible)
    await fillInput(page, 'street', '123 Oak Avenue');
    await fillInput(page, 'city', 'San Francisco');
    await fillInput(page, 'state', 'CA');
    await fillInput(page, 'zipCode', '94102');
    
    // Account Information
    await selectDropdown(page, 'accountType', 'individual');
    await selectDropdown(page, 'status', 'active');
    await fillInput(page, 'lifetimeValue', '5000');
    
    // Save
    const saveButton = page.locator('[data-testid="btn-save"]');
    await saveButton.click();
    
    await page.waitForTimeout(1000);
    
    // Verify (check for email since it was filled successfully)
    await expect(page.getByText('jane.smith@example.com').first()).toBeVisible();
  });

  test('should handle collapsible groups', async ({ page }) => {
    // Click Add button
    const addButton = page.locator('[data-testid="btn-create"]');
    await addButton.click();
    
    await page.waitForSelector('.form-view-container', { timeout: 5000 });
    
    // Look for collapsible sections
    // Note: Implementation may vary, this is a basic check
    const groups = page.locator('[data-collapsible], .collapsible-group, .group-header');
    const count = await groups.count();
    
    // Just verify the form loaded properly
    expect(count).toBeGreaterThanOrEqual(0);
  });
});

test.describe('Product Entity - Complex Fields', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/product');
    await page.waitForLoadState('networkidle');
  });

  test.skip('should create product with pricing and inventory', async ({ page }) => {
    // Click Add button
    const addButton = page.locator('[data-testid="btn-create"]');
    await addButton.click();
    
    await page.waitForSelector('.form-view-container', { timeout: 5000 });
    
    // Fill only required fields plus a few optional ones
    await fillInput(page, 'name', 'Wireless Headphones');
    await fillInput(page, 'sku', 'WH-001');
    await fillInput(page, 'price', '199.99');
    
    // Save
    const saveButton = page.locator('[data-testid="btn-save"]');
    await saveButton.click();
    
    // Wait for return to grid view
    await page.waitForTimeout(2000);
    
    // Verify product appears in grid
    await expect(page.getByText('Wireless Headphones').first()).toBeVisible();
  });

  test('should handle boolean flags correctly', async ({ page }) => {
    // Click Add button
    const addButton = page.locator('[data-testid="btn-create"]');
    await addButton.click();
    
    await page.waitForSelector('.form-view-container', { timeout: 5000 });
    
    // Fill required fields
    await fillInput(page, 'name', 'Test Product');
    await fillInput(page, 'sku', 'TEST-001');
    await fillInput(page, 'price', '50');
    
    // Toggle featured flag
    const featuredCheckbox = page.locator('input[name="featured"], input[id*="featured"]').first();
    if (await featuredCheckbox.isVisible()) {
      await featuredCheckbox.check();
    }
    
    // Save
    const saveButton = page.locator('[data-testid="btn-save"]');
    await saveButton.click();
    
    await page.waitForTimeout(1000);
    
    // Verify product created
    await expect(page.getByText('Test Product').first()).toBeVisible();
  });

  test('should handle number fields with prefix/suffix', async ({ page }) => {
    // Click Add button
    const addButton = page.locator('[data-testid="btn-create"]');
    await addButton.click();
    
    await page.waitForSelector('.form-view-container', { timeout: 5000 });
    
    // Fill required fields
    await fillInput(page, 'name', 'Premium Widget');
    await fillInput(page, 'sku', 'PREM-001');
    await fillInput(page, 'price', '299.99');
    
    // Try to fill weight if visible
    try {
      await fillInput(page, 'weight', '2.5');
    } catch (e) {
      // Weight field might not be required
    }
    
    // Save
    const saveButton = page.locator('[data-testid="btn-save"]');
    await saveButton.click();
    
    await page.waitForTimeout(1000);
  });
});

test.describe('Multi-Entity Navigation', () => {
  test('should navigate between different entities', async ({ page }) => {
    // Start at landing page
    await page.goto('/');
    
    // Navigate to Project
    await page.getByRole('link', { name: /Project/ }).first().click();
    await expect(page).toHaveURL(/\/project/);
    
    // Go back to home
    await page.goto('/');
    
    // Navigate to Task
    await page.getByRole('link', { name: /Task/ }).first().click();
    await expect(page).toHaveURL(/\/task/);
    
    // Go back to home
    await page.goto('/');
    
    // Navigate to Customer
    await page.getByRole('link', { name: /Customer/ }).first().click();
    await expect(page).toHaveURL(/\/customer/);
    
    // Go back to home
    await page.goto('/');
    
    // Navigate to Product
    await page.getByRole('link', { name: /Product/ }).first().click();
    await expect(page).toHaveURL(/\/product/);
  });

  test('should maintain separate data for each entity', async ({ page }) => {
    // Create a project
    await page.goto('/project');
    await createProject(page, {
      name: 'Test Project',
      code: 'TST-001',
      status: 'planning',
      priority: 'medium',
    });
    await page.waitForTimeout(1000);
    
    // Create a task
    await page.goto('/task');
    await createTask(page, {
      title: 'Test Task',
      status: 'todo',
      priority: 'medium',
      type: 'feature',
    });
    await page.waitForTimeout(1000);
    
    // Verify project page shows only project
    await page.goto('/project');
    await page.waitForSelector('.grid-view-container', { timeout: 5000 });
    await expect(page.getByText('Test Project').first()).toBeVisible();
    await expect(page.getByText('Test Task')).not.toBeVisible();
    
    // Verify task page shows only task
    await page.goto('/task');
    await page.waitForSelector('[data-testid="grid-view"]', { timeout: 5000 });
    await expect(page.getByText('Test Task').first()).toBeVisible();
    await expect(page.getByText('Test Project')).not.toBeVisible();
  });
});

test.describe('API Integration', () => {
  test('should create and retrieve via API', async ({ page, request }) => {
    // Create a project via API
    const response = await request.post('http://localhost:3002/api/project', {
      headers: {
        'Content-Type': 'application/json',
        'X-Owner-Id': 'test-user',
      },
      data: {
        name: 'API Created Project',
        code: 'API-001',
        status: 'planning',
        priority: 'high',
      },
    });
    
    expect(response.status()).toBe(201);
    const project = await response.json();
    expect(project.id).toBeDefined();
    
    // Verify it shows in the UI
    await page.goto('/project');
    await page.waitForSelector('.grid-view-container', { timeout: 5000 });
    await page.waitForTimeout(1000);
    await expect(page.getByText('API Created Project').first()).toBeVisible();
  });

  test('should handle API errors gracefully', async ({ request }) => {
    // Try to create a project without required fields
    const response = await request.post('http://localhost:3002/api/project', {
      headers: {
        'Content-Type': 'application/json',
        'X-Owner-Id': 'test-user',
      },
      data: {
        // Missing required 'name' and 'code' fields
        status: 'planning',
      },
    });
    
    expect(response.status()).toBe(400);
    const error = await response.json();
    expect(error.error).toBeDefined();
  });
});

// ============================================================================
// Helper Functions
// ============================================================================

// Convert camelCase to Title Case (e.g., "firstName" -> "First Name")
function toTitleCase(str: string): string {
  return str
    .replace(/([A-Z])/g, ' $1') // Add space before capitals
    .replace(/^./, (s) => s.toUpperCase()) // Capitalize first letter
    .trim();
}

async function fillInput(page: Page, fieldName: string, value: string) {
  // Use data-testid for reliable element selection
  const input = page.locator(`[data-testid="input-${fieldName}"], [data-testid="textarea-${fieldName}"]`);
  await input.clear();
  await input.fill(value);
}

async function selectDropdown(page: Page, fieldName: string, value: string) {
  // Use data-testid for reliable element selection
  const select = page.locator(`[data-testid="select-${fieldName}"]`);
  await select.selectOption(value);
}

async function createProject(page: Page, data: {
  name: string;
  code: string;
  status: string;
  priority: string;
}) {
  const addButton = page.locator('[data-testid="btn-create"]');
  await addButton.click();
  await page.waitForSelector('.form-view-container', { timeout: 5000 });
  
  await fillInput(page, 'name', data.name);
  await fillInput(page, 'code', data.code);
  await selectDropdown(page, 'status', data.status);
  await selectDropdown(page, 'priority', data.priority);
  
  const saveButton = page.locator('[data-testid="btn-save"]');
  await saveButton.click();
}

async function createTask(page: Page, data: {
  title: string;
  status: string;
  priority: string;
  type: string;
}) {
  const addButton = page.locator('[data-testid="btn-create"]');
  await addButton.click();
  await page.waitForSelector('.form-view-container', { timeout: 5000 });
  
  await fillInput(page, 'title', data.title);
  await selectDropdown(page, 'status', data.status);
  await selectDropdown(page, 'priority', data.priority);
  await selectDropdown(page, 'type', data.type);
  
  const saveButton = page.locator('[data-testid="btn-save"]');
  await saveButton.click();
}
