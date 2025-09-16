import { z } from "zod";

export const signinSchema = z
  .object({
    email: z.string().email({ message: "Invalid email address" }),
    password: z
      .string()
      .min(10, { message: "Пароль должен быть как минимум 10 символов" })
      .regex(/[a-z]/, { message: "Пароль должен содержать нижний регистр" })
      .regex(/[A-Z]/, { message: "Пароль должен содержать верхний регистр" })
      .regex(/[0-9]/, { message: "Пароль должен содержать цифры" })
      .regex(/[^A-Za-z0-9]/, {
        message: "Пароль должен содержать специальные символы",
      }),
    passwordConfirm: z.string().optional(),
    inviteCode: z
      .string()
      .uuid({ message: "Неверный код приглашения" })
      .optional(),
  })
  .superRefine((data, ctx) => {
    if ("passwordConfirm" in data && data.passwordConfirm !== undefined) {
      if (data.password !== data.passwordConfirm) {
        ctx.addIssue({
          code: "custom",
          path: ["passwordConfirm"],
          message: "Пароли не совпадают",
        });
      }
    }
  });
