"use node";

import { FolderRecord } from "./types";
import { elementsByLocalName, firstChildByLocalName, text } from "./utils";
import { DOMParser } from "@xmldom/xmldom";

export function parseFolders(pages: readonly string[]): FolderRecord {
  const folders: FolderRecord = {};
  for (const xml of pages) {
    const d = new DOMParser().parseFromString(xml, "text/xml");
    const objs = elementsByLocalName(d, "objects");
    for (const obj of objs) {
      const objEl = firstChildByLocalName(obj, "obj");
      if (!objEl) continue;
      const typeAttr = objEl.getAttribute("type") || "Unknown";
      if (typeAttr !== "Folder") continue;
      const moid = text(objEl).trim();
      const propSets = elementsByLocalName(obj, "propSet");
      let name: string | undefined;
      let children: string[] = [];
      for (const ps of propSets) {
        const nameEl = firstChildByLocalName(ps, "name");
        if (!nameEl) continue;
        const pname = text(nameEl).trim();
        const valEl = firstChildByLocalName(ps, "val");
        if (pname === "name") {
          if (valEl) name = text(valEl).trim();
        } else if (pname === "childEntity") {
          if (valEl) {
            const mos = elementsByLocalName(valEl, "ManagedObjectReference")
              .map(e => text(e).trim())
              .filter(Boolean);
            children = children.concat(mos);
          }
        }
      }
      const fName = name ?? moid;
      folders[moid] = { moid, name: fName, children };
    }
  }
  return folders;
}
