"use client";

import { useState } from "react";
import Image from "next/image";
import { SiGithub, SiTelegram } from "@icons-pack/react-simple-icons";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

import { Button } from "@hypershelf/ui/primitives/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@hypershelf/ui/primitives/dialog";

import { env } from "~/env";

export function Footer() {
  const [showInstallGuide, setShowInstallGuide] = useState(false);

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = "/plugins/hypershelf-vsphere.zip";
    link.download = "hypershelf-vsphere.zip";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowInstallGuide(true);
  };

  return (
    <footer className="p-2 w-full">
      <div className="gap-1 px-8 py-4 text-sm backdrop-blur-xl flex flex-col rounded-md border border-border bg-background/60">
        <div className="flex items-center justify-between">
          <div className="gap-4 flex items-center">
            <div className="gap-2 flex items-center">
              <a
                href="https://github.com/beveiled/hypershelf"
                target="_blank"
                rel="noopener noreferrer"
              >
                <SiGithub className="size-4 text-foreground" />
              </a>
              <a
                href="https://t.me/dgazizullin"
                target="_blank"
                rel="noopener noreferrer"
              >
                <SiTelegram className="size-4 rounded-full bg-foreground text-[#26A5E4]" />
              </a>
            </div>
            <div className="gap-2 flex items-center">
              <div className="text-xs font-extrabold relative font-title text-foreground">
                Hypershelf
                <div className="bottom-0 left-0 h-0.5 w-4 absolute bg-brand" />
              </div>
              <span className="text-xs text-muted-foreground">
                v{env.NEXT_PUBLIC_VERSION}
              </span>
            </div>
          </div>

          <Button
            variant="secondary"
            size="sm"
            className="md:flex hidden"
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
        <p className="mt-2 text-xs w-full text-muted-foreground">
          Распространяется под лицензией{" "}
          <a
            href="https://www.gnu.org/licenses/agpl-3.0.en.html"
            className="underline hover:text-primary"
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
