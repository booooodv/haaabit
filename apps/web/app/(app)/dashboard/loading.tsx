import { PageFrame, SkeletonBlock, Surface } from "../../../components/ui";
import todayStyles from "../../../components/today/today-dashboard.module.css";
import overviewStyles from "../../../components/dashboard/overview-section.module.css";
import shellStyles from "../../../components/dashboard/dashboard-shell.module.css";

export default function DashboardLoading() {
  return (
    <div className={shellStyles.stack}>
      <Surface variant="hero">
        <PageFrame className={todayStyles.heroFrame}>
          <div className={todayStyles.summaryRow}>
            <div className={todayStyles.summaryCopy}>
              <SkeletonBlock height="0.9rem" width="6rem" />
              <SkeletonBlock height="2.6rem" width="12rem" />
              <SkeletonBlock height="1rem" width="18rem" />
            </div>

            <div className={todayStyles.rateCard} aria-hidden="true">
              <SkeletonBlock height="0.9rem" width="5rem" />
              <SkeletonBlock height="2rem" width="4rem" />
            </div>
          </div>

          <div className={todayStyles.sections}>
            {Array.from({ length: 2 }).map((_, index) => (
              <section key={index} className={todayStyles.group} aria-hidden="true">
                <div className={todayStyles.groupHeader}>
                  <SkeletonBlock height="1.2rem" width="8rem" />
                  <SkeletonBlock height="1rem" width="6rem" />
                </div>
                <div className={todayStyles.cards}>
                  <SkeletonBlock height="7.5rem" />
                </div>
              </section>
            ))}
          </div>
        </PageFrame>
      </Surface>

      <section className={overviewStyles.section} aria-hidden="true">
        <div className={overviewStyles.header}>
          <SkeletonBlock height="0.9rem" width="7rem" />
          <SkeletonBlock height="1.8rem" width="12rem" />
          <SkeletonBlock height="1rem" width="18rem" />
        </div>

        <div className={overviewStyles.metrics}>
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className={overviewStyles.metricCard}>
              <SkeletonBlock height="0.8rem" width="5rem" />
              <SkeletonBlock height="1.6rem" width="4rem" />
              <SkeletonBlock height="0.9rem" width="8rem" />
            </div>
          ))}
        </div>

        <div className={overviewStyles.detailGrid}>
          <SkeletonBlock height="15rem" />
          <SkeletonBlock height="15rem" />
        </div>
      </section>
    </div>
  );
}
