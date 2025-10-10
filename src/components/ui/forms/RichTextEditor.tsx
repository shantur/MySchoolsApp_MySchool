/**
 * Plain Text Editor Component
 *
 * A simple textarea editor for creating plain text content.
 * Preserves line breaks without HTML formatting.
 */

'use client';

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
  
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className={`border border-gray-300 rounded-lg overflow-hidden ${className}`}>
      {/* Editor */}
      <textarea
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full min-h-[200px] p-4 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset resize-y"
        style={{ 
          minHeight: '200px',
          direction: 'ltr',
          textAlign: 'left',
        }}
        dir="ltr"
        data-testid="rich-text-editor"
        data-rich-text-editor
        data-placeholder={placeholder}
      />

      {/* Character count */}
      <div className="bg-gray-50 border-t border-gray-300 px-4 py-2 text-xs text-gray-500">
        {value.length} characters
      </div>
    </div>
  );
}