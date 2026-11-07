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
import { friendlyError, supabase, supabaseConfigured } from "./supabase";
import type { Profile } from "./types";

interface AuthContextValue {
  configured: boolean;
  loading: boolean;
  session: Session | null;
  profile: Profile | null;
  permissions: string[];
  error: string | null;
  signIn: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ ok: boolean; error?: string }>;
  refresh: () => Promise<void>;
  can: (resource: string, action: string) => boolean;
  hasAnyRole: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(supabaseConfigured);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async (nextSession: Session | null) => {
    if (!supabase || !nextSession?.user) {
      setProfile(null);
      setPermissions([]);
      setLoading(false);
      return;
    }
    try {
      const { data, error: profileError } = await supabase
        .from("profiles")
        .select("id,email,full_name,avatar_url,role,account_status,last_seen_at,created_at,updated_at")
        .eq("id", nextSession.user.id)
        .maybeSingle();

      if (profileError) throw profileError;
      setProfile(data ?? null);

      if (data?.role && data.account_status === "active") {
        const { data: perms, error: permError } = await supabase
          .from("role_permissions")
          .select("resource,action")
          .eq("role", data.role);
        if (permError) throw permError;
        setPermissions((perms ?? []).map((p: { resource: string; action: string }) => `${p.resource}.${p.action}`));
      } else {
        setPermissions([]);
      }
    } catch (e) {
      setError(friendlyError(e));
      setProfile(null);
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!supabase) return;
    let cancelled = false;

    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      setSession(data.session);
      loadProfile(data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (cancelled) return;
      if (event === "SIGNED_OUT" || event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        setSession(nextSession);
        if (event !== "TOKEN_REFRESHED") setLoading(true);
        loadProfile(nextSession);
      }
    });

    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) return { ok: false, error: "Supabase پیکربندی نشده است." };
    setError(null);
    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (signInError) {
      const message = /invalid/i.test(signInError.message)
        ? "ایمیل یا رمز عبور نادرست است."
        : /email not confirmed/i.test(signInError.message)
          ? "ایمیل شما تأیید نشده است."
          : friendlyError(signInError);
      return { ok: false, error: message };
    }
    setSession(data.session);
    await loadProfile(data.session);
    return { ok: true };
  }, [loadProfile]);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
    setPermissions([]);
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    if (!supabase) return { ok: false, error: "Supabase پیکربندی نشده است." };
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/#/admin/login`,
    });
    if (resetError) return { ok: false, error: friendlyError(resetError) };
    return { ok: true };
  }, []);

  const refresh = useCallback(async () => {
    if (!supabase) return;
    const { data } = await supabase.auth.getSession();
    await loadProfile(data.session);
  }, [loadProfile]);

  const can = useCallback(
    (resource: string, action: string) => {
      if (!profile || profile.account_status !== "active" || !profile.role) return false;
      if (profile.role === "super_admin") return true;
      return (
        permissions.includes(`${resource}.${action}`) ||
        permissions.includes(`${resource}.*`) ||
        permissions.includes(`*.${action}`) ||
        permissions.includes("*.*")
      );
    },
    [profile, permissions]
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      configured: supabaseConfigured,
      loading,
      session,
      profile,
      permissions,
      error,
      signIn,
      signOut,
      resetPassword,
      refresh,
      can,
      hasAnyRole: Boolean(profile?.role && profile.account_status === "active"),
    }),
    [loading, session, profile, permissions, error, signIn, signOut, resetPassword, refresh, can]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
