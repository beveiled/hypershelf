"use client";

import { Footer } from "@/components/Footer";
import Header from "@/components/Header";
import { UpdateNotifier } from "@/components/UpdateNotifier";
import { Button } from "@/components/ui/button";
import { HeaderContentProvider } from "@/components/util/HeaderContext";
import { LoadingProvider } from "@/components/util/LoadingContext";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { ExtendedFieldType } from "@/convex/schema";
import { useBrowser } from "@/lib/hooks/useBrowser";
import { cn } from "@/lib/utils";
import { useHypershelf } from "@/stores";
import { TRPCReactProvider } from "@/trpc/react";
import { useQuery } from "convex/react";
import { Annoyed } from "lucide-react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [insecure, setInsecure] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    fetch(process.env.NEXT_PUBLIC_CONVEX_URL!).catch(
      e => "Failed to fetch" === e.message && setInsecure(true),
    );
    const isLocal = ["localhost", "127.0.0.1"].includes(
      window.location.hostname,
    );
    if (
      !isLocal &&
      (window.location.protocol !== "https:" || !window.isSecureContext)
    ) {
      setInsecure(true);
    }
  }, []);

  const { viewer: unstableViewer } = useQuery(api.users.me) ?? {};
  const { fields: unstableFields } = useQuery(api.fields.get, {}) ?? {};
  const { assets: unstableAssets } = useQuery(api.assets.get, {}) ?? {};

  const setViewer = useHypershelf(state => state.setViewer);
  const setFields = useHypershelf(state => state.setFields);
  const setAssets = useHypershelf(state => state.setAssets);

  useEffect(() => {
    if (unstableViewer) setViewer(unstableViewer);
  }, [unstableViewer, setViewer]);

  useEffect(() => {
    if (unstableFields) {
      const newFields: Record<Id<"fields">, ExtendedFieldType> = {};
      unstableFields.forEach(field => (newFields[field.field._id] = field));
      setFields(newFields);
    }
  }, [unstableFields, setFields]);

  useEffect(() => {
    if (unstableAssets) {
      const newAssets: Record<Id<"assets">, (typeof unstableAssets)[0]> = {};
      unstableAssets.forEach(asset => (newAssets[asset.asset._id] = asset));
      setAssets(newAssets);
    }
  }, [unstableAssets, setAssets]);

  const browser = useBrowser();
  const [ignore, setIgnore] = useState(false);

  const hasIgnored = useMemo(() => {
    if (typeof window === "undefined") return undefined;
    return localStorage.getItem("ignoreFirefoxWarning") === "1";
  }, []);

  if (browser === "trident") {
    return (
      <div className="bg-background fixed top-0 right-0 bottom-0 left-0 m-auto flex h-fit w-md flex-col gap-4 rounded-md px-6 py-4 text-center shadow-[0_0_1rem_oklch(80%_0.188_70.08)]">
        <Image
          src="/images/trident-warning.png"
          alt="Галина"
          width={150}
          height={150}
          className="mx-auto"
        />
        <h1 className="text-2xl font-bold">Запахло ностальгией...</h1>
        <p className="text-secondary-fg text-sm">
          Hypershelf не поддерживает Internet Explorer.
          <br />
          Скачай Chrome.
          <br />
          Не надо брать пример с Галины!
        </p>
      </div>
    );
  }

  if (
    browser === "gecko" &&
    !ignore &&
    hasIgnored !== undefined &&
    !hasIgnored
  ) {
    return (
      <div className="bg-background fixed top-0 right-0 bottom-0 left-0 m-auto flex h-fit w-md flex-col gap-4 rounded-md px-6 py-4 text-center shadow-[0_0_1rem_oklch(80%_0.188_70.08)]">
        <Image
          src="/images/gecko-warning.png"
          alt="Галина"
          width={150}
          height={150}
          className="mx-auto"
        />
        <h1 className="text-2xl font-bold">Огненные лисы!</h1>
        <p className="text-secondary-fg text-sm">
          Hypershelf ломается на многих сборках Firefox.
          <br />
          Пожалуйста, используй Chrome.
          <br />
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setIgnore(true);
              localStorage.setItem("ignoreFirefoxWarning", "1");
            }}
            className="mt-4"
          >
            <Annoyed />
            Мне все равно
          </Button>
        </p>
      </div>
    );
  }

  return (
    <TRPCReactProvider>
      <HeaderContentProvider>
        <LoadingProvider>
          <Header />
          {insecure ? (
            <div className="bg-background fixed top-0 right-0 bottom-0 left-0 m-auto flex h-fit w-md flex-col gap-4 rounded-md px-6 py-4 text-center shadow-[0_0_1rem_oklch(80%_0.188_70.08)]">
              <Image
                src="/images/ssl-warning.png"
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
                  "px-2 min-h-screen",
                  pathname.startsWith("/integrations") ? "py-8" : "pt-12",
                )}
              >
                {children}
              </main>
              {!pathname.startsWith("/integrations") && pathname !== "/" && (
                <Footer />
              )}
              <UpdateNotifier />
            </>
          )}
        </LoadingProvider>
      </HeaderContentProvider>
    </TRPCReactProvider>
  );
}
