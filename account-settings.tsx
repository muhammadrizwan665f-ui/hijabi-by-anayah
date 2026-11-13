import { useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import {
  updateAdminEmail,
  updateAdminPassword,
} from "@/lib/auth.functions";
import { useAdmin } from "@/lib/admin-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** Lets the signed-in store owner change the D1-backed admin password and login email. */
export function AccountSettings() {
  const { email } = useAdmin();

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [savingPw, setSavingPw] = useState(false);

  const [newEmail, setNewEmail] = useState("");
  const [emailPw, setEmailPw] = useState("");
  const [savingEmail, setSavingEmail] = useState(false);

  async function changePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (newPw.length < 8) {
      toast.error("Password too short", { description: "Use at least 8 characters." });
      return;
    }
    if (newPw !== confirmPw) {
      toast.error("New passwords do not match");
      return;
    }

    setSavingPw(true);
    try {
      const result = await updateAdminPassword({
        data: { currentPassword: currentPw, newPassword: newPw },
      });

      if (!result.success) {
        toast.error(
          result.reason === "wrong_password"
            ? "Current password is wrong"
            : "Please check the password requirements",
        );
        return;
      }

      toast.success("Password changed successfully");
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
    } catch (error) {
      toast.error("Could not change password", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setSavingPw(false);
    }
  }

  async function changeEmail(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const target = newEmail.trim().toLowerCase();

    if (!target || target === email?.toLowerCase()) {
      toast.error("Enter a different email address");
      return;
    }

    setSavingEmail(true);
    try {
      const result = await updateAdminEmail({
        data: { currentPassword: emailPw, newEmail: target },
      });

      if (!result.success) {
        const messages: Record<string, string> = {
          wrong_password: "Current password is wrong",
          email_in_use: "This email is already used by another admin",
          same_email: "This is already your login email",
          invalid_input: "Enter a valid email address",
        };
        toast.error(messages[result.reason] ?? "Could not update login email");
        return;
      }

      toast.success("Login email updated");
      setNewEmail("");
      setEmailPw("");
      window.location.reload();
    } catch (error) {
      toast.error("Could not update login email", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setSavingEmail(false);
    }
  }

  return (
    <section className="premium-card mt-6 p-6">
      <div className="flex items-center gap-2">
        <ShieldCheck className="size-5" />
        <h2 className="font-display text-lg font-bold">Admin account</h2>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Signed in as <span className="font-medium text-foreground">{email}</span>. Change your admin password or login email here.
      </p>

      <div className="mt-5 grid gap-8 lg:grid-cols-2">
        <form onSubmit={changePassword} className="space-y-3">
          <h3 className="font-semibold">Change password</h3>
          <div className="space-y-1.5">
            <Label htmlFor="acc-current-pw">Current password</Label>
            <Input id="acc-current-pw" type="password" autoComplete="current-password" required value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="acc-new-pw">New password</Label>
            <Input id="acc-new-pw" type="password" autoComplete="new-password" required minLength={8} value={newPw} onChange={(e) => setNewPw(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="acc-confirm-pw">Confirm new password</Label>
            <Input id="acc-confirm-pw" type="password" autoComplete="new-password" required value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} />
          </div>
          <Button type="submit" disabled={savingPw}>
            {savingPw ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
            Update password
          </Button>
        </form>

        <form onSubmit={changeEmail} className="space-y-3">
          <h3 className="font-semibold">Change login email</h3>
          <div className="space-y-1.5">
            <Label htmlFor="acc-new-email">New email</Label>
            <Input id="acc-new-email" type="email" autoComplete="email" required value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="acc-email-pw">Current password</Label>
            <Input id="acc-email-pw" type="password" autoComplete="current-password" required value={emailPw} onChange={(e) => setEmailPw(e.target.value)} />
          </div>
          <p className="text-xs text-muted-foreground">
            Your login email is updated immediately after your current password is verified.
          </p>
          <Button type="submit" disabled={savingEmail}>
            {savingEmail ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
            Update login email
          </Button>
        </form>
      </div>
    </section>
  );
}
