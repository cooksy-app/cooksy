/* Public configuration. These values are safe to publish: the Supabase anon key is designed
   to be used in browsers. NEVER put an email/SMTP password or a Supabase service_role key here.
   Leave SUPABASE_URL empty to run Cooksy without accounts (local-only mode). */
window.Cooksy = window.Cooksy || {};

Cooksy.config = {
  SUPABASE_URL: 'https://ztvataiaxcvuibgpnoxq.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_EXU6bPoghReUJWwPZptkbg_X1kgp_nK',
  // Shown on the "check your email" screen so people know what to look for in Spam.
  SENDER_EMAIL: 'no.reply.cooksy@gmail.com',
  // Where the link in the verification email sends people. Must be listed under
  // Supabase → Authentication → URL Configuration → Redirect URLs.
  EMAIL_REDIRECT_URL: 'https://cooksy-app.github.io/cooksy/app/',
};
