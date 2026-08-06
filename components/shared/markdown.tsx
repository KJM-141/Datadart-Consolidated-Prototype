/**
 * Minimal **bold** renderer for assistant copy. The agent's phrasing carries
 * emphasis on the figures that matter (volume, price, duration); this renders
 * it wherever that copy is shown — the live chat and the staff transcript.
 */
export function Markdown({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("**") && p.endsWith("**") ? (
          <strong key={i} className="font-bold">
            {p.slice(2, -2)}
          </strong>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  );
}
