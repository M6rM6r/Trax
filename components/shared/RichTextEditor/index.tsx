"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import React, { useEffect } from "react";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import MenuBar from "./menu-bar";
import { ErrorMessage, FormikProps } from "formik";

interface RichTextEditorProps {
  content?: string;
  label: string;
  name: string;
  formikProps: FormikProps<Record<string, unknown>>;
  className?: string;
  initialValue?: string | null;
}
export default function RichTextEditor({
  content,
  label,
  name,
  formikProps,
  className,
  initialValue,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          HTMLAttributes: {
            class: "list-disc ml-3",
          },
        },
        orderedList: {
          HTMLAttributes: {
            class: "list-decimal ml-3",
          },
        },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Highlight,
    ],
    content: content || "",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "min-h-[156px] border border-border rounded-md bg-muted py-2 px-3 focus:outline-none",
      },
    },
    onUpdate: ({ editor }) => {
      // onChange(editor.getHTML());
      formikProps.setFieldValue(name, editor.getHTML());
    },
  });

  useEffect(() => {
    if (initialValue) {
      editor?.commands.setContent(initialValue);
    }
  }, [editor, initialValue]);

  return (
    <div className={className}>
      <p className={`text-16 text-muted-foreground font-[600] mb-2 `}>{label}</p>
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
      <ErrorMessage component={"div"} name={name} className="text-14 text-destructive mt-2" />
    </div>
  );
}
