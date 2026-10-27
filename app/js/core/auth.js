/* Email accounts with verification, via Supabase Auth (hosted; no server code of our own).
   Verification emails are sent by Supabase through the SMTP account configured in its dashboard.
   App data (profile, kitchen, lists) still lives on the device; the account only proves the email. */
window.Cooksy = window.Cooksy || {};

Cooksy.auth = (() => {
  const cfg = Cooksy.config || {};
  const enabled = !!(cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY && window.supabase);
  const client = enabled
    ? window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY, {
      auth: { flowType: 'implicit', detectSessionInUrl: true, persistSession: true },
    })
    : null;

  const redirectTo = () => cfg.EMAIL_REDIRECT_URL || location.origin + location.pathname;

  /** Friendlier wording for the errors people actually hit. */
  function message(error) {
    const m = (error?.message || String(error || '')).toLowerCase();
    if (m.includes('email not confirmed')) return 'Please verify your email first. Check your inbox and spam folder.';
    if (m.includes('invalid login')) return 'Email or password is incorrect.';
    if (m.includes('already registered') || m.includes('already been registered')) return 'An account with this email already exists. Try signing in.';
    if (m.includes('rate limit') || m.includes('too many')) return 'Too many attempts. Please wait a minute and try again.';
    if (m.includes('password')) return error.message;
    if (m.includes('fetch') || m.includes('network')) return 'Can’t reach the server. Check your internet connection.';
    return error?.message || 'Something went wrong. Please try again.';
  }

  async function signUp(email, password) {
    const { data, error } = await client.auth.signUp({ email, password, options: { emailRedirectTo: redirectTo() } });
    if (error) throw new Error(message(error));
    // Supabase returns a user with no identities when the email is already registered.
    if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      throw new Error('An account with this email already exists. Try signing in.');
    }
    return { verified: !!data.session };
  }

  async function signIn(email, password) {
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) {
      const err = new Error(message(error));
      err.unverified = /email not confirmed/i.test(error.message || '');
      throw err;
    }
    return data.user;
  }

  async function resend(email) {
    const { error } = await client.auth.resend({ type: 'signup', email, options: { emailRedirectTo: redirectTo() } });
    if (error) throw new Error(message(error));
  }

  /** Check the code from the email. type: 'signup' (verify account) or 'recovery' (password reset). */
  async function verifyCode(email, token, type) {
    const { data, error } = await client.auth.verifyOtp({ email, token, type });
    if (error) {
      const m = (error.message || '').toLowerCase();
      if (m.includes('expired') || m.includes('invalid')) throw new Error('That code is wrong or has expired. Check the latest email, or tap “Send a new code”.');
      throw new Error(message(error));
    }
    return data.user;
  }

  async function resetPassword(email) {
    const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo: redirectTo() });
    if (error) throw new Error(message(error));
  }

  /** Current verified user, if any (also completes a sign-in from an email link in the URL). */
  async function currentUser() {
    if (!client) return null;
    const { data } = await client.auth.getSession();
    const user = data.session?.user;
    return user && user.email_confirmed_at ? user : null;
  }

  async function updatePassword(password) {
    const { error } = await client.auth.updateUser({ password });
    if (error) throw new Error(message(error));
  }

  async function signOut() {
    if (client) await client.auth.signOut().catch(() => {});
  }

  /** True when the page was opened from a verification / magic link (tokens in the URL hash). */
  const isAuthRedirect = () => /access_token=|error_description=|type=signup|type=recovery/.test(location.hash);

  return { enabled, signUp, signIn, resend, verifyCode, resetPassword, updatePassword, currentUser, signOut, isAuthRedirect };
})();
