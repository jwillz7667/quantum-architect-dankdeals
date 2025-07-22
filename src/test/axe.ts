import { expect } from 'vitest';
import type { AxeResults } from 'axe-core';
import { axe } from 'jest-axe';

// Custom matcher implementation for Vitest
const toHaveNoViolations = {
  toHaveNoViolations(received: AxeResults) {
    const pass = received.violations.length === 0;

    if (pass) {
      return {
        pass: true,
        message: () => 'expected violations but received none',
      };
    }

    return {
      pass: false,
      message: () => {
        const violations = received.violations.map((v) => `${v.id}: ${v.description}`).join('\n');
        return `expected no violations but received:\n${violations}`;
      },
    };
  },
};

expect.extend(toHaveNoViolations);

declare module 'vitest' {
  interface Assertion {
    toHaveNoViolations(): Promise<void>;
  }
}

export { axe };
