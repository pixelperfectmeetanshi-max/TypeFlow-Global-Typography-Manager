import '@testing-library/react';
import { expect } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend vitest's expect with jest-dom matchers
expect.extend(matchers);

// Mock scrollIntoView for jsdom (not implemented in jsdom)
Element.prototype.scrollIntoView = function () {};

// Global test setup for vitest
// Add any global mocks or setup here
