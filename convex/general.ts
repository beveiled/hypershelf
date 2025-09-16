import { internalMutation } from "./_generated/server";

export const releaseExpiredLocks = internalMutation({
  handler: async ctx => {
    const objects = await ctx.db
      .query("fields")
      .filter(q => q.lt(q.field("editingLockExpires"), Date.now()))
      .collect();

    for (const object of objects) {
      await ctx.db.patch(object._id, {
        editingBy: undefined,
        editingLockExpires: undefined,
      });
    }

    const locks = await ctx.db
      .query("assetLocks")
      .filter(q => q.lt(q.field("expires"), Date.now()))
      .collect();
    for (const lock of locks) {
      await ctx.db.delete(lock._id);
    }
  },
});
