"use client";

import { useCallback, useEffect, useRef } from "react";
import { Bold, Italic, RemoveFormatting, Type } from "lucide-react";

type Props = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
};

const TEXT_COLORS = [
  { label: "Default", value: "#444444" },
  { label: "Black", value: "#111111" },
  { label: "Navy", value: "#0A2540" },
  { label: "Gold", value: "#B99A61" },
  { label: "Brown", value: "#744210" },
  { label: "Green", value: "#276749" },
  { label: "Blue", value: "#2B6CB0" },
  { label: "Red", value: "#C53030" },
  { label: "Grey", value: "#718096" },
];

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Write your message…",
  minHeight = 180,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const lastHtml = useRef(value);

  // Sync external value into editor when it changes from outside (preset switch)
  useEffect(() => {
    if (!ref.current) return;
    if (value !== lastHtml.current) {
      ref.current.innerHTML = value || "";
      lastHtml.current = value;
    }
  }, [value]);

  useEffect(() => {
    if (ref.current && !ref.current.innerHTML && value) {
      ref.current.innerHTML = value;
      lastHtml.current = value;
    }
  }, []);

  const emit = useCallback(() => {
    if (!ref.current) return;
    const html = ref.current.innerHTML;
    lastHtml.current = html;
    onChange(html);
  }, [onChange]);

  const run = (command: string, arg?: string) => {
    ref.current?.focus();
    try {
      document.execCommand(command, false, arg);
    } catch {
      /* ignore */
    }
    emit();
  };

  const applyColor = (color: string) => {
    run("foreColor", color);
  };

  const applyNormal = () => {
    run("removeFormat");
    // also unwrap bold/italic if still present in selection
    run("styleWithCSS", "false");
  };

  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden bg-white focus-within:border-[#b99a61]">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 border-b border-slate-100 bg-slate-50 px-2 py-1.5">
        <button
          type="button"
          title="Bold"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => run("bold")}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-700 hover:bg-white hover:shadow-sm"
        >
          <Bold className="h-4 w-4" />
        </button>
        <button
          type="button"
          title="Italic"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => run("italic")}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-700 hover:bg-white hover:shadow-sm"
        >
          <Italic className="h-4 w-4" />
        </button>
        <button
          type="button"
          title="Normal / clear formatting"
          onMouseDown={(e) => e.preventDefault()}
          onClick={applyNormal}
          className="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-xs font-medium text-slate-600 hover:bg-white hover:shadow-sm"
        >
          <RemoveFormatting className="h-3.5 w-3.5" />
          Normal
        </button>

        <div className="mx-1 h-5 w-px bg-slate-200" />

        <div className="flex items-center gap-1">
          <Type className="h-3.5 w-3.5 text-slate-400 ml-1" />
          <span className="text-[10px] uppercase tracking-wide text-slate-400 mr-1">Colour</span>
          {TEXT_COLORS.map((c) => (
            <button
              key={c.value}
              type="button"
              title={c.label}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => applyColor(c.value)}
              className="h-6 w-6 rounded-full border border-slate-200 shadow-sm hover:scale-110 transition"
              style={{ backgroundColor: c.value }}
            />
          ))}
          <label className="ml-1 inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-dashed border-slate-300 hover:bg-white" title="Custom colour">
            <input
              type="color"
              className="sr-only"
              defaultValue="#444444"
              onChange={(e) => applyColor(e.target.value)}
            />
            <span className="text-[10px] font-bold text-slate-500">+</span>
          </label>
        </div>
      </div>

      {/* Editable area */}
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline
        data-placeholder={placeholder}
        onInput={emit}
        onBlur={emit}
        className="px-4 py-3 text-sm leading-relaxed text-slate-800 outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-slate-300"
        style={{ minHeight }}
      />
    </div>
  );
}
