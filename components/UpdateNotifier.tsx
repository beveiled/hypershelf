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
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { motion } from "framer-motion";
import { CircleFadingArrowUp } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";

export function UpdateNotifier() {
  const currentVersion = process.env.NEXT_PUBLIC_VERSION;
  const version = useQuery(api.system.getVersion);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    if (version && version.version !== currentVersion) {
      setUpdateAvailable(true);
    }
  }, [currentVersion, version]);

  if (!updateAvailable) return null;
  return (
    <motion.div
      className="bg-background/50 shadow-brand pointer-events-none fixed right-0 bottom-0 z-50 w-full p-4 text-white shadow-[0_0_0.5rem_var(--color-brand)] backdrop-blur-lg md:right-4 md:bottom-4 md:w-auto md:rounded-xl"
      initial={{ opacity: 0, y: -10, scale: 0.7 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", bounce: 0.5 }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-bold">
          <CircleFadingArrowUp className="size-4" />
          Доступно обновление
        </div>
        <Button
          size="sm"
          className="pointer-events-auto h-auto w-fit py-0.5 text-sm"
          onClick={() => window.location.reload()}
        >
          Обновить
        </Button>
      </div>
      <div className="text-secondary-fg mt-2 text-xs">
        Обнови страницу, чтобы применить последнее обновление Hypershelf.
      </div>
    </motion.div>
  );
}
