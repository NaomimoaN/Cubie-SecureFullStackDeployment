// client/src/components/common/RichTextEditor.jsx

import React, { useState, useEffect, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import OrderedList from "@tiptap/extension-ordered-list";
import ListItem from "@tiptap/extension-list-item";
import Underline from "@tiptap/extension-underline";
import Strike from "@tiptap/extension-strike";

import {
  BoldIcon,
  ItalicIcon,
  UnderlineIcon,
  AlignLeftIcon,
  AlignCenterIcon,
  OrderedListIcon,
} from "../../assets/RichTextEditorIcons.jsx";

const RichTextEditor = ({
  value,
  onChange,
  placeholder = "",
  readOnly = false,
  className = "",
  height = "200px",
  enableDemoFeature = false, //Demo
  demoContent = "", //Demo
  isEditMode = false, //Demo
}) => {
  const [isDemoContentInserted, setIsDemoContentInserted] = useState(false); //Demo
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        link: false,
        underline: false,
        strike: false,
        orderedList: false,
        listItem: false,
        bulletList: false,
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Underline,
      Strike,
      OrderedList,
      ListItem,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
      ///////Demo////////////
      if (editor.getText().trim() !== "" && !isDemoContentInserted) {
        setIsDemoContentInserted(true);
      }
      /////////////////////////
    },
    editorProps: {
      attributes: {
        class: `prose max-w-none focus:outline-none ${
          readOnly ? "bg-white cursor-not-allowed" : "bg-white"
        }`,
      },
    },
    editable: !readOnly,
  });

  if (!editor) {
    return null;
  }
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value, false);
    }
  }, [value, editor]);

  /////Demo////////////////////////////////////////////////
  useEffect(() => {
    if (value === "" && isDemoContentInserted) {
      setIsDemoContentInserted(false);
    }
    if (isEditMode && value !== "") {
      setIsDemoContentInserted(true);
    }
  }, [value, isDemoContentInserted, isEditMode]);

  const handleEditorInteraction = useCallback(() => {
    if (
      enableDemoFeature &&
      !isEditMode &&
      !isDemoContentInserted &&
      editor.isEmpty
    ) {
      editor.chain().setContent(demoContent).run();
      setIsDemoContentInserted(true);
      editor.chain().focus("end").run();
    }
  }, [
    editor,
    enableDemoFeature,
    isEditMode,
    isDemoContentInserted,
    demoContent,
  ]);
  ////////////////////////////////////////////////////////////////////

  const MenuBar = () => {
    if (readOnly) return null;

    const buttonBase =
      "px-3 py-1 rounded text-sm font-medium flex items-center justify-center";
    const activeClass = "bg-gray3 text-white";
    const inactiveClass = "bg-white hover:bg-gray2 text-black border-none";

    return (
      <div className="flex flex-wrap gap-2 p-2 border border-gray3 bg-white rounded-t-md">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`${buttonBase} ${
            editor.isActive("bold") ? activeClass : inactiveClass
          }`}
        >
          <BoldIcon />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`${buttonBase} ${
            editor.isActive("italic") ? activeClass : inactiveClass
          }`}
        >
          <ItalicIcon />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`${buttonBase} ${
            editor.isActive("underline") ? activeClass : inactiveClass
          }`}
        >
          <UnderlineIcon />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          className={`${buttonBase} ${
            editor.isActive({ textAlign: "left" }) ? activeClass : inactiveClass
          }`}
        >
          <AlignLeftIcon />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          className={`${buttonBase} ${
            editor.isActive({ textAlign: "center" })
              ? activeClass
              : inactiveClass
          }`}
        >
          <AlignCenterIcon />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`${buttonBase} ${
            editor.isActive("orderedList") ? activeClass : inactiveClass
          }`}
        >
          <OrderedListIcon />
        </button>
      </div>
    );
  };

  // const showPlaceholder = !editor.isFocused && editor.isEmpty && placeholder;
  const showPlaceholder =
    !editor.isFocused &&
    editor.isEmpty &&
    placeholder &&
    !(enableDemoFeature && !isDemoContentInserted && editor.isEmpty); //Demo

  return (
    <div className={`overflow-hidden ${className}`}>
      <MenuBar />
      <div
        className={`relative ${
          height ? `h-[${height}]` : ""
        } min-h-[150px] overflow-y-auto p-3 ${
          readOnly
            ? "rounded-md border-none"
            : "border border-gray3 rounded-b-md"
        }`}
        onClick={handleEditorInteraction} // Demo
        onFocus={handleEditorInteraction} // Demo
        tabIndex={readOnly ? -1 : 0} // Demo
      >
        {showPlaceholder && (
          <div className="absolute top-3 left-3 text-gray3 pointer-events-none z-10">
            {placeholder}
          </div>
        )}
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};

export default RichTextEditor;
