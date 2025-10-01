"use node";

import { DEVICE_MAPPING } from "./consts";
import { Device, Folder, Inventory, Vm } from "./types";
import { elementsByLocalName, firstChildByLocalName, text } from "./utils";
import { DOMParser } from "@xmldom/xmldom";

export function parseInventory(pages: readonly string[]): Inventory {
  const folders: Record<string, Folder> = {};
  const vms: Record<string, Vm> = {};
  let serverUuid: string | null = null;
  for (const xml of pages) {
    const d = new DOMParser().parseFromString(xml, "text/xml");
    const objs = elementsByLocalName(d, "objects");
    for (const obj of objs) {
      const objEl = firstChildByLocalName(obj, "obj");
      if (!objEl) continue;
      const typeAttr = objEl.getAttribute("type");
      const mtype = typeAttr && typeAttr.length > 0 ? typeAttr : "Unknown";
      const moid = text(objEl).trim();
      const propSets = elementsByLocalName(obj, "propSet");
      let name: string | undefined;
      let children: string[] = [];
      const otherProps: Record<string, string> = {};
      const devices: Device[] = [];
      for (const ps of propSets) {
        const nameEl = firstChildByLocalName(ps, "name");
        if (!nameEl) continue;
        const pname = text(nameEl).trim();
        const valEl = firstChildByLocalName(ps, "val");
        if (pname === "childEntity" || pname === "vmFolder") {
          if (valEl) {
            const mos = elementsByLocalName(valEl, "ManagedObjectReference")
              .map(e => text(e).trim())
              .filter(s => s.length > 0);
            children = children.concat(mos);
          }
        } else if (pname === "name") {
          if (valEl) name = text(valEl).trim();
        } else if (pname === "summary.guest.ipAddress") {
          if (valEl) otherProps["ip"] = text(valEl).trim();
        } else if (pname === "config.hardware.memoryMB") {
          if (valEl) otherProps["ramMB"] = text(valEl).trim();
        } else if (pname === "config.hardware.numCPU") {
          if (valEl) otherProps["cpu"] = text(valEl).trim();
        } else if (pname === "runtime.powerState") {
          if (valEl) otherProps["powerState"] = text(valEl).trim();
        } else if (pname === "guest.guestFullName") {
          if (valEl) otherProps["guestFullName"] = text(valEl).trim();
        } else if (pname === "config.hardware.device") {
          if (valEl) {
            const devs = elementsByLocalName(valEl, "VirtualDevice");
            for (const dev of devs) {
              const deviceType = dev.getAttribute("xsi:type");
              if (!deviceType) continue;
              const mapping = DEVICE_MAPPING[deviceType];
              if (!mapping) continue;
              const props: { label: string; value: string }[] = [];
              for (const [k, vfn] of Object.entries(mapping.props)) {
                const propEl = firstChildByLocalName(dev, k);
                if (propEl) {
                  const v = text(propEl).trim();
                  const prop = vfn(v);
                  if (prop) props.push(prop);
                }
              }
              devices.push({ icon: mapping.icon, label: mapping.label, props });
            }
          }
        } else if (pname === "content.about.instanceUuid") {
          serverUuid = valEl ? text(valEl).trim() : null;
        }
      }
      if (mtype === "Folder") {
        const fName = name ?? moid;
        folders[moid] = { moid, name: fName, children };
      } else if (mtype === "VirtualMachine") {
        const vmName = name ?? moid;
        vms[moid] = {
          moid,
          name: vmName,
          ip: otherProps["ip"] ?? "",
          cpu: parseInt(otherProps["cpu"] ?? "0", 10),
          ramMB: parseInt(otherProps["ramMB"] ?? "0", 10),
          powerState:
            otherProps["powerState"] === "poweredOn" ||
            otherProps["powerState"] === "poweredOff" ||
            otherProps["powerState"] === "suspended"
              ? (otherProps["powerState"] as
                  | "poweredOn"
                  | "poweredOff"
                  | "suspended")
              : "poweredOff",
          guestFullName: otherProps["guestFullName"] ?? "",
          devices,
        };
      }
    }
  }
  return { folders, vms, serverUuid };
}
