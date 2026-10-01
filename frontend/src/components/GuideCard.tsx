import type { Guide } from "../types";

const SECTIONS: { key: keyof Omit<Guide, "summary">; label: string; mono?: boolean }[] = [
  { key: "how_to", label: "How to do it" },
  { key: "backend", label: "Backend endpoints", mono: true },
  { key: "frontend", label: "Frontend" },
  { key: "data", label: "Data model" },
  { key: "done_when", label: "Done when" },
];

export default function GuideCard({ guide }: { guide: Guide }) {
  return (
    <div className="mt-2 space-y-3">
      <p className="text-ink/80">{guide.summary}</p>
      {SECTIONS.map(({ key, label, mono }) =>
        guide[key].length > 0 && (
          <div key={key}>
            <p className="font-semibold text-sm">{label}</p>
            <ul className={`list-disc ml-5 mt-1 space-y-0.5 text-sm ${mono ? "font-mono text-[13px]" : ""}`}>
              {guide[key].map((t, i) => <li key={i}>{t}</li>)}
            </ul>
          </div>
        ))}
    </div>
  );
}
