 
import { expect } from 'vitest';
import * as matchers from 'jest-axe';

// @ts-expect-error - jest-axe matchers are compatible but types don't match perfectly
expect.extend(matchers);

declare module 'vitest' {
  interface Assertion {
    toHaveNoViolations(): Promise<void>;
  }
}
