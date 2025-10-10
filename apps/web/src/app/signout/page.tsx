"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthActions } from "@convex-dev/auth/react";
import { Loader2 } from "lucide-react";

export default function SignOutPage() {
  const { signOut } = useAuthActions();
  const router = useRouter();

  useEffect(() => {
    void signOut().then(() => {
      router.push("/signin");
    });
  }, [router, signOut]);

  return (
    <div className="gap-4 flex h-screen w-screen flex-col items-center justify-center text-muted-foreground">
      <div className="gap-1.5 flex items-center">
        <Loader2 className="size-6 animate-spin" />
        <div className="text-sm">Signing you out...</div>
      </div>
    </div>
  );
}
