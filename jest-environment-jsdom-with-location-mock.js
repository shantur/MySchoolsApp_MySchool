const JSDOMEnvironment = require('jest-environment-jsdom').default;

/**
 * Custom Jest environment that extends jsdom to mock window.location
 * 
 * jsdom 14+ has a locked Location object that prevents modification.
 * This custom environment deletes and recreates window.location as a plain object
 * so tests can mock the methods.
 * 
 * Based on: https://stackoverflow.com/a/60697570 and 
 *           https://www.csrhymes.com/2022/06/18/mocking-window-location-in-jest.html
 */
class JSDOMEnvironmentWithLocationMock extends JSDOMEnvironment {
  async setup() {
    await super.setup();
    
    // Note: jsdom's window.location is non-configurable and non-deletable.
    // Tests that need to mock navigation should use the navigation utility module
    // at src/lib/utils/navigation.ts instead of trying to mock window.location directly.
  }
}

module.exports = JSDOMEnvironmentWithLocationMock;
