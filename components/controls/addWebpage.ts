"use client";

import { addWebpage } from "@/lib/board/applyAction";
import { getEditor } from "@/lib/session/tutor";

export function promptAddWebpage() {
  const editor = getEditor();
  if (!editor) return;
  const input = window.prompt("Paste a webpage URL to put on the board (e.g. https://www.desmos.com/calculator)");
  if (!input) return;
  const url = /^https?:\/\//.test(input.trim()) ? input.trim() : `https://${input.trim()}`;
  const c = editor.getViewportPageBounds().center;
  const id = addWebpage(editor, url, { x: c.x - 380, y: c.y - 280 });
  if (id) editor.select(id);
}
