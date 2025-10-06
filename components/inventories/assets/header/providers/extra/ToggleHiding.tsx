import { Button } from "@/components/ui/button";
import { useHypershelf } from "@/stores";
import { Eye, EyeOff } from "lucide-react";

export function ToggleHiding() {
  const hiding = useHypershelf(state => state.hiding);
  const toggleHiding = useHypershelf(state => state.toggleHiding);

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
