// Mock for next/server module

class MockRequest {
  constructor(input, init = {}) {
    this.url = typeof input === 'string' ? input : input.url
    this.method = init.method || 'GET'
    this.headers = new Map(Object.entries(init.headers || {}))
    this.body = init.body
    this.nextUrl = new URL(this.url)
    this.json = async () => (typeof this.body === 'string' ? JSON.parse(this.body) : this.body)
  }
}

class MockResponse {
  constructor(body, init = {}) {
    this.body = body
    this.status = init.status || 200
    this.headers = new Map(Object.entries(init.headers || {}))
    this.json = async () => (typeof this.body === 'string' ? JSON.parse(this.body) : this.body)
  }
  
  static json(data, init = {}) {
    return new MockResponse(JSON.stringify(data), {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...init.headers,
      },
    })
  }
}

class MockNextResponse extends MockResponse {
  static json(data, init = {}) {
    return new MockResponse(JSON.stringify(data), {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...init.headers,
      },
    })
  }
  
  static redirect(url, init = {}) {
    return new MockResponse(null, {
      ...init,
      status: 302,
      headers: {
        'Location': url,
        ...init.headers,
      },
    })
  }
}

class MockURL {
  constructor(url, _base) {
    this.url = url
    this.searchParams = new MockURLSearchParams(url.includes('?') ? url.split('?')[1] : '')
  }
}

class MockURLSearchParams {
  constructor(query) {
    this.params = new Map()
    if (query) {
      query.split('&').forEach(param => {
        const [key, value] = param.split('=')
        if (key) this.params.set(decodeURIComponent(key), decodeURIComponent(value || ''))
      })
    }
  }
  
  get(key) {
    return this.params.get(key)
  }
  
  has(key) {
    return this.params.has(key)
  }
}

module.exports = {
  NextRequest: MockRequest,
  NextResponse: MockNextResponse,
  URL: MockURL,
  URLSearchParams: MockURLSearchParams,
}