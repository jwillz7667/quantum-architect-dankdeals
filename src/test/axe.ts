import { expect } from 'vitest';
import * as matchers from 'jest-axe/matchers';

expect.extend(matchers);

declare module 'vitest' {
  interface Assertion {
    toHaveNoViolations(): Promise<void>;
  }
} 