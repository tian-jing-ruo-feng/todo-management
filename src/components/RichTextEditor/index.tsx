import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Markdown } from 'tiptap-markdown'
import { Button, Space } from 'antd'
import {
  BoldOutlined,
  ItalicOutlined,
  UnorderedListOutlined,
  OrderedListOutlined,
  CodeOutlined,
  StrikethroughOutlined,
  RollbackOutlined,
} from '@ant-design/icons'
import { useEffect } from 'react'

interface RichTextEditorProps {
  content?: string
  onChange?: (content: string) => void
  placeholder?: string
  editable?: boolean
}

export default function RichTextEditor({
  content = '',
  onChange,
  placeholder = '输入内容...',
  editable = true,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit, Markdown],
    content,
    editable,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class:
          'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[100px] p-3',
      },
    },
  })

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content)
    }
  }, [content, editor])

  if (!editor) {
    return null
  }

  const setBold = () => editor.chain().focus().toggleBold().run()
  const setItalic = () => editor.chain().focus().toggleItalic().run()
  const setStrike = () => editor.chain().focus().toggleStrike().run()
  const setCode = () => editor.chain().focus().toggleCode().run()
  const setBulletList = () => editor.chain().focus().toggleBulletList().run()
  const setOrderedList = () => editor.chain().focus().toggleOrderedList().run()
  const undo = () => editor.chain().focus().undo().run()

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="bg-gray-50 border-b p-2 flex items-center space-x-1">
        <Space size="small">
          <Button
            size="small"
            type={editor.isActive('bold') ? 'primary' : 'default'}
            icon={<BoldOutlined />}
            onClick={setBold}
            disabled={!editable}
          />
          <Button
            size="small"
            type={editor.isActive('italic') ? 'primary' : 'default'}
            icon={<ItalicOutlined />}
            onClick={setItalic}
            disabled={!editable}
          />
          <Button
            size="small"
            type={editor.isActive('strike') ? 'primary' : 'default'}
            icon={<StrikethroughOutlined />}
            onClick={setStrike}
            disabled={!editable}
          />
          <Button
            size="small"
            type={editor.isActive('code') ? 'primary' : 'default'}
            icon={<CodeOutlined />}
            onClick={setCode}
            disabled={!editable}
          />
          <div className="w-px h-6 bg-gray-300" />
          <Button
            size="small"
            type={editor.isActive('bulletList') ? 'primary' : 'default'}
            icon={<UnorderedListOutlined />}
            onClick={setBulletList}
            disabled={!editable}
          />
          <Button
            size="small"
            type={editor.isActive('orderedList') ? 'primary' : 'default'}
            icon={<OrderedListOutlined />}
            onClick={setOrderedList}
            disabled={!editable}
          />
          <div className="w-px h-6 bg-gray-300" />
          <Button
            size="small"
            icon={<RollbackOutlined />}
            onClick={undo}
            disabled={!editable || !editor.can().undo()}
          />
        </Space>
      </div>
      <div className="bg-white">
        <EditorContent editor={editor} placeholder={placeholder} />
      </div>
    </div>
  )
}
