import { FolderPicker } from "./FolderPicker";
import { NetworkViewToggle } from "./NetworkViewToggle";

export function Overlay() {
  return (
    <div className="absolute top-0 right-2 mt-12 bg-black/10 rounded-md p-2 backdrop-blur-lg z-50 border border-border flex items-center gap-2">
      <NetworkViewToggle />
      <FolderPicker />
    </div>
  );
}
