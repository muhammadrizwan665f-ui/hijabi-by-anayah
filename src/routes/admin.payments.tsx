import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAdmin } from "@/lib/admin-store";
import { useStore } from "@/lib/store";
import { deletePaymentMethod, savePaymentMethod } from "@/lib/admin.functions";
import type { PaymentMethod } from "@/lib/types";

export const Route = createFileRoute("/admin/payments")({
  component: AdminPayments,
});

function blank(sortOrder: number): PaymentMethod {
  return {
    id: "",
    label: "",
    note: "",
    discountPct: 0,
    enabled: true,
    requiresProof: true,
    accountTitle: "",
    accountNumber: "",
    iban: "",
    instructions: "",
    sortOrder,
  };
}

function AdminPayments() {
  const { payments, reload } = useAdmin();
  const { refresh } = useStore();
  const [adding, setAdding] = useState<PaymentMethod | null>(null);

  async function persist(method: PaymentMethod) {
    const code = method.id.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "-");
    if (code.length < 2) {
      toast.error("Enter a short code, e.g. easypaisa");
      return false;
    }
    if (!method.label.trim()) {
      toast.error("Enter a display name for this payment method");
      return false;
    }
    try {
      await savePaymentMethod({ data: { method: { ...method, id: code } } });
      await reload();
      await refresh();
      toast.success("Payment method saved");
      return true;
    } catch {
      toast.error("Could not save this payment method.");
      return false;
    }
  }

  async function remove(code: string) {
    try {
      await deletePaymentMethod({ data: { code } });
      await reload();
      await refresh();
      toast.success("Payment method removed");
    } catch {
      toast.error("Could not remove this payment method.");
    }
  }

  return (
    <div className="pb-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Payment methods</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Add, edit or remove EasyPaisa, JazzCash, bank transfer and COD — including account
            numbers, discounts and screenshot verification.
          </p>
        </div>
        <Button onClick={() => setAdding(blank(payments.length + 1))} disabled={!!adding}>
          <Plus className="mr-2 size-4" /> Add method
        </Button>
      </div>

      <div className="mt-6 space-y-5">
        {adding ? (
          <MethodCard
            key="new"
            initial={adding}
            isNew
            onSave={async (m) => {
              const ok = await persist(m);
              if (ok) setAdding(null);
            }}
            onCancel={() => setAdding(null)}
          />
        ) : null}

        {payments.length === 0 && !adding ? (
          <p className="premium-card p-6 text-sm text-muted-foreground">
            No payment methods yet — add your first one so customers can check out.
          </p>
        ) : null}

        {payments.map((m) => (
          <MethodCard key={m.id} initial={m} onSave={persist} onDelete={() => remove(m.id)} />
        ))}
      </div>
    </div>
  );
}

function MethodCard({
  initial,
  isNew = false,
  onSave,
  onDelete,
  onCancel,
}: {
  initial: PaymentMethod;
  isNew?: boolean;
  onSave: (m: PaymentMethod) => Promise<boolean | void>;
  onDelete?: () => void;
  onCancel?: () => void;
}) {
  const [draft, setDraft] = useState<PaymentMethod>(initial);
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof PaymentMethod>(k: K, v: PaymentMethod[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  return (
    <div className="premium-card p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display font-bold">
          {isNew ? "New payment method" : draft.label || draft.id}
        </h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label htmlFor={`enabled-${initial.id || "new"}`} className="text-xs">
              Enabled
            </Label>
            <Switch
              id={`enabled-${initial.id || "new"}`}
              checked={draft.enabled}
              onCheckedChange={(v) => set("enabled", v)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor={`proof-${initial.id || "new"}`} className="text-xs">
              Needs screenshot
            </Label>
            <Switch
              id={`proof-${initial.id || "new"}`}
              checked={draft.requiresProof}
              onCheckedChange={(v) => set("requiresProof", v)}
            />
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Field
          label="Code"
          value={draft.id}
          disabled={!isNew}
          onChange={(v) => set("id", v)}
          placeholder="easypaisa"
        />
        <Field label="Display name" value={draft.label} onChange={(v) => set("label", v)} placeholder="EasyPaisa" />
        <Field
          label="Short note"
          value={draft.note}
          onChange={(v) => set("note", v)}
          placeholder="Instant transfer · extra discount"
        />
        <div>
          <Label htmlFor={`disc-${initial.id || "new"}`}>Discount %</Label>
          <Input
            id={`disc-${initial.id || "new"}`}
            type="number"
            min={0}
            max={90}
            className="mt-1.5"
            value={draft.discountPct}
            onChange={(e) => set("discountPct", Number(e.target.value) || 0)}
          />
        </div>
        <Field
          label="Account title"
          value={draft.accountTitle ?? ""}
          onChange={(v) => set("accountTitle", v)}
        />
        <Field
          label="Account number"
          value={draft.accountNumber ?? ""}
          onChange={(v) => set("accountNumber", v)}
          placeholder="0343 5295541"
        />
        <Field label="IBAN (bank only)" value={draft.iban ?? ""} onChange={(v) => set("iban", v)} />
        <div>
          <Label htmlFor={`sort-${initial.id || "new"}`}>Sort order</Label>
          <Input
            id={`sort-${initial.id || "new"}`}
            type="number"
            min={0}
            className="mt-1.5"
            value={draft.sortOrder}
            onChange={(e) => set("sortOrder", Number(e.target.value) || 0)}
          />
        </div>
      </div>

      <div className="mt-4">
        <Label htmlFor={`inst-${initial.id || "new"}`}>Checkout instructions</Label>
        <Textarea
          id={`inst-${initial.id || "new"}`}
          className="mt-1.5"
          maxLength={500}
          value={draft.instructions ?? ""}
          onChange={(e) => set("instructions", e.target.value)}
          placeholder="Send the advance amount to the number above, then upload your screenshot."
        />
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <Button
          onClick={() => {
            setSaving(true);
            void Promise.resolve(onSave(draft)).finally(() => setSaving(false));
          }}
          disabled={saving}
        >
          {saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}
          Save
        </Button>
        {onCancel ? (
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
        {onDelete ? (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="ml-auto text-destructive">
                <Trash2 className="mr-2 size-4" /> Remove
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remove {draft.label || draft.id}?</AlertDialogTitle>
                <AlertDialogDescription>
                  Customers will no longer see this option at checkout. Existing orders keep their
                  payment record.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep it</AlertDialogCancel>
                <AlertDialogAction onClick={onDelete}>Remove</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : null}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  const id = `${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${placeholder ?? ""}`;
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        className="mt-1.5"
        maxLength={200}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
