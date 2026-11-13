
import { useEffect, useState } from "react";
import { Lock } from "lucide-react";
import { toast } from "sonner";
import {
  ensureAdminUser,
  loginAdmin,
} from "@/lib/auth.functions";
import { useAdmin } from "@/lib/admin-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AdminLogin({ denied = false }: { denied?: boolean }) {
  const {
    signOut,
    email: signedInEmail,
    adminError,
  } = useAdmin();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void ensureAdminUser().catch((error) => {
      console.error("Admin initialization failed:", error);
    });
  }, []);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (busy) return;

    setBusy(true);

    try {
      const result = await loginAdmin({
        data: {
          email: email.trim().toLowerCase(),
          password,
        },
      });

      if (!result.success) {
        toast.error("Login failed", {
          description: "Check your email and password and try again.",
        });
        return;
      }

      toast.success("Welcome back");

      // Reload so AdminProvider reads the newly created D1 session.
      window.location.reload();
    } catch (error) {
      console.error("Admin login error:", error);

      toast.error("Login failed", {
        description:
          error instanceof Error
            ? error.message
            : "Unable to sign in. Please try again.",
      });
    } finally {
      setBusy(false);
    }
  }

  if (denied) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-2 px-4">
        <div className="premium-card w-full max-w-md p-8 text-center">
          <h1 className="font-display text-xl font-bold">
            Not an admin account
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            {signedInEmail} does not have store-owner access. Sign in with
            the Hijabi By Anayah admin email.
          </p>

          {adminError ? (
            <p className="mt-3 break-words rounded-md bg-muted p-2 text-left text-xs text-muted-foreground">
              Technical reason: {adminError}
            </p>
          ) : null}

          <Button
            className="mt-6 w-full"
            onClick={() => void signOut()}
          >
            Sign out and try again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-2 px-4">
      <form
        onSubmit={submit}
        className="premium-card w-full max-w-md p-8"
      >
        <span className="gradient-brand mx-auto flex size-12 items-center justify-center rounded-2xl text-brand-foreground">
          <Lock className="size-5" />
        </span>

        <h1 className="mt-4 text-center font-display text-2xl font-bold">
          Anayah Admin
        </h1>

        <p className="mt-1 text-center text-sm text-muted-foreground">
          Private area — store owner sign-in only.
        </p>

        <div className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="admin-email">Email</Label>
            <Input
              id="admin-email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="hello@hijabibyanayah.pk"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="admin-password">Password</Label>
            <Input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={busy}
          >
            {busy ? "Signing in…" : "Sign in"}
          </Button>
        </div>
      </form>
    </div>
  );
}
