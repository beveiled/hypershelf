import type { BgSignal } from "./types";

export const sendToTab = async (
  tabId: number,
  msg: BgSignal,
): Promise<void> => {
  try {
    await chrome.tabs.sendMessage(tabId, msg);
  } catch {}
};
