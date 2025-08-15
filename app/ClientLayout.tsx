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

import Header from "@/components/Header";
import { HeaderContentProvider } from "@/components/util/HeaderContext";
import { LoadingProvider } from "@/components/util/LoadingContext";
import { LogProvider } from "@/components/util/Log";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { Footer } from "@/components/Footer";
import { UpdateNotifier } from "@/components/UpdateNotifier";

export default function ClientLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <LogProvider>
      <HeaderContentProvider>
        <LoadingProvider>
          <Header />
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
        </LoadingProvider>
      </HeaderContentProvider>
    </LogProvider>
  );
}
