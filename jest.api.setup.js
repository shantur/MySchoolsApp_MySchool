// Setup for API route tests
const { TextEncoder, TextDecoder } = require('util')

// Setup Web API mocks for Next.js API routes
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Mock Request and Response for Next.js API routes
global.Request = class Request {
  constructor(input, init = {}) {
    this.url = typeof input === 'string' ? input : input.url
    this.method = init.method || 'GET'
    this.headers = new Map(Object.entries(init.headers || {}))
    this.body = init.body
    this.json = async () => (typeof this.body === 'string' ? JSON.parse(this.body) : this.body)
  }
}

global.Response = class Response {
  constructor(body, init = {}) {
    this.body = body
    this.status = init.status || 200
    this.headers = new Map(Object.entries(init.headers || {}))
    this.json = async () => (typeof this.body === 'string' ? JSON.parse(this.body) : this.body)
  }
  
  static json(data, init = {}) {
    return new Response(JSON.stringify(data), {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...init.headers,
      },
    })
  }
}

// Mock NextResponse
global.NextResponse = class NextResponse extends Response {
  static json(data, init = {}) {
    return new Response(JSON.stringify(data), {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...init.headers,
      },
    })
  }
}

// Mock NextRequest
global.NextRequest = class NextRequest extends Request {
  constructor(input, init = {}) {
    super(input, init)
    this.nextUrl = new URL(typeof input === 'string' ? input : input.url)
  }
}

// Mock URL and URLSearchParams
global.URL = class URL {
  constructor(url, base) {
    this.url = url
    this.searchParams = new URLSearchParams(url.includes('?') ? url.split('?')[1] : '')
  }
}

global.URLSearchParams = class URLSearchParams {
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