/*
https://github.com/hikariatama/hypershelf
Copyright (C) 2025  Daniil Gazizullin

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/
"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { useAuthActions } from "@convex-dev/auth/react";
import { pwnedPassword } from "hibp";
import { CircleAlert, Cloud, KeyRound, Loader2Icon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { z } from "zod";
import { useLoading } from "@/components/util/LoadingContext";

const schema = z
  .object({
    email: z.string().email({ message: "Invalid email address" }),
    password: z
      .string()
      .min(10, { message: "Password must be at least 10 characters" })
      .regex(/[a-z]/, { message: "Password must contain a lowercase letter" })
      .regex(/[A-Z]/, { message: "Password must contain an uppercase letter" })
      .regex(/[0-9]/, { message: "Password must contain a number" })
      .regex(/[^A-Za-z0-9]/, {
        message: "Password must contain a special symbol"
      }),
    passwordConfirm: z.string().optional(),
    inviteCode: z.string().uuid({ message: "Invalid invite code" }).optional()
  })
  .superRefine((data, ctx) => {
    if ("passwordConfirm" in data && data.passwordConfirm !== undefined) {
      if (data.password !== data.passwordConfirm) {
        ctx.addIssue({
          code: "custom",
          path: ["passwordConfirm"],
          message: "Passwords do not match"
        });
      }
    }
  });

export default function SignIn() {
  const { signIn } = useAuthActions();
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fields, setFields] = useState({
    email: "",
    password: "",
    passwordConfirm: "",
    inviteCode: ""
  });
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
    passwordConfirm?: string;
    inviteCode?: string;
  }>({});
  const router = useRouter();

  const { isLoading, setIsLoading } = useLoading();

  useEffect(() => {
    if (isLoading) setIsLoading(false);
  }, [isLoading, setIsLoading]);

  const params = useSearchParams();
  const ergo = params.get("ergo") || "/";
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
            inviteCode: fields.inviteCode
          }
        : { email: fields.email, password: fields.password };

    toValidate[name as keyof typeof toValidate] = value;

    try {
      schema.parse(toValidate);
      setFieldErrors(prev => ({ ...prev, [name]: undefined }));
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
            toValidate[name as keyof typeof toValidate] !== ""
        );
        setFieldErrors(prev => ({
          ...prev,
          [name]: errArr.length > 0 ? errArr[0].message : undefined
        }));
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFields(prev => ({ ...prev, [name]: value }));
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
            inviteCode: fields.inviteCode
          }
        : { email: fields.email, password: fields.password };

    const result = schema.safeParse(toValidate);
    if (!result.success) {
      const errors: {
        email?: string;
        password?: string;
        passwordConfirm?: string;
        inviteCode?: string;
      } = {};
      for (const err of result.error.errors) {
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
          setError(
            `Your password has been exposed in ${pwnedCount} breaches. Please choose a different password.`
          );
          setLoading(false);
          return;
        }
      } catch {
        console.log(
          "Failed to check password against breach database. Proceeding with sign-in."
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
      .catch(error => {
        setError(
          error.message !== "result is null"
            ? error.message
            : flow === "signIn"
              ? "Invalid email or password"
              : "Error signing up. Please try again."
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
    <div className="flex flex-col items-center justify-center gap-4 md:min-h-screen md:pb-16">
      <Card className="w-full max-w-md gap-2 py-4 md:gap-6 md:py-6">
        <CardHeader>
          <CardTitle className="font-title relative text-lg font-extrabold md:text-2xl">
            <div className="bg-brand absolute bottom-0.5 left-0 h-0.5 w-4 md:bottom-0 md:h-1 md:w-6"></div>
            {flow === "signIn" ? "Login" : "Sign Up"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-2" onSubmit={submit} noValidate>
            <TooltipProvider>
              <Tooltip open={!!fieldErrors.email && fields.email.length > 0}>
                <TooltipTrigger asChild>
                  <Input
                    type="email"
                    name="email"
                    placeholder="Email"
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
                    placeholder="Password"
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
                      placeholder="Confirm Password"
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
                      placeholder="Invite Code"
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
              {flow === "signIn" ? "Sign in" : "Sign up"}
            </Button>
            <Button disabled variant="secondary" className="w-full" size="sm">
              <Cloud />
              Use SSO
            </Button>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span>
                {flow === "signIn"
                  ? "Don't have an account?"
                  : "Already have an account?"}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="cursor-pointer"
                onClick={() => setFlow(flow === "signIn" ? "signUp" : "signIn")}
              >
                {flow === "signIn" ? "Sign up instead" : "Sign in instead"}
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
      <Card className="w-full max-w-md rounded-lg">
        <CardContent className="flex h-full items-center justify-center">
          <div className="flex items-center justify-center gap-2 text-sm font-semibold text-red-500">
            <CircleAlert className="size-4.5" />
            Early access. Do not use as a single source of truth.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
