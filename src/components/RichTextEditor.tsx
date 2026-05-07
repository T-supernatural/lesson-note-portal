import { useRef, useEffect, useMemo, useState } from 'react';
import ReactQuill, { Quill } from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const BlockEmbed = Quill.import('blots/block/embed');

class LessonTableBlot extends BlockEmbed {
  static blotName = 'lessonTable';
  static tagName = 'div';
  static className = 'lesson-table-embed';

  static create(value: string) {
    const node = super.create() as HTMLElement;
    node.setAttribute('contenteditable', 'false');
    node.innerHTML = value;
    node.querySelectorAll('td, th').forEach((cell) => {
      cell.setAttribute('contenteditable', 'true');
    });
    return node;
  }

  static value(node: HTMLElement) {
    return node.innerHTML;
  }
}

Quill.register(LessonTableBlot);

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
}

const RichTextEditor = ({ 
  value, 
  onChange, 
  placeholder = 'Write your content here...', 
  disabled = false,
  readOnly = false 
}: RichTextEditorProps) => {
  const quillRef = useRef<ReactQuill>(null);
  const onChangeRef = useRef(onChange);
  const lastSyncedHTMLRef = useRef(value);
  const [isUploading, setIsUploading] = useState(false);
  const toolbarId = useMemo(() => `rich-text-toolbar-${Math.random().toString(36).slice(2)}`, []);
  const editorValue = useMemo(() => {
    if (!value || !/<table\b/i.test(value) || /lesson-table-embed/.test(value) || typeof DOMParser === 'undefined') {
      return value;
    }

    const documentFragment = new DOMParser().parseFromString(`<div>${value}</div>`, 'text/html');
    documentFragment.body.querySelectorAll('table').forEach((table) => {
      if (table.parentElement?.classList.contains('lesson-table-embed')) return;
      const wrapper = documentFragment.createElement('div');
      wrapper.className = 'lesson-table-embed';
      wrapper.setAttribute('contenteditable', 'false');
      table.parentNode?.insertBefore(wrapper, table);
      wrapper.appendChild(table);
    });

    return documentFragment.body.firstElementChild?.innerHTML ?? value;
  }, [value]);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!quillRef.current || !/<table\b/i.test(editorValue) || editorValue === lastSyncedHTMLRef.current) return;
    const editor = quillRef.current.getEditor();
    editor.root.innerHTML = editorValue;
    lastSyncedHTMLRef.current = editorValue;
  }, [editorValue]);

  const syncCurrentEditorHTML = () => {
    if (!quillRef.current) return;
    const root = quillRef.current.getEditor().root;
    lastSyncedHTMLRef.current = root.innerHTML;
    onChangeRef.current(root.innerHTML);
  };

  const getActiveCell = () => {
    const selection = document.getSelection();
    const node = selection?.anchorNode;
    const element = node instanceof Element ? node : node?.parentElement;
    const cell = element?.closest('td, th') as HTMLTableCellElement | null;
    return quillRef.current?.getEditor().root.contains(cell) ? cell : null;
  };

  const createTable = (rows = 3, columns = 3) => {
    const table = document.createElement('table');
    table.className = 'lesson-table';

    const tbody = document.createElement('tbody');
    Array.from({ length: rows }).forEach(() => {
      const row = document.createElement('tr');
      Array.from({ length: columns }).forEach(() => {
        const cell = document.createElement('td');
        cell.innerHTML = '<br>';
        row.appendChild(cell);
      });
      tbody.appendChild(row);
    });

    table.appendChild(tbody);
    return table;
  };

  const placeCursorInCell = (cell: HTMLTableCellElement) => {
    const range = document.createRange();
    range.selectNodeContents(cell);
    range.collapse(true);
    const selection = document.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  };

  const insertTable = () => {
    if (!quillRef.current || disabled || readOnly) return;
    const editor = quillRef.current.getEditor();
    editor.focus();

    const table = createTable();
    const range = editor.getSelection(true);
    const index = range ? range.index : editor.getLength();
    editor.insertEmbed(index, 'lessonTable', table.outerHTML, 'user');
    editor.insertText(index + 1, '\n', 'user');
    syncCurrentEditorHTML();

    const tableEmbeds = editor.root.querySelectorAll('.lesson-table-embed');
    const insertedEmbed = tableEmbeds[tableEmbeds.length - 1];
    const firstCell = insertedEmbed?.querySelector('td') as HTMLTableCellElement | null;
    if (firstCell) placeCursorInCell(firstCell);
  };

  const addTableRow = () => {
    if (disabled || readOnly) return;
    const cell = getActiveCell();
    const row = cell?.parentElement as HTMLTableRowElement | null;
    const table = cell?.closest('table');
    if (!row || !table) {
      toast.error('Click inside a table first');
      return;
    }

    const columnCount = row.children.length;
    const newRow = document.createElement('tr');
    Array.from({ length: columnCount }).forEach(() => {
      const newCell = document.createElement('td');
      newCell.innerHTML = '<br>';
      newRow.appendChild(newCell);
    });
    row.after(newRow);
    placeCursorInCell(newRow.cells[0]);
    syncCurrentEditorHTML();
  };

  const removeTableRow = () => {
    if (disabled || readOnly) return;
    const cell = getActiveCell();
    const row = cell?.parentElement as HTMLTableRowElement | null;
    const table = cell?.closest('table');
    const rows = table?.querySelectorAll('tr');
    if (!row || !rows) {
      toast.error('Click inside a table first');
      return;
    }
    if (rows.length <= 1) {
      toast.error('A table must have at least one row');
      return;
    }

    const nextRow = row.nextElementSibling || row.previousElementSibling;
    row.remove();
    const nextCell = nextRow?.querySelector('td, th') as HTMLTableCellElement | null;
    if (nextCell) placeCursorInCell(nextCell);
    syncCurrentEditorHTML();
  };

  const addTableColumn = () => {
    if (disabled || readOnly) return;
    const cell = getActiveCell();
    const row = cell?.parentElement as HTMLTableRowElement | null;
    const table = cell?.closest('table');
    if (!cell || !row || !table) {
      toast.error('Click inside a table first');
      return;
    }

    const index = Array.from(row.children).indexOf(cell);
    table.querySelectorAll('tr').forEach((tableRow) => {
      const newCell = document.createElement('td');
      newCell.innerHTML = '<br>';
      tableRow.children[index]?.after(newCell);
    });
    const insertedCell = row.children[index + 1] as HTMLTableCellElement | undefined;
    if (insertedCell) placeCursorInCell(insertedCell);
    syncCurrentEditorHTML();
  };

  const removeTableColumn = () => {
    if (disabled || readOnly) return;
    const cell = getActiveCell();
    const row = cell?.parentElement as HTMLTableRowElement | null;
    const table = cell?.closest('table');
    if (!cell || !row || !table) {
      toast.error('Click inside a table first');
      return;
    }
    if (row.children.length <= 1) {
      toast.error('A table must have at least one column');
      return;
    }

    const index = Array.from(row.children).indexOf(cell);
    table.querySelectorAll('tr').forEach((tableRow) => {
      tableRow.children[index]?.remove();
    });
    const nextCell = row.children[Math.max(0, index - 1)] as HTMLTableCellElement | undefined;
    if (nextCell) placeCursorInCell(nextCell);
    syncCurrentEditorHTML();
  };

  const handleTableButton = (event: React.MouseEvent<HTMLButtonElement>, action: () => void) => {
    event.preventDefault();
    action();
  };

  useEffect(() => {
    if (!quillRef.current) return;
    
    const editor = quillRef.current.getEditor();
    const root = editor.root;

    const normalizeFileName = (name: string) => {
      return `${Date.now()}_${name}`
        .replace(/\s+/g, '_')
        .replace(/[^a-zA-Z0-9._-]/g, '');
    };

    const handleImageUpload = async (e: Event) => {
      const input = e.target as HTMLInputElement;
      const files = input.files;
      
      if (!files || !files[0]) return;
      
      const file = files[0];
      const range = editor.getSelection(true);
      
      if (!range) {
        toast.error('Please click in the editor first');
        return;
      }

      // Check file type
      const isImage = file.type.startsWith('image/');
      const isDocument = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type);

      if (!isImage && !isDocument) {
        toast.error('Only images and PDF/DOCX files are supported');
        return;
      }

      setIsUploading(true);
      try {
        const fileName = normalizeFileName(file.name);
        const { error } = await supabase.storage
          .from('lesson-content')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (error) {
          toast.error('Upload failed: ' + error.message + '. Check Supabase storage permissions.');
          return;
        }

        const urlResponse = await supabase.storage
          .from('lesson-content')
          .getPublicUrl(fileName);

        if (!urlResponse.data?.publicUrl) {
          toast.error('Unable to retrieve uploaded file URL.');
          return;
        }
        const urlData = urlResponse.data;

        if (isImage) {
          editor.insertEmbed(range.index, 'image', urlData.publicUrl);
          editor.setSelection(range.index + 1, 0);
        } else {
          editor.insertText(range.index, file.name, { link: urlData.publicUrl, color: '#0ea5e9' });
          editor.setSelection(range.index + file.name.length, 0);
        }
        
        toast.success('File uploaded successfully');
      } catch (err: any) {
        toast.error('Upload error: ' + err.message);
      } finally {
        setIsUploading(false);
        if (e.target instanceof HTMLInputElement) {
          e.target.value = '';
        }
      }
    };

    const toolbar = editor.getModule('toolbar');
    if (toolbar) {
      toolbar.addHandler('image', () => {
        const input = document.createElement('input');
        input.setAttribute('type', 'file');
        input.setAttribute('accept', 'image/*,application/pdf,.docx');
        input.addEventListener('change', handleImageUpload);
        input.click();
      });
    }

    root.addEventListener('input', syncCurrentEditorHTML);
    return () => {
      root.removeEventListener('input', syncCurrentEditorHTML);
    };
  }, []);

  // Quill modules configuration
  const modules = {
    toolbar: {
      container: `#${toolbarId}`,
      handlers: {
        // Custom handlers are attached in useEffect
      }
    },
    clipboard: {
      matchVisual: false, // Don't match Word formatting exactly, let Quill handle it
    }
  };

  const formats = [
    'bold', 'italic', 'underline', 'strike',
    'script',
    'blockquote', 'code-block',
    'header',
    'list', 'bullet',
    'align',
    'link', 'image',
    'color', 'background',
    'font', 'size',
    'lessonTable',
  ];

  return (
    <div className={clsx(
      'rich-text-editor rounded-2xl border border-slate-200 bg-white overflow-hidden',
      'shadow-sm transition focus-within:border-slate-400 focus-within:ring-2 focus-within:ring-sky-200',
      disabled && 'opacity-50 pointer-events-none'
    )}>
      <div id={toolbarId} className="ql-toolbar ql-snow">
        <span className="ql-formats">
          <button className="ql-bold" />
          <button className="ql-italic" />
          <button className="ql-underline" />
          <button className="ql-strike" />
          <button className="ql-script" value="sub" />
          <button className="ql-script" value="super" />
        </span>
        <span className="ql-formats">
          <button className="ql-blockquote" />
          <button className="ql-code-block" />
        </span>
        <span className="ql-formats">
          <button className="ql-header" value="1" />
          <button className="ql-header" value="2" />
        </span>
        <span className="ql-formats">
          <button className="ql-list" value="ordered" />
          <button className="ql-list" value="bullet" />
        </span>
        <span className="ql-formats">
          <button className="ql-align" value="" />
          <button className="ql-align" value="center" />
          <button className="ql-align" value="right" />
          <button className="ql-align" value="justify" />
        </span>
        <span className="ql-formats">
          <button className="ql-link" />
          <button className="ql-image" />
        </span>
        <span className="ql-formats">
          <button className="lesson-table-button" type="button" title="Insert table" onMouseDown={(event) => handleTableButton(event, insertTable)}>Tbl</button>
          <button className="lesson-table-button" type="button" title="Add row" onMouseDown={(event) => handleTableButton(event, addTableRow)}>+R</button>
          <button className="lesson-table-button" type="button" title="Remove row" onMouseDown={(event) => handleTableButton(event, removeTableRow)}>-R</button>
          <button className="lesson-table-button" type="button" title="Add column" onMouseDown={(event) => handleTableButton(event, addTableColumn)}>+C</button>
          <button className="lesson-table-button" type="button" title="Remove column" onMouseDown={(event) => handleTableButton(event, removeTableColumn)}>-C</button>
        </span>
        <span className="ql-formats">
          <select className="ql-color" />
          <select className="ql-background" />
        </span>
        <span className="ql-formats">
          <button className="ql-clean" />
        </span>
      </div>
      <ReactQuill
        ref={quillRef}
        value={editorValue}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        readOnly={readOnly || disabled}
        theme="snow"
        className="h-full"
      />
      {isUploading && (
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center rounded-2xl">
          <p className="text-white font-medium">Uploading...</p>
        </div>
      )}
      <style>{`
        .rich-text-editor .ql-container {
          font-size: 0.875rem;
          font-family: inherit;
        }
        .rich-text-editor .ql-toolbar {
          border: none;
          border-bottom: 1px solid #e2e8f0;
          background-color: #f8fafc;
          border-radius: 0;
          padding: 12px;
        }
        .rich-text-editor .ql-toolbar button {
          width: 28px;
          min-width: 28px;
        }
        .rich-text-editor .ql-toolbar .lesson-table-button {
          color: #475569;
          font-size: 0.7rem;
          font-weight: 700;
          line-height: 1;
        }
        .rich-text-editor .ql-toolbar .lesson-table-button:hover {
          color: #0284c7;
        }
        .rich-text-editor .ql-snow .ql-toolbar button:hover,
        .rich-text-editor .ql-snow .ql-toolbar button:focus,
        .rich-text-editor .ql-snow .ql-toolbar button.ql-active,
        .rich-text-editor .ql-snow .ql-toolbar .ql-picker-label:hover,
        .rich-text-editor .ql-snow .ql-toolbar .ql-picker-item:hover,
        .rich-text-editor .ql-snow .ql-toolbar .ql-picker-item.ql-selected {
          color: #0284c7;
        }
        .rich-text-editor .ql-toolbar.ql-snow .ql-stroke {
          stroke: #64748b;
        }
        .rich-text-editor .ql-toolbar.ql-snow .ql-fill,
        .rich-text-editor .ql-toolbar.ql-snow .ql-stroke.ql-fill {
          fill: #64748b;
        }
        .rich-text-editor .ql-toolbar.ql-snow .ql-picker-label {
          color: #64748b;
        }
        .rich-text-editor .lesson-table-embed {
          margin: 12px 0;
        }
        .rich-text-editor .ql-editor {
          min-height: 300px;
          max-height: 600px;
          padding: 16px;
        }
        .rich-text-editor .ql-editor.ql-blank::before {
          color: #94a3b8;
          font-style: normal;
        }
        .rich-text-editor table td,
        .rich-text-editor table th {
          border: 1.5px solid #64748b;
          padding: 8px;
          text-align: left;
          min-width: 72px;
          vertical-align: top;
        }
        .rich-text-editor table {
          width: 100%;
          border-collapse: collapse;
          margin: 12px 0;
          border: 1.5px solid #64748b;
          table-layout: fixed;
        }
        .rich-text-editor img {
          max-width: 100%;
          height: auto;
          margin: 12px 0;
          border-radius: 8px;
        }
        .rich-text-editor a {
          color: #0284c7;
          text-decoration: underline;
        }
        .rich-text-editor blockquote {
          border-left: 4px solid #0284c7;
          margin: 12px 0;
          padding-left: 12px;
          color: #64748b;
        }
        .rich-text-editor pre {
          background-color: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 4px;
          padding: 12px;
          overflow-x: auto;
        }
      `}</style>
    </div>
  );
};

export default RichTextEditor;
