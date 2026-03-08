import { HabitCreateForm } from "../../../../components/habits/habit-create-form";
import { Notice, PageFrame, PageHeader, Surface } from "../../../../components/ui";
import styles from "./page.module.css";

export default function NewHabitPage() {
  return (
    <Surface variant="hero" className={styles.shell}>
      <PageFrame>
        <PageHeader
          eyebrow="Onboarding"
          title="Create your first habit"
          description="Your account is ready. Add one clear habit now so later logins can route straight into a useful dashboard."
        />
        <Notice tone="info" title="Start simple">
          You can refine categories, targets, and scheduling patterns later. Right now, aim for one habit you
          genuinely expect to check today.
        </Notice>
        <HabitCreateForm submitLabel="Create first habit" />
      </PageFrame>
    </Surface>
  );
}
