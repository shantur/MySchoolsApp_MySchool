// Mock window.location for tests
// This file is imported after jest is fully initialized
// Only runs in jsdom environment (not node environment for middleware tests)

if (typeof window !== 'undefined') {
  // jsdom's window.location properties are read-only, so we need to fully replace the object
  // Save the original location object
  const originalLocation = window.location;
  
  // Create a mock location object
  const locationMock = {
    ...originalLocation,
    assign: jest.fn(),
    reload: jest.fn(),
    replace: jest.fn(),
    href: originalLocation.href,
    protocol: originalLocation.protocol,
    host: originalLocation.host,
    hostname: originalLocation.hostname,
    port: originalLocation.port,
    pathname: originalLocation.pathname,
    search: originalLocation.search,
    hash: originalLocation.hash,
    origin: originalLocation.origin,
    toString: () => originalLocation.toString(),
  };

  // Delete the existing location and add our mock
  delete global.window.location;
  global.window.location = locationMock;

  // Reset mocks before each test
  beforeEach(() => {
    locationMock.assign.mockClear();
    locationMock.reload.mockClear();
    locationMock.replace.mockClear();
  });

  module.exports = locationMock;
} else {
  // Node environment - no window object
  module.exports = {};
}
