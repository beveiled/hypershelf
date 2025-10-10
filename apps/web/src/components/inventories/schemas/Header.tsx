import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { RefreshCcw } from "lucide-react";

import { useHypershelf } from "@hypershelf/lib/stores";
import { IconButton } from "@hypershelf/ui/primitives/button";

export function Header() {
  const [fetchTimeRelative, setFetchTimeRelative] =
    useState<string>("когда-то");
  const fetchTimeAbsolute = useHypershelf((state) => state.topologyFetchTime);
  const [outdated, setOutdated] = useState(false);

  useEffect(() => {
    if (!fetchTimeAbsolute) {
      setFetchTimeRelative("никогда");
      return;
    }
    const updateRelativeTime = () => {
      setFetchTimeRelative(
        formatDistanceToNow(new Date(fetchTimeAbsolute), {
          addSuffix: true,
          locale: ru,
        }),
      );

      if (
        new Date().getTime() - new Date(fetchTimeAbsolute).getTime() >
        10 * 60 * 1000
      ) {
        setOutdated(true);
      } else {
        setOutdated(false);
      }
    };
    updateRelativeTime();
    const interval = setInterval(updateRelativeTime, 3 * 1000);
    return () => clearInterval(interval);
  }, [fetchTimeAbsolute]);

  if (!fetchTimeAbsolute) return null;

  return (
    <div className="gap-1.5 text-xs flex items-center text-muted-foreground">
      <div>Было актуально {fetchTimeRelative}</div>
      {outdated && (
        <IconButton
          selected={false}
          onClick={() => {
            window.location.reload();
          }}
        >
          <RefreshCcw className="size-3.5" />
        </IconButton>
      )}
    </div>
  );
}
