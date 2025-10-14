import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { motion } from "framer-motion";
import { CircleFadingArrowUp } from "lucide-react";

import { api } from "@hypershelf/convex/_generated/api";
import { Button } from "@hypershelf/ui/primitives/button";

import { env } from "~/env";

export function UpdateNotifier() {
  const currentVersion = env.NEXT_PUBLIC_VERSION;
  const version = useQuery(api.system.getVersion);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    if (version && currentVersion) {
      const parseSemver = (versionStr: string) => {
        const [main, modifier] = versionStr.split("-");
        if (!main) return null;
        const [major, minor, patch] = main.split(".").map(Number);
        if (major === undefined || minor === undefined || patch === undefined)
          return null;
        return { major, minor, patch, modifier };
      };

      const serverVersion = parseSemver(version.version);
      const clientVersion = parseSemver(currentVersion);

      if (!serverVersion || !clientVersion) return;

      if (serverVersion.major > clientVersion.major) {
        setUpdateAvailable(true);
        return;
      }
      if (serverVersion.major < clientVersion.major) {
        return;
      }

      if (serverVersion.minor > clientVersion.minor) {
        setUpdateAvailable(true);
        return;
      }
      if (serverVersion.minor < clientVersion.minor) {
        return;
      }

      if (serverVersion.patch > clientVersion.patch) {
        setUpdateAvailable(true);
        return;
      }
      if (serverVersion.patch < clientVersion.patch) {
        return;
      }

      if (!serverVersion.modifier && clientVersion.modifier) {
        setUpdateAvailable(true);
      }
    }
  }, [currentVersion, version]);

  if (!updateAvailable) return null;
  return (
    <motion.div
      className="right-0 bottom-0 p-4 backdrop-blur-lg md:right-4 md:bottom-4 md:w-auto md:rounded-xl pointer-events-none fixed z-50 w-full bg-background/50 text-foreground shadow-[0_0_0.5rem_var(--color-brand)] shadow-brand"
      initial={{ opacity: 0, y: -10, scale: 0.7 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", bounce: 0.5 }}
    >
      <div className="flex items-center justify-between">
        <div className="gap-2 text-sm font-bold flex items-center">
          <CircleFadingArrowUp className="size-4" />
          Доступно обновление
        </div>
        <Button
          size="sm"
          className="py-0.5 text-sm pointer-events-auto h-auto w-fit"
          onClick={() => window.location.reload()}
        >
          Обновить
        </Button>
      </div>
      <div className="mt-2 text-xs text-secondary-fg">
        Обнови страницу, чтобы применить последнее обновление Hypershelf.
      </div>
    </motion.div>
  );
}
