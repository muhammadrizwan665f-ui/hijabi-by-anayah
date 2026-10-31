import { useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/lib/admin-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** Lets the signed-in store owner change the admin password and login email. */
export function AccountSettings() {
  const { email } = useAdmin();

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [savingPw, setSavingPw] = useState(false);

  const [newEmail, setNewEmail] = useState("");
  const [emailPw, setEmailPw] = useState("");
  const [savingEmail, setSavingEmail] = useState(false);

  async function verifyCurrent(password: string) {
    if (!email) return false;
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return !error;
  }

  async function changePassword(e: React.FormEvent) {
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
      if (!(await verifyCurrent(currentPw))) {
        toast.error("Current password is wrong");
        return;
      }
      const { error } = await supabase.auth.updateUser({ password: newPw });
      if (error) {
        toast.error("Could not change password", { description: error.message });
        return;
      }
      toast.success("Password changed");
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
    } finally {
      setSavingPw(false);
    }
  }

  async function changeEmail(e: React.FormEvent) {
    e.preventDefault();
    const target = newEmail.trim().toLowerCase();
    if (!target || target === email?.toLowerCase()) {
      toast.error("Enter a different email address");
      return;
    }
    setSavingEmail(true);
    try {
      if (!(await verifyCurrent(emailPw))) {
        toast.error("Current password is wrong");
        return;
      }
      const { error } = await supabase.auth.updateUser(
        { email: target },
        { emailRedirectTo: `${window.location.origin}/admin` },
      );
      if (error) {
        toast.error("Could not change email", { description: error.message });
        return;
      }
      toast.success("Confirmation email sent", {
        description:
          "Open the link in the email sent to the new address (and to the old one if asked). The login email changes after you confirm.",
        duration: 10000,
      });
      setNewEmail("");
      setEmailPw("");
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
        Signed in as <span className="font-medium text-foreground">{email}</span>. Change your admin password or login
        email here.
      </p>

      <div className="mt-5 grid gap-8 lg:grid-cols-2">
        <form onSubmit={changePassword} className="space-y-3">
          <h3 className="font-semibold">Change password</h3>
          <div className="space-y-1.5">
            <Label htmlFor="acc-current-pw">Current password</Label>
            <Input
              id="acc-current-pw"
              type="password"
              autoComplete="current-password"
              required
              value={currentPw}
              onChange={(e) => setCurrentPw(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="acc-new-pw">New password</Label>
            <Input
              id="acc-new-pw"
              type="password"
              autoComplete="new-password"
              required
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="acc-confirm-pw">Confirm new password</Label>
            <Input
              id="acc-confirm-pw"
              type="password"
              autoComplete="new-password"
              required
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
            />
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
            <Input
              id="acc-new-email"
              type="email"
              autoComplete="email"
              required
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="acc-email-pw">Current password</Label>
            <Input
              id="acc-email-pw"
              type="password"
              autoComplete="current-password"
              required
              value={emailPw}
              onChange={(e) => setEmailPw(e.target.value)}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            A confirmation link is emailed to the new address. Your login email stays the same until you confirm it.
          </p>
          <Button type="submit" disabled={savingEmail}>
            {savingEmail ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
            Send confirmation
          </Button>
        </form>
      </div>
    </section>
  );
}
