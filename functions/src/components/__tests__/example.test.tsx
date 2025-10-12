/**
 * Example component test to validate testing setup
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from '@jest/globals';

// Simple component for testing
function ExampleComponent({ title }: { title: string }) {
  return (
    <div>
      <h1>{title}</h1>
      <p>This is a test component</p>
    </div>
  );
}

describe('Example Component Test', () => {
  it('should render the title', () => {
    render(<ExampleComponent title="Test Title" />);
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('should render the paragraph', () => {
    render(<ExampleComponent title="Test Title" />);
    expect(screen.getByText('This is a test component')).toBeInTheDocument();
  });
});
