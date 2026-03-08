export const routes = {
  auth: "/",
  dashboard: "/dashboard",
  habits: "/habits",
  apiAccess: "/api-access",
  newHabit: "/habits/new",
  habitDetail: (habitId: string) => `/habits/${habitId}`,
} as const;

export function getPrimaryAppNavigation(labels: { dashboard: string; habits: string }) {
  return [
    {
      href: routes.dashboard,
      label: labels.dashboard,
    },
    {
      href: routes.habits,
      label: labels.habits,
    },
  ] as const;
}

export function getUtilityAppNavigation(labels: { apiAccess: string }) {
  return [
    {
      href: routes.apiAccess,
      label: labels.apiAccess,
    },
  ] as const;
}
