"use client";

import { Suspense, useActionState } from "react";
import { useSearchParams } from "next/navigation";

import {
  loginAction,
  signInWithGoogleAction,
  signupAction,
} from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

const initialState = { error: undefined };

function LoginFormContent() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? "/today";
  const authError = searchParams.get("error");

  const [loginState, loginFormAction, loginPending] = useActionState(
    loginAction,
    initialState
  );
  const [signupState, signupFormAction, signupPending] = useActionState(
    signupAction,
    initialState
  );
  const [googleState, googleFormAction, googlePending] = useActionState(
    signInWithGoogleAction,
    initialState
  );

  return (
    <LoginCard
      authError={authError}
      redirectTo={redirectTo}
      loginState={loginState}
      loginFormAction={loginFormAction}
      loginPending={loginPending}
      signupState={signupState}
      signupFormAction={signupFormAction}
      signupPending={signupPending}
      googleState={googleState}
      googleFormAction={googleFormAction}
      googlePending={googlePending}
    />
  );
}

type LoginCardProps = {
  authError: string | null;
  redirectTo: string;
  loginState: { error?: string };
  loginFormAction: (formData: FormData) => void;
  loginPending: boolean;
  signupState: { error?: string };
  signupFormAction: (formData: FormData) => void;
  signupPending: boolean;
  googleState: { error?: string };
  googleFormAction: (formData: FormData) => void;
  googlePending: boolean;
};

function LoginCard({
  authError,
  redirectTo,
  loginState,
  loginFormAction,
  loginPending,
  signupState,
  signupFormAction,
  signupPending,
  googleState,
  googleFormAction,
  googlePending,
}: LoginCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Welcome to Compass</CardTitle>
        <CardDescription>
          Sign in to steward today&apos;s commitments and weekly check-ins.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {authError ? (
          <p className="text-destructive text-sm">{authError}</p>
        ) : null}

        <form action={loginFormAction} className="space-y-3">
          <input type="hidden" name="redirectTo" value={redirectTo} />

          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>

          {loginState.error ? (
            <p className="text-destructive text-sm">{loginState.error}</p>
          ) : null}

          <Button type="submit" className="w-full" disabled={loginPending}>
            {loginPending ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        <Separator />

        <form action={signupFormAction} className="space-y-3">
          <input type="hidden" name="redirectTo" value={redirectTo} />

          <div className="space-y-1.5">
            <Label htmlFor="signup-email">Sign-up email</Label>
            <Input
              id="signup-email"
              name="email"
              type="email"
              autoComplete="email"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="signup-password">Sign-up password</Label>
            <Input
              id="signup-password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
            />
          </div>

          <Button
            type="submit"
            variant="outline"
            className="w-full"
            disabled={signupPending}
          >
            {signupPending ? "Creating account..." : "Create account"}
          </Button>
          {signupState.error ? (
            <p className="text-destructive text-sm">{signupState.error}</p>
          ) : (
            <p className="text-muted-foreground text-xs">
              New users receive a confirmation email after sign-up.
            </p>
          )}
        </form>

        <form action={googleFormAction}>
          <Button
            type="submit"
            variant="secondary"
            className="w-full"
            disabled={googlePending}
          >
            Continue with Google
          </Button>
          {googleState.error ? (
            <p className="text-destructive mt-2 text-sm">{googleState.error}</p>
          ) : null}
        </form>
      </CardContent>
    </Card>
  );
}

function LoginCardFallback() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Welcome to Compass</CardTitle>
        <CardDescription>Loading sign-in form…</CardDescription>
      </CardHeader>
      <CardContent className="text-muted-foreground text-sm">
        Preparing authentication options.
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginCardFallback />}>
      <LoginFormContent />
    </Suspense>
  );
}
