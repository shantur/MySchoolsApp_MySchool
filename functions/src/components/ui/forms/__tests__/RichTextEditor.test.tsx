/**
 * Rich Text Editor Tests
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import RichTextEditor from '../RichTextEditor';

// Mock document.execCommand for testing
const mockExecCommand = jest.fn();
Object.defineProperty(document, 'execCommand', {
  value: mockExecCommand,
  writable: true,
});

// Mock document.queryCommandState for testing
const mockQueryCommandState = jest.fn(() => false);
Object.defineProperty(document, 'queryCommandState', {
  value: mockQueryCommandState,
  writable: true,
});

describe('RichTextEditor', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
    mockExecCommand.mockClear();
    mockQueryCommandState.mockClear();
    mockQueryCommandState.mockReturnValue(false);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders with initial value', () => {
    render(
      <RichTextEditor
        value="<p>Initial content</p>"
        onChange={mockOnChange}
      />
    );

    expect(screen.getByTestId('rich-text-editor')).toBeInTheDocument();
  });

  it('renders with placeholder when empty', () => {
    render(
      <RichTextEditor
        value=""
        onChange={mockOnChange}
        placeholder="Test placeholder"
      />
    );

    const editor = screen.getByTestId('rich-text-editor');
    expect(editor).toHaveAttribute('data-placeholder', 'Test placeholder');
    expect(editor).toHaveTextContent('Test placeholder');
  });

  it('calls onChange when content is modified', () => {
    render(
      <RichTextEditor
        value=""
        onChange={mockOnChange}
      />
    );

    const editor = screen.getByTestId('rich-text-editor');
    fireEvent.input(editor, { target: { innerHTML: '<p>New content</p>' } });

    expect(mockOnChange).toHaveBeenCalledWith('<p>New content</p>');
  });

  it('formats text when bold button is clicked', () => {
    render(
      <RichTextEditor
        value=""
        onChange={mockOnChange}
      />
    );

    const boldButton = screen.getByTitle('Bold (Ctrl+B)');
    fireEvent.click(boldButton);

    expect(mockExecCommand).toHaveBeenCalledWith('bold', false, undefined);
  });

  it('formats text when italic button is clicked', () => {
    render(
      <RichTextEditor
        value=""
        onChange={mockOnChange}
      />
    );

    const italicButton = screen.getByTitle('Italic (Ctrl+I)');
    fireEvent.click(italicButton);

    expect(mockExecCommand).toHaveBeenCalledWith('italic', false, undefined);
  });

  it('formats text when underline button is clicked', () => {
    render(
      <RichTextEditor
        value=""
        onChange={mockOnChange}
      />
    );

    const underlineButton = screen.getByTitle('Underline (Ctrl+U)');
    fireEvent.click(underlineButton);

    expect(mockExecCommand).toHaveBeenCalledWith('underline', false, undefined);
  });

  it('inserts bullet list when list button is clicked', () => {
    render(
      <RichTextEditor
        value=""
        onChange={mockOnChange}
      />
    );

    const bulletListButton = screen.getByTitle('Bullet List');
    fireEvent.click(bulletListButton);

    expect(mockExecCommand).toHaveBeenCalledWith('insertUnorderedList', false, undefined);
  });

  it('inserts numbered list when numbered list button is clicked', () => {
    render(
      <RichTextEditor
        value=""
        onChange={mockOnChange}
      />
    );

    const numberedListButton = screen.getByTitle('Numbered List');
    fireEvent.click(numberedListButton);

    expect(mockExecCommand).toHaveBeenCalledWith('insertOrderedList', false, undefined);
  });

  it('shows active state for bold when queryCommandState returns true', () => {
    // Mock queryCommandState to return true for bold
    mockQueryCommandState.mockImplementation((command: string) => {
      if (command === 'bold') return true;
      return false;
    });

    render(
      <RichTextEditor
        value=""
        onChange={mockOnChange}
      />
    );

    // Trigger selection change to update the button state
    const editor = screen.getByTestId('rich-text-editor');
    fireEvent.mouseUp(editor);

    const boldButton = screen.getByTitle('Bold (Ctrl+B)');
    expect(boldButton).toHaveClass('bg-blue-600', 'text-white');
  });

  it('disables all controls when disabled prop is true', () => {
    render(
      <RichTextEditor
        value=""
        onChange={mockOnChange}
        disabled={true}
      />
    );

    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toBeDisabled();
    });

    const editor = screen.getByTestId('rich-text-editor');
    expect(editor).toHaveAttribute('contenteditable', 'false');
  });

  it('displays character count', () => {
    render(
      <RichTextEditor
        value="<p>Hello world</p>"
        onChange={mockOnChange}
      />
    );

    expect(screen.getByText('11 characters')).toBeInTheDocument();
  });

  it('has proper data attributes for testing', () => {
    render(
      <RichTextEditor
        value=""
        onChange={mockOnChange}
      />
    );

    expect(screen.getByTestId('rich-text-editor')).toHaveAttribute('data-rich-text-editor');
  });
});