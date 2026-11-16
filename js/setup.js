// THE LOBBY, PART 2 (PLAN.md 9): the three things asked once. The CV (a PDF dropped on the desk, or its words pasted),
// read in this browser and never sent; the job titles it suggests, on three sticky notes; where to work, on a map on the
// wall. Kept on this device (PLAN.md 5: the CV never leaves it).
// Before it, on a first visit (PLAN.md 20 B; Vin, 16/11: «để họ chơi cho vui»): one sheet, what they fish for, one press,
// and they play, with a typical CV of that field; their own CV any time later, from the desk or «My CV».
import { asks } from './score.js';
import { CITIES_KNOWN } from './lake.js';

const KEY = 'glf.me';
const $ = (id) => document.getElementById(id);

export const me = (() => { try { return JSON.parse(localStorage.getItem(KEY)) || null; } catch (e) { return null; } })();
function save(v) { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) { /* a private window: this visit alone */ } }

// ---- reading a PDF, with Mozilla's pdf.js, fetched only when one is dropped ---------------------------------------------
const PDFJS = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/';
function loadPdfJs() {
  if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
  return new Promise((ok, no) => {
    const s = document.createElement('script'); s.src = `${PDFJS}pdf.min.js`;
    s.onload = () => { window.pdfjsLib.GlobalWorkerOptions.workerSrc = `${PDFJS}pdf.worker.min.js`; ok(window.pdfjsLib); };
    s.onerror = () => no(new Error('The PDF reader could not be loaded'));
    document.head.appendChild(s);
  });
}
async function pdfText(file) {
  const lib = await loadPdfJs();
  const doc = await lib.getDocument({ data: await file.arrayBuffer() }).promise;
  const pages = [];
  for (let i = 1; i <= Math.min(doc.numPages, 6); i++) {
    const c = await (await doc.getPage(i)).getTextContent();
    pages.push(c.items.map((x) => x.str).join(' '));
  }
  return pages.join('\n');
}

// ---- what the CV suggests: the titles it names (its headline first), else what its skills point at; its city ------------
const TITLES = ['Machine Learning Engineer', 'AI Engineer', 'Data Scientist', 'Data Analyst', 'Data Engineer', 'Research Scientist',
  'Research Engineer', 'Software Engineer', 'Backend Engineer', 'Frontend Engineer', 'Full Stack Engineer', 'Mobile Engineer',
  'iOS Engineer', 'Android Engineer', 'DevOps Engineer', 'Site Reliability Engineer', 'Security Engineer', 'Platform Engineer',
  'QA Engineer', 'Solutions Engineer', 'Sales Engineer', 'Engineering Manager', 'Quantitative Analyst', 'Quantitative Researcher',
  'Quant Developer', 'Product Manager', 'Product Designer', 'UX Designer', 'UI Designer', 'Business Analyst', 'Financial Analyst',
  'Account Executive', 'Account Manager', 'Customer Success Manager', 'Marketing Manager', 'Project Manager', 'Operations Manager',
  'Consultant', 'Accountant', 'Recruiter'];
const CITIES = ['London', 'Manchester', 'Edinburgh', 'Glasgow', 'Bristol', 'Cambridge', 'Oxford', 'Leeds', 'Birmingham', 'Belfast',
  'Cardiff', 'Dublin', 'Paris', 'Berlin', 'Amsterdam', 'Munich', 'Zurich', 'New York', 'San Francisco', 'Seattle', 'Toronto',
  'Singapore', 'Sydney', 'Hanoi', 'Ho Chi Minh City'];
