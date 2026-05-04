'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Bold, Italic, List, ListOrdered, Heading2, Undo, Redo } from 'lucide-react';

type TiptapEditorProps = {
  content: string;
  onChange: (html: string) => void;
};

export function TiptapEditor({ content, onChange }: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content,
    onUpdate: ({ editor: e }) => onChange(e.getHTML()),
    editorProps: {
      attributes: {
        class: 'min-h-[120px] p-3 text-sm text-foreground leading-relaxed focus:outline-none',
      },
    },
    immediatelyRender: false,
  });

  const btn = (active: boolean) =>
    `rounded p-1.5 text-foreground-lighter transition-colors hover:bg-surface-400 hover:text-foreground ${active ? 'bg-surface-400 text-foreground' : ''}`;

  return (
    <div className="overflow-hidden rounded-md border border-border-control bg-surface-200">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 rounded-t-md border-b border-muted bg-surface-300 p-1">
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleBold().run()}
          className={btn(!!editor?.isActive('bold'))}
          title="Bold"
        >
          <Bold className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          className={btn(!!editor?.isActive('italic'))}
          title="Italic"
        >
          <Italic className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
          className={btn(!!editor?.isActive('heading', { level: 2 }))}
          title="Heading"
        >
          <Heading2 className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          className={btn(!!editor?.isActive('bulletList'))}
          title="Bullet List"
        >
          <List className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          className={btn(!!editor?.isActive('orderedList'))}
          title="Ordered List"
        >
          <ListOrdered className="h-3.5 w-3.5" />
        </button>
        <div className="mx-1 h-4 w-px bg-border-muted" />
        <button
          type="button"
          onClick={() => editor?.chain().focus().undo().run()}
          className={btn(false)}
          title="Undo"
        >
          <Undo className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().redo().run()}
          className={btn(false)}
          title="Redo"
        >
          <Redo className="h-3.5 w-3.5" />
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
