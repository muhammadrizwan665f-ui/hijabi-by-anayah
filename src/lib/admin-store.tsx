
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  getAdminSession,
  logoutAdmin,
} from "./auth.functions";
import { getAdminBootstrap } from "./admin.functions";
import { toSettings } from "./mappers";
import type {
  Notification,
  Order,
  PaymentMethod,
  Product,
  Settings,
} from "./types";

interface AdminData {
  products: Product[];
  payments: PaymentMethod[];
  notifications: Notification[];
  orders: Order[];
  settings: Settings;
}

interface AdminSession {
  user: {
    email: string;
  };
}

interface AdminApi extends AdminData {
  session: AdminSession | null;
  email: string | null;
  isAdmin: boolean;
  adminError: string | null;
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
  const [session, setSession] = useState<AdminSession | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [data, setData] = useState<AdminData>(emptyData);

  const reload = useCallback(async () => {
    setLoadingData(true);

    try {
      const next = await getAdminBootstrap();
      setData(next);
      setIsAdmin(true);
      setAdminError(null);
    } catch (err) {
      setIsAdmin(false);
      setAdminError(
        err instanceof Error ? err.message : String(err),
      );
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    async function checkSession() {
      try {
        const current = await getAdminSession();

        if (!mounted) return;

        if (current) {
          setSession({
            user: {
              email: current.email,
            },
          });
        } else {
          setSession(null);
          setIsAdmin(false);
          setData(emptyData);
        }
      } catch (err) {
        if (!mounted) return;

        setSession(null);
        setIsAdmin(false);
        setAdminError(
          err instanceof Error ? err.message : String(err),
        );
      } finally {
        if (mounted) setChecking(false);
      }
    }

    void checkSession();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (session) {
      void reload();
    }
  }, [session, reload]);

  const signOut = useCallback(async () => {
    try {
      await logoutAdmin();
    } finally {
      setSession(null);
      setIsAdmin(false);
      setAdminError(null);
      setData(emptyData);
    }
  }, []);

  const api = useMemo<AdminApi>(
    () => ({
      ...data,
      session,
      email: session?.user.email ?? null,
      isAdmin,
      adminError,
      checking,
      loadingData,
      reload,
      signOut,
    }),
    [
      data,
      session,
      isAdmin,
      adminError,
      checking,
      loadingData,
      reload,
      signOut,
    ],
  );

  return (
    <AdminContext.Provider value={api}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin(): AdminApi {
  const ctx = useContext(AdminContext);

  if (!ctx) {
    throw new Error("useAdmin must be used inside AdminProvider");
  }

  return ctx;
}
