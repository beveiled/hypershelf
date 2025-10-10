import { Eye, EyeOff } from "lucide-react";

import { useHypershelf } from "@hypershelf/lib/stores";
import { Button } from "@hypershelf/ui/primitives/button";

export function ToggleHiding() {
  const hiding = useHypershelf((state) => state.hiding);
  const toggleHiding = useHypershelf((state) => state.toggleHiding);

  return (
    <Button size="sm" variant="ghost" onClick={toggleHiding}>
      {hiding ? (
        <>
          <Eye />
          Показать скрытые поля
        </>
      ) : (
        <>
          <EyeOff />
          Не показывать скрытые поля
        </>
      )}
    </Button>
  );
}
