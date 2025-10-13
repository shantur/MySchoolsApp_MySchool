// Mock for next/server module

class MockRequest {
  constructor(input, init = {}) {
    // Handle URL object, string URL, or Request-like object
    let urlString;
    if (input instanceof URL) {
      urlString = input.href;
    } else if (typeof input === 'string') {
      urlString = input;
    } else if (input && input.url) {
      urlString = input.url;
    } else {
      urlString = 'http://localhost:3000/';
    }
    
    // Ensure we have a full URL (with protocol and host)
    const fullUrl = urlString.startsWith('http') 
      ? urlString 
      : `http://localhost:3000${urlString}`;
    
    this.url = fullUrl;
    this.method = init.method || 'GET';
    this.headers = new Map(Object.entries(init.headers || {}));
    this.body = init.body;
    
    // Create a proper URL object
    const parsedUrl = new URL(fullUrl);
    this.nextUrl = {
      pathname: parsedUrl.pathname,
      search: parsedUrl.search,
      searchParams: parsedUrl.searchParams,
      href: parsedUrl.href,
      toString: () => parsedUrl.href
    };
    
    this.json = async () => (typeof this.body === 'string' ? JSON.parse(this.body) : this.body);
    
    // Add cookies helper with Map-like interface
    const cookieMap = new Map();
    const cookieHeader = this.headers.get('cookie') || '';
    if (cookieHeader) {
      cookieHeader.split(';').forEach(cookie => {
        const [name, ...valueParts] = cookie.trim().split('=');
        if (name) {
          cookieMap.set(name.trim(), valueParts.join('='));
        }
      });
    }
    
    this.cookies = {
      get: (name) => {
        const value = cookieMap.get(name);
        return value ? { value } : undefined;
      },
      set: (name, value) => {
        cookieMap.set(name, value);
        // Update the cookie header
        const cookies = Array.from(cookieMap.entries())
          .map(([k, v]) => `${k}=${v}`)
          .join('; ');
        this.headers.set('cookie', cookies);
      }
    };
  }
}

class MockResponse {
  constructor(body, init = {}) {
    this.body = body;
    this.status = init.status || 200;
    this.ok = this.status >= 200 && this.status < 300;
    
    // Create a case-insensitive headers map
    const headersMap = new Map();
    Object.entries(init.headers || {}).forEach(([key, value]) => {
      headersMap.set(key.toLowerCase(), value);
    });
    
    this.headers = {
      get: (name) => headersMap.get(name.toLowerCase()),
      set: (name, value) => headersMap.set(name.toLowerCase(), value),
      has: (name) => headersMap.has(name.toLowerCase()),
      entries: () => headersMap.entries(),
      keys: () => headersMap.keys(),
      values: () => headersMap.values()
    };
    
    this.json = async () => (typeof this.body === 'string' ? JSON.parse(this.body) : this.body);
  }
  
  static json(data, init = {}) {
    const response = new MockResponse(JSON.stringify(data), {
      ...init,
      headers: {
        'content-type': 'application/json',
        ...(init.headers || {}),
      },
    });
    return response;
  }
}

class MockNextResponse extends MockResponse {
  static json(data, init = {}) {
    const response = new MockNextResponse(JSON.stringify(data), {
      ...init,
      headers: {
        'content-type': 'application/json',
        ...(init.headers || {}),
      },
    });
    response.ok = init.status ? init.status >= 200 && init.status < 300 : true;
    return response;
  }
  
  static redirect(url, init = {}) {
    const urlString = typeof url === 'string' ? url : url.toString();
    // Next.js NextResponse.redirect defaults to 307 (Temporary Redirect) not 302
    const response = new MockNextResponse(null, {
      ...init,
      status: init.status || 307,
      headers: {
        'location': urlString,
        ...(init.headers || {}),
      },
    });
    response.redirected = true;
    return response;
  }
  
  static next() {
    return new MockNextResponse(null, { status: 200 });
  }
}

module.exports = {
  NextRequest: MockRequest,
  NextResponse: MockNextResponse,
}