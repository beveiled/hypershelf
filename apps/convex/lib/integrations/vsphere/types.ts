"use node";

import type { getClient } from "../../redis";

type StrMap<V> = Readonly<Record<string, V>>;
export interface Vm {
  readonly moid: string;
  readonly name: string;
  readonly ip: string;
  readonly cpu: number;
  readonly ramMB: number;
  readonly powerState: "poweredOn" | "poweredOff" | "suspended";
  readonly guestFullName: string;
  readonly devices: Device[];
}
export interface Folder {
  readonly moid: string;
  readonly name: string;
  readonly children: readonly string[];
}
export interface Device {
  readonly icon: string;
  readonly label: string;
  readonly props: { label: string; value: string }[];
}
export interface Inventory {
  readonly folders: StrMap<Folder>;
  readonly vms: StrMap<Vm>;
  readonly serverUuid: string | null;
}
export interface Router {
  id: string;
  name: string;
  parent: string | null;
}
export type VM = {
  id: string;
  hostname: string;
  ip: string | undefined;
  cpu: number;
  ram: number;
  power: boolean;
  parent: string;
  os: string;
  devices: Device[];
  vsphereUrl?: string | undefined;
};
export interface SoapClientConfig {
  readonly url: string;
  readonly username: string;
  readonly password: string;
  readonly redis: ReturnType<typeof getClient> | null;
}
export interface SoapResponse {
  readonly text: string;
  readonly setCookieHeader: string | null;
  readonly status: number;
}
export type FolderRecord = Record<
  string,
  { moid: string; name: string; children: string[] }
>;
export interface FolderTree {
  id: string;
  name: string;
  children: FolderTree[];
}
export type NetworkTopology = {
  hosts: {
    hostname: string;
    id: string;
    neighbors: { id: string; attributes?: (string | number)[] }[];
  }[];
};
export type VMTopology = {
  routers: Router[];
  vms: VM[];
  fetchTime: string;
};
