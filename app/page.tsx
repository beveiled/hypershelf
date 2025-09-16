"use client";

import { AssetsInventory } from "@/components/inventories/assets/AssetsInventory";

export default function Content() {
  return (
    <div className="flex flex-col gap-4">
      <AssetsInventory />
    </div>
  );
}
