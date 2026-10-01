import { useState } from "react";
import type { Change } from "../types";

interface Props {
  changes: Change[];
  onSubmit: (text: string) => Promise<void>;
}

export default function ChangeBox({ changes, onSubmit }: Props) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setSending(true);
    setError(null);
    try {
      await onSubmit(text.trim());
      setText("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not check this change");
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="card">
      <h2>Scope check</h2>
      <p className="muted small">
        Added or changed something? Describe it and Aegis checks it against your original goal.
      </p>
      <label htmlFor="change" className="sr-only">
        Describe a change
      </label>
      <textarea
        id="change"
        rows={2}
        value={text}
        maxLength={1000}
        onChange={(e) => setText(e.target.value)}
        placeholder="e.g. I added a live chat feature between buyers and sellers"
      />
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <button className="btn primary" disabled={text.trim().length < 3 || sending} onClick={() => void submit()}>
        {sending ? "Checking…" : "Check against goal"}
      </button>
      <ul className="changes">
        {[...changes].reverse().map((c) => (
          <li key={c.at} className={c.verdict === "scope_creep" ? "warn" : "ok"}>
            <strong>{c.verdict === "scope_creep" ? "Scope creep" : "On track"}</strong>: {c.text}
            {c.advice && <div className="small">{c.advice}</div>}
          </li>
        ))}
      </ul>
    </section>
  );
}