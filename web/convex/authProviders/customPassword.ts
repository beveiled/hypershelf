import { Password } from "@convex-dev/auth/providers/Password";
import { ConvexError } from "convex/values";
import { z } from "zod";

const ParamsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(16)
});

export default Password({
  profile(params) {
    const { error, data } = ParamsSchema.safeParse(params);
    if (error) {
      throw new ConvexError(error.format());
    }
    return { email: data.email };
  }
});
