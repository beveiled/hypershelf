import { useEffect, useState } from "react";

export type OS = "macos" | "other";

export const useOS = (): OS => {
  const [os, setOS] = useState<OS>("other");

  useEffect(() => {
    const { userAgent } = window.navigator;

    if (userAgent.includes("Mac")) {
      setOS("macos");
    } else {
      setOS("other");
    }
  }, []);

  return os;
};
