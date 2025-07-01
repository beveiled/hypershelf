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

import { renderField } from "@/components/inventories/assets/AssetsInventory";
import { useLoading } from "@/components/util/LoadingContext";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { motion } from "framer-motion";
import { CloudOff, Fingerprint, Loader2, ShieldAlert } from "lucide-react";
import { DynamicIcon, IconName } from "lucide-react/dynamic";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export default function VSphereIntegrationPage() {
  const searchParams = useSearchParams();
  const dns = searchParams.get("dns");

  const assets = useQuery(api.assets.getAll);
  const fields = useQuery(api.fields.getAll);
  const users = useQuery(api.users.getAll);

  const [isPermissionDenied, setIsPermissionDenied] = useState(false);
  const [authRequestSent, setAuthRequestSent] = useState(false);
  const [isRequestingAccess, setIsRequestingAccess] = useState(false);

  const { setIsLoading } = useLoading();

  const fieldMappings = useMemo(() => {
    if (!fields) return { hostname: null, ip: null } as const;
    const hostnameField = fields.fields.find(f => f.field.slug === "hostname");
    const ipField = fields.fields.find(f => f.field.slug === "ip");
    return {
      hostname: hostnameField ? hostnameField.field._id : null,
      ip: ipField ? ipField.field._id : null
    } as const;
  }, [fields]);

  const asset = useMemo(() => {
    if (!assets) return null;
    return assets.assets.find(a => {
      if (!a.asset.metadata || !fieldMappings.hostname || !fieldMappings.ip)
        return false;
      return a.asset.metadata[fieldMappings.hostname] === dns;
    });
  }, [assets, dns, fieldMappings]);

  useEffect(() => {
    window.parent.postMessage(
      {
        type: "HYPERSHELF",
        action: "UPDATE_HEIGHT",
        data: {
          height: asset ? 250 : 100
        }
      },
      "*"
    );

    if (asset) {
      window.parent.postMessage(
        {
          type: "HYPERSHELF",
          action: "ASSET_FOUND",
          data: {
            href: `/#${asset.asset._id}`
          }
        },
        "*"
      );
    }
  }, [asset]);

  const isLoading = !assets || !fields || !users;

  useEffect(() => {
    setIsLoading(isLoading);
  }, [isLoading, setIsLoading]);

  const requestAccess = async () => {
    setIsRequestingAccess(true);
    try {
      await document.requestStorageAccess();
      setIsLoading(true);
      const url = new URL(window.location.href);
      url.searchParams.set("storageAccess", "true");
      window.location.href = url.toString();
    } catch {
      setIsPermissionDenied(true);
    }
  };

  if ((assets && !assets.viewer) || (fields && !fields.viewer)) {
    if (searchParams.get("storageAccess") === "true") {
      if (!authRequestSent) {
        window.parent.postMessage(
          {
            type: "HYPERSHELF",
            action: "AUTH"
          },
          "*"
        );
        setAuthRequestSent(true);
      }
      return (
        <div className="mt-2 flex h-full w-full items-center justify-center gap-2 font-bold text-red-500">
          <ShieldAlert className="h-5 w-5" />
          Authenticate in popup and reload the page
        </div>
      );
    }

    return (
      <div className="text-muted-foreground -mt-4 flex h-full w-full flex-col items-center justify-center text-xs font-semibold">
        <motion.button
          className="text-muted-foreground flex cursor-pointer items-center gap-2 rounded-md px-3 py-1.5 text-xs font-semibold"
          onClick={requestAccess}
          whileHover={{ scale: 1.05, rotate: 3, color: "#fff" }}
          whileTap={{ scale: 0.95, rotate: 4, color: "oklch(65% 0.005 130)" }}
          transition={{ type: "spring", stiffness: 500, damping: 35 }}
        >
          {isRequestingAccess ? (
            <Loader2 className="size-10" />
          ) : (
            <Fingerprint className="size-10" />
          )}
        </motion.button>
        Click the button to authenticate
      </div>
    );
  }

  if (isPermissionDenied) {
    return (
      <div className="mt-2 flex h-full w-full items-center justify-center gap-2 font-bold text-red-500">
        <ShieldAlert className="h-5 w-5" />
        You must give permission to access your assets
      </div>
    );
  }

  return (
    <>
      {!isLoading && (!fieldMappings.hostname || !fieldMappings.ip) && (
        <div className="mt-2 flex h-full w-full items-center justify-center gap-2 font-bold text-red-500">
          <ShieldAlert className="h-5 w-5" />
          Hypershelf schema is invalid
        </div>
      )}

      {!isLoading && fieldMappings.hostname && fieldMappings.ip && !asset && (
        <div className="text-muted-foreground mt-2 flex h-full w-full items-center justify-center gap-2 font-bold">
          <CloudOff className="h-5 w-5" />
          This asset is not in the inventory
        </div>
      )}

      {!isLoading && asset && (
        <div className="grid grid-cols-1 gap-1 text-xs sm:grid-cols-2">
          {fields!.fields.map(({ field }) => {
            if (!asset.asset.metadata || field.hidden) return null;
            return (
              <div
                key={field._id}
                className="bg-secondary border-border flex items-center gap-2 rounded-md border px-2 py-1"
              >
                <DynamicIcon
                  name={(field.extra?.icon || "circle") as IconName}
                  className="h-4 w-4"
                />
                <strong>{field.name}:</strong>{" "}
                {renderField(
                  field,
                  (
                    asset.asset.metadata as NonNullable<
                      typeof asset.asset.metadata
                    >
                  )[field._id],
                  users.users!,
                  // TODO: Markdown preview
                  () => {},
                  "size-4"
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
