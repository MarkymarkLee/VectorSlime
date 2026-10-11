/**
 * Streaming parser for the tutor's output.
 *
 * The model writes plain spoken text, interleaved with board actions:
 *   <board tool="math">\frac{a}{b}</board>
 *   <board tool="arrow" target="shape:abc" label="check this"/>
 * Text outside tags is spoken; tags are executed on the whiteboard.
 * Using inline tags instead of native tool calls keeps raw HTML/LaTeX
 * unescaped and works with any local model.
 */

export interface BoardAction {
  tool: string;
  attrs: Record<string, string>;
  body: string;
}

export interface ParserHandlers {
  onSpeech: (text: string) => void;
  onAction: (action: BoardAction) => void;
}

const OPEN_TAGS = ["<board", "<think>", "[board actions"];

export class ActionStreamParser {
  private buffer = "";
  private mode: "text" | "board" | "think" | "note" = "text";

  constructor(private handlers: ParserHandlers) {}

  push(chunk: string) {
    this.buffer += chunk;
    this.drain(false);
  }

  end() {
    this.drain(true);
    if (this.mode === "board") {
      // Unterminated tag: try to salvage it.
      const action = parseBoardTag(this.buffer + "</board>");
      if (action) this.handlers.onAction(action);
    } else if (this.mode === "text" && this.buffer) {
      this.handlers.onSpeech(this.buffer);
    }
    this.buffer = "";
    this.mode = "text";
  }

  private drain(final: boolean) {
    for (;;) {
      if (this.mode === "text") {
        const idx = findFirst(this.buffer, OPEN_TAGS);
        if (idx === -1) {
          // Hold back a tail that could be the start of a tag.
          const keep = final ? 0 : partialTagTail(this.buffer);
          const emit = this.buffer.slice(0, this.buffer.length - keep);
          if (emit) this.handlers.onSpeech(emit);
          this.buffer = this.buffer.slice(this.buffer.length - keep);
          return;
        }
        if (idx > 0) this.handlers.onSpeech(this.buffer.slice(0, idx));
        this.buffer = this.buffer.slice(idx);
        this.mode = this.buffer.startsWith("<think>") ? "think" : this.buffer.startsWith("[board actions") ? "note" : "board";
      } else if (this.mode === "note") {
        // The model sometimes echoes our history notes ("[board actions you took: ...]"); never speak them.
        const end = this.buffer.indexOf("]");
        if (end === -1) return;
        this.buffer = this.buffer.slice(end + 1);
        this.mode = "text";
      } else if (this.mode === "think") {
        const end = this.buffer.indexOf("</think>");
        if (end === -1) return;
        this.buffer = this.buffer.slice(end + "</think>".length);
        this.mode = "text";
      } else {
        const tagEnd = findBoardEnd(this.buffer);
        if (tagEnd === -1) return;
        const action = parseBoardTag(this.buffer.slice(0, tagEnd));
        if (action) this.handlers.onAction(action);
        this.buffer = this.buffer.slice(tagEnd);
        this.mode = "text";
      }
    }
  }
}

function findFirst(s: string, needles: string[]) {
  let best = -1;
  for (const n of needles) {
    const i = s.indexOf(n);
    if (i !== -1 && (best === -1 || i < best)) best = i;
  }
  return best;
}

/** Length of a trailing fragment that could still grow into one of OPEN_TAGS. */
function partialTagTail(s: string) {
  const start = Math.max(s.lastIndexOf("<"), s.lastIndexOf("["));
  if (start === -1) return 0;
  const tail = s.slice(start);
  return OPEN_TAGS.some((t) => t.startsWith(tail)) ? tail.length : 0;
}

/** Returns the index just past the end of the board tag, or -1 if incomplete. */
function findBoardEnd(s: string) {
  const openEnd = findOpenTagEnd(s);
  if (openEnd === -1) return -1;
  if (s[openEnd - 2] === "/") return openEnd; // self-closing
  const close = s.indexOf("</board>", openEnd);
  return close === -1 ? -1 : close + "</board>".length;
}

/** Index just past the `>` that closes the opening tag, respecting quoted attributes. */
function findOpenTagEnd(s: string) {
  let quote: string | null = null;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (quote) {
      if (c === quote) quote = null;
    } else if (c === '"' || c === "'") {
      quote = c;
    } else if (c === ">") {
      return i + 1;
    }
  }
  return -1;
}

export function parseBoardTag(raw: string): BoardAction | null {
  const openEnd = findOpenTagEnd(raw);
  if (openEnd === -1) return null;
  const open = raw.slice(0, openEnd);
  const attrs: Record<string, string> = {};
  const re = /([a-zA-Z_-]+)\s*=\s*("([^"]*)"|'([^']*)')/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(open))) attrs[m[1].toLowerCase()] = m[3] ?? m[4] ?? "";
  let body = open.endsWith("/>") ? "" : raw.slice(openEnd).replace(/<\/board>\s*$/, "");
  body = stripFences(body.trim());
  const tool = (attrs.tool || attrs.type || "").toLowerCase();
  if (!tool) return null;
  return { tool, attrs, body };
}

function stripFences(s: string) {
  const fence = /^```[a-zA-Z]*\n([\s\S]*?)\n?```$/;
  const m = s.match(fence);
  return m ? m[1] : s;
}

/** Make text safe and natural for TTS. */
export function cleanForSpeech(text: string) {
  return text
    .replace(/\$\$?([^$]*)\$\$?/g, "$1")
    .replace(/\\[dt]?frac\{([^{}]*)\}\{([^{}]*)\}/g, " $1 over $2 ")
    .replace(/\\sqrt\{([^{}]*)\}/g, " the square root of $1 ")
    .replace(/\^\{?2\}?/g, " squared")
    .replace(/\^\{?3\}?/g, " cubed")
    .replace(/\^\{([^{}]*)\}|\^(\w)/g, " to the power of $1$2")
    .replace(/\\(cdot|times)/g, " times ")
    .replace(/\\(le|leq)\b/g, " less than or equal to ")
    .replace(/\\(ge|geq)\b/g, " greater than or equal to ")
    .replace(/\\(pi|theta|alpha|beta|infty)\b/g, " $1 ")
    .replace(/\\[a-zA-Z]+/g, " ")
    .replace(/[*_`#>{}\\]/g, "")
    .replace(/\s+/g, " ");
}
