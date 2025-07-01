/*
https://github.com/hikariatama/hypershelf
Copyright (C) 2025  Daniil Gazizullin

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/
"use client";

import { api } from "@/convex/_generated/api";
import { cn } from "@/lib/utils";
import { useConvexAuth, useQuery } from "convex/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { convex } from "./ConvexClientProvider";
import { useHeaderContent } from "./util/HeaderContext";
import { motion } from "framer-motion";
import { useLoading } from "./util/LoadingContext";
import { Cog, GitBranch, LogIn, LogOut, Settings2, Table2 } from "lucide-react";

function NavLink({
  href,
  children
}: {
  href: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (href === pathname) return;
    setIsNavigating(true);
    router.push(href);
  };

  useEffect(() => {
    setIsNavigating(false);
  }, [pathname]);

  return (
    <Link
      href={href}
      className="group relative overflow-x-hidden"
      onClick={handleClick}
    >
      {children}
      <div
        className={cn("bg-brand absolute bottom-0 left-0 h-[1px] w-full", {
          "animate-load": isNavigating,
          "origin-left scale-x-0 transform transition-transform duration-100 group-hover:scale-x-100":
            !isNavigating
        })}
      />
    </Link>
  );
}

export default function Header() {
  const [isConnected, setIsConnected] = useState(false);
  const currentUser = useQuery(api.auth.getCurrentUser);
  const pathname = usePathname();
  const { isLoading } = useLoading();

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
  const { content } = useHeaderContent();

  if (pathname.startsWith("/integrations")) {
    const overlayVariants = {
      initial: {
        top: "50%",
        left: "50%",
        x: "-50%",
        y: "-50%",
        scale: 1
      },
      corner: {
        top: "0.5rem",
        left: "1rem",
        x: 0,
        y: 0,
        scale: 0.3,
        transition: { type: "spring", stiffness: 300, damping: 30 }
      }
    } as const;
    return (
      <motion.div
        variants={overlayVariants}
        initial="initial"
        animate={isLoading ? "initial" : "corner"}
        className="absolute z-50 flex origin-top-left flex-col items-start"
      >
        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="font-title group relative text-4xl font-extrabold select-none"
        >
          Hypershelf
          <div className="absolute bottom-0 left-0 h-1 w-11.5 overflow-hidden">
            <div
              className={cn(
                "bg-brand h-full w-full",
                isLoading
                  ? "animate-brand-load"
                  : "group-hover:animate-brand-once"
              )}
            />
          </div>
        </Link>
      </motion.div>
    );
  }

  return (
    <header className="fixed z-50 w-screen">
      <div className="border-border text-foreground m-2 flex h-8 items-center justify-between rounded-md border bg-black/40 px-4 py-1.5 backdrop-blur-xl">
        <div className="flex items-center md:gap-8">
          <Link href="/" className="font-title relative text-xs font-extrabold">
            <span className="hidden md:inline">Hypershelf</span>
            <span className="inline md:hidden">H</span>
            <div
              className={cn(
                "bg-brand md:!bg-brand absolute bottom-0 left-0 h-0.5 w-4",
                { "bg-red-500": !isConnected }
              )}
            ></div>
          </Link>
          <div className="hidden items-center gap-1.5 md:flex">
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
        {content}
        <nav>
          <div className="flex gap-x-6 text-xs font-medium">
            {pathname !== "/signin" && (
              <>
                <NavLink href="/">
                  <span className="hidden lg:inline">Assets</span>
                  <Table2 className="inline size-4 lg:hidden" />
                </NavLink>
                <NavLink href="/fields">
                  <span className="hidden lg:inline">Fields</span>
                  <Settings2 className="inline size-4 lg:hidden" />
                </NavLink>
                <NavLink href="/schemas">
                  <span className="hidden lg:inline">Schemas</span>
                  <GitBranch className="inline size-4 lg:hidden" />
                </NavLink>
                <NavLink href="/views">
                  <span className="hidden lg:inline">Views</span>
                  <Cog className="inline size-4 lg:hidden" />
                </NavLink>
              </>
            )}
            {pathname !== "/signin" &&
              (isAuthenticated ? (
                <>
                  <NavLink href="/signout">
                    <span className="hidden lg:inline">Sign Out</span>
                    <LogOut className="text-destructive inline size-4 lg:hidden" />
                  </NavLink>
                  <div className="text-muted-foreground hidden text-xs md:block">
                    {currentUser?.email ?? "..."}
                  </div>
                </>
              ) : (
                <NavLink href="/signin">
                  <span className="hidden lg:inline">Sign In</span>
                  <LogIn className="inline size-4 lg:hidden" />
                </NavLink>
              ))}
          </div>
        </nav>
      </div>
    </header>
  );
}
