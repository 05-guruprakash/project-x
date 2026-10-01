import {
  useMemo,
} from "react";

import type {
  Busy,
  Project,
  Status,
  StepResult,
} from "../types";

import { api } from "../api";

import ChangeBox from "./ChangeBox";
import CheckpointTimeline from "./CheckpointTimeline";
import StepCard from "./StepCard";
import ThinkingIndicator from "./ThinkingIndicator";

const NEXT: Record<
  Status,
  Status
> = {
  todo: "doing",
  doing: "done",
  done: "todo",
};

interface Props {
  project: Project;
  results: Record<
    number,
    StepResult
  >;
  busy: Busy;
  force: boolean;
  onForce: (value: boolean) => void;
  onStep: () => void;
  onAll: () => void;
  onStatus: (
    index: number,
    status: Status,
  ) => void;
  onChange: (
    text: string,
  ) => Promise<void>;
  onExport: () => void;
  onGithub: () => void;
  onUpdate: (
    project: Project,
  ) => void;
}

export default function Workspace({
  project,
  results,
  busy,
  force,
  onForce,
  onStep,
  onAll,
  onStatus,
  onChange,
  onExport,
  onGithub,
  onUpdate,
}: Props) {
  const total =
    project.tasks.length;

  const completed =
    project.tasks.filter(
      (task) =>
        task.status === "done",
    ).length;

  const completion =
    total
      ? Math.round(
          (completed / total) *
            100,
        )
      : 0;

  const currentIndex =
    Math.min(
      project.idx,
      Math.max(
        total - 1,
        0,
      ),
    );

  const currentPhase =
    project.tasks[
      currentIndex
    ];

  const latestResult =
    results[
      Math.max(
        project.steps.length - 1,
        0,
      )
    ];

  const loading =
    busy === "step" ||
    busy === "plan";

  const checkpointLabels =
    useMemo(
      () =>
        (
          project
            .checkpoints ?? []
        ).slice(),
      [project],
    );

  async function update(
    fn: () => Promise<Project>,
  ) {
    try {
      onUpdate(
        await fn(),
      );
    } catch (error) {
      console.error(
        error,
      );
    }
  }

  return (
    <div className="workspace">
      <section className="workspace-heading">
        <div>
          <div className="eyebrow">
            PROJECT WORKSPACE
          </div>

          <h1>
            {project.goal}
          </h1>

          <p>
            {project.idea}
          </p>
        </div>

        <div className="workspace-actions">
          <button
            className="soft-button"
            onClick={onExport}
          >
            ↓ Export
          </button>

          <button
            className="soft-button"
            onClick={onGithub}
          >
            GitHub
          </button>
        </div>
      </section>

      <section className="command-card">
        <div className="command-card-main">
          <div className="phase-badge">
            <span className="pulse-dot" />
            PHASE{" "}
            {Math.min(
              project.idx + 1,
              total || 1,
            )}{" "}
            / {total}
          </div>

          <h2>
            {currentPhase?.title ??
              "Project complete"}
          </h2>

          <p>
            {currentPhase?.description ??
              "All planned phases have been completed."}
          </p>
        </div>

        <div className="command-card-progress">
          <div className="progress-copy">
            <span>
              Project progress
            </span>

            <strong>
              {completion}%
            </strong>
          </div>

          <div className="big-progress">
            <span
              style={{
                width: `${completion}%`,
              }}
            />
          </div>
        </div>
      </section>

      <section className="execution-grid">
        <div className="main-column">
          <section className="checkpoint-card">
            <div className="section-title-row">
              <div>
                <div className="eyebrow">
                  LIVE EXECUTION
                </div>

                <h3>
                  What Aegis is doing
                </h3>
              </div>

              {loading && (
                <span className="live-pill">
                  <span />
                  Working
                </span>
              )}
            </div>

            {loading ? (
              <ThinkingIndicator
                label={
                  busy === "plan"
                    ? "Building project plan"
                    : "Analyzing current phase"
                }
              />
            ) : (
              <CheckpointTimeline
                checkpoints={
                  checkpointLabels
                }
                currentIndex={
                  Math.max(
                    checkpointLabels.length -
                      1,
                    0,
                  )
                }
              />
            )}
          </section>

          <section className="phase-section">
            <div className="section-title-row">
              <div>
                <div className="eyebrow">
                  GUIDED BUILD
                </div>

                <h3>
                  Work through the
                  project
                </h3>
              </div>

              <span className="phase-count">
                {project.steps.length}/
                {total} analyzed
              </span>
            </div>

            {project.steps.length ===
            0 ? (
              <div className="empty-phase-card">
                <div className="empty-phase-icon">
                  ◌
                </div>

                <h4>
                  Your first phase
                  is ready.
                </h4>

                <p>
                  Aegis will analyze
                  one phase at a time,
                  show the checkpoint,
                  and keep the project
                  aligned with the
                  original goal.
                </p>

                <button
                  className="primary-action"
                  onClick={onStep}
                  disabled={
                    loading ||
                    project.done
                  }
                >
                  Analyze phase 1
                  <span>→</span>
                </button>
              </div>
            ) : (
              <div className="phase-list">
                {project.steps.map(
                  (
                    step,
                    index,
                  ) => (
                    <StepCard
                      key={`${step.title}-${index}`}
                      step={step}
                      index={index}
                      total={total}
                      status={
                        project.tasks[
                          index
                        ]?.status
                      }
                      result={
                        results[
                          index
                        ]
                      }
                      onToggleSub={(
                        subIndex,
                      ) =>
                        void update(
                          () =>
                            api.toggleSub(
                              project.project_id,
                              index,
                              subIndex,
                            ),
                        )
                      }
                      onComplete={() =>
                        onStatus(
                          index,
                          "done",
                        )
                      }
                      onAsk={(
                        message,
                      ) =>
                        update(
                          () =>
                            api.chat(
                              project.project_id,
                              index,
                              message,
                            ),
                        )
                      }
                    />
                  ),
                )}
              </div>
            )}
          </section>

          <section className="navigator-card">
            <div>
              <div className="eyebrow">
                CONTINUE
              </div>

              <h3>
                Keep building with
                Aegis
              </h3>

              <p>
                Move through the
                roadmap one phase at a
                time. You can revisit
                previous phases whenever
                context is needed.
              </p>
            </div>

            <div className="navigator-actions">
              <button
                className="soft-button"
                disabled={
                  project.idx <= 0
                }
              >
                ← Previous
              </button>

              <button
                className="primary-action"
                disabled={
                  loading ||
                  project.done
                }
                onClick={onStep}
              >
                {loading
                  ? "Analyzing..."
                  : project.done
                  ? "Project complete"
                  : `Continue to phase ${
                      project.idx + 1
                    }`}
                {!project.done &&
                  !loading && (
                    <span>
                      →
                    </span>
                  )}
              </button>
            </div>
          </section>
        </div>

        <aside className="workspace-mini-column">
          <section className="mini-intelligence-card">
            <div className="eyebrow">
              AGENT STATUS
            </div>

            <div className="agent-status">
              <div className="agent-avatar">
                A
              </div>

              <div>
                <strong>
                  Aegis Agent
                </strong>

                <span>
                  {
                    loading
                      ? "Working on your project"
                      : "Waiting for direction"
                  }
                </span>
              </div>
            </div>
          </section>

          <section className="mini-intelligence-card">
            <div className="eyebrow">
              QUICK CONTROL
            </div>

            <div className="control-stack">
              <button
                className="control-button primary-control"
                onClick={onStep}
                disabled={
                  loading ||
                  project.done
                }
              >
                <span>
                  {loading
                    ? "Analyzing..."
                    : "Analyze next phase"}
                </span>

                <span>→</span>
              </button>

              <button
                className="control-button"
                onClick={onAll}
                disabled={
                  loading ||
                  project.done
                }
              >
                Analyze all phases
              </button>
            </div>

            <label className="demo-toggle">
              <input
                type="checkbox"
                checked={force}
                onChange={(event) =>
                  onForce(
                    event.target
                      .checked,
                  )
                }
              />

              <span>
                Enable drift demo
              </span>
            </label>
          </section>

          <section className="mini-intelligence-card">
            <div className="eyebrow">
              PHASE STATES
            </div>

            <div className="state-list">
              {project.tasks.map(
                (
                  task,
                  index,
                ) => (
                  <button
                    key={`${task.title}-${index}`}
                    className={`state-row ${
                      index ===
                      currentIndex
                        ? "active"
                        : ""
                    }`}
                    onClick={() =>
                      onStatus(
                        index,
                        NEXT[
                          task.status
                        ],
                      )
                    }
                  >
                    <span
                      className={`state-dot ${task.status}`}
                    />

                    <span>
                      {task.title}
                    </span>

                    <small>
                      {task.status}
                    </small>
                  </button>
                ),
              )}
            </div>
          </section>

          {latestResult?.intervention && (
            <section className="mini-intelligence-card intervention-mini-card">
              <div className="eyebrow">
                RECOVERY
              </div>

              <h4>
                Goal drift recovered
              </h4>

              <p>
                {
                  latestResult.intervention
                }
              </p>
            </section>
          )}
        </aside>
      </section>

      <ChangeBox
        changes={project.changes}
        onSubmit={onChange}
      />
    </div>
  );
}