# Landing Page Refactoring

## Overview
Extracted the landing page HTML template into a proper React component for better maintainability and consistency with the rest of the framework.

## Changes Made

### 1. New Files Created

#### `/src/framework/ui/LandingPage.tsx`
- React component that renders the landing page
- Accepts `pages` prop containing registered navigation pages
- Displays page cards in a grid layout
- Handles empty state when no pages are registered

#### `/src/framework/ui/LandingPage.css`
- Extracted all landing page styles from the HTML template
- Includes gradient title, card grid layout, hover effects
- Maintains the same visual design as the original

#### `/src/framework/ui/landing-client.tsx`
- Client-side entry point for the landing page
- Renders `LandingPage` component using `MATTE_LANDING_CONFIG` from window
- Similar pattern to the main client.tsx

### 2. Modified Files

#### `/src/framework/framework.ts`
- Added `landingBundle` field to cache compiled landing page JS
- Updated `buildClient()` to build both `client.tsx` and `landing-client.tsx`
- Updated `renderLandingPage()` to serve HTML that loads the React component
- Added route to serve `/landing.js` bundle
- Updated CSS bundle loading to include `LandingPage.css`

#### `/tests/integration/framework.test.ts`
- Updated test assertion to check for `MATTE_LANDING_CONFIG` and `/landing.js` instead of "Available Pages" text

### 3. Test Configuration

#### `/package.json`
- Updated `test` script to explicitly run only `tests/unit` and `tests/integration`
- E2E tests remain separate under `test:e2e` script

#### `/playwright.config.ts`
- Added `testMatch: '**/*.e2e.ts'` to only match E2E test files
- Prevents Playwright tests from being picked up by bun test

#### `/tests/e2e/app.spec.ts` → `/tests/e2e/app.e2e.ts`
- Renamed file to use `.e2e.ts` extension instead of `.spec.ts`
- Prevents bun test from attempting to load Playwright tests

## Benefits

1. **Consistency**: Landing page now uses React like all other UI components
2. **Maintainability**: Easier to modify and extend the landing page
3. **Type Safety**: TypeScript types for landing page props
4. **Modularity**: CSS separated into its own file
5. **Architecture**: Follows the same pattern as entity pages

## Test Results

### Unit & Integration Tests
- ✅ 184 tests passing
- All existing functionality preserved

### E2E Tests
- ✅ 21 tests passing, 1 skipped
- Landing page displays correctly with React component
- All navigation and entity operations working as expected

## Migration Notes

The landing page functionality remains identical from a user perspective:
- Same visual design and layout
- Same navigation behavior
- Same URL structure
- No breaking changes to the public API

The implementation now uses React components instead of HTML string templates, making it consistent with the rest of the framework.
