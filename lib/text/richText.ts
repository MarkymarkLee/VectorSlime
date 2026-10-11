import katex from "katex";

/**
 * Light rendering for tutor text in chat and captions: inline $math$ (KaTeX),
 * **bold**, `code`. Each math span stays a single token so word-by-word
 * reveals never split a formula.
 */
export type RichToken =
  | { kind: "word"; text: string; bold?: boolean }
  | { kind: "code"; text: string }
  | { kind: "math"; html: string };

// Inline $...$ follows pandoc's rule so prices like "$25 and $0.10" stay text:
// no space just inside the dollars, and no digit right after the closing one.
const PATTERN = /\$\$([^$]+)\$\$|\$(?=\S)([^$\n]*?\S)\$(?!\d)|\\\((.+?)\\\)|\*\*([^*]+)\*\*|`([^`]+)`/g;

export function tokenizeRich(input: string): RichToken[] {
  // Drop markdown headings / list markers the model sometimes adds.
  const text = input.replace(/^\s{0,3}(#{1,6}|[-*])\s+/gm, "");
  const tokens: RichToken[] = [];
  const words = (s: string, bold?: boolean) =>
    s
      .split(/\s+/)
      .filter(Boolean)
      .forEach((w) => tokens.push(bold ? { kind: "word", text: w, bold } : { kind: "word", text: w }));

  let last = 0;
  let m: RegExpExecArray | null;
  PATTERN.lastIndex = 0;
  while ((m = PATTERN.exec(text))) {
    words(text.slice(last, m.index));
    const math = m[1] ?? m[2] ?? m[3];
    if (math !== undefined) tokens.push({ kind: "math", html: renderMath(math) });
    else if (m[4] !== undefined) words(m[4], true);
    else if (m[5] !== undefined) tokens.push({ kind: "code", text: m[5] });
    last = m.index + m[0].length;
  }
  words(text.slice(last));
  return tokens;
}

function renderMath(tex: string) {
  return katex.renderToString(tex, { throwOnError: false, strict: "ignore" });
}
