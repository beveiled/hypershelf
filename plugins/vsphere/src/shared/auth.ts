import type { BgReq, BgRes, Tokens } from "./types";

export const ensureTokens = async (): Promise<Tokens> => {
  console.log("Ensuring tokens");
  const res = (await chrome.runtime.sendMessage({
    type: "AUTH_ENSURE",
  } as BgReq)) as BgRes;
  if (res.type === "AUTH_OK") return res.payload;
  if (res.type === "ERROR") throw new Error(res.message);
  throw new Error("Auth required");
};

export const resetAuth = async (): Promise<Tokens> => {
  console.log("Invalidating auth");
  const res = (await chrome.runtime.sendMessage({
    type: "AUTH_RESET",
  } as BgReq)) as BgRes;
  if (res.type === "AUTH_OK") return res.payload;
  if (res.type === "ERROR") throw new Error(res.message);
  throw new Error("Auth required");
};
