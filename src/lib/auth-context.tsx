import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Profile {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone: string | null;
  gender: string | null;
  church: string | null;
  registration_id: string;
  status: "active" | "completed";
  batch_year: number;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isAdmin: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  isAdmin: false,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          setTimeout(async () => {
            const [{ data: profileData }, { data: roleData }, { data: setting }] = await Promise.all([
              supabase
                .from("profiles")
                .select("*")
                .eq("user_id", session.user.id)
                .single(),
              supabase
                .from("user_roles")
                .select("role")
                .eq("user_id", session.user.id),
              supabase
                .from("app_settings")
                .select("value")
                .eq("key", "login_open")
                .maybeSingle(),
            ]);
            const admin = roleData?.some((r) => r.role === "admin") ?? false;
            const loginOpen = setting?.value === undefined ? true : setting.value === true || setting.value === "true";

            if (!loginOpen && !admin) {
              await supabase.auth.signOut();
              toast.error("Logins are temporarily disabled. Please check back later.");
              setProfile(null);
              setIsAdmin(false);
              setUser(null);
              setSession(null);
              setLoading(false);
              return;
            }

            setProfile(profileData as Profile | null);
            setIsAdmin(admin);
            setLoading(false);
          }, 0);
        } else {
          setProfile(null);
          setIsAdmin(false);
          setLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, isAdmin, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
