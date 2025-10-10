"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthActions } from "@convex-dev/auth/react";
import { pwnedPassword } from "hibp";
import { Cloud, KeyRound, Loader2Icon } from "lucide-react";

import { Alert, AlertDescription } from "@hypershelf/ui/primitives/alert";
import { Button } from "@hypershelf/ui/primitives/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@hypershelf/ui/primitives/card";
import { Input } from "@hypershelf/ui/primitives/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@hypershelf/ui/primitives/tooltip";

import { signinSchema } from "./schema";

export default function SignIn() {
  const { signIn } = useAuthActions();
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fields, setFields] = useState({
    email: "",
    password: "",
    passwordConfirm: "",
    inviteCode: "",
  });
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
    passwordConfirm?: string;
    inviteCode?: string;
  }>({});
  const router = useRouter();

  const params = useSearchParams();
  const ergo = params.get("ergo") ?? "/";
  const isRelativePath = (path: string) => {
    return path.startsWith("/") && !path.startsWith("//");
  };

  const validate = (name: string, value: string) => {
    const toValidate =
      flow === "signUp"
        ? {
            email: fields.email,
            password: fields.password,
            passwordConfirm: fields.passwordConfirm,
            inviteCode: fields.inviteCode,
          }
        : { email: fields.email, password: fields.password };

    toValidate[name as keyof typeof toValidate] = value;

    try {
      signinSchema.parse(toValidate);
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    } catch (e: unknown) {
      if (
        e &&
        typeof e === "object" &&
        "errors" in e &&
        Array.isArray(e.errors)
      ) {
        const errArr = e.errors.filter(
          (err: { path: string[]; message: string }) =>
            err.path[0] === name &&
            toValidate[name as keyof typeof toValidate] !== "",
        );
        setFieldErrors((prev) => ({
          ...prev,
          [name]:
            errArr.length > 0
              ? (errArr[0] as { message: string }).message
              : undefined,
        }));
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFields((prev) => ({ ...prev, [name]: value }));
    validate(name, value);
    if (flow === "signUp" && name === "password") {
      validate("passwordConfirm", fields.passwordConfirm);
    }
  };

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const toValidate =
      flow === "signUp"
        ? {
            email: fields.email,
            password: fields.password,
            passwordConfirm: fields.passwordConfirm,
            inviteCode: fields.inviteCode,
          }
        : { email: fields.email, password: fields.password };

    const result = signinSchema.safeParse(toValidate);
    if (!result.success) {
      const errors: {
        email?: string;
        password?: string;
        passwordConfirm?: string;
        inviteCode?: string;
      } = {};
      for (const err of result.error.issues) {
        errors[
          err.path[0] as "email" | "password" | "passwordConfirm" | "inviteCode"
        ] = err.message;
      }
      setFieldErrors(errors);
      setLoading(false);
      return;
    }

    if (flow !== "signIn") {
      try {
        const pwnedCount = await pwnedPassword(fields.password);
        if (pwnedCount > 0) {
          setError(`Пароль нашелся в ${pwnedCount} утечках. Выбери другой.`);
          setLoading(false);
          return;
        }
      } catch {
        console.log(
          "Failed to check password against breach database. Proceeding with sign-in.",
        );
      }
    }

    const formData = new FormData();
    formData.set("email", fields.email);
    formData.set("password", fields.password);
    if (flow === "signUp") {
      formData.set("inviteCode", fields.inviteCode);
    }
    formData.set("flow", flow);

    void signIn("password", formData)
      .catch((error: Error) => {
        setError(
          error.message !== "result is null"
            ? error.message
            : flow === "signIn"
              ? "Неверная почта или пароль"
              : "Не получилось зарегистрироваться. Проверь почту и пароль",
        );
      })
      .then(() => {
        if (params.get("close") === "true") {
          window.close();
          return null;
        }
        router.push(isRelativePath(ergo) ? ergo : "/");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <div className="gap-4 md:min-h-screen md:pb-16 flex flex-col items-center justify-center">
      <Card className="max-w-md gap-2 py-4 md:gap-6 md:py-6 w-full">
        <CardHeader>
          <CardTitle className="text-lg font-extrabold md:text-2xl relative font-title">
            <div className="bottom-0.5 left-0 h-0.5 w-4 md:bottom-0 md:h-1 md:w-6 absolute bg-brand"></div>
            {flow === "signIn" ? "Sign In" : "Sign Up"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form className="gap-2 flex flex-col" onSubmit={submit} noValidate>
            <TooltipProvider>
              <Tooltip open={!!fieldErrors.email && fields.email.length > 0}>
                <TooltipTrigger asChild>
                  <Input
                    type="email"
                    name="email"
                    placeholder="Почта"
                    autoComplete="email"
                    required
                    value={fields.email}
                    onChange={handleChange}
                    aria-invalid={!!fieldErrors.email}
                  />
                </TooltipTrigger>
                <TooltipContent side="right">
                  {fieldErrors.email}
                </TooltipContent>
              </Tooltip>
              <Tooltip
                open={!!fieldErrors.password && fields.password.length > 0}
              >
                <TooltipTrigger asChild>
                  <Input
                    type="password"
                    name="password"
                    placeholder="Пароль"
                    autoComplete="current-password"
                    required
                    value={fields.password}
                    onChange={handleChange}
                    aria-invalid={!!fieldErrors.password}
                  />
                </TooltipTrigger>
                <TooltipContent side="right">
                  {fieldErrors.password}
                </TooltipContent>
              </Tooltip>
              {flow === "signUp" && (
                <Tooltip
                  open={
                    !!fieldErrors.passwordConfirm &&
                    fields.passwordConfirm.length > 0
                  }
                >
                  <TooltipTrigger asChild>
                    <Input
                      type="password"
                      name="passwordConfirm"
                      placeholder="Опять пароль"
                      autoComplete="new-password"
                      required
                      value={fields.passwordConfirm}
                      onChange={handleChange}
                      aria-invalid={!!fieldErrors.passwordConfirm}
                    />
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    {fieldErrors.passwordConfirm}
                  </TooltipContent>
                </Tooltip>
              )}
              {flow === "signUp" && (
                <Tooltip
                  open={
                    !!fieldErrors.inviteCode && fields.inviteCode.length > 0
                  }
                >
                  <TooltipTrigger asChild>
                    <Input
                      type="text"
                      name="inviteCode"
                      placeholder="Код приглашения"
                      required
                      value={fields.inviteCode}
                      onChange={handleChange}
                      aria-invalid={!!fieldErrors.inviteCode}
                    />
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    {fieldErrors.inviteCode}
                  </TooltipContent>
                </Tooltip>
              )}
            </TooltipProvider>
            <Button
              disabled={
                loading ||
                !!fieldErrors.email ||
                !!fieldErrors.password ||
                (flow === "signUp" && !!fieldErrors.passwordConfirm) ||
                (flow === "signUp" && !!fieldErrors.inviteCode)
              }
              type="submit"
              className="w-full cursor-pointer"
              size="sm"
            >
              {loading ? (
                <Loader2Icon className="animate-spin" />
              ) : (
                <KeyRound />
              )}
              {flow === "signIn" ? "Войти" : "Зарегистрироваться"}
            </Button>
            <Button disabled variant="secondary" className="w-full" size="sm">
              <Cloud />
              Войти через SSO
            </Button>
            <div className="mt-2 text-sm flex items-center justify-between">
              <span>
                {flow === "signIn" ? "Нет аккаунта?" : "Уже есть аккаунт??"}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="cursor-pointer"
                onClick={() => setFlow(flow === "signIn" ? "signUp" : "signIn")}
              >
                {flow === "signIn" ? "К регистрации" : "К входу"}
              </Button>
            </div>
            {error && (
              <Alert variant="destructive" className="mt-2">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </form>
        </CardContent>
        <CardFooter />
      </Card>
    </div>
  );
}
