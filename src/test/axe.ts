import { expect } from 'vitest';
import matchers from 'jest-axe';

expect.extend(matchers as any);

declare module 'vitest' {
  interface Assertion {
    toHaveNoViolations(): Promise<void>;
  }
}
