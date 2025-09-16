import { Id } from "@/convex/_generated/dataModel";
import { ImmerStateCreator, UsersSlice } from "../types";

export const usersSlice: ImmerStateCreator<UsersSlice> = set => ({
  setUsers: incoming =>
    set(state => {
      for (const [id, name] of Object.entries(incoming) as [
        Id<"users">,
        string,
      ][]) {
        if (state.users[id] === name) continue;
        state.users[id] = name;
      }
      for (const id of Object.keys(state.users)) {
        if (!incoming[id as Id<"users">]) {
          delete state.users[id as Id<"users">];
        }
      }
    }),
});
