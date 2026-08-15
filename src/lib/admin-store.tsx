import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { getAdminBootstrap } from "./admin.functions";
import { rowToNotification, toSettings } from "./mappers";
import type { Notification, Order, PaymentMethod, Product, Settings } from "./types";

interface AdminData {
  products: Product[];
  payments: PaymentMethod[];
  notifications: Notification[];
  orders: Order[];
  settings: Settings;
}

interface AdminApi extends AdminData {
  session: Session | null;
  email: string | null;
  isAdmin: boolean;
  checking: boolean;
  loadingData: boolean;
  reload: () => Promise<void>;
  signOut: () => Promise<void>;
}

const emptyData: AdminData = {
  products: [],
  payments: [],
  notifications: [],
  orders: [],
  settings: toSettings({}),
};

const AdminContext = createContext<AdminApi | null>(null);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [data, setData] = useState<AdminData>(emptyData);

  const reload = useCallback(async () => {
    setLoadingData(true);
    try {
      const next = await getAdminBootstrap();
      setData(next);
      setIsAdmin(true);
    } catch {
      setIsAdmin(false);
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
      setSession(next);
      if (event === "SIGNED_OUT") {
        setIsAdmin(false);
        setData(emptyData);
      }
    });
    void (async () => {
      const { data: got } = await supabase.auth.getSession();
      setSession(got.session);
      setChecking(false);
    })();
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      const sub = supabase
        .channel("admin_notifications")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "notifications" },
          (payload) => {
            const notif = rowToNotification(payload.new as any);
            setData((prev) => ({
              ...prev,
              notifications: [notif, ...prev.notifications].slice(0, 50),
            }));
            // Show real-time toast
            import("sonner").then(({ toast }) => {
              toast.info(notif.title, {
                description: notif.message,
                duration: 5000,
              });
            });
          },
        )
        .subscribe();
      return () => {
        void supabase.removeChannel(sub);
      };
    }
    return undefined;
  }, [isAdmin]);

  useEffect(() => {
    if (session) void reload();
  }, [session, reload]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setIsAdmin(false);
    setData(emptyData);
  }, []);

  const api = useMemo<AdminApi>(
    () => ({
      ...data,
      session,
      email: session?.user.email ?? null,
      isAdmin,
      checking,
      loadingData,
      reload,
      signOut,
    }),
    [data, session, isAdmin, checking, loadingData, reload, signOut],
  );

  return <AdminContext.Provider value={api}>{children}</AdminContext.Provider>;
}

export function useAdmin(): AdminApi {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin must be used inside AdminProvider");
  return ctx;
}
