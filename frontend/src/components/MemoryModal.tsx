import { useEffect, useState } from "react";
import { api } from "../api";
import type { Memory } from "../types";
import Modal from "./Modal";

const EMPTY: Memory = { experience: "", preferred_stack: "", notes: "" };

export default function MemoryModal({ onClose }: { onClose: () => void }) {
  const [mem, setMem] = useState<Memory>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .memory()
      .then(setMem)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Could not load profile"))
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      await api.saveMemory(mem);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save profile");
      setSaving(false);
    }
  };

  const set = (key: keyof Memory, value: string) => setMem((m) => ({ ...m, [key]: value }));

  return (
    <Modal title="My profile" onClose={onClose}>
      <p className="muted small">Aegis uses this to tailor every new plan to you.</p>
      {loading ? (
        <p className="muted">Loading…</p>
      ) : (
        <div className="form">
          <label htmlFor="exp">Experience level</label>
          <select id="exp" value={mem.experience} onChange={(e) => set("experience", e.target.value)}>
            <option value="">Not set</option>
            <option>Beginner</option>
            <option>Intermediate</option>
            <option>Advanced</option>
          </select>
          <label htmlFor="stack">Preferred tech stack</label>
          <input
            id="stack"
            value={mem.preferred_stack}
            maxLength={300}
            onChange={(e) => set("preferred_stack", e.target.value)}
            placeholder="e.g. React, NestJS, PostgreSQL"
          />
          <label htmlFor="notes">Anything else Aegis should know</label>
          <textarea
            id="notes"
            rows={3}
            value={mem.notes}
            maxLength={1000}
            onChange={(e) => set("notes", e.target.value)}
            placeholder="e.g. I have 2 weeks, solo, college project"
          />
        </div>
      )}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <button className="btn primary" disabled={loading || saving} onClick={() => void save()}>
        {saving ? "Saving…" : "Save"}
      </button>
    </Modal>
  );
}