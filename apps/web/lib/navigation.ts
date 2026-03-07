export const routes = {
  auth: "/",
  dashboard: "/dashboard",
  habits: "/habits",
  newHabit: "/habits/new",
  habitDetail: (habitId: string) => `/habits/${habitId}`,
} as const;
