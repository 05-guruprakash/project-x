import type {
  Project,
  StepResult,
} from "../types";

interface Props {
  project: Project | null;
  results: Record<number, StepResult>;
  onClose: () => void;
}

function percentage(
  value: unknown,
) {
  if (
    typeof value !==
    "number"
  ) {
    return null;
  }

  return Math.round(
    value <= 1
      ? value * 100
      : value,
  );
}

function getDrift(
  result?: StepResult,
) {
  if (!result) return null;

  const drift =
    result.drift ?? {};

  return percentage(
    drift.probability ??
      drift.drift_probability ??
      drift.drift_prob ??
      drift.prob ??
      null,
  );
}

function getAlignment(
  result?: StepResult,
) {
  if (!result) return null;

  return percentage(
    result.drift
      ?.alignment_score,
  );
}

export default function RightSidebar({
  project,
  results,
  onClose,
}: Props) {
  if (!project) {
    return (
      <aside className="right-sidebar">
        <header className="right-header">
          <div>
            <div className="eyebrow">
              AEGIS
            </div>

            <h3>
              Project context
            </h3>
          </div>

          <button
            className="icon-button subtle"
            onClick={onClose}
          >
            ›
          </button>
        </header>

        <div className="right-empty">
          <div className="empty-orbit">
            A
          </div>

          <h4>
            Your project intelligence
          </h4>

          <p>
            Start a project and
            Aegis will keep your
            roadmap, requirements
            and goal state visible
            here.
          </p>
        </div>
      </aside>
    );
  }

  const total =
    project.tasks.length;

  const completed =
    project.tasks.filter(
      (task) =>
        task.status === "done",
    ).length;

  const currentIndex =
    Math.min(
      Math.max(
        project.idx - 1,
        0,
      ),
      Math.max(
        total - 1,
        0,
      ),
    );

  const latest =
    results[
      Math.max(
        project.steps.length - 1,
        0,
      )
    ];

  const alignment =
    getAlignment(latest);

  const drift =
    getDrift(latest);

  return (
    <aside className="right-sidebar">
      <header className="right-header">
        <div>
          <div className="eyebrow">
            PROJECT CONTEXT
          </div>

          <h3>
            Project intelligence
          </h3>
        </div>

        <button
          className="icon-button subtle"
          onClick={onClose}
          title="Close project context"
        >
          ›
        </button>
      </header>

      <div className="right-scroll">
        <section className="context-card hero-context-card">
          <div className="eyebrow">
            CURRENT PROJECT
          </div>

          <h4>
            {project.goal}
          </h4>

          <p>
            {project.idea}
          </p>
        </section>

        <section className="context-card">
          <div className="context-card-header">
            <div>
              <div className="eyebrow">
                ROADMAP
              </div>

              <h4>
                Project phases
              </h4>
            </div>

            <span className="mini-count">
              {completed}/{total}
            </span>
          </div>

          <div className="roadmap-list">
            {project.tasks.map(
              (task, index) => {
                const done =
                  task.status ===
                  "done";

                const active =
                  index ===
                  currentIndex;

                return (
                  <div
                    key={`${task.title}-${index}`}
                    className={`roadmap-row ${
                      active
                        ? "active"
                        : ""
                    }`}
                  >
                    <div
                      className={`roadmap-number ${
                        done
                          ? "done"
                          : ""
                      }`}
                    >
                      {done
                        ? "✓"
                        : index + 1}
                    </div>

                    <div className="roadmap-copy">
                      <strong>
                        {task.title}
                      </strong>

                      <span>
                        {done
                          ? "Complete"
                          : active
                          ? "Current phase"
                          : "Upcoming"}
                      </span>
                    </div>
                  </div>
                );
              },
            )}
          </div>
        </section>

        <section className="context-card">
          <div className="eyebrow">
            GOAL INTEGRITY
          </div>

          <div className="intelligence-metrics">
            <div className="metric-block">
              <span>
                Alignment
              </span>

              <strong>
                {alignment !==
                null
                  ? `${alignment}%`
                  : "—"}
              </strong>
            </div>

            <div className="metric-block">
              <span>
                Drift risk
              </span>

              <strong>
                {drift !== null
                  ? `${drift}%`
                  : "—"}
              </strong>
            </div>
          </div>

          <div className="metric-track">
            <span
              style={{
                width: `${
                  alignment ??
                  0
                }%`,
              }}
            />
          </div>

          {latest?.intervention && (
            <div className="intervention-card">
              <div className="intervention-icon">
                ↻
              </div>

              <div>
                <strong>
                  Aegis intervened
                </strong>

                <p>
                  {
                    latest.intervention
                  }
                </p>
              </div>
            </div>
          )}
        </section>

        <section className="context-card">
          <div className="eyebrow">
            ACTIVE PHASE
          </div>

          <h4>
            {
              project.tasks[
                currentIndex
              ]?.title
            }
          </h4>

          <p>
            {
              project.tasks[
                currentIndex
              ]?.description
            }
          </p>

          <div className="phase-progress">
            <div>
              <span>
                Phase
              </span>

              <strong>
                {Math.min(
                  project.idx ||
                    1,
                  total ||
                    1,
                )}{" "}
                / {total}
              </strong>
            </div>

            <div className="metric-track">
              <span
                style={{
                  width: `${
                    total
                      ? Math.round(
                          (project.idx /
                            total) *
                            100,
                        )
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>
        </section>

        <section className="context-card">
          <div className="eyebrow">
            TECHNOLOGY
          </div>

          <div className="tech-stack">
            {Object.entries(
              project.tech_stack,
            ).map(
              ([key, value]) => (
                <div
                  className="tech-row"
                  key={key}
                >
                  <span>
                    {key}
                  </span>

                  <strong>
                    {value}
                  </strong>
                </div>
              ),
            )}
          </div>
        </section>

        <section className="context-card">
          <div className="eyebrow">
            REQUIREMENTS
          </div>

          <div className="requirements">
            {project.requirements.map(
              (
                requirement,
                index,
              ) => (
                <div
                  className="requirement"
                  key={`${requirement}-${index}`}
                >
                  <span>✓</span>

                  <p>
                    {requirement}
                  </p>
                </div>
              ),
            )}
          </div>
        </section>

        <section className="context-card metrics-card">
          <div className="stat-line">
            <span>
              Checkpoints
            </span>

            <strong>
              {
                project
                  .checkpoints
                  ?.length ?? 0
              }
            </strong>
          </div>

          <div className="stat-line">
            <span>
              Interventions
            </span>

            <strong>
              {
                project.interventions
              }
            </strong>
          </div>

          <div className="stat-line">
            <span>
              Scope checks
            </span>

            <strong>
              {project.changes.length}
            </strong>
          </div>
        </section>
      </div>
    </aside>
  );
}