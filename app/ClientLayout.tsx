/*
https://github.com/beveiled/hypershelf
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

import Header from "@/components/Header";
import { HeaderContentProvider } from "@/components/util/HeaderContext";
import { LoadingProvider } from "@/components/util/LoadingContext";
import { LogProvider } from "@/components/util/Log";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { Footer } from "@/components/Footer";
import { UpdateNotifier } from "@/components/UpdateNotifier";
import { useEffect, useState } from "react";
import Image from "next/image";

export default function ClientLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [insecure, setInsecure] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    fetch(process.env.NEXT_PUBLIC_CONVEX_URL!).catch(
      e => "Failed to fetch" === e.message && setInsecure(true)
    );
    const isLocal = ["localhost", "127.0.0.1"].includes(
      window.location.hostname
    );
    if (
      !isLocal &&
      (window.location.protocol !== "https:" || !window.isSecureContext)
    ) {
      setInsecure(true);
    }
  }, []);

  return (
    <LogProvider>
      <HeaderContentProvider>
        <LoadingProvider>
          <Header />
          {insecure ? (
            <div className="bg-background fixed top-0 right-0 bottom-0 left-0 m-auto flex h-fit w-md flex-col gap-4 rounded-md px-6 py-4 text-center shadow-[0_0_1rem_oklch(80%_0.188_70.08)]">
              <Image
                src="/images/http.png"
                alt="Галина"
                width={150}
                height={150}
                className="mx-auto"
              />
              <h1 className="text-2xl font-bold">Небезопасное подключение</h1>
              <p className="text-secondary-fg text-sm">
                Приложение не будет работать.
                <br />
                Установи SSL-сертификат и перезагрузи страницу.
              </p>
            </div>
          ) : (
            <>
              <main
                className={cn(
                  "px-2",
                  pathname.startsWith("/integrations") ? "py-8" : "pt-12"
                )}
              >
                {children}
              </main>
              {!pathname.startsWith("/integrations") && <Footer />}
              <UpdateNotifier />
            </>
          )}
        </LoadingProvider>
      </HeaderContentProvider>
    </LogProvider>
  );
}
