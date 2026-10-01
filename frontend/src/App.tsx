import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  api,
  downloadSpec,
} from "./api";

import GithubModal from "./components/GithubModal";
import MemoryModal from "./components/MemoryModal";
import NewProject from "./components/NewProject";
import RightSidebar from "./components/RightSidebar";
import Sidebar from "./components/Sidebar";
import Workspace from "./components/Workspace";

import type {
  Busy,
  Project,
  ProjectSummary,
  QA,
  Status,
  StepResult,
} from "./types";

const getErrorMessage = (
  error: unknown,
) =>
  error instanceof Error
    ? error.message
    : "Something went wrong.";

export default function App() {
  const [projects, setProjects] =
    useState<ProjectSummary[]>(
      [],
    );

  const [project, setProject] =
    useState<Project | null>(null);

  const [results, setResults] =
    useState<
      Record<number, StepResult>
    >({});

  const [busy, setBusy] =
    useState<Busy>(null);

  const [error, setError] =
    useState<string | null>(null);

  const [modal, setModal] =
    useState<
      "memory" | "github" | null
    >(null);

  const [forceDrift, setForceDrift] =
    useState(false);

  const [mlDown, setMlDown] =
    useState(false);

  const [leftOpen, setLeftOpen] =
    useState(true);

  const [rightOpen, setRightOpen] =
    useState(true);

  const refresh =
    useCallback(async () => {
      try {
        const data =
          await api.projects();

        setProjects(data);
      } catch (error) {
        setError(
          getErrorMessage(error),
        );
      }
    }, []);

  useEffect(() => {
    void refresh();

    api
      .health()
      .then((health) => {
        setMlDown(
          health.drift_model ===
            "unreachable",
        );
      })
      .catch(() =>
        setMlDown(true),
      );
  }, [refresh]);

  const guard = async (
    kind: Busy,
    fn: () => Promise<void>,
  ) => {
    setBusy(kind);
    setError(null);

    try {
      await fn();
    } catch (error) {
      setError(
        getErrorMessage(error),
      );
    } finally {
      setBusy(null);
    }
  };

  const reloadProject = async (
    id: string,
  ) => {
    const next =
      await api.project(id);

    setProject(next);
    await refresh();
  };

  const openProject = (
    id: string,
  ) =>
    guard("open", async () => {
      const next =
        await api.project(id);

      setProject(next);
      setResults({});
    });

  const createProject = (
    idea: string,
    answers: QA[],
  ) =>
    guard("plan", async () => {
      const next =
        await api.create(
          idea,
          answers,
        );

      setProject(next);
      setResults({});
      await refresh();
    });

  const removeProject = (
    id: string,
  ) =>
    guard(null, async () => {
      await api.remove(id);

      if (
        project?.project_id === id
      ) {
        setProject(null);
      }

      await refresh();
    });

  const runStep = () => {
    if (!project) return;

    void guard(
      "step",
      async () => {
        const result =
          await api.step(
            project.project_id,
            forceDrift,
          );

        setResults(
          (previous) => ({
            ...previous,
            [result.task_idx]:
              result,
          }),
        );

        await reloadProject(
          project.project_id,
        );
      },
    );
  };

  const runAll = () => {
    if (!project) return;

    void guard(
      "step",
      async () => {
        try {
          let finished =
            project.done;

          while (!finished) {
            const result =
              await api.step(
                project.project_id,
                false,
              );

            setResults(
              (previous) => ({
                ...previous,
                [result.task_idx]:
                  result,
              }),
            );

            finished =
              result.done;
          }
        } finally {
          await reloadProject(
            project.project_id,
          );
        }
      },
    );
  };

  const updateStatus = async (
    index: number,
    status: Status,
  ) => {
    if (!project) return;

    const previous =
      project;

    setProject({
      ...project,
      tasks: project.tasks.map(
        (task, taskIndex) =>
          taskIndex === index
            ? {
                ...task,
                status,
              }
            : task,
      ),
    });

    try {
      await api.setStatus(
        project.project_id,
        index,
        status,
      );

      await refresh();
    } catch (error) {
      setProject(previous);

      setError(
        getErrorMessage(error),
      );
    }
  };

  const logChange = async (
    text: string,
  ) => {
    if (!project) return;

    try {
      const change =
        await api.logChange(
          project.project_id,
          text,
        );

      setProject({
        ...project,
        changes: [
          ...project.changes,
          change,
        ],
      });
    } catch (error) {
      setError(
        getErrorMessage(error),
      );
    }
  };

  return (
    <div
      className={[
        "app-shell",
        leftOpen
          ? "left-is-open"
          : "left-is-closed",
        rightOpen
          ? "right-is-open"
          : "right-is-closed",
      ].join(" ")}
    >
      <aside className="left-sidebar-shell">
        {leftOpen && (
          <Sidebar
            list={projects}
            activeId={
              project?.project_id ??
              null
            }
            onOpen={(id) =>
              void openProject(id)
            }
            onNew={() =>
              setProject(null)
            }
            onDelete={(id) =>
              void removeProject(id)
            }
            onMemory={() =>
              setModal("memory")
            }
            onClose={() =>
              setLeftOpen(false)
            }
          />
        )}
      </aside>

      {!leftOpen && (
        <button
          className="floating-panel-button floating-left"
          onClick={() =>
            setLeftOpen(true)
          }
          aria-label="Open chat history"
          title="Open chat history"
        >
          →
        </button>
      )}

      <main className="center-shell">
        <header className="topbar">
          <div className="topbar-group">
            <button
              className="icon-button"
              onClick={() =>
                setLeftOpen(
                  (value) => !value,
                )
              }
              title={
                leftOpen
                  ? "Close chat history"
                  : "Open chat history"
              }
              aria-label="Toggle chat history"
            >
              {leftOpen
                ? "‹"
                : "☰"}
            </button>

            <div className="brand">
              <div className="brand-logo">
                A
              </div>

              <div>
                <div className="brand-name">
                  Aegis
                </div>

                <div className="brand-caption">
                  Adaptive project intelligence
                </div>
              </div>
            </div>
          </div>

          <div className="topbar-group">
            {project && (
              <div className="topbar-status">
                <span className="status-dot" />
                {project.done
                  ? "Project complete"
                  : project.steps
                      .length
                  ? `Phase ${Math.min(
                      project.idx,
                      project.tasks
                        .length,
                    )} / ${
                      project.tasks
                        .length
                    }`
                  : "Planning"}
              </div>
            )}

            <button
              className="icon-button"
              onClick={() =>
                setRightOpen(
                  (value) => !value,
                )
              }
              title={
                rightOpen
                  ? "Close project context"
                  : "Open project context"
              }
              aria-label="Toggle project context"
            >
              {rightOpen
                ? "›"
                : "◧"}
            </button>
          </div>
        </header>

        {mlDown && (
          <div className="system-banner warning">
            <span className="banner-icon">
              !
            </span>

            <div>
              <strong>
                ML monitor offline
              </strong>

              <span>
                Goal-drift checks
                require the ML service
                on port 8001.
              </span>
            </div>
          </div>
        )}

        {error && (
          <div className="system-banner error">
            <span className="banner-icon">
              ×
            </span>

            <div>
              <strong>
                Something went wrong
              </strong>

              <span>{error}</span>
            </div>

            <button
              className="banner-dismiss"
              onClick={() =>
                setError(null)
              }
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="center-content">
          {project ? (
            <Workspace
              project={project}
              results={results}
              busy={busy}
              force={forceDrift}
              onForce={setForceDrift}
              onStep={runStep}
              onAll={runAll}
              onStatus={(
                index,
                status,
              ) =>
                void updateStatus(
                  index,
                  status,
                )
              }
              onChange={logChange}
              onExport={() =>
                void downloadSpec(
                  project.project_id,
                ).catch(
                  (error: unknown) =>
                    setError(
                      getErrorMessage(
                        error,
                      ),
                    ),
                )
              }
              onGithub={() =>
                setModal("github")
              }
              onUpdate={setProject}
            />
          ) : (
            <NewProject
              busy={busy}
              onCreate={(
                idea,
                answers,
              ) =>
                void createProject(
                  idea,
                  answers,
                )
              }
            />
          )}
        </div>
      </main>

      <aside className="right-sidebar-shell">
        {rightOpen && (
          <RightSidebar
            project={project}
            results={results}
            onClose={() =>
              setRightOpen(false)
            }
          />
        )}
      </aside>

      {modal === "memory" && (
        <MemoryModal
          onClose={() =>
            setModal(null)
          }
        />
      )}

      {modal === "github" &&
        project && (
          <GithubModal
            onClose={() =>
              setModal(null)
            }
            onSubmit={async (
              repo,
              token,
            ) => {
              const result =
                await api.github(
                  project.project_id,
                  repo,
                  token,
                );

              await reloadProject(
                project.project_id,
              );

              return result;
            }}
          />
        )}
    </div>
  );
}