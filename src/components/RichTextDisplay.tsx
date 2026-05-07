import DOMPurify from 'dompurify';

interface RichTextDisplayProps {
  content: string | null | undefined;
}

const RichTextDisplay = ({ content }: RichTextDisplayProps) => {
  if (!content) {
    return <p className="text-sm text-slate-600">No content</p>;
  }

  // Check if content is HTML or plain text
  const isHTML = /<[^>]*>/.test(content);

  if (isHTML) {
    // Sanitize HTML content
    const cleanHTML = DOMPurify.sanitize(content, {
      ALLOWED_TAGS: [
        'p', 'br', 'strong', 'em', 'u', 's', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li', 'table', 'thead', 'tbody', 'tr', 'td', 'th',
        'blockquote', 'pre', 'code', 'a', 'img', 'span', 'div', 'sub', 'sup',
      ],
      ALLOWED_ATTR: [
        'href', 'title', 'target', 'rel',
        'src', 'alt', 'width', 'height',
        'style', 'class',
        'colspan', 'rowspan', 'align',
      ],
    });

    return (
      <>
        <div 
          className="ql-editor prose prose-sm"
          dangerouslySetInnerHTML={{ __html: cleanHTML }}
          style={{
            backgroundColor: 'transparent',
            padding: 0,
            border: 'none',
          }}
        />
        <style>{`
          .ql-editor {
            font-size: 0.875rem;
            line-height: 1.6;
            color: #1e293b;
          }
          .ql-editor h1 {
            font-size: 1.875rem;
            font-weight: 700;
            margin: 1em 0 0.5em;
          }
          .ql-editor h2 {
            font-size: 1.5rem;
            font-weight: 700;
            margin: 0.83em 0 0.42em;
          }
          .ql-editor h3 {
            font-size: 1.25rem;
            font-weight: 700;
            margin: 0.67em 0 0.33em;
          }
          .ql-editor p {
            margin: 0.5em 0;
          }
          .ql-editor ul, .ql-editor ol {
            padding-left: 1.5em;
            margin: 0.5em 0;
          }
          .ql-editor li {
            margin: 0.25em 0;
          }
          .ql-editor table {
            width: 100%;
            border-collapse: collapse;
            margin: 1em 0;
            border: 1.5px solid #64748b;
            table-layout: fixed;
            page-break-inside: avoid;
          }
          .ql-editor table td,
          .ql-editor table th {
            border: 1.5px solid #64748b;
            padding: 0.5em;
            text-align: left;
            min-width: 4rem;
            vertical-align: top;
            word-break: break-word;
          }
          .ql-editor table th {
            background-color: #f8fafc;
            font-weight: 600;
          }
          .ql-editor img {
            max-width: 100%;
            height: auto;
            margin: 0.5em 0;
            border-radius: 0.5rem;
            border: 1px solid #e2e8f0;
          }
          .ql-editor a {
            color: #0284c7;
            text-decoration: underline;
          }
          .ql-editor a:hover {
            color: #0369a1;
          }
          .ql-editor blockquote {
            border-left: 4px solid #0284c7;
            margin: 0.5em 0;
            padding-left: 1em;
            color: #64748b;
            font-style: italic;
          }
          .ql-editor pre {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 0.25rem;
            padding: 1em;
            overflow-x: auto;
            font-family: 'Courier New', monospace;
          }
          .ql-editor code {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 0.25rem;
            padding: 0.2em 0.4em;
            font-family: 'Courier New', monospace;
          }
          .ql-editor pre code {
            background-color: transparent;
            border: none;
            padding: 0;
          }
          .ql-editor sub,
          .ql-editor sup {
            font-size: 0.75em;
            line-height: 0;
          }
        `}</style>
      </>
    );
  }

  // Plain text fallback
  return (
    <p className="text-sm text-slate-600 whitespace-pre-line">{content}</p>
  );
};

export default RichTextDisplay;
