"use client";

import { api } from "@/convex/_generated/api";
import { cn } from "@/lib/utils";
import { convex } from "./ConvexClientProvider";
import { useHeaderContent } from "./util/HeaderContext";
import { useLoading } from "./util/LoadingContext";
import { useConvexAuth, useQuery } from "convex/react";
import { motion } from "framer-motion";
import { GitBranch, LogIn, LogOut, Settings2, Table2 } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

function NavLink({
  href,
  children,
  label,
}: {
  href: string;
  children: React.ReactNode;
  label: string;
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
    <motion.div
      initial={{ scale: 1 }}
      whileTap={{ scale: 0.92 }}
      transition={{ type: "spring", bounce: 0.3, duration: 0.3 }}
      tabIndex={-1}
    >
      <Link
        href={href}
        className={cn(
          "group relative overflow-x-hidden block cursor-pointer outline-0 focus-visible:ring-ring/50 focus-visible:ring-2 rounded-md p-1",
          href === pathname && "text-brand",
        )}
        onClick={handleClick}
        aria-label={label}
        role="button"
      >
        {children}
        <div
          className={cn("bg-brand absolute bottom-0.5 left-0 h-[1px] w-full", {
            "animate-load": isNavigating,
            "origin-left scale-x-0 transform transition-transform duration-100 group-hover:scale-x-100":
              !isNavigating,
          })}
        />
      </Link>
    </motion.div>
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
        scale: 1,
      },
      corner: {
        top: "0.5rem",
        left: "1rem",
        x: 0,
        y: 0,
        scale: 0.3,
        transition: { type: "spring", stiffness: 300, damping: 30 },
      },
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
                  : "group-hover:animate-brand-once",
              )}
            />
          </div>
        </Link>
      </motion.div>
    );
  }

  return (
    <header className="fixed z-[9999] w-screen">
      <div className="border-border text-foreground bg-background/60 m-2 flex h-8 items-center justify-between rounded-md border px-4 py-1.5 backdrop-blur-xl">
        <div className="flex items-center md:gap-8">
          <Link
            href="/"
            className="font-title relative text-xs font-extrabold outline-0 focus-visible:ring-ring/50 focus-visible:ring-[3px] rounded-md p-1"
          >
            <span className="hidden md:inline">Hypershelf</span>
            <span className="inline md:hidden">H</span>
            <div
              className={cn(
                "bg-brand md:!bg-brand absolute bottom-1 left-1 h-0.5 w-4",
                {
                  "bg-red-500": !isConnected,
                },
              )}
            ></div>
          </Link>
          <div className="hidden items-center gap-1.5 md:flex">
            <div
              className={cn("h-1.5 w-1.5 rounded-full", {
                "bg-green-500": isConnected,
                "bg-red-500": !isConnected,
              })}
            ></div>
            <div className="text-muted-foreground text-xs">
              {isConnected ? "Онлайн" : "Переподключаемся..."}
            </div>
          </div>
        </div>
        {content}
        <nav>
          <div className="flex gap-x-6 text-xs font-medium">
            {pathname !== "/signin" && (
              <>
                <NavLink href="/" label="Хосты">
                  <span className="hidden lg:inline">Хосты</span>
                  <Table2 className="inline size-4 lg:hidden" />
                </NavLink>
                <NavLink href="/fields" label="Поля">
                  <span className="hidden lg:inline">Поля</span>
                  <Settings2 className="inline size-4 lg:hidden" />
                </NavLink>
                <NavLink href="/schemas" label="Схемы">
                  <span className="hidden lg:inline">Схемы</span>
                  <GitBranch className="inline size-4 lg:hidden" />
                </NavLink>
              </>
            )}
            {pathname !== "/signin" &&
              (isAuthenticated ? (
                <>
                  <NavLink href="/signout" label="Выйти">
                    <span className="hidden lg:inline">Выйти</span>
                    <LogOut className="text-destructive inline size-4 lg:hidden" />
                  </NavLink>
                  <div className="text-muted-foreground hidden text-xs md:block p-1">
                    {currentUser?.email ?? "..."}
                  </div>
                </>
              ) : (
                <NavLink href="/signin" label="Войти">
                  <span className="hidden lg:inline">Войти</span>
                  <LogIn className="inline size-4 lg:hidden" />
                </NavLink>
              ))}
          </div>
        </nav>
      </div>
    </header>
  );
}
