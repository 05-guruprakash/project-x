import {
  useCallback,
  useState,
} from "react";

import { api } from "../api";
import type {
  Busy,
  QA,
} from "../types";

import Discovery from "./Discovery";
import ThinkingIndicator from "./ThinkingIndicator";

const EXAMPLES = [
  "Build an AI-powered hostel food waste prediction platform",
  "Build a campus event platform with QR-based check-in",
  "Build an AI-assisted software development platform",
];

interface Props {
  busy: Busy;
  onCreate: (
    idea: string,
    answers: QA[],
  ) => void;
}

export default function NewProject({
  busy,
  onCreate,
}: Props) {
  const [idea, setIdea] =
    useState("");

  const [
    phase,
    setPhase,
  ] = useState<
    "idea" | "discover" | "creating"
  >("idea");

  const valid =
    idea.trim().length >= 5;

  const finishDiscovery =
    useCallback(
      (answers: QA[]) => {
        setPhase("creating");

        onCreate(
          idea.trim(),
          answers,
        );
      },
      [idea, onCreate],
    );

  if (phase === "creating") {
    return (
      <div className="new-project-page">
        <div className="planning-loader">
          <ThinkingIndicator label="Building your project architecture" />

          <h2>
            Aegis is planning
            your project
          </h2>

          <p>
            Turning your answers
            into a structured,
            goal-aware project
            roadmap.
          </p>
        </div>
      </div>
    );
  }

  if (phase === "discover") {
    return (
      <div className="new-project-page">
        <div className="discovery-shell">
          <div className="discovery-top">
            <div>
              <div className="eyebrow">
                PROJECT DISCOVERY
              </div>

              <h1>
                Let's understand
                what you're building.
              </h1>

              <p>
                Aegis asks only the
                questions that can
                meaningfully change
                the project plan.
              </p>
            </div>

            <div className="discovery-orb">
              A
            </div>
          </div>

          <div className="discovery-card-wrap">
            <Discovery
              ask={(answers) =>
                api.discover(
                  idea.trim(),
                  answers,
                )
              }
              onDone={
                finishDiscovery
              }
            />
          </div>

          <button
            className="ghost-button"
            onClick={() =>
              finishDiscovery([])
            }
          >
            Skip and let Aegis
            decide
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="new-project-page">
      <div className="hero-glow glow-one" />
      <div className="hero-glow glow-two" />

      <div className="new-project-hero">
        <div className="hero-orbit">
          <div className="orbit-ring ring-one" />
          <div className="orbit-ring ring-two" />

          <div className="hero-orbit-core">
            A
          </div>
        </div>

        <div className="eyebrow center">
          ADAPTIVE PROJECT INTELLIGENCE
        </div>

        <h1>
          What are you
          <span> building?</span>
        </h1>

        <p className="hero-copy">
          Describe your project idea.
          Aegis will understand the
          goal, ask the right questions,
          build the roadmap and guide
          you phase by phase.
        </p>

        <div className="project-input-wrap">
          <textarea
            value={idea}
            maxLength={2000}
            rows={5}
            placeholder="Describe the project you want to build..."
            onChange={(event) =>
              setIdea(
                event.target.value,
              )
            }
          />

          <div className="input-bottom">
            <span>
              {idea.length}/2000
            </span>

            <button
              className="send-project-button"
              disabled={!valid}
              onClick={() =>
                setPhase(
                  "discover",
                )
              }
            >
              <span>
                Start building
              </span>

              <span>→</span>
            </button>
          </div>
        </div>

        <div className="example-header">
          Try an idea
        </div>

        <div className="example-grid">
          {EXAMPLES.map(
            (example) => (
              <button
                className="example-card"
                key={example}
                onClick={() =>
                  setIdea(
                    example,
                  )
                }
              >
                <span className="example-icon">
                  ✦
                </span>

                <span>
                  {example}
                </span>

                <span className="example-arrow">
                  ↗
                </span>
              </button>
            ),
          )}
        </div>
      </div>
    </div>
  );
}