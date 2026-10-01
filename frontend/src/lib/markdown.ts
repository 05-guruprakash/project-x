import type { Summary } from "../types";

const list = (title: string, items: string[]) =>
  items.length ? `\n**${title}**\n${items.map((i) => `- ${i}`).join("\n")}\n` : "";

export function planToMarkdown(s: Summary): string {
  const stack = Object.entries(s.tech_stack).map(([k, v]) => `- **${k}**: ${v}`).join("\n");
  const steps = s.steps.map((st, i) =>
    `\n## ${i + 1}. ${st.title}\n${st.guide.summary}\n` +
    list("How to do it", st.guide.how_to) + list("Backend endpoints", st.guide.backend) +
    list("Frontend", st.guide.frontend) + list("Data model", st.guide.data) + list("Done when", st.guide.done_when)).join("");
  return `# ${s.goal}\n\n${s.summary}\n\n## Requirements\n${s.requirements.map((r) => `- ${r}`).join("\n")}\n\n## Tech stack\n${stack}\n${steps}`;
}

export function downloadText(filename: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/markdown" }));
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
