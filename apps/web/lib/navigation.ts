export const routes = {
  auth: "/",
  dashboard: "/dashboard",
  habits: "/habits",
  apiAccess: "/api-access",
  newHabit: "/habits/new",
  habitDetail: (habitId: string) => `/habits/${habitId}`,
} as const;

export const primaryAppNavigation = [
  {
    href: routes.dashboard,
    label: "Today",
  },
  {
    href: routes.habits,
    label: "Habits",
  },
] as const;

export const utilityAppNavigation = [
  {
    href: routes.apiAccess,
    label: "API Access",
  },
] as const;
