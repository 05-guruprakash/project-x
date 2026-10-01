import {
  useCallback,
  useEffect,
  useState,
} from "react";

import type {
  Discovery as DiscoveryResult,
  QA,
  Question,
} from "../types";

import ThinkingIndicator from "./ThinkingIndicator";

interface Props {
  ask: (
    answers: QA[],
  ) => Promise<DiscoveryResult>;

  onDone: (
    answers: QA[],
  ) => void;
}

export default function Discovery({
  ask,
  onDone,
}: Props) {
  const [answers, setAnswers] =
    useState<QA[]>([]);

  const [question, setQuestion] =
    useState<Question | null>(
      null,
    );

  const [selected, setSelected] =
    useState<string[]>([]);

  const [custom, setCustom] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const load =
    useCallback(async () => {
      setLoading(true);
      setError("");

      try {
        const response =
          await ask(answers);

        if (
          response.done ||
          !response.question
        ) {
          onDone(answers);
          return;
        }

        setQuestion(
          response.question,
        );

        setSelected([]);
        setCustom("");
      } catch (errorValue) {
        setError(
          errorValue instanceof Error
            ? errorValue.message
            : String(
                errorValue,
              ),
        );
      } finally {
        setLoading(false);
      }
    }, [
      answers,
      ask,
      onDone,
    ]);

  useEffect(() => {
    void load();
  }, [load]);

  const submit = (
    answer: string,
  ) => {
    const clean =
      answer.trim();

    if (
      !question ||
      !clean
    ) {
      return;
    }

    setAnswers(
      (previous) => [
        ...previous,
        {
          q: question.question,
          a: clean,
        },
      ],
    );
  };

  const toggle = (
    label: string,
  ) => {
    setSelected(
      (previous) =>
        previous.includes(label)
          ? previous.filter(
              (item) =>
                item !== label,
            )
          : [
              ...previous,
              label,
            ],
    );
  };

  if (error) {
    return (
      <div className="discovery-error">
        <strong>
          Discovery failed
        </strong>

        <span>{error}</span>

        <button
          onClick={() =>
            void load()
          }
        >
          Retry
        </button>
      </div>
    );
  }

  if (loading || !question) {
    return (
      <div className="discovery-loading">
        <ThinkingIndicator
          label="Understanding what matters for this project"
        />
      </div>
    );
  }

  return (
    <div className="discovery-content">
      <div className="question-progress">
        <div className="question-progress-top">
          <span>
            Question{" "}
            {answers.length + 1}
          </span>

          <span>
            {Math.min(
              answers.length + 1,
              10,
            )}{" "}
            / 10
          </span>
        </div>

        <div className="question-progress-track">
          <span
            style={{
              width: `${Math.min(
                ((answers.length +
                  1) /
                  10) *
                  100,
                100,
              )}%`,
            }}
          />
        </div>
      </div>

      <h2>
        {question.question}
      </h2>

      {question.multi && (
        <p className="discovery-hint">
          Select everything that
          applies.
        </p>
      )}

      <div className="answer-grid">
        {question.options.map(
          (option) => {
            const active =
              selected.includes(
                option.label,
              );

            return (
              <button
                key={option.label}
                className={`answer-option ${
                  active
                    ? "selected"
                    : ""
                }`}
                onClick={() =>
                  question.multi
                    ? toggle(
                        option.label,
                      )
                    : submit(
                        option.label,
                      )
                }
              >
                <span className="answer-radio">
                  {active
                    ? "✓"
                    : ""}
                </span>

                <span className="answer-copy">
                  <strong>
                    {option.label}
                  </strong>

                  {option.detail && (
                    <small>
                      {
                        option.detail
                      }
                    </small>
                  )}
                </span>
              </button>
            );
          },
        )}
      </div>

      {question.multi && (
        <button
          className="continue-button"
          disabled={
            selected.length === 0
          }
          onClick={() =>
            submit(
              selected.join(", "),
            )
          }
        >
          Continue
          <span>→</span>
        </button>
      )}

      <div className="custom-answer">
        <input
          value={custom}
          onChange={(event) =>
            setCustom(
              event.target.value,
            )
          }
          placeholder="Something else? Type your own answer..."
          onKeyDown={(event) => {
            if (
              event.key ===
              "Enter"
            ) {
              event.preventDefault();

              if (custom.trim()) {
                submit(
                  custom.trim(),
                );
              }
            }
          }}
        />

        <button
          disabled={!custom.trim()}
          onClick={() =>
            submit(
              custom.trim(),
            )
          }
        >
          Add
        </button>
      </div>

      <button
        className="decide-button"
        onClick={() =>
          submit(
            "Let Aegis decide",
          )
        }
      >
        ✦ Let Aegis decide
      </button>
    </div>
  );
}