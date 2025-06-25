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

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { SiGithub, SiTelegram } from "@icons-pack/react-simple-icons";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import Image from "next/image";
import { useState } from "react";

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
    <footer className="w-full p-2">
      <div className="border-border flex flex-col gap-1 rounded-md border bg-black/40 px-8 py-4 text-sm backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <a
              href="https://github.com/hikariatama/hypershelf"
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
            vSphere Plugin
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
                  vSphere Plugin Installation Guide
                </DialogTitle>
                <VisuallyHidden>
                  <DialogDescription>
                    Follow these steps to install the Hypershelf vSphere plugin
                  </DialogDescription>
                </VisuallyHidden>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Step 1: Extract the ZIP file</h4>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">
                    Step 2: Open <code>chrome://extensions</code>
                  </h4>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Step 3: Enable Developer Mode</h4>
                  <p className="text-muted-foreground">
                    Toggle the &quot;Developer mode&quot; switch in the top
                    right corner.
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">
                    Step 4: Load the unpacked extension
                  </h4>
                  <p className="text-muted-foreground">
                    Click the &quot;Load unpacked&quot; button and select the
                    extracted folder containing the 3 plugin files.
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button onClick={() => setShowInstallGuide(false)}>
                  Got it, thanks!
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        <p className="text-muted-foreground mt-2 w-full text-xs">
          © Daniil Gazizullin {new Date().getFullYear()} &middot; Released
          under the{" "}
          <a
            href="https://www.gnu.org/licenses/agpl-3.0.en.html"
            className="hover:text-primary underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            GNU Affero General Public License v3.0
          </a>
          .
        </p>
      </div>
    </footer>
  );
}
