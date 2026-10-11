"use client";

import { useMemo } from "react";
import { tokenizeRich, type RichToken } from "@/lib/text/richText";

export function TokenView({ token }: { token: RichToken }) {
  if (token.kind === "math") return <span dangerouslySetInnerHTML={{ __html: token.html }} />;
  if (token.kind === "code") return <code className="rounded bg-zinc-500/20 px-1 font-mono text-[0.9em]">{token.text}</code>;
  return token.bold ? <strong className="font-semibold">{token.text}</strong> : <>{token.text}</>;
}

/** Tutor text with inline math, bold and code rendered. */
export default function RichText({ text }: { text: string }) {
  const tokens = useMemo(() => tokenizeRich(text), [text]);
  return (
    <>
      {tokens.map((t, i) => (
        <span key={i}>
          <TokenView token={t} />{" "}
        </span>
      ))}
    </>
  );
}
