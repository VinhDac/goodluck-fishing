// WHERE THE FISH COME FROM: each company's own job board, read straight from the browser (each of these answers any
// page: CORS open, tried 13 Nov 2026). No server, no scraping: the boards publish these lists for anyone to read.

// The first lakes: the 35 company boards GoodLuck already read (JobA-Z config/boards.toml), more to come.
export const COMPANIES = [
  ...['mangroup', 'janestreet', 'imc', 'point72', 'aqr', 'squarepointcapital', 'gsacapital', 'winton', 'quadraturecapital',
    'jumptrading', 'towerresearchcapital', 'dvtrading', 'schonfeld', 'aquaticcapitalmanagement', 'deepfinresearch', 'monzo',
    'wise', 'tide', 'ebury', 'gocardless', 'stripe', 'helsing', 'dmgmedia'].map((slug) => ({ ats: 'greenhouse', slug })),
  ...['zopa', 'spotify', 'palantir', 'kpler'].map((slug) => ({ ats: 'lever', slug })),
  ...['ramp', 'cohere', 'elevenlabs', 'synthesia', 'tradinghub', 'trainline', 'abound'].map((slug) => ({ ats: 'ashby', slug })),
];

// a company's name as people write it, when its board does not say
const NAMES = { mangroup: 'Man Group', janestreet: 'Jane Street', imc: 'IMC', point72: 'Point72', aqr: 'AQR',
  squarepointcapital: 'Squarepoint', gsacapital: 'GSA Capital', winton: 'Winton', quadraturecapital: 'Quadrature',
  jumptrading: 'Jump Trading', towerresearchcapital: 'Tower Research', dvtrading: 'DV Trading', schonfeld: 'Schonfeld',
  aquaticcapitalmanagement: 'Aquatic', deepfinresearch: 'Deepfin', monzo: 'Monzo', wise: 'Wise', tide: 'Tide', ebury: 'Ebury',
  gocardless: 'GoCardless', stripe: 'Stripe', helsing: 'Helsing', dmgmedia: 'dmg media', zopa: 'Zopa', spotify: 'Spotify',
  palantir: 'Palantir', kpler: 'Kpler', ramp: 'Ramp', cohere: 'Cohere', elevenlabs: 'ElevenLabs', synthesia: 'Synthesia',
  tradinghub: 'TradingHub', trainline: 'Trainline', abound: 'Abound', deductive: 'Deductive' };
export const nameOf = (c) => NAMES[c.slug] || c.slug.replace(/^./, (x) => x.toUpperCase());

// each board's own list, made one shape: {id, title, company, place, url, posted (ms), text}
const READ = {
  greenhouse: async (c, signal) => {
    const r = await fetch(`https://boards-api.greenhouse.io/v1/boards/${c.slug}/jobs?content=true`, { signal });
    const d = await r.json();
    return (d.jobs || []).map((j) => ({ id: `gh:${c.slug}:${j.id}`, title: j.title, company: j.company_name || nameOf(c),
      place: (j.location && j.location.name) || '', url: j.absolute_url, posted: Date.parse(j.first_published || j.updated_at) || 0,
      text: plain(j.content || '') }));
  },
  lever: async (c, signal) => {
    const r = await fetch(`https://api.lever.co/v0/postings/${c.slug}?mode=json`, { signal });
    const d = await r.json();
    return (Array.isArray(d) ? d : []).map((j) => ({ id: `lv:${c.slug}:${j.id}`, title: j.text, company: nameOf(c),
      place: ((j.categories && (j.categories.allLocations || [j.categories.location])) || []).filter(Boolean).join('; '),
      url: j.hostedUrl, posted: j.createdAt || 0, text: j.descriptionPlain || '' }));
  },
  ashby: async (c, signal) => {
    const r = await fetch(`https://api.ashbyhq.com/posting-api/job-board/${c.slug}`, { signal });
    const d = await r.json();
    return (d.jobs || []).filter((j) => j.isListed !== false).map((j) => ({ id: `ab:${c.slug}:${j.id}`, title: j.title,
      company: nameOf(c), place: [j.location, ...((j.secondaryLocations || []).map((s) => s.location))].filter(Boolean).join('; ')
        + (j.isRemote ? ' (remote)' : ''), url: j.jobUrl, posted: Date.parse(j.publishedAt) || 0, text: j.descriptionPlain || '' }));
  },
};

// Greenhouse sends its words as escaped HTML
function plain(html) {
  const t = document.createElement('textarea');
  t.innerHTML = html;
  const d = document.createElement('div');
  d.innerHTML = t.value;
  return (d.textContent || '').replace(/\s+/g, ' ').trim();
}

// THE SONAR: every lake read, a few at a time, each one's jobs handed over as it comes; a lake that does not answer in
// 15 seconds, or answers wrong, is said and passed by. `onLake(company, jobs | null, error)`.
export async function sonar(companies, onLake, atOnce = 6) {
  const queue = companies.slice();
  async function worker() {
    while (queue.length) {
      const c = queue.shift();
      const ctl = new AbortController();
      const timer = setTimeout(() => ctl.abort(), 15000);
      try {
        onLake(c, await READ[c.ats](c, ctl.signal), null);
      } catch (e) {
        onLake(c, null, e);
      } finally {
        clearTimeout(timer);
      }
    }
  }
  await Promise.all(Array.from({ length: atOnce }, worker));
}
