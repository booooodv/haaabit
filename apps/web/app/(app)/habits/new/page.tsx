import { HabitCreateForm } from "../../../../components/habits/habit-create-form";

export default function NewHabitPage() {
  return (
    <section
      style={{
        background: "#fffdf8",
        border: "1px solid #d8d0c4",
        borderRadius: "1.5rem",
        padding: "2rem",
        boxShadow: "0 20px 60px rgba(40, 28, 15, 0.08)",
      }}
    >
      <h1 style={{ marginTop: 0 }}>Create your first habit</h1>
      <p style={{ color: "#6b5e50", marginBottom: "1.5rem" }}>
        Your account is ready. Add the first habit now so future logins can route straight into your
        dashboard.
      </p>
      <HabitCreateForm />
    </section>
  );
}
