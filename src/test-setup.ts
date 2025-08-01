// This file is required by vitest and loads recursively all the .spec and framework files

import 'zone.js';
import 'zone.js/testing';
import { getTestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting
} from '@angular/platform-browser-dynamic/testing';

// Set up global test utilities for Vitest (must be imported before Angular setup)
import { expect, vi, it, describe, beforeEach, afterEach } from 'vitest';

// Global error handler to suppress Ionic platform errors
const originalConsoleError = console.error;
console.error = (...args: any[]) => {
  const message = args[0]?.toString() || '';
  if (message.includes('elm[aelFn] is not a function') || 
      message.includes('Ionic platform')) {
    return; // Suppress Ionic-specific errors
  }
  originalConsoleError.apply(console, args);
};

// Handle uncaught exceptions globally
if (typeof process !== 'undefined') {
  process.on('uncaughtException', (error: Error) => {
    if (error.message.includes('elm[aelFn] is not a function')) {
      return; // Suppress this specific Ionic error
    }
    console.error('Uncaught Exception:', error);
  });
  
  process.on('unhandledRejection', (reason: any) => {
    if (reason?.toString().includes('elm[aelFn] is not a function')) {
      return; // Suppress this specific Ionic error
    }
    console.error('Unhandled Rejection:', reason);
  });
}

// Override the global error handler for the window
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    if (event.error?.message?.includes('elm[aelFn] is not a function')) {
      event.preventDefault();
      event.stopPropagation();
      return false;
    }
    return true;
  });
  
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason?.toString().includes('elm[aelFn] is not a function')) {
      event.preventDefault();
      return false;
    }
    return true;
  });
}

// Mock DOM API completely for Ionic compatibility
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// First, initialize the Angular testing environment.
getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting(),
);

// Add Jasmine-compatible globals
Object.assign(global, { 
  expect, 
  vi,
  it,
  describe,
  beforeEach,
  afterEach,
  xit: it.skip,
  fit: it.only,
  fdescribe: describe.only,
  xdescribe: describe.skip
});

// Patch Zone.js for tests
import { TestBed } from '@angular/core/testing';

// Initialize TestBed before any tests run
beforeEach(() => {
  if (TestBed) {
    TestBed.resetTestingModule();
  }
});
