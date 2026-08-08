import { createClient } from '@supabase/supabase-js';
import { getAnonymousSessionId } from '@/lib/anonymousSession';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.');
}

export const supabase = createClient(supabaseUrl || 'https://example.supabase.co', supabaseAnonKey || 'missing-key');

const tableNames = {
  Scan: 'scans',
  CommunityReport: 'community_reports',
  ScamPattern: 'scam_patterns',
  User: 'profiles'
};

function orderParts(order = '-created_date') {
  const descending = order.startsWith('-');
  return { column: descending ? order.slice(1) : order, ascending: !descending };
}

function withError(result) {
  if (result.error) throw result.error;
  return result.data;
}

function normalizeUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    full_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User',
    role: user.user_metadata?.role || 'user'
  };
}

function entity(table) {
  return {
    async create(payload) {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id || null;
      const insertPayload = { ...payload };
      if (userId) insertPayload.user_id = userId;
      if (!userId && !insertPayload.anonymous_session_id) insertPayload.anonymous_session_id = getAnonymousSessionId();
      const result = await supabase.from(table).insert(insertPayload).select('*').single();
      if (result.error && /(fingerprint|offer_dna|recruiter_identity|contract_risk|anonymous_session_id)/i.test(result.error.message || '')) {
        const { fingerprint, offer_dna, recruiter_identity, contract_risk, anonymous_session_id, ...retryPayload } = insertPayload;
        return withError(await supabase.from(table).insert(retryPayload).select('*').single());
      }
      return withError(result);
    },
    async get(id) {
      return withError(await supabase.from(table).select('*').eq('id', id).single());
    },
    async list(order = '-created_date', limit = 100) {
      const { column, ascending } = orderParts(order);
      return withError(await supabase.from(table).select('*').order(column, { ascending }).limit(limit));
    },
    async listMine(order = '-created_date', limit = 100) {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id || null;
      const { column, ascending } = orderParts(order);
      let query = supabase.from(table).select('*').order(column, { ascending }).limit(limit);
      if (userId) query = query.eq('user_id', userId);
      else query = query.eq('anonymous_session_id', getAnonymousSessionId());
      const result = await query;
      if (result.error && /anonymous_session_id/i.test(result.error.message || '')) {
        return withError(await supabase.from(table).select('*').is('user_id', null).order(column, { ascending }).limit(limit));
      }
      return withError(result);
    },
    async update(id, payload) {
      return withError(await supabase.from(table).update(payload).eq('id', id).select('*').single());
    },
    async delete(id) {
      return withError(await supabase.from(table).delete().eq('id', id));
    }
  };
}
async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return normalizeUser(data.user);
}

export const api = {
  auth: {
    me: getCurrentUser,
    async loginViaEmailPassword(email, password) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return normalizeUser(data.user);
    },
    async register({ email, password }) {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      return data;
    },
    async verifyOtp({ email, otpCode }) {
      const { data, error } = await supabase.auth.verifyOtp({ email, token: otpCode, type: 'signup' });
      if (error) throw error;
      return data.session ? { access_token: data.session.access_token } : data;
    },
    async resendOtp(email) {
      const { data, error } = await supabase.auth.resend({ type: 'signup', email });
      if (error) throw error;
      return data;
    },
    async setToken(accessToken) {
      return accessToken;
    },
    async logout(returnTo) {
      await supabase.auth.signOut();
      if (returnTo) window.location.href = returnTo;
    },
    redirectToLogin(returnTo = '/') {
      window.location.href = `/login?returnTo=${encodeURIComponent(returnTo)}`;
    },
    async loginWithProvider(provider, returnTo = '/') {
      const redirectTo = new URL(returnTo, window.location.origin).href;
      const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo } });
      if (error) throw error;
    },
    async resetPasswordRequest(email) {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });
      if (error) throw error;
      return data;
    },
    async resetPassword({ newPassword }) {
      const { data, error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      return data;
    }
  },
  entities: Object.fromEntries(Object.entries(tableNames).map(([name, table]) => [name, entity(table)])),
  alerts: {
    async notifyHighRiskReport(report) {
      const { data, error } = await supabase.functions.invoke('jobshield-alerts', { body: { report } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    }
  },
  storage: {
    async uploadFile(file) {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
      const path = `${crypto.randomUUID()}-${safeName}`;
      const { error } = await supabase.storage.from('jobshield-uploads').upload(path, file);
      if (error) throw error;
      const { data } = supabase.storage.from('jobshield-uploads').getPublicUrl(path);
      return { file_url: data.publicUrl };
    }
  }
};

