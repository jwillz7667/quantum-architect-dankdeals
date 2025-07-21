/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { expect } from 'vitest';
import { toHaveNoViolations } from 'jest-axe';

expect.extend({ toHaveNoViolations });

declare module 'vitest' {
  interface Assertion {
    toHaveNoViolations(): Promise<void>;
  }
}
