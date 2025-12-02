# Playwright E2E Tests

This directory contains end-to-end tests for the Matte.js framework using Playwright.

## Overview

The E2E tests validate the complete functionality of a Matte.js application including:

- **Multiple entities**: Project, Task, Customer, and Product
- **Customized fields**: Various field types with prefixes, suffixes, placeholders, and validation
- **Field grouping**: Horizontal and vertical groups, some collapsible
- **Standard views**: Grid views for all entities
- **CRUD operations**: Create, Read, Update, and Delete for all entities
- **API integration**: Direct API calls and UI verification
- **Navigation**: Multi-page navigation between different entities

## Test Application

The test application (`test-app.ts`) sets up a complete Matte.js instance with:

### Project Entity
- Basic fields: name, code, status, priority
- Timeline group: startDate, endDate, duration
- Budget group (collapsible): estimatedBudget, actualCost, variance
- Rich text description
- Team members: projectManager, teamLead
- Boolean flags: isConfidential, requiresApproval

### Task Entity
- Title with large styling
- Rich text description
- Status, priority, type enums
- Scheduling group: dueDate, estimatedHours, actualHours
- Assignee and tags
- Completion flag

### Customer Entity
- Personal Information group: firstName, lastName, email, phone, dateOfBirth
- Address group (collapsible): street, city, state, zipCode, country
- Account Information group (collapsible): accountType, status, memberSince, lifetimeValue, vipStatus
- Rich text notes

### Product Entity
- Basic: name, sku, category, status
- Rich text description
- Pricing group: price, cost, margin
- Inventory group: stock, reorderPoint, reorderQuantity
- Physical group (collapsible): weight, length, width, height
- Boolean flags: featured, taxable

## Running Tests

### Install Playwright browsers (first time only)
```bash
bun run playwright:install
```

### Run all tests
```bash
bun run test:e2e
```

### Run tests with UI mode (recommended for development)
```bash
bun run test:e2e:ui
```

### Run tests in headed mode (see browser)
```bash
bun run test:e2e:headed
```

### Debug tests
```bash
bun run test:e2e:debug
```

### Run specific test file
```bash
bunx playwright test tests/e2e/app.spec.ts
```

### Run specific test
```bash
bunx playwright test -g "should create a new project"
```

## Test Structure

### Landing Page Tests
- Verifies all entities are listed
- Tests navigation to entity pages

### Project Entity Tests
- Empty state verification
- Creating projects with all fields
- Editing existing projects
- Deleting projects
- Field validation

### Task Entity Tests
- Creating tasks with multiple field types
- Different status handling

### Customer Entity Tests
- Creating customers with grouped fields
- Collapsible group handling

### Product Entity Tests
- Creating products with pricing and inventory
- Boolean flag handling
- Number fields with prefix/suffix

### Multi-Entity Navigation Tests
- Navigation between entities
- Data isolation between entities

### API Integration Tests
- Direct API calls
- Error handling

## Helper Functions

The test suite includes helper functions for common operations:

- `fillInput(page, fieldName, value)`: Fills form inputs by trying multiple selector strategies
- `selectDropdown(page, fieldName, value)`: Selects dropdown options
- `createProject(page, data)`: Quick project creation
- `createTask(page, data)`: Quick task creation

## Configuration

The Playwright configuration (`playwright.config.ts`) is set up to:

- Run tests against `http://localhost:3002`
- Start the test application automatically via `webServer`
- Use a single worker to avoid conflicts
- Capture screenshots on failure
- Generate HTML reports

## Test Application Port

The test application runs on port **3002** to avoid conflicts with:
- Main development server (port 3000)
- Integration test server (port 3001)

## CI/CD Considerations

For CI environments:
- Tests retry up to 2 times on failure
- `forbidOnly` prevents accidentally committed `.only()` tests
- The web server starts fresh (not reused)

## Debugging Tips

1. **Use UI mode** for interactive debugging: `bun run test:e2e:ui`
2. **Use debug mode** to step through tests: `bun run test:e2e:debug`
3. **Check screenshots** in `test-results/` after failures
4. **View HTML report** with `bunx playwright show-report`
5. **Add waits** if elements load slowly: `await page.waitForTimeout(500)`

## Known Limitations

- Tests use heuristic selectors (name, id patterns) since the actual HTML structure depends on the view implementation
- Some tests may need adjustment based on final UI/UX decisions
- Collapsible groups are checked for existence but not fully tested for expand/collapse behavior
- Rich text editing uses basic fill() - more complex rich text operations may need custom handling

## Adding New Tests

When adding new tests:

1. Follow the existing test structure
2. Use descriptive test names with `should...` pattern
3. Use helper functions for common operations
4. Add appropriate waits for async operations
5. Clean up any created data if tests aren't isolated
6. Test both success and failure cases

## Maintenance

As the framework evolves:

- Update selectors if HTML structure changes significantly
- Add data-testid attributes to components for more reliable selection
- Keep helper functions in sync with view implementations
- Update expected behavior as features change
