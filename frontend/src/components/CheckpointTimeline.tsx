interface CheckpointTimelineProps {
  checkpoints: string[];
  currentIndex?: number;
}

export default function CheckpointTimeline({
  checkpoints,
  currentIndex = checkpoints.length - 1,
}: CheckpointTimelineProps) {
  if (!checkpoints.length) {
    return (
      <div className="checkpoint-empty">
        Checkpoints will appear as
        Aegis works through the
        project.
      </div>
    );
  }

  return (
    <div className="checkpoint-timeline">
      {checkpoints.map(
        (
          checkpoint,
          index,
        ) => {
          const isCurrent =
            index ===
            currentIndex;

          return (
            <div
              className={`checkpoint-row ${
                isCurrent
                  ? "current"
                  : ""
              }`}
              key={`${checkpoint}-${index}`}
            >
              <div className="checkpoint-line">
                <div className="checkpoint-node">
                  {index <
                  currentIndex
                    ? "✓"
                    : isCurrent
                    ? "•"
                    : ""}
                </div>

                {index <
                  checkpoints.length -
                    1 && (
                  <div className="checkpoint-connector" />
                )}
              </div>

              <div className="checkpoint-text">
                <span className="checkpoint-step">
                  CHECKPOINT {index + 1}
                </span>

                <strong>
                  {checkpoint}
                </strong>
              </div>
            </div>
          );
        },
      )}
    </div>
  );
}