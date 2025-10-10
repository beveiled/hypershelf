import { Password } from "@convex-dev/auth/providers/Password";
import { ConvexError } from "convex/values";
import { z } from "zod";

const ParamsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(16),
  inviteCode: z.string().uuid().optional(),
});

export default Password({
  profile(params) {
    const { error, data } = ParamsSchema.safeParse(params);
    if (error) {
      throw new ConvexError(error.format());
    }

    if (
      params.flow === "signUp" &&
      data.inviteCode?.trim() !== process.env.INVITE_CODE?.trim()
    ) {
      throw new ConvexError("Invalid invite code");
    }

    return { email: data.email };
  },
});
