/* Account gate: create account → type the code from the email → continue.
   Shown before onboarding when Supabase is configured (see js/config.js).
   The Supabase email templates must include {{ .Token }} (see README). */
window.Cooksy = window.Cooksy || {};
Cooksy.views = Cooksy.views || {};

(() => {
  const { esc } = Cooksy.util;
  const { icon } = Cooksy.ui;
  const A = Cooksy.auth;
  const sender = (Cooksy.config || {}).SENDER_EMAIL || '';

  // mode: 'signup' | 'signin' | 'code' (verify account) | 'forgot' | 'reset' (code + new password)
  const ui = { mode: 'signup', email: '', password: '', code: '', error: '', info: '', busy: false, showPw: false, cooldownUntil: 0 };
  const rerender = () => Cooksy.app.render();
  const set = (patch) => { Object.assign(ui, patch); rerender(); };
  const validEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);
  const cleanCode = (c) => c.replace(/\D/g, '');

  function done(user) {
    Cooksy.store.update((s) => { s.account = { email: user.email, verifiedAt: user.email_confirmed_at || new Date().toISOString() }; });
    Object.assign(ui, { password: '', code: '', mode: 'signup', info: '' });
    Cooksy.app.clearForceAccount();
    Cooksy.ui.toast('Email verified. Welcome to Cooksy!');
  }

  async function run(fn) {
    if (ui.busy) return;
    set({ busy: true, error: '', info: '' });
    try { await fn(); } catch (e) { ui.error = e.message || String(e); }
    set({ busy: false });
  }

  const goToCode = (mode) => Object.assign(ui, { mode, code: '', cooldownUntil: Date.now() + 60000 });

  const spamNotice = () => `
    <div class="banner banner--yellow" role="alert">${icon('alert')}
      <div><strong>Check your spam folder!</strong>The email is most likely in your <b>Spam</b> or <b>Junk</b> folder${sender ? `, from <b>${esc(sender)}</b>` : ''}. If you find it there, tap “Not spam” so future emails reach your inbox.</div>
    </div>`;

  const pwField = (label, autocomplete) => `
    <div class="field"><label for="acc-pw">${label}</label>
      <div class="row" style="flex-wrap:nowrap;gap:8px">
        <input class="input" id="acc-pw" type="${ui.showPw ? 'text' : 'password'}" data-input="pw" value="${esc(ui.password)}" autocomplete="${autocomplete}" minlength="8" required>
        <button type="button" class="btn btn--ghost btn--sm" data-action="toggle-pw" aria-pressed="${ui.showPw}">${ui.showPw ? 'Hide' : 'Show'}</button>
      </div>
      ${autocomplete === 'new-password' ? '<span class="hint">At least 8 characters.</span>' : ''}
    </div>`;

  const emailField = () => `
    <div class="field"><label for="acc-email">Email</label>
      <input class="input" id="acc-email" type="email" data-input="email" value="${esc(ui.email)}" autocomplete="email" inputmode="email" required></div>`;

  const codeField = () => `
    <div class="field"><label for="acc-code">Verification code</label>
      <input class="input code-input" id="acc-code" data-input="code" value="${esc(ui.code)}" inputmode="numeric" autocomplete="one-time-code" maxlength="10" placeholder="Code" aria-describedby="acc-code-hint">
      <span class="hint" id="acc-code-hint">The code is valid for 1 hour.</span></div>`;

  function resendRow(action) {
    const wait = Math.max(0, Math.ceil((ui.cooldownUntil - Date.now()) / 1000));
    return `<div class="row" style="justify-content:center">
      <button type="button" class="btn btn--ghost btn--sm" data-action="${action}" ${wait || ui.busy ? 'disabled' : ''}>${wait ? `Send a new code in ${wait}s` : 'Send a new code'}</button>
      <button type="button" class="btn btn--ghost btn--sm" data-action="mode" data-mode="${ui.mode === 'reset' ? 'signin' : 'signup'}">${ui.mode === 'reset' ? 'Back to sign in' : 'Use a different email'}</button>
    </div>`;
  }

  function body() {
    const err = ui.error ? `<p class="error-text" role="alert">${esc(ui.error)}</p>` : '';
    const info = ui.info ? `<div class="banner banner--info" role="status">${icon('check')}<div>${esc(ui.info)}</div></div>` : '';
    const busy = ui.busy ? ' disabled aria-busy="true"' : '';

    if (ui.mode === 'code') {
      return `
        <h1>Enter your code</h1>
        <p class="lead">We emailed a verification code to <b>${esc(ui.email)}</b>. Type it below to verify your account.</p>
        <div class="onb-body">
          ${spamNotice()}
          ${info}
          <form class="stack" data-submit="verify" style="--stack:12px" novalidate>
            ${codeField()}
            ${err}
            <button class="btn btn--primary btn--block" type="submit"${busy}>${ui.busy ? 'Checking…' : 'Verify'}</button>
          </form>
          ${resendRow('resend')}
        </div>`;
    }
    if (ui.mode === 'reset') {
      return `
        <h1>Reset your password</h1>
        <p class="lead">We emailed a code to <b>${esc(ui.email)}</b>. Enter it and choose a new password.</p>
        <div class="onb-body">
          ${spamNotice()}
          ${info}
          <form class="stack" data-submit="reset" style="--stack:12px" novalidate>
            ${codeField()}
            ${pwField('New password', 'new-password')}
            ${err}
            <button class="btn btn--primary btn--block" type="submit"${busy}>${ui.busy ? 'Saving…' : 'Save new password'}</button>
          </form>
          ${resendRow('resend-reset')}
        </div>`;
    }
    if (ui.mode === 'forgot') {
      return `
        <h1>Forgot your password?</h1>
        <p class="lead">We’ll email you a code to reset it.</p>
        <form class="onb-body" data-submit="forgot" novalidate>
          ${emailField()}
          ${err}
          <button class="btn btn--primary btn--block" type="submit"${busy}>Send code</button>
          <button type="button" class="btn btn--ghost" data-action="mode" data-mode="signin">${icon('back')} Back to sign in</button>
        </form>`;
    }
    const signup = ui.mode === 'signup';
    return `
      <h1>${signup ? 'Create your account' : 'Welcome back'}</h1>
      <p class="lead">${signup ? 'We’ll email you a code to verify your email.' : 'Sign in with your verified email.'}</p>
      <div class="tabs" role="tablist" style="margin:20px 0 0">
        <button type="button" role="tab" aria-selected="${signup}" data-action="mode" data-mode="signup">Create account</button>
        <button type="button" role="tab" aria-selected="${!signup}" data-action="mode" data-mode="signin">Sign in</button>
      </div>
      <form class="onb-body" data-submit="${signup ? 'signup' : 'signin'}" novalidate>
        ${emailField()}
        ${pwField('Password', signup ? 'new-password' : 'current-password')}
        ${err}
        <button class="btn btn--primary btn--block" type="submit"${busy}>${ui.busy ? 'Please wait…' : signup ? 'Create account' : 'Sign in'}</button>
        ${signup ? '<p class="small muted">Your email is only used to sign in. Your recipes, kitchen and lists stay on this device.</p>'
          : '<button type="button" class="link small" style="align-self:flex-start" data-action="mode" data-mode="forgot">Forgot password?</button>'}
      </form>`;
  }

  // Tick the "send a new code" countdown.
  setInterval(() => {
    if ((ui.mode === 'code' || ui.mode === 'reset') && ui.cooldownUntil > Date.now() - 1000 && document.querySelector('[data-action^="resend"]')) rerender();
  }, 1000);

  Cooksy.views.account = {
    render() {
      return `<div class="onboarding"><div class="onb-card">
        <img class="onb-logo" src="assets/cooksy-logo.png" alt="Cooksy" style="width:min(150px,45%)">
        ${body()}
      </div></div>`;
    },
    afterRender(root) {
      if (!document.activeElement || document.activeElement === document.body) root.querySelector('#acc-code, #acc-email, #acc-pw')?.focus();
    },
    /** Called by the app when the page was opened from an email link. */
    setMode(mode, extra = {}) { Object.assign(ui, { mode, error: '', info: '' }, extra); },
    inputs: {
      email: (el) => { ui.email = el.value.trim(); },
      pw: (el) => { ui.password = el.value; },
      code: (el) => { ui.code = cleanCode(el.value); },
    },
    actions: {
      mode: (el) => set({ mode: el.dataset.mode, error: '', info: '', code: '' }),
      'toggle-pw': () => set({ showPw: !ui.showPw }),
      resend: () => run(async () => {
        await A.resend(ui.email);
        ui.cooldownUntil = Date.now() + 60000;
        ui.code = '';
        ui.info = 'New code sent. Use the code from the newest email.';
      }),
      'resend-reset': () => run(async () => {
        await A.resetPassword(ui.email);
        ui.cooldownUntil = Date.now() + 60000;
        ui.code = '';
        ui.info = 'New code sent. Use the code from the newest email.';
      }),
    },
    submits: {
      signup: () => run(async () => {
        if (!validEmail(ui.email)) throw new Error('Please enter a valid email address.');
        if (ui.password.length < 8) throw new Error('Password must be at least 8 characters.');
        const r = await A.signUp(ui.email, ui.password);
        if (r.verified) { done(await A.currentUser() || { email: ui.email }); return; }
        goToCode('code');
      }),
      signin: () => run(async () => {
        if (!validEmail(ui.email) || !ui.password) throw new Error('Enter your email and password.');
        try {
          done(await A.signIn(ui.email, ui.password));
        } catch (e) {
          if (!e.unverified) throw e;
          await A.resend(ui.email); // account exists but isn't verified yet: send a fresh code
          goToCode('code');
          ui.info = 'Your email isn’t verified yet. We sent you a new code.';
        }
      }),
      verify: () => run(async () => {
        if (!/^\d{6,10}$/.test(ui.code)) throw new Error('Enter the code from the email (numbers only).');
        done(await A.verifyCode(ui.email, ui.code, 'signup'));
      }),
      forgot: () => run(async () => {
        if (!validEmail(ui.email)) throw new Error('Please enter a valid email address.');
        await A.resetPassword(ui.email);
        goToCode('reset');
      }),
      reset: () => run(async () => {
        if (!/^\d{6,10}$/.test(ui.code)) throw new Error('Enter the code from the email (numbers only).');
        if (ui.password.length < 8) throw new Error('Password must be at least 8 characters.');
        const user = await A.verifyCode(ui.email, ui.code, 'recovery');
        await A.updatePassword(ui.password);
        done(user);
        Cooksy.ui.toast('Password updated');
      }),
    },
  };
})();
