import { getHabitsCopy } from "../../../../lib/i18n/habits";
import { getRequestLocale } from "../../../../lib/i18n";
import { HabitCreateForm } from "../../../../components/habits/habit-create-form";
import { Notice, PageFrame, PageHeader, Surface } from "../../../../components/ui";
import styles from "./page.module.css";

export default async function NewHabitPage() {
  const locale = await getRequestLocale();
  const copy = getHabitsCopy(locale);

  return (
    <Surface variant="hero" className={styles.shell}>
      <PageFrame>
        <PageHeader
          eyebrow={copy.onboarding.eyebrow}
          title={copy.onboarding.title}
          description={copy.onboarding.description}
        />
        <Notice tone="info" title={copy.onboarding.noticeTitle}>
          {copy.onboarding.noticeBody}
        </Notice>
        <HabitCreateForm submitLabel={copy.onboarding.submitLabel} />
      </PageFrame>
    </Surface>
  );
}