export function suggestTitles(cv) {
  const t = cv.toLowerCase(), found = [];
  for (const title of TITLES) {
    const at = t.indexOf(title.toLowerCase());
    if (at >= 0) found.push([at, title]);
  }
  const out = found.sort((a, b) => a[0] - b[0]).map((f) => f[1]);
  const sk = asks(cv);
  const lean = [[['pytorch', 'machine learning', 'deep learning', 'llm'], 'Machine Learning Engineer'],
    [['sql', 'tableau', 'power bi', 'excel'], 'Data Analyst'], [['react', 'javascript', 'typescript'], 'Frontend Engineer'],
    [['python', 'java', 'golang', 'c++'], 'Software Engineer'], [['figma', 'ux'], 'Product Designer']];
  for (const [skills, title] of lean) if (skills.some((s) => sk.has(s)) && !out.includes(title)) out.push(title);
  return out.slice(0, 3);
}
export function suggestCity(cv) {
  const t = cv.toLowerCase();
  const hits = CITIES.map((c) => [t.indexOf(c.toLowerCase()), c]).filter((x) => x[0] >= 0).sort((a, b) => a[0] - b[0]);
  return hits.length ? hits[0][1] : '';
}

// ---- the first visit: what they fish for (PLAN.md 20 B) ---------------------------------------------------------------------
// Each field comes with the titles it fishes for and a typical CV of it: the skills its postings in the shared store ask
// most (counted 16/11), trimmed so a golden letter stays a rare one (about one in ten to one in four). Said plainly while
// it is in use: a letter «fits a typical Data & AI CV», never «fits you».
export const FIELDS = [
  { name: 'Software', titles: ['Software Engineer', 'Backend Engineer', 'Frontend Engineer', 'Full Stack Engineer', 'Developer'],
    skills: ['python', 'backend', 'api', 'frontend', 'testing', 'sql', 'aws', 'artificial intelligence', 'machine learning', 'full stack', 'distributed systems', 'ci/cd', 'kubernetes', 'security'] },
  { name: 'Data & AI', titles: ['Data Scientist', 'Data Analyst', 'Data Engineer', 'Machine Learning Engineer', 'AI Engineer'],
    skills: ['python', 'machine learning', 'artificial intelligence', 'llm', 'sql', 'data analysis', 'data engineering', 'api', 'ai agents', 'stakeholder management', 'gcp', 'testing', 'pytorch', 'statistics', 'pandas'] },
  { name: 'Design', titles: ['Product Designer', 'UX Designer', 'Designer'],
    skills: ['figma', 'ux', 'ui', 'design systems', 'user research', 'artificial intelligence'] },
  { name: 'Product', titles: ['Product Manager', 'Product Owner', 'Program Manager'],
    skills: ['product management', 'stakeholder management', 'ux', 'data analysis', 'api', 'a/b testing', 'agile', 'user research', 'sql', 'artificial intelligence'] },
  { name: 'Marketing', titles: ['Marketing', 'Communications', 'Social Media', 'Brand Manager'],
    skills: ['marketing', 'seo', 'crm', 'data analysis', 'a/b testing', 'artificial intelligence'] },
  { name: 'Sales', titles: ['Account Executive', 'Sales', 'Business Development', 'Account Manager'],
    skills: ['sales', 'crm', 'account management', 'customer success', 'excel', 'artificial intelligence'] },
  { name: 'Finance', titles: ['Financial Analyst', 'Accountant', 'Finance Manager', 'Controller'],
    skills: ['accounting', 'excel', 'financial modelling', 'sql', 'data analysis', 'risk management', 'artificial intelligence'] },
  { name: 'People & Ops', titles: ['Recruiter', 'Talent', 'People', 'Operations Manager', 'Customer Success Manager'],
    skills: ['customer success', 'crm', 'excel', 'data analysis', 'account management', 'stakeholder management', 'artificial intelligence'] },
];
// the city the computer's own clock is set to, when the store knows it (Europe/London: London); else anywhere
export function cityOfZone() {
  let zone = '';
  try { zone = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) { return ''; }
  const last = zone.split('/').pop().replace(/_/g, ' ').toLowerCase();
  const city = ['ho chi minh', 'saigon'].includes(last) ? 'ho chi minh city' : last;
  return CITIES_KNOWN.includes(city) ? city.replace(/\b[a-z]/g, (c) => c.toUpperCase()) : '';
}
export function pick(done) {
  let chosen = null;
  show('field');
  const box = $('fieldChips'); box.replaceChildren();
  for (const f of FIELDS) {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'fieldnote'; b.textContent = f.name;
    b.onclick = () => { chosen = f; for (const x of box.children) x.classList.toggle('on', x === b); say('field', ''); };
    box.appendChild(b);
  }
  $('fieldCity').value = cityOfZone();
  $('fieldRemote').checked = true;
  $('fieldGo').onclick = () => {
    if (!chosen) return say('field', 'Pick one first: any of them.');
    const v = { cv: '', sample: chosen.name, titles: chosen.titles.slice(), city: $('fieldCity').value.trim(), remote: $('fieldRemote').checked, skills: chosen.skills.slice() };
    save(v);
    show(null);
    done(v);
  };
  $('fieldCv').onclick = () => begin(done, () => pick(done));           // they have their CV at hand: the CV's own three steps
}

