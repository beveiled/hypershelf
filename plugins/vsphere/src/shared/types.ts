export type Tokens = {
  token: string;
  refreshToken: string;
};

export type ExtractedIds = {
  dns: string | null;
  ip: string | null;
  url: string;
};

export type BgReq =
  | { type: "AUTH_ENSURE" }
  | { type: "AUTH_PERSIST"; payload: Tokens }
  | { type: "AUTH_RESET" }
  | { type: "GET_IDS"; tabId?: number }
  | { type: "ATTACH_OBSERVER"; tabId?: number }
  | { type: "PING" }
  | { type: "DOM_HINT"; tabId?: number };

export type BgSignal =
  | { type: "URL_CHANGE"; tabId: number; url: string }
  | { type: "DOM_HINT"; tabId?: number }
  | { type: "REFETCH"; tabId: number };

export type BgRes =
  | { type: "AUTH_OK"; payload: Tokens }
  | { type: "AUTH_REQUIRED" }
  | { type: "IDS"; payload: ExtractedIds }
  | { type: "PONG" }
  | { type: "ERROR"; message: string };

export type Message = BgReq | BgRes | BgSignal;
