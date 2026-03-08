import { PageFrame, SkeletonBlock, StatePanel } from "../../../components/ui";
import styles from "../../../components/dashboard/dashboard-shell.module.css";

export default function DashboardLoading() {
  return (
    <PageFrame>
      <StatePanel
        testId="dashboard-route-loading"
        eyebrow="Dashboard"
        title="Preparing dashboard"
        description="Analytics and today data are loading without dropping you out of the protected shell."
        tone="neutral"
      >
        <div className={styles.routeLoading}>
          <SkeletonBlock height="1rem" width="7rem" />
          <SkeletonBlock height="1.2rem" width="15rem" />
          <SkeletonBlock height="6rem" />
          <SkeletonBlock height="8rem" />
        </div>
      </StatePanel>
    </PageFrame>
  );
}
