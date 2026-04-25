import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Profile } from '../types';

type AuthContextValue = {
  session: any | null;
  user: any | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<any | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (error) {
        if (error.code === 'PGRST116') { // not found
          // Create default profile
          const { data: newProfile, error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: userId,
              full_name: user?.user_metadata?.full_name || 'New User',
              email: user?.email || '',
              role: 'teacher', // default to teacher
              subject: null,
            })
            .select()
            .single();
          if (insertError) {
            console.error('Failed to create profile:', insertError);
            setProfile(null);
            return;
          }
          setProfile(newProfile as Profile);
        } else {
          console.error('Failed to fetch profile:', error);
          setProfile(null);
        }
      } else {
        setProfile(data as Profile);
      }
    } catch (err) {
      console.error('Profile fetch error:', err);
      setProfile(null);
    }
  };

  useEffect(() => {
    const currentSession = supabase.auth.getSession().then(({ data }) => {
      const sessionData = data.session;
      setSession(sessionData);
      setUser(sessionData?.user ?? null);
      if (sessionData?.user?.id) fetchProfile(sessionData.user.id);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, sessionData) => {
      setSession(sessionData);
      setUser(sessionData?.user ?? null);
      if (sessionData?.user?.id) {
        fetchProfile(sessionData.user.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    const sessionData = await supabase.auth.getSession();
    setSession(sessionData.data.session);
    setUser(sessionData.data.session?.user ?? null);
    if (sessionData.data.session?.user?.id) {
      await fetchProfile(sessionData.data.session.user.id);
    }
    setLoading(false);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
  };

  const value = useMemo(
    () => ({ session, user, profile, loading, signIn, signOut }),
    [session, user, profile, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
