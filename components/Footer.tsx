"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SiGithub, SiTelegram } from "@icons-pack/react-simple-icons";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import Image from "next/image";
import { useEffect, useState } from "react";

export function Footer() {
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const [isShift, setIsShift] = useState(false);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Shift") {
        setIsShift(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Shift") {
        setIsShift(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => setIsInView(window.scrollY >= 10);
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = "/plugins/hypershelf-vsphere.zip";
    link.download = "hypershelf-vsphere.zip";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowInstallGuide(true);
  };

  if (!isInView && !isShift) return null;

  return (
    <footer className="w-full p-2">
      <div className="border-border bg-background/60 flex flex-col gap-1 rounded-md border px-8 py-4 text-sm backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <a
                href="https://github.com/beveiled/hypershelf"
                target="_blank"
                rel="noopener noreferrer"
              >
                <SiGithub className="size-4 text-white" />
              </a>
              <a
                href="https://t.me/dgazizullin"
                target="_blank"
                rel="noopener noreferrer"
              >
                <SiTelegram className="size-4 rounded-full bg-white text-[#26A5E4]" />
              </a>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-foreground font-title relative text-xs font-extrabold">
                Hypershelf
                <div className="bg-brand absolute bottom-0 left-0 h-0.5 w-4" />
              </div>
              <span className="text-muted-foreground text-xs">
                v{process.env.NEXT_PUBLIC_VERSION}{" "}
                {process.env.NEXT_PUBLIC_VERSION_MOD}
              </span>
            </div>
          </div>

          <Button
            variant="secondary"
            size="sm"
            className="hidden md:flex"
            onClick={handleDownload}
          >
            <Image
              src="/images/vsphere.png"
              alt="vSphere Icon"
              width={16}
              height={16}
            />
            Плагин для vSphere
          </Button>

          <Dialog open={showInstallGuide} onOpenChange={setShowInstallGuide}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  <Image
                    src="/images/vsphere.png"
                    alt="vSphere Icon"
                    width={24}
                    height={24}
                    className="mr-2 inline-block"
                  />
                  Гайд по установке плагина
                </DialogTitle>
                <VisuallyHidden>
                  <DialogDescription>
                    Следуй этим шагам, чтобы установить плагин для vSphere
                  </DialogDescription>
                </VisuallyHidden>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Шаг 1: Распакуй ZIP файл</h4>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">
                    Шаг 2: Открой <code>chrome://extensions</code>
                  </h4>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">
                    Шаг 3: Включи режим разработчика
                  </h4>
                  <p className="text-muted-foreground">
                    Включи &quot;Developer mode&quot; переключатель в правом
                    верхнем углу страницы.
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Шаг 4: Загрузи расширение</h4>
                  <p className="text-muted-foreground">
                    Нажми &quot;Загрузить распакованное расширение&quot; и
                    выбери папку с содержимым распакованного ZIP файла (должно
                    быть 3 файла).
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button onClick={() => setShowInstallGuide(false)}>
                  Окей, спасибо!
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        <p className="text-muted-foreground mt-2 w-full text-xs">
          Распространяется под лицензией{" "}
          <a
            href="https://www.gnu.org/licenses/agpl-3.0.en.html"
            className="hover:text-primary underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            GNU AGPL v3.0
          </a>
          .
        </p>
      </div>
    </footer>
  );
}
