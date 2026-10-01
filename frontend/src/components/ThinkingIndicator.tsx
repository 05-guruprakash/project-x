interface Props {
  label?: string;
  compact?: boolean;
}

export default function ThinkingIndicator({
  label = "Analyzing project context",
  compact = false,
}: Props) {
  return (
    <div
      className={
        compact
          ? "thinking compact"
          : "thinking"
      }
    >
      <div className="thinking-orbit">
        <span />
        <span />
        <span />
        <span />
        <div className="thinking-core">
          A
        </div>
      </div>

      <div className="thinking-copy">
        <strong>{label}</strong>

        <div className="thinking-dots">
          <span />
          <span />
          <span />
        </div>
      </div>
    </div>
  );
}