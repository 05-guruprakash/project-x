import { useState } from "react";
import type { GithubResult } from "../types";
import Modal from "./Modal";

interface Props {
  onClose: () => void;
  onSubmit: (repo: string, token: string) => Promise<GithubResult>;
}

export default function GithubModal({ onClose, onSubmit }: Props) {
  const [repo, setRepo] = useState("");
  const [token, setToken] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GithubResult | null>(null);

  const validRepo = /^[\w.-]+\/[\w.-]+$/.test(repo.trim());

  const submit = async () => {
    setSending(true);
    setError(null);
    try {
      setResult(await onSubmit(repo.trim(), token.trim()));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create issues");
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal title="Push plan to GitHub" onClose={onClose}>
      <p className="muted small">
        Creates one issue per step. Use a fine-grained token with Issues: read and write for that repo. The token is
        used once and never stored.
      </p>
      <div className="form">
        <label htmlFor="repo">Repository</label>
        <input id="repo" value={repo} onChange={(e) => setRepo(e.target.value)} placeholder="owner/name" />
        <label htmlFor="token">Access token</label>
        <input id="token" type="password" autoComplete="off" value={token} onChange={(e) => setToken(e.target.value)} />
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {result && (
        <div className="banner ok">
          {result.created.length === 0 ? "All steps already have issues." : `Created ${result.created.length} issues.`}
          {result.error && <div className="error">{result.error}</div>}
          <ul>
            {result.created.map((c) => (
              <li key={c.url}>
                <a href={c.url} target="_blank" rel="noreferrer">
                  {c.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
      <button
        className="btn primary"
        disabled={!validRepo || token.trim().length < 10 || sending}
        onClick={() => void submit()}
      >
        {sending ? "Creating issues…" : "Create issues"}
      </button>
    </Modal>
  );
}