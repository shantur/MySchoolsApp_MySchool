/**
 * Rich Text Editor Component
 *
 * A simple WYSIWYG editor for creating and formatting content.
 * Supports basic text formatting, lists, and links.
 */

'use client';

import { useState, useRef, useEffect } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'Enter content...',
  disabled = false,
  className = '',
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);

  // Initialize editor with content
  useEffect(() => {
    if (editorRef.current) {
      const currentContent = value === '' ? placeholder : value;
      if (editorRef.current.innerHTML !== currentContent) {
        editorRef.current.innerHTML = currentContent;
      }
    }
  }, [value, placeholder]);

  // Update selection state
  const updateSelectionState = () => {
    if (editorRef.current) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        setIsBold(document.queryCommandState('bold'));
        setIsItalic(document.queryCommandState('italic'));
        setIsUnderline(document.queryCommandState('underline'));
      }
    }
  };

  // Handle content changes
  const handleInput = () => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML;
      onChange(content);
      updateSelectionState();
    }
  };

  // Handle selection changes
  const handleSelectionChange = () => {
    updateSelectionState();
  };

  // Format text
  const formatText = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    handleInput();
    editorRef.current?.focus();
  };

  // Insert link
  const insertLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      formatText('createLink', url);
    }
  };

  // Insert list
  const insertList = (ordered: boolean) => {
    const command = ordered ? 'insertOrderedList' : 'insertUnorderedList';
    formatText(command);
  };

  return (
    <div className={`border border-gray-300 rounded-lg overflow-hidden ${className}`}>
      {/* Toolbar */}
      <div className="bg-gray-50 border-b border-gray-300 p-2 flex flex-wrap gap-1">
        {/* Text Formatting */}
        <button
          type="button"
          onClick={() => formatText('bold')}
          disabled={disabled}
          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
            isBold
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          title="Bold (Ctrl+B)"
        >
          <strong>B</strong>
        </button>
        
        <button
          type="button"
          onClick={() => formatText('italic')}
          disabled={disabled}
          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
            isItalic
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          title="Italic (Ctrl+I)"
        >
          <em>I</em>
        </button>
        
        <button
          type="button"
          onClick={() => formatText('underline')}
          disabled={disabled}
          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
            isUnderline
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          title="Underline (Ctrl+U)"
        >
          <u>U</u>
        </button>

        <div className="w-px bg-gray-300 mx-1" />

        {/* Lists */}
        <button
          type="button"
          onClick={() => insertList(false)}
          disabled={disabled}
          className={`px-3 py-1 rounded text-sm font-medium transition-colors bg-white text-gray-700 hover:bg-gray-100 border border-gray-300 ${
            disabled ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          title="Bullet List"
        >
          • List
        </button>
        
        <button
          type="button"
          onClick={() => insertList(true)}
          disabled={disabled}
          className={`px-3 py-1 rounded text-sm font-medium transition-colors bg-white text-gray-700 hover:bg-gray-100 border border-gray-300 ${
            disabled ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          title="Numbered List"
        >
          1. List
        </button>

        <div className="w-px bg-gray-300 mx-1" />

        {/* Link */}
        <button
          type="button"
          onClick={insertLink}
          disabled={disabled}
          className={`px-3 py-1 rounded text-sm font-medium transition-colors bg-white text-gray-700 hover:bg-gray-100 border border-gray-300 ${
            disabled ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          title="Insert Link"
        >
          🔗 Link
        </button>

        <div className="w-px bg-gray-300 mx-1" />

        {/* Clear Formatting */}
        <button
          type="button"
          onClick={() => formatText('removeFormat')}
          disabled={disabled}
          className={`px-3 py-1 rounded text-sm font-medium transition-colors bg-white text-gray-700 hover:bg-gray-100 border border-gray-300 ${
            disabled ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          title="Clear Formatting"
        >
          Clear
        </button>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable={!disabled}
        onInput={handleInput}
        onMouseUp={handleSelectionChange}
        onKeyUp={handleSelectionChange}
        className="min-h-[200px] p-4 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
        style={{ 
          minHeight: '200px',
          direction: 'ltr',
          textAlign: 'left',
          ...(value === '' && { 
            color: '#9CA3AF' // gray-400
          })
        }}
        dir="ltr"
        data-testid="rich-text-editor"
        data-rich-text-editor
        data-placeholder={placeholder}
        suppressContentEditableWarning={true}
        dangerouslySetInnerHTML={{
          __html: value === '' ? placeholder : value
        }}
      />

      {/* Character count */}
      <div className="bg-gray-50 border-t border-gray-300 px-4 py-2 text-xs text-gray-500">
        {value.replace(/<[^>]*>/g, '').length} characters
      </div>
    </div>
  );
}