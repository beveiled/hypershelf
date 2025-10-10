import type { BgReq, BgRes, Tokens } from "./types";

const send = async (req: BgReq): Promise<BgRes> => {
  const r = await chrome.runtime.sendMessage<BgReq, BgRes>(req);
  return r;
};

export const ensureTokens = async (): Promise<Tokens> => {
  const res = await send({ type: "AUTH_ENSURE" });
  if (res.type === "AUTH_OK") return res.payload;
  if (res.type === "ERROR") throw new Error(res.message);
  throw new Error("Auth required");
};

export const resetAuth = async (): Promise<Tokens> => {
  console.log("[Hypershelf] Requesting new auth token");
  const res = await send({ type: "AUTH_RESET" });
  if (res.type === "AUTH_OK") return res.payload;
  if (res.type === "ERROR") throw new Error(res.message);
  throw new Error("Auth required");
};
