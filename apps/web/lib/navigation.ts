export const routes = {
  auth: "/",
  dashboard: "/dashboard",
  habits: "/habits",
  apiAccess: "/api-access",
  newHabit: "/habits/new",
  habitDetail: (habitId: string) => `/habits/${habitId}`,
} as const;
