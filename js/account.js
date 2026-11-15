// THE LOBBY, PART 3 (PLAN.md 9, frame 5): «Where should we send your bucket?». An email, a link in it, and the person is
// in: no password (Supabase's email link). «Later» lets anyone play at once, the bucket kept on this device until they
// sign in. Signed in, what they look for (never the CV: PLAN.md 5) is kept in the table profiles, theirs alone.
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from './config.js';

const LIB = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js';
const $ = (id) => document.getElementById(id);
let client = null;

function load() {
  if (window.supabase) return Promise.resolve(window.supabase);
  return new Promise((ok, no) => {
    const s = document.createElement('script'); s.src = LIB;
    s.onload = () => ok(window.supabase); s.onerror = () => no(new Error('the sign-in service could not be loaded'));
    document.head.appendChild(s);
  });
}
// the client, made once; a link opened from the email is read here and signs the person in
export async function sb() {
  if (!client) client = (await load()).createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: true, detectSessionInUrl: true } });
  return client;
}
export async function user() {
  try { const { data } = await (await sb()).auth.getSession(); return data.session ? data.session.user : null; } catch (e) { return null; }
}
// what the person looks for, kept with their account (no CV)
export async function saveProfile(me) {
  const u = await user();
  if (!u) return false;
  const { error } = await (await sb()).from('profiles').upsert({ user_id: u.id, titles: me.titles, city: me.city, remote: me.remote,
    updated_at: new Date().toISOString() });
  return !error;
}

// the postcard: an email and a link, or later; done(signedIn) when it is put away
export function postcard(done) {
  const card = $('postcard');
  card.hidden = false;
  $('pcSaid').textContent = '';
  $('pcEmail').value = '';
  $('pcLater').onclick = () => { card.hidden = true; done(false); };
  $('pcSend').onclick = async () => {
    const email = $('pcEmail').value.trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { $('pcSaid').textContent = 'That does not look like an email address.'; return; }
    $('pcSend').disabled = true; $('pcSaid').textContent = 'Sending…';
    try {
      const { error } = await (await sb()).auth.signInWithOtp({ email, options: { emailRedirectTo: location.origin + location.pathname } });
      $('pcSaid').textContent = error ? `It did not go: ${error.message}` : 'Sent. Open the link in the email on this device to keep your bucket. You can fish now.';
      if (!error) { $('pcSend').hidden = true; $('pcLater').textContent = 'Fish now'; }
    } catch (e) { $('pcSaid').textContent = `It did not go: ${e.message}`; }
    $('pcSend').disabled = false;
  };
}
