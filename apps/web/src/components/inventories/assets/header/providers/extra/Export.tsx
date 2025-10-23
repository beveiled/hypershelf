import { useState } from "react";
import { LoaderCircle, Table2 } from "lucide-react";

import type { Id } from "@hypershelf/convex/_generated/dataModel";
import { useHypershelf } from "@hypershelf/lib/stores";
import { Button } from "@hypershelf/ui/primitives/button";
import { toast } from "@hypershelf/ui/toast";

import { buildXlsx } from "~/lib/exporter";

export function Export() {
  const [downloading, setDownloading] = useState(false);

  const download = async () => {
    setDownloading(true);
    try {
      const assets = Object.values(useHypershelf.getState().assets);
      const fields = Object.values(useHypershelf.getState().fields).filter(
        (f) => !f.field.hidden,
      );
      const users = useHypershelf.getState().users;

      const buffer = await buildXlsx(
        [...fields.map((f) => f.field.name)],
        assets.map((asset) => [
          ...fields.map((f) => {
            if (f.field.type === "markdown")
              return "Маркдаун не поддерживается";
            const value = asset.asset.metadata?.[f.field._id];
            if (!value) return "";
            if (Array.isArray(value)) return value.join(", ");
            if (f.field.type === "boolean") return value ? "✅" : "❌";
            if (f.field.type === "user" && typeof value === "string")
              return users[value as Id<"users">] ?? "Неизвестный пользователь";
            return String(value);
          }),
        ]),
      );

      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `hypershelf-export-${new Date().toISOString().slice(0, 10)}-${new Date().getHours().toString().padStart(2, "0")}-${new Date().getMinutes().toString().padStart(2, "0")}-${new Date().getSeconds().toString().padStart(2, "0")}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Failed to export XLSX", e);
      toast.error("Не смогли экспортировать XLSX!");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Button size="sm" variant="ghost" onClick={download} disabled={downloading}>
      {downloading ? (
        <LoaderCircle className="animate-spin opacity-50" />
      ) : (
        <Table2 className="opacity-50" />
      )}
      Экспортировать .xlsx
    </Button>
  );
}
