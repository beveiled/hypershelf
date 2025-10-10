"use client";

import { FolderPicker } from "./FolderPicker";
import { LinksList } from "./LinksList";
import { NetworkViewToggle } from "./NetworkViewToggle";

export function Overlay() {
  return (
    <div className="top-0 right-2 mt-12 gap-1.5 absolute z-50 flex flex-col items-end">
      <div className="gap-1 bg-black/10 p-1 backdrop-blur-lg flex items-center rounded-md border border-border">
        <NetworkViewToggle />
        <FolderPicker />
      </div>
      <LinksList />
    </div>
  );
}
