"use client";

import { api } from "@/convex/_generated/api";
import { cn } from "@/lib/utils";
import { useConvexAuth, useQuery } from "convex/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { convex } from "./ConvexClientProvider";

function NavLink({
  href,
  children
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className="group relative">
      {children}
      <div className="bg-brand absolute -bottom-0.5 left-0 h-[1px] w-full origin-left scale-x-0 transform transition-transform duration-100 group-hover:scale-x-100"></div>
    </Link>
  );
}

export default function Header() {
  const [isConnected, setIsConnected] = useState(false);
  const currentUser = useQuery(api.auth.getCurrentUser);
  const pathname = usePathname();
  useEffect(() => {
    const checkConnection = () => {
      const connectionState = convex.connectionState();
      setIsConnected(connectionState.isWebSocketConnected);
    };

    checkConnection();
    const interval = setInterval(checkConnection, 1000);

    return () => clearInterval(interval);
  }, []);

  const { isAuthenticated } = useConvexAuth();

  // TODO: navigation animation

  return (
    <header className="fixed w-full">
      <div className="border-border text-foreground mx-4 my-2 flex items-center justify-between rounded-md border px-4 py-1.5 backdrop-blur-xl">
        <div className="flex items-center gap-8">
          <Link href="/" className="font-title relative text-xs font-extrabold">
            Hypershelf
            <div className="bg-brand absolute bottom-0 left-0 h-0.5 w-4"></div>
          </Link>
          <div className="flex items-center gap-1.5">
            <div
              className={cn("h-1.5 w-1.5 rounded-full", {
                "bg-green-500": isConnected,
                "bg-red-500": !isConnected
              })}
            ></div>
            <div className="text-muted-foreground text-xs">
              {isConnected ? "Live" : "Reconnecting..."}
            </div>
          </div>
        </div>
        <nav>
          <div className="flex space-x-6 text-xs font-medium">
            {pathname !== "/signin" && (
              <>
                <NavLink href="/">Assets</NavLink>
                <NavLink href="/fields">Fields</NavLink>
                <NavLink href="/schemas">Schemas</NavLink>
              </>
            )}
            {pathname !== "/signin" &&
              (isAuthenticated ? (
                <>
                  <NavLink href="/signout">Sign Out</NavLink>
                  <div className="text-muted-foreground text-xs">
                    {currentUser?.email ?? "..."}
                  </div>
                </>
              ) : (
                <NavLink href="/signin">Sign In</NavLink>
              ))}
          </div>
        </nav>
      </div>
    </header>
  );
}
