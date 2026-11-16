// GET THE APP (PLAN.md 20 C; Vin, 16/11: «để họ chơi cho vui. rồi thích thì tải về máy chạy thật»): what the app does that
// the web does not, said as it is (app/fleet.py, app/sources.py: it goes out when the person sails, it reads the boards
// live, it asks each posting whether it is still up, it keeps everything on the computer), and where to get it. The
// download is the newest GitHub release's Windows installer, looked up when the sheet is opened; until there is one, the
// sheet says the app comes out this week. Never shown in the app itself.

const REPO = 'VinhDac/goodluck-fishing';
const $ = (id) => document.getElementById(id);
let found = null;                                                     // the newest release's installer, once looked up

async function latest() {
  if (found) return found;
  try {
    const r = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, { headers: { Accept: 'application/vnd.github+json' } });
    if (!r.ok) return null;                                           // no release yet (404), or asked too often: ask again next time
    const rel = await r.json(), exe = (rel.assets || []).find((a) => /\.exe$/i.test(a.name));
    if (exe) found = { url: exe.browser_download_url, mb: Math.max(1, Math.round(exe.size / 1e6)), version: rel.tag_name };
    return found;
  } catch (e) { return null; }                                        // offline
}

// the sheet; closed() when it is put away
export function openApp(closed) {
  const get = $('appGet'), said = $('appSaid');
  get.hidden = true; said.textContent = 'Looking for the newest version…';
  $('app').hidden = false;
  $('appClose').onclick = () => { $('app').hidden = true; if (closed) closed(); };
  latest().then((f) => {
    if ($('app').hidden) return;
    if (f) {
      get.href = f.url; get.textContent = `Download for Windows · ${f.mb} MB`; get.hidden = false;
      // a new app no one has signed: Windows says so the first time, and the way past it is plain to say
      said.textContent = `Version ${String(f.version || '').replace(/^v/i, '')}, for Windows 10 or 11 (Mac later). Windows may say it protected your PC from an app it does not know yet: press More info, then Run anyway.`;
    }
    else said.textContent = 'The Windows app comes out this week. Fish here meanwhile.';
  });
}
