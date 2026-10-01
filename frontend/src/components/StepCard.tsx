import {
  useState,
} from "react";

import type {
  Status,
  StepRecord,
  StepResult,
} from "../types";

interface Props {
  step: StepRecord;
  index: number;
  total?: number;
  status?: Status;
  result?: StepResult;
  onToggleSub?: (
    index: number,
  ) => void;
  onComplete?: () => void;
  onAsk?: (
    message: string,
  ) => Promise<void>;
}

function getDrift(
  result?: StepResult,
) {
  if (!result) {
    return null;
  }

  const drift =
    result.drift ?? {};

  const value =
    drift.probability ??
    drift.drift_probability ??
    drift.drift_prob ??
    drift.prob;

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

export default function StepCard({
  step,
  index,
  total,
  status = "todo",
  result,
  onToggleSub,
  onComplete,
  onAsk,
}: Props) {
  const [expanded, setExpanded] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [sending, setSending] =
    useState(false);

  const substeps =
    step.substeps ??
    (step.guide.substeps ??
      []).map((item) => ({
        ...item,
        done: false,
      }));

  const complete =
    substeps.filter(
      (item) => item.done,
    ).length;

  const drift =
    getDrift(result);

  async function send() {
    const text =
      message.trim();

    if (
      !text ||
      sending ||
      !onAsk
    ) {
      return;
    }

    setSending(true);
    setMessage("");

    try {
      await onAsk(text);
    } finally {
      setSending(false);
    }
  }

  return (
    <article
      className={`phase-card ${
        status === "done"
          ? "phase-complete"
          : ""
      }`}
    >
      <button
        className="phase-card-head"
        onClick={() =>
          setExpanded(
            (value) => !value,
          )
        }
      >
        <div className="phase-number">
          {status === "done"
            ? "✓"
            : String(index + 1).padStart(
                2,
                "0",
              )}
        </div>

        <div className="phase-title-wrap">
          <span className="eyebrow">
            PHASE{" "}
            {index + 1}
            {total
              ? ` OF ${total}`
              : ""}
          </span>

          <h3>
            {step.title}
          </h3>

          <p>
            {step.guide.summary}
          </p>
        </div>

        <div className="phase-head-meta">
          {drift !== null && (
            <span className="drift-pill">
              Drift {drift}%
            </span>
          )}

          <span className="expand-icon">
            {expanded
              ? "−"
              : "+"}
          </span>
        </div>
      </button>

      {result?.intervention && (
        <div className="intervention-banner">
          <div className="intervention-banner-icon">
            ↻
          </div>

          <div>
            <strong>
              Goal drift detected
            </strong>

            <p>
              Aegis intervened and
              re-planned this phase.
            </p>

            <span>
              {
                result.intervention
              }
            </span>
          </div>
        </div>
      )}

      {expanded && (
        <div className="phase-card-body">
          {step.guide.why && (
            <div className="detail-block">
              <div className="eyebrow">
                WHY THIS PHASE
              </div>

              <p>
                {step.guide.why}
              </p>
            </div>
          )}

          {step.guide.explanation && (
            <div className="detail-block explanation">
              <div className="eyebrow">
                AEGIS CHECKPOINT
              </div>

              <p>
                {
                  step.guide
                    .explanation
                }
              </p>
            </div>
          )}

          {substeps.length >
            0 && (
            <div className="detail-block">
              <div className="detail-block-header">
                <div>
                  <div className="eyebrow">
                    PHASE ACTIONS
                  </div>

                  <h4>
                    {complete}/
                    {substeps.length}{" "}
                    complete
                  </h4>
                </div>
              </div>

              <div className="substep-list">
                {substeps.map(
                  (
                    item,
                    subIndex,
                  ) => (
                    <label
                      key={
                        subIndex
                      }
                      className={`substep ${
                        item.done
                          ? "done"
                          : ""
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={
                          item.done
                        }
                        disabled={
                          !onToggleSub
                        }
                        onChange={() =>
                          onToggleSub?.(
                            subIndex,
                          )
                        }
                      />

                      <span className="custom-checkbox">
                        {item.done
                          ? "✓"
                          : ""}
                      </span>

                      <span className="substep-copy">
                        <strong>
                          {
                            item.title
                          }
                        </strong>

                        <small>
                          {
                            item.detail
                          }
                        </small>
                      </span>
                    </label>
                  ),
                )}
              </div>
            </div>
          )}

          {step.guide.tools?.length ? (
            <div className="detail-block">
              <div className="eyebrow">
                TOOLS
              </div>

              <div className="chip-list">
                {step.guide.tools.map(
                  (
                    tool,
                    toolIndex,
                  ) => (
                    <span
                      className="soft-chip"
                      key={
                        toolIndex
                      }
                    >
                      {tool}
                    </span>
                  ),
                )}
              </div>
            </div>
          ) : null}

          <div className="detail-grid">
            {step.guide.backend
              ?.length ? (
              <div className="detail-block compact-block">
                <div className="eyebrow">
                  BACKEND
                </div>

                <ul>
                  {step.guide.backend.map(
                    (item, i) => (
                      <li
                        key={i}
                      >
                        {item}
                      </li>
                    ),
                  )}
                </ul>
              </div>
            ) : null}

            {step.guide.frontend
              ?.length ? (
              <div className="detail-block compact-block">
                <div className="eyebrow">
                  FRONTEND
                </div>

                <ul>
                  {step.guide.frontend.map(
                    (item, i) => (
                      <li
                        key={i}
                      >
                        {item}
                      </li>
                    ),
                  )}
                </ul>
              </div>
            ) : null}
          </div>

          {onAsk && (
            <div className="phase-chat">
              <div className="eyebrow">
                ASK AEGIS
              </div>

              <div className="phase-chat-box">
                <input
                  value={message}
                  onChange={(event) =>
                    setMessage(
                      event.target
                        .value,
                    )
                  }
                  onKeyDown={(event) => {
                    if (
                      event.key ===
                      "Enter"
                    ) {
                      void send();
                    }
                  }}
                  placeholder="Ask Aegis about this phase..."
                />

                <button
                  onClick={() =>
                    void send()
                  }
                  disabled={
                    sending ||
                    !message.trim()
                  }
                >
                  {sending
                    ? "..."
                    : "Ask"}
                </button>
              </div>

              {step.chat?.length ? (
                <div className="mini-chat">
                  {step.chat
                    .slice(-4)
                    .map(
                      (
                        chat,
                        chatIndex,
                      ) => (
                        <div
                          key={
                            chatIndex
                          }
                          className={`mini-message ${chat.role}`}
                        >
                          {
                            chat.text
                          }
                        </div>
                      ),
                    )}
                </div>
              ) : null}
            </div>
          )}

          <div className="phase-footer">
            {status !== "done" &&
              onComplete && (
                <button
                  className="complete-phase-button"
                  onClick={
                    onComplete
                  }
                >
                  Complete phase
                  <span>→</span>
                </button>
              )}
          </div>
        </div>
      )}
    </article>
  );
}