// ---- the three steps, one after another; done(profile) when all three are answered; «Not now» puts the paper away (back(),
// if given: the first visit's sheet again) ------------------------------------------------------------------------------------
export function begin(done, back) {
  const v = { cv: '', titles: [], city: '', remote: true };
  show('paper');
  $('paperLater').onclick = () => { show(null); $('stage').ondrop = null; if (back) back(); };
  const take = async (getText) => {
    say('paper', 'Reading it…');
    try {
      const text = (await getText()).replace(/\s+/g, ' ').trim();
      if (asks(text).size < 3 && text.length < 200) return say('paper', 'Little could be read in it: try the PDF itself, or paste its words.');
      v.cv = text; titlesStep(v, done);
    } catch (e) { say('paper', `It could not be read (${e.message}). Paste its words instead.`); }
  };
  // a PDF dropped anywhere on the scene, or chosen, or the words pasted
  const stage = $('stage');
  if (matchMedia('(pointer: coarse)').matches) { $('paper').querySelector('h2').textContent = 'Your CV, please'; $('paper').querySelector('p').textContent = 'A PDF. It is read on this phone and never sent anywhere.'; }
  stage.ondragover = (e) => e.preventDefault();
  stage.ondrop = (e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) take(() => fileText(f)); };
  $('cvFile').onchange = () => { const f = $('cvFile').files[0]; if (f) take(() => fileText(f)); };
  $('pasteGo').onclick = () => take(async () => $('cvPaste').value);
}
async function fileText(f) {
  if (/\.pdf$/i.test(f.name) || f.type === 'application/pdf') return pdfText(f);
  if (/\.(txt|md)$/i.test(f.name)) return f.text();
  throw new Error('a PDF, please');
}
function titlesStep(v, done) {
  show('notes');
  const box = $('noteList'); box.replaceChildren();
  const picked = new Set();
  const add = (title, on) => {
    const n = document.createElement('button'); n.className = 'note' + (on ? ' on' : ''); n.type = 'button'; n.textContent = title;
    if (on) picked.add(title);
    n.onclick = () => { if (picked.has(title)) { picked.delete(title); n.classList.remove('on'); } else if (picked.size < 3) { picked.add(title); n.classList.add('on'); } };
    box.appendChild(n);
  };
  suggestTitles(v.cv).forEach((t) => add(t, true));
  $('noteOwn').value = '';
  $('noteAdd').onclick = () => { const t = $('noteOwn').value.trim(); if (t && picked.size < 3) { add(t, true); $('noteOwn').value = ''; } };
  $('notesGo').onclick = () => {
    if (!picked.size) return say('notes', 'Keep one note at least, or write your own.');
    v.titles = [...picked]; placeStep(v, done);
  };
}
function placeStep(v, done) {
  show('map');
  $('city').value = suggestCity(v.cv);
  $('remote').checked = true;
  $('mapGo').onclick = () => {
    v.city = $('city').value.trim(); v.remote = $('remote').checked;
    try { localStorage.setItem('glf.dream', JSON.stringify($('dream').value.split(',').map((x) => x.trim()).filter(Boolean).slice(0, 8))); } catch (e) { /* this visit alone */ }
    save({ ...v, skills: [...asks(v.cv).keys()] });
    show(null);
    done(v);
  };
}
function show(which) {
  for (const id of ['field', 'paper', 'notes', 'map']) $(id).hidden = id !== which;
  if (which) say(which, '');
}
function say(which, text) { const el = document.querySelector(`#${which} .said`); if (el) el.textContent = text; }
