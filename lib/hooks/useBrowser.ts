import { useEffect, useState } from "react";

export type Browser = "gecko" | "webkit" | "blink" | "trident" | "other";

export const useBrowser = (): Browser => {
  const [browser, setBrowser] = useState<Browser>("other");

  useEffect(() => {
    const { userAgent } = window.navigator;

    if (userAgent.includes("Firefox")) {
      // Covers Firefox, Zen, Waterfox, Pale Moon, IceCat, etc.
      setBrowser("gecko");
    } else if (userAgent.includes("Chrome")) {
      // Covers Chrome, Edge, Opera, Brave, Vivaldi, Yandex Browser, etc.
      setBrowser("blink");
    } else if (userAgent.includes("Safari")) {
      // Covers Safari, WebKitGTK, QtWeb, etc.
      setBrowser("webkit");
    } else if (userAgent.includes("MSIE") || userAgent.includes("Trident")) {
      // Covers Internet Explorer
      setBrowser("trident");
    } else {
      // Covers browsers like Ladybird :)
      setBrowser("other");
    }
  }, []);

  return browser;
};
