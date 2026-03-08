"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { signOut } from "../../lib/auth-client";
import { routes } from "../../lib/navigation";
import { Button } from "../ui";

export function SignOutButton({ label = "Log out" }: { label?: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await signOut();
          router.push(routes.auth);
          router.refresh();
        })
      }
    >
      {label}
    </Button>
  );
}
