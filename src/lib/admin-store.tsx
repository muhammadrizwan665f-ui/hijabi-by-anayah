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
import { toSettings } from "./mappers";
import type { Coupon, Order, PaymentMethod, Product, Settings } from "./types";

interface AdminData {
  products: Product[];
  payments: PaymentMethod[];
  coupons: Coupon[];
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
  coupons: [],
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
