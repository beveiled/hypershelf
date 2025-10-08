export const isVsphere = (url: string): boolean => {
  const u = url.toLowerCase();
  if (u.startsWith("chrome-extension://")) return false;
  return u.startsWith(import.meta.env.VITE_VSPHERE_URL_PREFIX!.toLowerCase());
};
