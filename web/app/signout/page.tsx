"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthActions } from "@convex-dev/auth/react";

export default function SignOutPage() {
  const { signOut } = useAuthActions();
  const router = useRouter();

  useEffect(() => {
    void signOut().then(() => {
      router.push("/signin");
    });
  }, [router, signOut]);

  return null;
}
