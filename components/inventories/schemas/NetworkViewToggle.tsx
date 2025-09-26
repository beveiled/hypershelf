import { IconButton } from "@/components/ui/button";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import { cn, shallowPositional } from "@/lib/utils";
import { useHypershelf } from "@/stores";
import { api } from "@/trpc/react";
import { motion } from "framer-motion";
import { Loader2, Network, UploadCloud } from "lucide-react";
import { ChangeEvent, DragEvent, useCallback, useRef, useState } from "react";
import { useStoreWithEqualityFn } from "zustand/traditional";

function JsonUploader({ onUploaded }: { onUploaded: () => void }) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const uploadNetworkTopology = api.vsphere.uploadNetworkTopology.useMutation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File | null) => {
      if (file && file.type === "application/json") {
        const reader = new FileReader();
        reader.onload = e => {
          const content = e.target?.result;
          if (typeof content === "string") {
            setIsLoading(true);
            uploadNetworkTopology.mutate(
              { data: content },
              {
                onSuccess: () => {
                  onUploaded();
                },
                onError: error => {
                  console.error("Failed to upload network topology:", error);
                },
                onSettled: () => {
                  setIsLoading(false);
                },
              },
            );
          }
        };
        reader.readAsText(file);
      } else if (file) {
        console.error("Invalid file type. Please upload a JSON file.");
      }
    },
    [uploadNetworkTopology, onUploaded],
  );

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFile(e.dataTransfer.files[0]);
      }
    },
    [handleFile],
  );

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <motion.div
      className={cn(
        "relative flex flex-col items-center justify-center p-4 rounded-lg cursor-pointer transition-colors group",
        isDragging ? "bg-muted text-primary" : "text-border",
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", bounce: 0.3, duration: 0.3 }}
    >
      <svg
        className="absolute inset-0 w-full h-full rounded-lg pointer-events-none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          x="2"
          y="2"
          width="calc(100% - 4px)"
          height="calc(100% - 4px)"
          rx="12"
          ry="12"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeDasharray="8 8"
          className="group-hover:animate-dash"
        />
      </svg>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        onChange={handleFileChange}
        className="hidden"
      />

      {isLoading ? (
        <Loader2 className="size-8 mb-2 text-muted-foreground animate-spin" />
      ) : (
        <UploadCloud className="size-8 mb-2 text-muted-foreground" />
      )}
      <p className="text-sm text-muted-foreground text-center">
        Drop JSON file here or click to upload
      </p>
    </motion.div>
  );
}

export function NetworkViewToggle() {
  const toggleVmNodeNetworkTopologyView = useHypershelf(
    state => state.toggleVmNodeNetworkTopologyView,
  );
  const vmIds = useStoreWithEqualityFn(
    useHypershelf,
    state => state.vms.map(v => v.id),
    shallowPositional,
  );
  const linksAvailable = useHypershelf(state => state.links.length > 0);
  const networkView = useHypershelf(
    state =>
      Object.keys(state.selectedVmNodesNetworkTopologyView).length > 0 &&
      state.links.length > 0,
  );

  const [isPopoverOpen, setPopoverOpen] = useState(false);

  const utils = api.useUtils();

  const handleClick = useCallback(() => {
    if (!linksAvailable) return;
    vmIds.forEach(id => toggleVmNodeNetworkTopologyView(id, !networkView));
  }, [vmIds, toggleVmNodeNetworkTopologyView, networkView, linksAvailable]);
  const onUploaded = useCallback(() => {
    void utils.vsphere.fetchNetworkTopology.refetch();
    vmIds.forEach(id => toggleVmNodeNetworkTopologyView(id, true));
    setPopoverOpen(false);
  }, [vmIds, toggleVmNodeNetworkTopologyView, utils]);
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setPopoverOpen(true);
  }, []);

  return (
    <div className="flex">
      <Popover open={isPopoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverAnchor asChild>
          <IconButton
            selected={networkView}
            onClick={handleClick}
            onContextMenu={handleContextMenu}
            {...(!linksAvailable && { whileTap: {} })}
          >
            <Network
              className={cn(
                "size-4",
                networkView && "text-[#55f]",
                !linksAvailable && "text-muted-foreground",
              )}
            />
          </IconButton>
        </PopoverAnchor>
        <PopoverContent className="w-60">
          <JsonUploader onUploaded={onUploaded} />
        </PopoverContent>
      </Popover>
    </div>
  );
}
