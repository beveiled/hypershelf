"use node";

import { DOMParser } from "@xmldom/xmldom";

import type { getClient } from "../../redis";
import type {
  FolderTree,
  NetworkTopology,
  Router,
  VM,
  VMTopology,
} from "./types";
import { env } from "../../env";
import { parseFolders } from "./parseFolders";
import { parseInventory } from "./parseInventory";
import { SoapClient } from "./SoapClient";
import { elementsByLocalName, firstChildByLocalName, text } from "./utils";

export async function fetchTopology(
  rootMoid: string,
  redis: ReturnType<typeof getClient> | null = null,
): Promise<{
  routers: Router[];
  vms: VM[];
}> {
  const client = new SoapClient({
    url: `https://${env.VSPHERE_HOSTNAME}/sdk`,
    username: env.VSPHERE_LOGIN,
    password: env.VSPHERE_PASSWORD,
    redis,
  });
  const pages = await client.retrieveAll("Folder", rootMoid);
  const inv = parseInventory(pages);
  const routers: Router[] = [];
  const vms: VM[] = [];
  for (const f of Object.values(inv.folders)) {
    const parent = Object.values(inv.folders).find((ff) =>
      ff.children.includes(f.moid),
    );
    routers.push({
      id: f.moid,
      name: f.name,
      parent: parent ? parent.moid : null,
    });
  }
  for (const v of Object.values(inv.vms)) {
    const parent = Object.values(inv.folders).find((f) =>
      f.children.includes(v.moid),
    );
    vms.push({
      id: v.moid,
      hostname: v.name,
      ip: v.ip,
      cpu: v.cpu,
      ram: Math.round(v.ramMB / 1024),
      power: v.powerState === "poweredOn",
      parent: parent ? parent.moid : "",
      os: v.guestFullName,
      devices: v.devices,
      vsphereUrl: inv.serverUuid
        ? `https://${env.VSPHERE_HOSTNAME}/ui/app/vm;nav=v/urn:vmomi:VirtualMachine:${v.moid}:${inv.serverUuid}/summary`
        : undefined,
    });
  }
  return { routers, vms };
}

export async function fetchTopologyStructure(
  rootMoid: string,
  redis: ReturnType<typeof getClient> | null = null,
): Promise<FolderTree> {
  const client = new SoapClient({
    url: `https://${env.VSPHERE_HOSTNAME}/sdk`,
    username: env.VSPHERE_LOGIN,
    password: env.VSPHERE_PASSWORD,
    redis,
  });

  const rootType = rootMoid.startsWith("datacenter-") ? "Datacenter" : "Folder";
  const pages = await client.retrieveFolders(rootType, rootMoid);

  const folders = parseFolders(pages);

  const dcVmFolder = (() => {
    if (!rootMoid.startsWith("datacenter-")) return null;
    for (const xml of pages) {
      const d = new DOMParser().parseFromString(xml, "text/xml");
      const objs = elementsByLocalName(d, "objects");
      for (const obj of objs) {
        const objEl = firstChildByLocalName(obj, "obj");
        if (!objEl) continue;
        const typeAttr = objEl.getAttribute("type") ?? "";
        const moid = text(objEl).trim();
        if (typeAttr !== "Datacenter" || moid !== rootMoid) continue;
        const propSets = elementsByLocalName(obj, "propSet");
        for (const ps of propSets) {
          const nameEl = firstChildByLocalName(ps, "name");
          if (!nameEl || text(nameEl).trim() !== "vmFolder") continue;
          const valEl = firstChildByLocalName(ps, "val");
          if (!valEl) continue;
          const ref = text(valEl).trim();
          if (ref) return ref;
        }
      }
    }
    return null;
  })();

  const startId = dcVmFolder ?? rootMoid;

  const build = (moid: string): FolderTree => {
    const f = folders[moid];
    const name = f ? f.name : moid;
    const children = f
      ? f.children.filter((c) => folders[c]).map((c) => build(c))
      : [];
    return { name, children, id: moid };
  };

  return build(startId);
}

export async function fetchHost(
  args: { hostname?: string | null; ip?: string | null; moid?: string | null },
  redis: ReturnType<typeof getClient> | null = null,
): Promise<{
  moid: string;
  hostname: string;
  ip: string;
  os: string;
} | null> {
  const client = new SoapClient({
    url: `https://${env.VSPHERE_HOSTNAME}/sdk`,
    username: env.VSPHERE_LOGIN,
    password: env.VSPHERE_PASSWORD,
    redis,
  });
  const m = args.moid?.trim() ? args.moid.trim() : null;
  if (m) {
    const resp = await client.retrieveVmCore(m);
    const d = new DOMParser().parseFromString(resp.text, "text/xml");
    const objs = elementsByLocalName(d, "objects");
    for (const obj of objs) {
      const objEl = firstChildByLocalName(obj, "obj");
      if (!objEl) continue;
      const t = objEl.getAttribute("type") ?? "";
      if (t !== "VirtualMachine") continue;
      const moid = text(objEl).trim();
      let hostname = "";
      let ip = "";
      let os = "";
      const propSets = elementsByLocalName(obj, "propSet");
      for (const ps of propSets) {
        const nameEl = firstChildByLocalName(ps, "name");
        if (!nameEl) continue;
        const pname = text(nameEl).trim();
        const valEl = firstChildByLocalName(ps, "val");
        const v = valEl ? text(valEl).trim() : "";
        if (pname === "summary.guest.hostName") hostname = v;
        else if (pname === "summary.guest.ipAddress") ip = v;
        else if (pname === "guest.guestFullName") os = v;
      }
      return { moid, hostname, ip, os };
    }
    return null;
  }

  const ip = args.ip?.trim() ? args.ip.trim() : null;
  const hostname = args.hostname?.trim() ? args.hostname.trim() : null;

  const found = await client.findCandidatesSingle(ip, hostname);
  const pool: { moid: string; score: number }[] = [];
  if (found.ipMoRef) pool.push({ moid: found.ipMoRef, score: 2 });
  if (found.hostMoRef) pool.push({ moid: found.hostMoRef, score: 1 });
  const chosen = pool.sort((a, b) => b.score - a.score).find(Boolean);
  if (!chosen) return null;

  const resp = await client.retrieveVmCore(chosen.moid);
  const d = new DOMParser().parseFromString(resp.text, "text/xml");
  const objs = elementsByLocalName(d, "objects");
  for (const obj of objs) {
    const objEl = firstChildByLocalName(obj, "obj");
    if (!objEl) continue;
    const t = objEl.getAttribute("type") ?? "";
    if (t !== "VirtualMachine") continue;
    const moid = text(objEl).trim();
    let h = "";
    let i = "";
    let os = "";
    const propSets = elementsByLocalName(obj, "propSet");
    for (const ps of propSets) {
      const nameEl = firstChildByLocalName(ps, "name");
      if (!nameEl) continue;
      const pname = text(nameEl).trim();
      const valEl = firstChildByLocalName(ps, "val");
      const v = valEl ? text(valEl).trim() : "";
      if (pname === "summary.guest.hostName") h = v;
      else if (pname === "summary.guest.ipAddress") i = v;
      else if (pname === "guest.guestFullName") os = v;
    }
    return { moid, hostname: h, ip: i, os };
  }
  return null;
}

export type { Router, VM, FolderTree, NetworkTopology, VMTopology };
