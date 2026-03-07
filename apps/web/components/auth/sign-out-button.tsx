"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { signOut } from "../../lib/auth-client";
import { routes } from "../../lib/navigation";

export function SignOutButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await signOut();
          router.push(routes.auth);
          router.refresh();
        })
      }
    >
      Log out
    </button>
  );
}
