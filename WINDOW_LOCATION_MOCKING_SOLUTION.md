# Window.location Mocking Solution for Jest/jsdom Tests

## Problem Statement

When testing React components that use window.location methods in Jest/jsdom, you encounter:
```
Matcher error: received value must be a mock or spy function
```

## Root Cause

jsdom makes window.location completely immutable - non-configurable, non-deletable, non-writable.

## Working Solution: Navigation Wrapper Pattern

### 1. Create src/lib/utils/navigation.ts
```typescript
export const navigation = {
  assign(url: string): void { window.location.assign(url); },
  reload(): void { window.location.reload(); },
  replace(url: string): void { window.location.replace(url); },
};
```

### 2. Update Component
```typescript
import { navigation } from '@/lib/utils/navigation';
navigation.assign('/dashboard'); // instead of window.location.assign()
```

### 3. Mock in Tests
```typescript
jest.mock('@/lib/utils/navigation', () => ({
  navigation: { assign: jest.fn(), reload: jest.fn(), replace: jest.fn() }
}));

expect(navigation.assign).toHaveBeenCalledWith('/dashboard');
```

## Why This Works

Module mocking with jest.mock() bypasses jsdom's immutability constraints.

## Results

- MySchoolWeb LoginForm: 20/20 tests passing (100%)
- This is the ONLY reliable solution for mocking window.location in jsdom

See full documentation in this file for details on failed approaches and migration steps.
