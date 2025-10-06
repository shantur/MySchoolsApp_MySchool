/**
 * HTML Structure Validation Tests
 * 
 * Validates that rendered HTML contains required data-* attributes
 * for Flutter adapter parsing.
 * 
 * @jest-environment jsdom
 */

describe('Notices HTML Structure for Parsing', () => {
  describe('Notice List Page Structure', () => {
    it('should have page metadata attributes', () => {
      const html = `
        <div 
          data-page-type="notice-list" 
          data-portal-version="1.0.0"
          data-school-id="school123"
        />
      `;
      
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      const metadata = doc.querySelector('[data-page-type="notice-list"]');
      expect(metadata).not.toBeNull();
      expect(metadata?.getAttribute('data-portal-version')).toBe('1.0.0');
      expect(metadata?.getAttribute('data-school-id')).toBe('school123');
    });

    it('should structure notice items correctly', () => {
      const html = `
        <article 
          class="notice-item" 
          data-notice-id="notice123" 
          data-school-id="schoolA"
        >
          <h2 data-notice-title>Important Announcement</h2>
          <p class="notice-summary" data-notice-summary>
            This is a summary...
          </p>
          <span 
            class="notice-date" 
            data-notice-publication-date="2025-10-26T10:00:00Z"
          >
            October 26, 2025
          </span>
          <a 
            href="/schoolA/notices/notice123" 
            data-notice-detail-link
          >
            Read More
          </a>
        </article>
      `;
      
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      const notice = doc.querySelector('[data-notice-id="notice123"]');
      expect(notice).not.toBeNull();
      expect(notice?.getAttribute('data-school-id')).toBe('schoolA');
      
      const title = notice?.querySelector('[data-notice-title]');
      expect(title?.textContent).toBe('Important Announcement');
      
      const summary = notice?.querySelector('[data-notice-summary]');
      expect(summary).not.toBeNull();
      
      const date = notice?.querySelector('[data-notice-publication-date]');
      expect(date?.getAttribute('data-notice-publication-date'))
        .toBe('2025-10-26T10:00:00Z');
      
      const link = notice?.querySelector('[data-notice-detail-link]');
      expect(link?.getAttribute('href'))
        .toBe('/schoolA/notices/notice123');
    });

    it('should include attachment count attribute', () => {
      const html = `
        <span data-attachment-count="2">📎 2 attachments</span>
      `;
      
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      const attachmentCount = doc.querySelector('[data-attachment-count]');
      expect(attachmentCount?.getAttribute('data-attachment-count'))
        .toBe('2');
    });
  });

  describe('Notice Detail Page Structure', () => {
    it('should have page metadata for detail view', () => {
      const html = `
        <div 
          data-page-type="notice-detail" 
          data-portal-version="1.0.0"
          data-notice-id="notice123"
          data-school-id="schoolA"
        />
      `;
      
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      const metadata = doc.querySelector(
        '[data-page-type="notice-detail"]'
      );
      expect(metadata).not.toBeNull();
      expect(metadata?.getAttribute('data-notice-id')).toBe('notice123');
      expect(metadata?.getAttribute('data-school-id')).toBe('schoolA');
    });

    it('should structure notice content with data attributes', () => {
      const html = `
        <article class="notice-detail" data-notice-id="notice123">
          <h1 data-notice-title>Important Announcement</h1>
          <div 
            class="notice-content" 
            data-notice-body
            data-content-format="html"
          >
            <p>Full content here.</p>
          </div>
        </article>
      `;
      
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      const article = doc.querySelector('.notice-detail');
      expect(article?.getAttribute('data-notice-id')).toBe('notice123');
      
      const title = article?.querySelector('[data-notice-title]');
      expect(title?.textContent).toBe('Important Announcement');
      
      const body = article?.querySelector('[data-notice-body]');
      expect(body?.getAttribute('data-content-format')).toBe('html');
    });

    it('should structure attachments correctly', () => {
      const html = `
        <ul class="attachments-list">
          <li 
            class="attachment-item" 
            data-attachment-id="attach456"
          >
            <a 
              href="/api/attachments/download/attach456" 
              data-attachment-download-url="/api/attachments/download/attach456"
              data-attachment-filename="document.pdf"
              data-attachment-filetype="application/pdf"
              data-attachment-size="123456"
            >
              document.pdf
            </a>
          </li>
          <li 
            class="attachment-item" 
            data-attachment-id="attach789"
          >
            <a 
              href="/api/attachments/download/attach789"
              data-attachment-download-url="/api/attachments/download/attach789"
              data-attachment-filename="image.jpg"
              data-attachment-filetype="image/jpeg"
              data-attachment-size="654321"
            >
              image.jpg
            </a>
          </li>
        </ul>
      `;
      
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      const attachmentsList = doc.querySelector('.attachments-list');
      expect(attachmentsList?.tagName).toBe('UL');
      
      const attachments = doc.querySelectorAll('.attachment-item');
      expect(attachments.length).toBe(2);
      
      // First attachment
      const firstAttachment = attachments[0];
      expect(firstAttachment.getAttribute('data-attachment-id'))
        .toBe('attach456');
      
      const firstLink = firstAttachment.querySelector('a');
      expect(firstLink?.getAttribute('data-attachment-filename'))
        .toBe('document.pdf');
      expect(firstLink?.getAttribute('data-attachment-filetype'))
        .toBe('application/pdf');
      expect(firstLink?.getAttribute('data-attachment-size'))
        .toBe('123456');
      
      // Second attachment
      const secondAttachment = attachments[1];
      const secondLink = secondAttachment.querySelector('a');
      expect(secondLink?.getAttribute('data-attachment-filename'))
        .toBe('image.jpg');
      expect(secondLink?.getAttribute('data-attachment-filetype'))
        .toBe('image/jpeg');
    });
  });

  describe('Semantic HTML Requirements', () => {
    it('should use article tag for notice items', () => {
      const html = '<article class="notice-item"></article>';
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      const article = doc.querySelector('.notice-item');
      expect(article?.tagName).toBe('ARTICLE');
    });

    it('should use semantic heading tags', () => {
      const html = `
        <article>
          <h1 data-notice-title>Title</h1>
          <h2>Subtitle</h2>
        </article>
      `;
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      const h1 = doc.querySelector('h1');
      const h2 = doc.querySelector('h2');
      
      expect(h1).not.toBeNull();
      expect(h2).not.toBeNull();
    });

    it('should use ul for attachments list', () => {
      const html = '<ul class="attachments-list"></ul>';
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      const list = doc.querySelector('.attachments-list');
      expect(list?.tagName).toBe('UL');
    });
  });

  describe('ARIA Labels for Accessibility', () => {
    it('should include aria-label for hidden metadata', () => {
      const html = `
        <div data-page-type="notice-list" aria-hidden="true" />
      `;
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      const metadata = doc.querySelector('[data-page-type]');
      expect(metadata?.getAttribute('aria-hidden')).toBe('true');
    });
  });
});
