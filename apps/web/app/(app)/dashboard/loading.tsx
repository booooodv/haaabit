import { getMessages, getRequestLocale } from "../../../lib/i18n";
import { PageFrame, SkeletonBlock, StatePanel } from "../../../components/ui";
import styles from "../../../components/dashboard/dashboard-shell.module.css";

export default async function DashboardLoading() {
  const locale = await getRequestLocale();
  const copy = getMessages(locale);

  return (
    <PageFrame>
      <StatePanel
        testId="dashboard-route-loading"
        eyebrow={copy.dashboard.loading.routeEyebrow}
        title={copy.dashboard.loading.routeTitle}
        description={copy.dashboard.loading.routeDescription}
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
