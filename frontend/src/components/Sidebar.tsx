import {
  useState,
} from "react";

import type {
  ProjectSummary,
} from "../types";

interface Props {
  list: ProjectSummary[];
  activeId: string | null;
  onOpen: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onMemory: () => void;
  onClose?: () => void;
}

export default function Sidebar({
  list,
  activeId,
  onOpen,
  onNew,
  onDelete,
  onMemory,
  onClose,
}: Props) {
  const [query, setQuery] =
    useState("");

  const filtered =
    list.filter((project) =>
      project.title
        .toLowerCase()
        .includes(
          query
            .toLowerCase()
            .trim(),
        ),
    );

  return (
    <aside className="left-sidebar">
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <div className="brand-logo small">
            A
          </div>

          <span>Aegis</span>
        </div>

        {onClose && (
          <button
            className="icon-button subtle"
            onClick={onClose}
            title="Close sidebar"
            aria-label="Close sidebar"
          >
            ‹
          </button>
        )}
      </div>

      <button
        className="new-project-button"
        onClick={onNew}
      >
        <span className="new-project-icon">
          +
        </span>

        <span>
          New project
        </span>
      </button>

      <div className="sidebar-search">
        <span>⌕</span>

        <input
          value={query}
          onChange={(event) =>
            setQuery(
              event.target.value,
            )
          }
          placeholder="Search projects"
        />

        {query && (
          <button
            onClick={() =>
              setQuery("")
            }
            aria-label="Clear search"
          >
            ×
          </button>
        )}
      </div>

      <div className="sidebar-label">
        PROJECT HISTORY
      </div>

      <div className="history-list">
        {filtered.length === 0 ? (
          <div className="history-empty">
            <div className="history-empty-icon">
              ◌
            </div>

            <span>
              {query
                ? "No matching projects"
                : "No projects yet"}
            </span>
          </div>
        ) : (
          filtered.map(
            (project) => {
              const completed =
                project.done;

              return (
                <button
                  key={
                    project.project_id
                  }
                  className={`history-item ${
                    activeId ===
                    project.project_id
                      ? "active"
                      : ""
                  }`}
                  onClick={() =>
                    onOpen(
                      project.project_id,
                    )
                  }
                >
                  <div className="history-icon">
                    {completed
                      ? "✓"
                      : "◌"}
                  </div>

                  <div className="history-content">
                    <div className="history-title">
                      {project.title}
                    </div>

                    <div className="history-meta">
                      {project.done}/
                      {project.total} complete
                    </div>
                  </div>

                  <span
                    className="history-arrow"
                    onClick={(event) => {
                      event.stopPropagation();

                      const confirmed =
                        window.confirm(
                          "Delete this project?",
                        );

                      if (
                        confirmed
                      ) {
                        onDelete(
                          project.project_id,
                        );
                      }
                    }}
                  >
                    ···
                  </span>
                </button>
              );
            },
          )
        )}
      </div>

      <div className="sidebar-footer">
        <button
          className="sidebar-footer-button"
          onClick={onMemory}
        >
          <span>✦</span>
          <span>Project memory</span>
        </button>

        <div className="sidebar-footer-status">
          <span className="status-dot" />
          Aegis ready
        </div>
      </div>
    </aside>
  );
}