import { Fragment } from "react";

/**
 * Minimal markdown renderer for assistant copy.
 *
 * Handles **bold**, blank-line paragraphs, single-line breaks, and `-` / `1.`
 * lists — and nothing else. That is the whole of what the scripted copy in
 * `lib/agent.ts` and `lib/assistant-kb.ts` actually uses, and a real markdown
 * dependency to render four constructs would be a poor trade.
 *
 * It grew lists because the guide's answers are genuinely list-shaped — four
 * pricing lines, ten lifecycle stages, three devices. Before it understood
 * them, every one of those ran together into a single wall of prose with stray
 * hyphens in it.
 *
 * Emits block elements, so call sites must not wrap it in a `<p>`.
 */
export function Markdown({ text }: { text: string }) {
  const blocks = text.split(/\n{2,}/).filter((b) => b.trim());

  return (
    <>
      {blocks.map((block, bi) => {
        const lines = block.split("\n").filter((l) => l.trim());
        const spacing = bi > 0 ? "mt-2" : undefined;

        if (lines.every((l) => /^\s*[-*]\s+/.test(l))) {
          return (
            <ul key={bi} className={cx("list-disc space-y-1 pl-4", spacing)}>
              {lines.map((l, i) => (
                <li key={i}>
                  <Inline text={l.replace(/^\s*[-*]\s+/, "")} />
                </li>
              ))}
            </ul>
          );
        }

        if (lines.every((l) => /^\s*\d+\.\s+/.test(l))) {
          return (
            <ol key={bi} className={cx("list-decimal space-y-1 pl-4.5", spacing)}>
              {lines.map((l, i) => (
                <li key={i}>
                  <Inline text={l.replace(/^\s*\d+\.\s+/, "")} />
                </li>
              ))}
            </ol>
          );
        }

        return (
          <p key={bi} className={spacing}>
            {lines.map((l, i) => (
              <Fragment key={i}>
                {i > 0 && <br />}
                <Inline text={l} />
              </Fragment>
            ))}
          </p>
        );
      })}
    </>
  );
}

/**
 * **bold** and *italic* — the emphasis the copy puts on figures that matter and
 * on the names of things on screen.
 *
 * `**` is tested first in the alternation, so a bold run is never mistaken for
 * two italics. Before italics were handled, copy referring to a panel by name
 * printed its asterisks verbatim.
 */
function Inline({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*\s][^*]*\*)/g);
  return (
    <>
      {parts.map((p, i) => {
        if (p.startsWith("**") && p.endsWith("**") && p.length > 4) {
          return (
            <strong key={i} className="font-bold">
              {p.slice(2, -2)}
            </strong>
          );
        }
        if (p.startsWith("*") && p.endsWith("*") && p.length > 2) {
          return (
            <em key={i} className="italic">
              {p.slice(1, -1)}
            </em>
          );
        }
        return <Fragment key={i}>{p}</Fragment>;
      })}
    </>
  );
}

const cx = (...v: (string | undefined)[]) => v.filter(Boolean).join(" ");
