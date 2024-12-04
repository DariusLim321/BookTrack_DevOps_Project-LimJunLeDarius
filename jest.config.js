module.exports = {
  collectCoverage: true,
  coverageDirectory: 'jest-coverage', // Separate directory for Jest coverage
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80,
    },
  },
  testMatch: [
    "**/jest/JestSearchBookUtil.test.js"
  ],
  collectCoverageFrom: [
    "utils/search-book-util.js"  // Collect coverage for this specific file
  ],
};
