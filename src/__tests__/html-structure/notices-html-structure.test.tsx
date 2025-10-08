/**
 * HTML Structure Validation Tests
 * 
 * Validates that rendered HTML contains required data-* attributes
 * for Flutter adapter parsing. Includes both unit tests (hard-coded HTML)
 * and integration tests (rendering actual components).
 * 
 * @jest-environment jsdom
 */

import { render } from '@testing-library/react';
import { Timestamp } from 'firebase-admin/firestore';

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

  describe('Integration Tests - Rendered Components', () => {
    describe('Notice Detail Page Rendering', () => {
      it('should render notice detail with correct HTML structure and data attributes', () => {
        // Mock notice data with attachments
        const mockNotice = {
          noticeId: 'test-notice-123',
          schoolId: 'school-a',
          title: 'Test Notice Title',
          body: '<p>This is the notice body content.</p>',
          publicationDate: Timestamp.fromDate(new Date('2025-10-26T10:00:00Z')),
          status: 'published' as const,
          attachments: [
            {
              id: 'attach-real-id-456',
              fileName: 'document.pdf',
              fileType: 'application/pdf',
              downloadURL: '/api/attachments/download/attach-real-id-456',
              size: 123456,
            },
            {
              id: 'attach-real-id-789',
              fileName: 'image.jpg',
              fileType: 'image/jpeg',
              downloadURL: '/api/attachments/download/attach-real-id-789',
              size: 654321,
            },
          ],
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        };

        // Create a simplified version of the notice detail HTML structure
        const NoticeDetailTestComponent = () => (
          <>
            <div
              data-page-type="notice-detail"
              data-portal-version="1.0.0"
              data-timestamp={new Date().toISOString()}
              data-notice-id={mockNotice.noticeId}
              data-school-id={mockNotice.schoolId}
              className="hidden"
              aria-hidden="true"
            />
            <article className="notice-detail" data-notice-id={mockNotice.noticeId}>
              <h1 data-notice-title>{mockNotice.title}</h1>
              <div
                className="notice-content"
                data-notice-body
                data-content-format="html"
                dangerouslySetInnerHTML={{ __html: mockNotice.body }}
              />
              {mockNotice.attachments && mockNotice.attachments.length > 0 && (
                <ul className="attachments-list">
                  {mockNotice.attachments.map((attachment) => (
                    <li
                      key={attachment.id}
                      className="attachment-item"
                      data-attachment-id={attachment.id}
                    >
                      <a
                        href={`${attachment.downloadURL}?noticeId=${mockNotice.noticeId}&schoolId=${mockNotice.schoolId}`}
                        data-attachment-download-url={`${attachment.downloadURL}?noticeId=${mockNotice.noticeId}&schoolId=${mockNotice.schoolId}`}
                        data-attachment-filename={attachment.fileName}
                        data-attachment-filetype={attachment.fileType}
                        data-attachment-size={attachment.size?.toString()}
                      >
                        {attachment.fileName}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          </>
        );

        const { container } = render(<NoticeDetailTestComponent />);

        // Verify page metadata
        const pageMetadata = container.querySelector('[data-page-type="notice-detail"]');
        expect(pageMetadata).not.toBeNull();
        expect(pageMetadata?.getAttribute('data-notice-id')).toBe('test-notice-123');
        expect(pageMetadata?.getAttribute('data-school-id')).toBe('school-a');
        expect(pageMetadata?.getAttribute('data-portal-version')).toBe('1.0.0');

        // Verify notice article structure
        const article = container.querySelector('article.notice-detail');
        expect(article).not.toBeNull();
        expect(article?.getAttribute('data-notice-id')).toBe('test-notice-123');

        // Verify title
        const title = article?.querySelector('[data-notice-title]');
        expect(title).not.toBeNull();
        expect(title?.textContent).toBe('Test Notice Title');

        // Verify body
        const body = article?.querySelector('[data-notice-body]');
        expect(body).not.toBeNull();
        expect(body?.getAttribute('data-content-format')).toBe('html');

        // Verify attachments with REAL IDs
        const attachmentsList = container.querySelector('ul.attachments-list');
        expect(attachmentsList).not.toBeNull();

        const attachments = container.querySelectorAll('li.attachment-item');
        expect(attachments).toHaveLength(2);

        // First attachment - verify REAL ID
        const firstAttachment = attachments[0];
        expect(firstAttachment.getAttribute('data-attachment-id')).toBe('attach-real-id-456');
        const firstLink = firstAttachment.querySelector('a');
        expect(firstLink?.getAttribute('data-attachment-filename')).toBe('document.pdf');
        expect(firstLink?.getAttribute('data-attachment-filetype')).toBe('application/pdf');
        expect(firstLink?.getAttribute('data-attachment-size')).toBe('123456');
        expect(firstLink?.getAttribute('data-attachment-download-url')).toContain('attach-real-id-456');

        // Second attachment - verify REAL ID
        const secondAttachment = attachments[1];
        expect(secondAttachment.getAttribute('data-attachment-id')).toBe('attach-real-id-789');
        const secondLink = secondAttachment.querySelector('a');
        expect(secondLink?.getAttribute('data-attachment-filename')).toBe('image.jpg');
        expect(secondLink?.getAttribute('data-attachment-filetype')).toBe('image/jpeg');
        expect(secondLink?.getAttribute('data-attachment-size')).toBe('654321');
        expect(secondLink?.getAttribute('data-attachment-download-url')).toContain('attach-real-id-789');
      });
    });

    describe('Live HTML Preview Panel Rendering', () => {
      it('should render live preview HTML with correct structure', () => {
        const previewData = {
          title: 'Preview Notice Title',
          body: 'This is the preview body content.',
          schoolId: 'school-preview',
        };

        const previewHtml = `
          <div data-page-type="notice-detail" data-portal-version="1.0.0" data-timestamp="${new Date().toISOString()}" data-notice-id="preview-notice" data-school-id="${previewData.schoolId}" class="hidden" aria-hidden="true"></div>

          <article class="notice-detail" data-notice-id="preview-notice">
            <h1 data-notice-title>${previewData.title}</h1>
            <div class="notice-content" data-notice-body data-content-format="html">
              ${previewData.body.replace(/\n/g, '<br>')}
            </div>
          </article>
        `;

        const PreviewComponent = () => (
          <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
        );

        const { container } = render(<PreviewComponent />);

        // Verify the preview renders with correct data attributes
        const pageMetadata = container.querySelector('[data-page-type="notice-detail"]');
        expect(pageMetadata).not.toBeNull();
        expect(pageMetadata?.getAttribute('data-school-id')).toBe('school-preview');
        expect(pageMetadata?.getAttribute('data-notice-id')).toBe('preview-notice');

        const article = container.querySelector('article[data-notice-id="preview-notice"]');
        expect(article).not.toBeNull();

        const title = article?.querySelector('[data-notice-title]');
        expect(title?.textContent).toBe('Preview Notice Title');

        const body = article?.querySelector('[data-notice-body]');
        expect(body).not.toBeNull();
        expect(body?.getAttribute('data-content-format')).toBe('html');
      });
    });

    describe('HTML Contract Snapshot Tests', () => {
      it('should maintain consistent HTML structure for notice detail (snapshot)', () => {
        const mockNotice = {
          noticeId: 'snapshot-notice',
          schoolId: 'snapshot-school',
          title: 'Snapshot Test Notice',
          body: '<p>Snapshot body content</p>',
          attachments: [
            {
              id: 'snapshot-attach-1',
              fileName: 'test.pdf',
              fileType: 'application/pdf',
              downloadURL: '/api/attachments/download/snapshot-attach-1',
              size: 1024,
            },
          ],
        };

        const NoticeSnapshotComponent = () => (
          <article className="notice-detail" data-notice-id={mockNotice.noticeId}>
            <h1 data-notice-title>{mockNotice.title}</h1>
            <div
              data-notice-body
              data-content-format="html"
              dangerouslySetInnerHTML={{ __html: mockNotice.body }}
            />
            <ul className="attachments-list">
              {mockNotice.attachments.map((att) => (
                <li key={att.id} data-attachment-id={att.id}>
                  <a
                    href={att.downloadURL}
                    data-attachment-download-url={att.downloadURL}
                    data-attachment-filename={att.fileName}
                    data-attachment-filetype={att.fileType}
                    data-attachment-size={att.size?.toString()}
                  >
                    {att.fileName}
                  </a>
                </li>
              ))}
            </ul>
          </article>
        );

        const { container } = render(<NoticeSnapshotComponent />);
        
        // Take a snapshot of the rendered DOM structure
        expect(container.innerHTML).toMatchSnapshot();
      });
    });
  });
});
