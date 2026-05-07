import { useRef, useEffect, useMemo, useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import clsx from 'clsx';

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
  const [isUploading, setIsUploading] = useState(false);
  const toolbarId = useMemo(() => `rich-text-toolbar-${Math.random().toString(36).slice(2)}`, []);

  useEffect(() => {
    if (!quillRef.current) return;
    
    const editor = quillRef.current.getEditor();

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
    'blockquote', 'code-block',
    'header',
    'list', 'bullet',
    'align',
    'link', 'image',
    'color', 'background',
    'font', 'size',
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
          <select className="ql-color" />
          <select className="ql-background" />
        </span>
        <span className="ql-formats">
          <button className="ql-clean" />
        </span>
      </div>
      <ReactQuill
        ref={quillRef}
        value={value}
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
          border: 1px solid #e2e8f0;
          padding: 8px;
          text-align: left;
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
