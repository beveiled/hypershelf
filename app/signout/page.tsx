"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function SignOutPage() {
  const { signOut } = useAuthActions();
  const router = useRouter();

  useEffect(() => {
    void signOut().then(() => {
      router.push("/signin");
    });
  }, [router, signOut]);

  return (
    <div className="text-muted-foreground flex h-screen w-screen flex-col items-center justify-center gap-4">
      <div className="flex items-center gap-1.5">
        <Loader2 className="size-6 animate-spin" />
        <div className="text-sm">Signing you out...</div>
      </div>
    </div>
  );
}
