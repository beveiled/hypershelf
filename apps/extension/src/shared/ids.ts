import { VSPHERE_HOSTNAME } from "./env";

export const isVsphere = (url: string): boolean => {
  const u = url.toLowerCase();
  if (u.startsWith("chrome-extension://")) return false;
  return u.startsWith(`https://${VSPHERE_HOSTNAME}`);
};
