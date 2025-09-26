import { RedisClient } from "@/server/redis/types";

type StrMap<V> = { readonly [k: string]: V };
export type Vm = {
  readonly moid: string;
  readonly name: string;
  readonly ip: string;
  readonly cpu: number;
  readonly ramMB: number;
  readonly powerState: "poweredOn" | "poweredOff" | "suspended";
  readonly guestFullName: string;
  readonly devices: Device[];
};
export type Folder = {
  readonly moid: string;
  readonly name: string;
  readonly children: readonly string[];
};
export type Device = {
  readonly icon: string;
  readonly label: string;
  readonly props: { label: string; value: string }[];
};
export type Inventory = {
  readonly folders: StrMap<Folder>;
  readonly vms: StrMap<Vm>;
  readonly serverUuid: string | null;
};
export type Router = {
  id: string;
  name: string;
  parent: string | null;
};
export type VM = {
  id: string;
  hostname: string;
  ip: string;
  cpu: number;
  ram: number;
  power: boolean;
  parent: string;
  os: string;
  devices: Device[];
  vsphereUrl?: string | undefined;
};
export type SoapClientConfig = {
  readonly url: string;
  readonly username: string;
  readonly password: string;
  readonly redis: RedisClient | null;
};
export type SoapResponse = {
  readonly text: string;
  readonly setCookieHeader: string | null;
  readonly status: number;
};
export type FolderRecord = Record<
  string,
  { moid: string; name: string; children: string[] }
>;
export type FolderTree = {
  id: string;
  name: string;
  children: FolderTree[];
};
