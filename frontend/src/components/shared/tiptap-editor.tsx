'use client';

import React, { useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { useUpload } from '@/hooks/use-upload';
import { Button } from '@/components/ui/button';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Code,
  Terminal,
  Link2,
  Image as ImageIcon,
  Undo2,
  Redo2,
  Loader2,
  Unlink,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TiptapEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  maxCharacters?: number;
}

export function TiptapEditor({
  content,
  onChange,
  placeholder = 'Write your thoughts here...',
  maxCharacters,
}: TiptapEditorProps) {
  const { uploadImage, isUploading } = useUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageUploadProgress, setImageUploadProgress] = useState(false);

  // Initialize Editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        codeBlock: {
          HTMLAttributes: {
            class: 'rounded-lg bg-muted/60 p-4 border border-border font-mono text-xs overflow-x-auto my-3',
          },
        },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-brand-accent underline underline-offset-4 font-semibold hover:opacity-80 transition-opacity',
          rel: 'noopener noreferrer',
          target: '_blank',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-xl border border-border max-w-full my-4 mx-auto block shadow-sm hover:scale-[1.01] transition-transform duration-200',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      CharacterCount.configure({
        limit: maxCharacters,
      }),
    ],
    content: content || '',
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose-tiptap focus:outline-none min-h-[220px] max-h-[500px] overflow-y-auto custom-scrollbar px-4 py-3 bg-background text-sm leading-relaxed border-b border-border',
      },
      handleDrop: (view, event, slice, moved) => {
        if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0]) {
          const file = event.dataTransfer.files[0];
          if (file.type.startsWith('image/')) {
            event.preventDefault();
            handleDirectImageUpload(file);
            return true;
          }
        }
        return false;
      },
    },
    immediatelyRender: false, // Prevent Next.js SSR hydration errors
  });

  // Synchronize external value only when internal content differs (prevents layout resetting)
  React.useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content || '');
    }
  }, [content, editor]);

  // Image Upload logic
  const handleDirectImageUpload = async (file: File) => {
    if (!editor) return;
    setImageUploadProgress(true);
    try {
      const secureUrl = await uploadImage(file, 'forum');
      editor.chain().focus().setImage({ src: secureUrl }).run();
    } catch (err) {
      console.error('Image upload failed', err);
    } finally {
      setImageUploadProgress(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleDirectImageUpload(file);
    }
  };

  // Link Prompt
  const toggleLink = () => {
    if (!editor) return;
    if (editor.isActive('link')) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('Enter Hyperlink URL:', previousUrl || 'https://');
    if (url === null) return;
    if (url.trim() === '') {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().setLink({ href: url }).run();
  };

  if (!editor) return null;

  const charactersCount = editor.storage.characterCount.characters();
  const percentage = maxCharacters ? Math.round((charactersCount / maxCharacters) * 100) : 0;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs relative">
      {/* Sticky, responsive format toolbar */}
      <div className="sticky top-0 z-10 flex flex-wrap items-center gap-1 bg-muted/40 p-2 border-b border-border/80 backdrop-blur-sm select-none">
        {/* Inline formatting group */}
        <div className="flex items-center gap-0.5 border-r border-border/60 pr-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={cn('h-8 w-8', editor.isActive('bold') && 'bg-secondary text-foreground')}
            title="Bold (Ctrl+B)"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={cn('h-8 w-8', editor.isActive('italic') && 'bg-secondary text-foreground')}
            title="Italic (Ctrl+I)"
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={cn('h-8 w-8', editor.isActive('underline') && 'bg-secondary text-foreground')}
            title="Underline (Ctrl+U)"
          >
            <UnderlineIcon className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={cn('h-8 w-8', editor.isActive('strike') && 'bg-secondary text-foreground')}
            title="Strikethrough"
          >
            <Strikethrough className="h-4 w-4" />
          </Button>
        </div>

        {/* Headings */}
        <div className="flex items-center gap-0.5 border-r border-border/60 pr-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={cn('h-8 w-8', editor.isActive('heading', { level: 1 }) && 'bg-secondary text-foreground')}
            title="Heading 1"
          >
            <Heading1 className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={cn('h-8 w-8', editor.isActive('heading', { level: 2 }) && 'bg-secondary text-foreground')}
            title="Heading 2"
          >
            <Heading2 className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={cn('h-8 w-8', editor.isActive('heading', { level: 3 }) && 'bg-secondary text-foreground')}
            title="Heading 3"
          >
            <Heading3 className="h-4 w-4" />
          </Button>
        </div>

        {/* Lists & Tasks */}
        <div className="flex items-center gap-0.5 border-r border-border/60 pr-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={cn('h-8 w-8', editor.isActive('bulletList') && 'bg-secondary text-foreground')}
            title="Bullet List"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={cn('h-8 w-8', editor.isActive('orderedList') && 'bg-secondary text-foreground')}
            title="Numbered List"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleTaskList().run()}
            className={cn('h-8 w-8', editor.isActive('taskList') && 'bg-secondary text-foreground')}
            title="Task List"
          >
            <CheckSquare className="h-4 w-4" />
          </Button>
        </div>

        {/* Block elements */}
        <div className="flex items-center gap-0.5 border-r border-border/60 pr-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={cn('h-8 w-8', editor.isActive('blockquote') && 'bg-secondary text-foreground')}
            title="Blockquote"
          >
            <Quote className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={cn('h-8 w-8', editor.isActive('code') && 'bg-secondary text-foreground')}
            title="Inline Code"
          >
            <Code className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={cn('h-8 w-8', editor.isActive('codeBlock') && 'bg-secondary text-foreground')}
            title="Code Block"
          >
            <Terminal className="h-4 w-4" />
          </Button>
        </div>

        {/* Links & Media */}
        <div className="flex items-center gap-0.5 border-r border-border/60 pr-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={toggleLink}
            className={cn('h-8 w-8', editor.isActive('link') && 'bg-secondary text-brand-accent')}
            title="Add/Remove Hyperlink"
          >
            {editor.isActive('link') ? <Unlink className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
          </Button>

          {/* Hidden image file input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={triggerFileInput}
            disabled={isUploading || imageUploadProgress}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            title="Insert Image"
          >
            {isUploading || imageUploadProgress ? (
              <Loader2 className="h-4 w-4 animate-spin text-brand-accent" />
            ) : (
              <ImageIcon className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Undo/Redo */}
        <div className="flex items-center gap-0.5 ml-auto">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="h-8 w-8"
            title="Undo"
          >
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="h-8 w-8"
            title="Redo"
          >
            <Redo2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Editor Content Area */}
      <EditorContent editor={editor} />

      {/* Bottom Counter Bar */}
      {(maxCharacters || maxCharacters === 0) && (
        <div className="flex items-center justify-between px-4 py-1.5 bg-muted/20 border-t border-border/50 text-[10px] font-mono text-muted-foreground select-none">
          <div className="flex items-center gap-2">
            <div className="w-16 h-1 rounded-full bg-border overflow-hidden">
              <div
                className={cn(
                  'h-full transition-all duration-300',
                  percentage > 85 ? 'bg-destructive' : 'bg-primary'
                )}
                style={{ width: `${Math.min(percentage, 100)}%` }}
              ></div>
            </div>
            <span>{percentage}% Used</span>
          </div>
          <span>
            {charactersCount} / {maxCharacters} chars
          </span>
        </div>
      )}
    </div>
  );
}
