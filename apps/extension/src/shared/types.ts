export type Tokens = {
  token: string;
  refreshToken: string;
};

export type ExtractedIds = {
  dns: string | null;
  url: string;
};

export type BgReq =
  | { type: "AUTH_ENSURE" }
  | { type: "AUTH_PERSIST"; payload: Tokens }
  | { type: "AUTH_RESET" }
  | { type: "PING" };

export type BgRes =
  | { type: "AUTH_OK"; payload: Tokens }
  | { type: "AUTH_REQUIRED" }
  | { type: "PONG" }
  | { type: "ERROR"; message: string };

export type Message = BgReq | BgRes;
