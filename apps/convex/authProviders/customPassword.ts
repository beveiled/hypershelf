import { Password } from "@convex-dev/auth/providers/Password";
import { ConvexError } from "convex/values";
import { z } from "zod";

const ParamsSchema = z.object({
  email: z.string().email(),
  password: z
    .string()
    .min(10)
    .regex(/[a-z]/)
    .regex(/[A-Z]/)
    .regex(/[0-9]/)
    .regex(/[^A-Za-z0-9]/),
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

    if (
      process.env.NEXT_PUBLIC_EMAIL_DOMAIN &&
      !data.email.endsWith(`@${process.env.NEXT_PUBLIC_EMAIL_DOMAIN}`)
    ) {
      throw new ConvexError("Forbidden email domain");
    }

    return { email: data.email };
  },
});
