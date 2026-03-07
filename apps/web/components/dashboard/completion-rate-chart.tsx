import type { HabitTrendPoint } from "@haaabit/contracts/habits";
import type { OverviewTrendPoint } from "@haaabit/contracts/stats";

type ChartPoint = OverviewTrendPoint | HabitTrendPoint;

function getPointLabel(point: ChartPoint) {
  if ("totalCount" in point) {
    return `${point.completedCount}/${point.totalCount}`;
  }

  if (point.completionTarget === null) {
    return "Not due";
  }

  return `${point.completedCount}/${point.completionTarget}`;
}

function getPointColor(point: ChartPoint) {
  if ("totalCount" in point) {
    return point.completionRate >= 0.75 ? "#173d35" : point.completionRate > 0 ? "#9d6b2e" : "#d8c3a4";
  }

  switch (point.status) {
    case "completed":
      return "#173d35";
    case "pending":
      return "#b17b2d";
    case "missed":
      return "#c98574";
    case "not_due":
      return "#d8cfc0";
  }
}

function getPointHeight(point: ChartPoint) {
  const rate = point.completionRate ?? 0;
  return Math.max(18, Math.round(rate * 88));
}

export function CompletionRateChart({
  title,
  subtitle,
  points,
  testId,
}: {
  title: string;
  subtitle: string;
  points: ChartPoint[];
  testId?: string;
}) {
  return (
    <section
      data-testid={testId}
      style={{
        display: "grid",
        gap: "0.9rem",
        padding: "1.15rem",
        borderRadius: "1.25rem",
        background: "#fffdf8",
        border: "1px solid #d9cdb8",
      }}
    >
      <div style={{ display: "grid", gap: "0.25rem" }}>
        <h3 style={{ margin: 0, fontSize: "1rem" }}>{title}</h3>
        <p style={{ margin: 0, color: "#67594d", fontSize: "0.92rem" }}>{subtitle}</p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${points.length}, minmax(0, 1fr))`,
          gap: "0.45rem",
          alignItems: "end",
          minHeight: "7rem",
        }}
      >
        {points.map((point) => (
          <div
            key={point.date}
            title={`${point.date} · ${getPointLabel(point)}`}
            style={{
              display: "grid",
              gap: "0.4rem",
              alignItems: "end",
            }}
          >
            <div
              style={{
                height: `${getPointHeight(point)}px`,
                borderRadius: "999px",
                background: getPointColor(point),
                opacity: point.completionRate === null ? 0.45 : 1,
              }}
            />
            <span
              style={{
                fontSize: "0.68rem",
                color: "#7c6d5d",
                transform: "rotate(-28deg)",
                transformOrigin: "left top",
                whiteSpace: "nowrap",
              }}
            >
              {point.date.slice(5)}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
