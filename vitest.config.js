import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Use happy-dom for better performance and compatibility
    environment: 'happy-dom',

    // Setup file for global test configuration
    setupFiles: ['__tests__/setup.js'],

    // Include test files
    include: ['__tests__/**/*.test.js'],

    // Global test timeout (10 seconds)
    testTimeout: 10000,

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov', 'json'],
      include: ['js/**/*.js'],
      exclude: [
        'js/lame.min.js',
        'js/jsmediatags.min.js',
        '**/*.test.js',
        '**/*.spec.js',
        '__tests__/**'
      ],
      // Target 60% coverage minimum
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 50,
        statements: 60
      }
    },

    // Enable globals like describe, it, expect
    globals: true,

    // Disable console warnings for cleaner test output
    silent: false,

    // Run tests in parallel for performance
    threads: true,

    // Isolate tests for better reliability
    isolate: true
  }
})
