import { ApiAccessPanel } from "../../../components/api/api-access-panel";
import { buildCookieHeader, getApiAccessTokenFromCookieHeader } from "../../../lib/server-auth";

export default async function ApiAccessPage() {
  const cookieHeader = await buildCookieHeader();
  const tokenState = await getApiAccessTokenFromCookieHeader(cookieHeader);

  return <ApiAccessPanel initialTokenState={tokenState} />;
}
