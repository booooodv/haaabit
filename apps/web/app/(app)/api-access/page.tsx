import { ApiAccessPanel } from "../../../components/api/api-access-panel";
import {
  buildCookieHeader,
  getAdminRegistrationFromCookieHeader,
  getApiAccessTokenFromCookieHeader,
  getSessionFromCookieHeader,
} from "../../../lib/server-auth";

export default async function ApiAccessPage() {
  const cookieHeader = await buildCookieHeader();
  const [tokenState, session, adminRegistrationState] = await Promise.all([
    getApiAccessTokenFromCookieHeader(cookieHeader),
    getSessionFromCookieHeader(cookieHeader),
    getAdminRegistrationFromCookieHeader(cookieHeader),
  ]);

  return (
    <ApiAccessPanel
      initialTokenState={tokenState}
      initialRegistrationState={session?.user.isAdmin ? adminRegistrationState : null}
    />
  );
}
