import { expect, test, type APIRequestContext } from "@playwright/test";

async function signUpThroughApi(request: APIRequestContext, email: string, name: string) {
  const response = await request.post("http://127.0.0.1:3001/api/auth/sign-up/email", {
    data: {
      email,
      password: "password123",
      name,
    },
  });

  expect(response.ok()).toBeTruthy();

  const cookieHeader = response
    .headersArray()
    .filter((header) => header.name.toLowerCase() === "set-cookie")
    .map((header) => header.value.split(";")[0])
    .join("; ");

  return cookieHeader;
}

test("signed-in user can reach dashboard after creating the first habit", async ({
  request,
}) => {
  const email = `new-user-${Date.now()}@example.com`;
  const cookieHeader = await signUpThroughApi(request, email, "New User");

  const createHabitResponse = await request.post("http://127.0.0.1:3001/api/habits", {
    headers: {
      cookie: cookieHeader,
    },
    data: {
      name: "Morning walk",
      frequency: {
        type: "daily",
      },
    },
  });

  expect(createHabitResponse.ok()).toBeTruthy();

  const dashboardResponse = await request.get("http://127.0.0.1:3000/dashboard", {
    headers: {
      cookie: cookieHeader,
    },
  });

  expect(dashboardResponse.ok()).toBeTruthy();
  const dashboardHtml = await dashboardResponse.text();
  expect(dashboardHtml).toContain("Dashboard");
  expect(dashboardHtml).toContain("Morning walk");
});
