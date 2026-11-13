// THE SCORE (DESIGN.md step 2): of what a job asks, how much the CV speaks to, each ask weighed by how often the posting
// names it (three times at most), as GoodLuck scores. By rule, in the browser: no model, nothing sent anywhere. The score
// is the fish's size.

// what a posting can ask, each with the ways it is written (the first is its name)
const SKILLS = [
  ['python'], ['java'], ['javascript', 'js'], ['typescript'], ['c++', 'cpp'], ['c#', '.net', 'dotnet'], ['golang'],
  ['rust'], ['scala'], ['kotlin'], ['swift'], ['ruby'], ['php'], ['r programming', 'rstudio'], ['matlab'], ['sql', 'mysql', 'postgres', 'postgresql'],
  ['nosql', 'mongodb', 'dynamodb'], ['bash', 'shell scripting'], ['linux', 'unix'], ['git'],
  ['react', 'react.js', 'reactjs'], ['node', 'node.js', 'nodejs'], ['vue'], ['angular'], ['html'], ['css'], ['graphql'], ['rest api', 'restful'],
  ['django'], ['flask'], ['fastapi'], ['spring'], ['microservices'], ['distributed systems'], ['api', 'apis'],
  ['aws', 'amazon web services'], ['gcp', 'google cloud'], ['azure'], ['docker'], ['kubernetes', 'k8s'], ['terraform'], ['ci/cd', 'ci cd', 'continuous integration'],
  ['machine learning', 'ml'], ['deep learning'], ['artificial intelligence', 'ai'], ['llm', 'llms', 'large language models', 'large language model'],
  ['nlp', 'natural language processing'], ['computer vision'], ['pytorch'], ['tensorflow'], ['scikit-learn', 'sklearn'], ['pandas'], ['numpy'],
  ['statistics', 'statistical'], ['probability'], ['mathematics', 'maths', 'math'], ['optimization', 'optimisation'], ['time series'],
  ['data analysis', 'data analytics', 'analytics'], ['data engineering', 'data pipelines', 'etl'], ['spark', 'pyspark'], ['airflow'], ['kafka'],
  ['snowflake'], ['dbt'], ['tableau'], ['power bi', 'powerbi'], ['excel'], ['looker'], ['a/b testing', 'ab testing', 'experimentation'],
  ['rag', 'retrieval augmented generation'], ['prompt engineering'], ['ai agents', 'agentic'], ['mlops'], ['evals', 'model evaluation'],
  ['quantitative', 'quant'], ['trading'], ['derivatives'], ['risk management'], ['fixed income'], ['equities'],
  ['financial modelling', 'financial modeling'], ['accounting'], ['payments'], ['compliance'], ['fintech'], ['crypto', 'blockchain'],
  ['product management', 'product manager', 'roadmap'], ['agile', 'scrum'], ['stakeholder management', 'stakeholders'], ['user research'],
  ['figma'], ['ux', 'user experience'], ['ui', 'user interface'], ['design systems'],
  ['sales'], ['account management'], ['marketing'], ['seo'], ['crm', 'salesforce', 'hubspot'], ['customer success'],
  ['security', 'cybersecurity'], ['networking'], ['testing', 'test automation', 'qa'], ['backend', 'back-end', 'back end'],
  ['frontend', 'front-end', 'front end'], ['full stack', 'full-stack', 'fullstack'], ['mobile', 'ios', 'android'], ['embedded'],
];

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// each spelling as a whole word ("ai" never inside "maintain"); c++, c# and .net by their own edges
const PATTERNS = SKILLS.map((forms) => ({
  name: forms[0],
  rx: new RegExp(forms.map((f) => `(?:^|[^a-z0-9+#.])${esc(f.trim())}(?=$|[^a-z0-9+#])`).join('|'), 'g'),
}));

/** {skill: how many times the text names it} */
export function asks(text) {
  const t = ` ${String(text || '').toLowerCase()} `;
  const out = new Map();
  for (const p of PATTERNS) {
    const n = (t.match(p.rx) || []).length;
    if (n) out.set(p.name, n);
  }
  return out;
}

/** The job's score against the CV's skills, 0 to 100, with what it asks that the CV says and does not; null when the
 *  posting names fewer than three skills (too little to judge: shown as an unread fish, never a low one). */
export function score(job, cvSkills) {
  const a = asks(`${job.title} ${job.text}`);
  if (a.size < 3) return { score: null, have: [], miss: [] };
  let got = 0, all = 0;
  const have = [], miss = [];
  for (const [skill, n] of a) {
    const w = Math.min(3, n);
    all += w;
    if (cvSkills.has(skill)) { got += w; have.push(skill); } else miss.push(skill);
  }
  const byWeight = (x, y) => Math.min(3, a.get(y)) - Math.min(3, a.get(x));
  return { score: Math.round((100 * got) / all), have: have.sort(byWeight), miss: miss.sort(byWeight) };
}

/** a fish's size from its score: gold, big, medium, small, or unread */
export function sizeOf(s) {
  if (s == null) return 'unread';
  return s >= 85 ? 'gold' : s >= 70 ? 'big' : s >= 50 ? 'medium' : 'small';
}

// ---- the person's own filters: their titles and where they work ----------------------------------------------------
const words = (s) => String(s || '').toLowerCase().match(/[a-z0-9+#]+/g) || [];
const LEVEL = new Set(['senior', 'sr', 'junior', 'jr', 'lead', 'principal', 'staff', 'head', 'graduate', 'intern', 'associate', 'i', 'ii', 'iii', 'of', 'and', 'the', 'a']);

/** A job's title fits one of theirs when its last word (what the job is: engineer, analyst) is in it, and half of the
 *  others; no title given, every job fits. */
export function titleFits(title, titles) {
  if (!titles.length) return true;
  const have = new Set(words(title));
  const near = (w) => have.has(w) || have.has(w.replace(/s$/, '')) || have.has(`${w}s`);
  return titles.some((t) => {
    const core = words(t).filter((w) => !LEVEL.has(w));
    if (!core.length || !near(core[core.length - 1])) return false;
    const rest = core.slice(0, -1);
    return rest.filter(near).length >= Math.ceil(rest.length / 2);
  });
}

/** Where it is fits theirs: their city named in its place, or remote work when they take it; no city given, anywhere. */
export function placeFits(place, city, remote) {
  const p = String(place || '').toLowerCase();
  if (remote && /remote|anywhere|work from home/.test(p)) return true;
  if (!city.trim()) return true;
  return p.includes(city.trim().toLowerCase());
}
