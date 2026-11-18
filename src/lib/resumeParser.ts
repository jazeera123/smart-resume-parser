import type { Candidate } from './supabaseClient';

// ---- Text extraction ----

export async function extractTextFromFile(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  if (name.endsWith('.pdf')) {
    return extractTextFromPdf(file);
  }
  if (name.endsWith('.docx')) {
    return extractTextFromDocx(file);
  }
  throw new Error('Unsupported file type. Please upload a PDF or DOCX file.');
}

async function extractTextFromPdf(file: File): Promise<string> {
  try {
    const pdfjs = await import('pdfjs-dist');
    // Use the bundled worker URL so it works in the browser without extra config.
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url,
    ).toString();

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    const parts: string[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item) => ('str' in item ? (item as { str: string }).str : ''))
        .join(' ');
      parts.push(pageText);
    }
    const text = parts.join('\n').trim();
    if (!text) {
      throw new Error('No selectable text found in this PDF. It may be a scanned image.');
    }
    return text;
  } catch (err) {
    if (err instanceof Error && err.message.includes('No selectable text')) {
      throw err;
    }
    throw new Error('Could not read this PDF file. It may be corrupted or password-protected.');
  }
}

async function extractTextFromDocx(file: File): Promise<string> {
  try {
    const mammoth = await import('mammoth/mammoth.browser');
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    const text = (result.value || '').trim();
    if (!text) {
      throw new Error('No text content found in this DOCX file.');
    }
    return text;
  } catch (err) {
    if (err instanceof Error && err.message.includes('No text content')) {
      throw err;
    }
    throw new Error('Could not read this DOCX file. It may be corrupted.');
  }
}

// ---- Information extraction ----

export type ExtractedInfo = {
  name: string | null;
  email: string | null;
  phone: string | null;
  education: string | null;
  experience: string | null;
  skills: string[];
};

export function extractInfo(text: string): ExtractedInfo {
  return {
    name: extractName(text),
    email: extractEmail(text),
    phone: extractPhone(text),
    education: extractEducation(text),
    experience: extractExperience(text),
    skills: extractSkills(text),
  };
}

function extractEmail(text: string): string | null {
  const match = text.match(/[\w.+-]+@[\w-]+\.[\w.-]+/);
  return match ? match[0] : null;
}

function extractPhone(text: string): string | null {
  // Match international and common formats, with optional country code.
  const patterns = [
    /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3,4}[-.\s]?\d{4}/,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) {
      const cleaned = m[0].replace(/[^\d+]/g, '');
      if (cleaned.length >= 10) return m[0].trim();
    }
  }
  return null;
}

function extractName(text: string): string | null {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  // The name is almost always in the first few non-empty lines, before the email.
  const emailIdx = lines.findIndex((l) => /@/.test(l));
  const searchLimit = emailIdx >= 0 ? Math.min(emailIdx, 6) : 6;
  for (let i = 0; i < searchLimit && i < lines.length; i++) {
    const line = lines[i];
    // A name line: 2-4 words, mostly letters, no digits, not too long.
    const words = line.split(/\s+/);
    const looksLikeName =
      words.length >= 2 &&
      words.length <= 4 &&
      line.length <= 40 &&
      !/\d/.test(line) &&
      !/(@|www\.|http|resume|curriculum|cv|profile)/i.test(line) &&
      /^[A-Za-z][A-Za-z.\-'\s]+$/.test(line);
    if (looksLikeName) return line;
  }
  return null;
}

function extractEducation(text: string): string | null {
  const keywords = [
    'education',
    'academic',
    'qualification',
    'university',
    'college',
    'bachelor',
    'master',
    'phd',
    'b.tech',
    'm.tech',
    'b.e.',
    'm.e.',
    'b.sc',
    'm.sc',
    'diploma',
    'degree',
    'school',
    'gpa',
  ];
  return extractSection(text, keywords, 300);
}

function extractExperience(text: string): string | null {
  const keywords = [
    'experience',
    'employment',
    'work history',
    'professional',
    'career',
    'intern',
    'software engineer',
    'developer',
    'worked at',
    'company',
  ];
  return extractSection(text, keywords, 400);
}

function extractSection(text: string, keywords: string[], maxChars: number): string | null {
  const lower = text.toLowerCase();
  // Find the earliest keyword occurrence.
  let bestIdx = -1;
  for (const kw of keywords) {
    const idx = lower.indexOf(kw);
    if (idx >= 0 && (bestIdx === -1 || idx < bestIdx)) {
      bestIdx = idx;
    }
  }
  if (bestIdx === -1) return null;
  // Take a window of text starting at the keyword, ending at the next blank line or maxChars.
  const start = bestIdx;
  let end = Math.min(start + maxChars, text.length);
  const nextBreak = text.indexOf('\n\n', start);
  if (nextBreak >= 0 && nextBreak < end) end = nextBreak;
  const section = text.slice(start, end).replace(/\s+/g, ' ').trim();
  return section.length > 0 ? section : null;
}

// ---- Skill extraction (dictionary + phrase matching, spaCy-inspired) ----

const SKILL_DICTIONARY = [
  // Languages
  'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'C', 'Go', 'Golang',
  'Ruby', 'PHP', 'Swift', 'Kotlin', 'Rust', 'Scala', 'R', 'MATLAB', 'Perl', 'Dart',
  'Objective-C', 'Shell', 'Bash', 'PowerShell', 'Lua', 'Haskell', 'Clojure', 'Elixir',
  // Frontend
  'React', 'React.js', 'React Native', 'Vue', 'Vue.js', 'Angular', 'Svelte', 'Next.js',
  'Nuxt', 'Redux', 'MobX', 'jQuery', 'HTML', 'HTML5', 'CSS', 'CSS3', 'Tailwind',
  'Tailwind CSS', 'Bootstrap', 'Sass', 'SCSS', 'Less', 'Material-UI', 'Chakra UI',
  'Storybook', 'Webpack', 'Vite', 'Rollup', 'Babel', 'Axios', 'GraphQL', 'Apollo',
  // Backend
  'Node.js', 'Express', 'Express.js', 'NestJS', 'Deno', 'Flask', 'Django', 'FastAPI',
  'Spring', 'Spring Boot', 'Ruby on Rails', 'Rails', 'Laravel', 'ASP.NET', '.NET',
  'ASP.NET Core', 'Gin', 'Echo', 'REST', 'RESTful', 'gRPC', 'Microservices',
  // Databases
  'SQL', 'PostgreSQL', 'Postgres', 'MySQL', 'SQLite', 'MongoDB', 'Redis', 'Cassandra',
  'DynamoDB', 'Elasticsearch', 'Firebase', 'Supabase', 'Oracle', 'MariaDB', 'CouchDB',
  'Neo4j', 'Prisma', 'Sequelize', 'TypeORM', 'SQLAlchemy', 'Mongoose',
  // Cloud / DevOps
  'AWS', 'Azure', 'GCP', 'Google Cloud', 'Docker', 'Kubernetes', 'Terraform',
  'Ansible', 'Jenkins', 'CI/CD', 'GitHub Actions', 'GitLab CI', 'CircleCI', 'Nginx',
  'Apache', 'Linux', 'Unix', 'Helm', 'Pulumi', 'CloudFormation', 'Serverless',
  'Lambda', 'EC2', 'S3', 'RDS', 'Cloudflare', 'Vercel', 'Netlify', 'Heroku',
  // Data / ML
  'Machine Learning', 'Deep Learning', 'NLP', 'Natural Language Processing',
  'Computer Vision', 'TensorFlow', 'PyTorch', 'Keras', 'scikit-learn', 'Pandas',
  'NumPy', 'SciPy', 'Matplotlib', 'Seaborn', 'Jupyter', 'Data Science', 'Data Analysis',
  'Data Engineering', 'ETL', 'Spark', 'Hadoop', 'Kafka', 'Airflow', 'dbt', 'Snowflake',
  'BigQuery', 'Tableau', 'Power BI', 'Looker', 'spaCy', 'OpenAI', 'LangChain',
  'LLM', 'Hugging Face',
  // Tools / Practices
  'Git', 'GitHub', 'GitLab', 'Bitbucket', 'Jira', 'Confluence', 'Agile', 'Scrum',
  'Kanban', 'TDD', 'Unit Testing', 'Jest', 'Vitest', 'Mocha', 'Chai', 'Cypress',
  'Playwright', 'Selenium', 'PyTest', 'JUnit', 'Postman', 'Figma', 'Sketch',
  // Mobile
  'Android', 'iOS', 'Flutter', 'Xamarin', 'Ionic',
  // Security / Other
  'OAuth', 'JWT', 'Auth0', 'Cryptography', 'Penetration Testing', 'OWASP',
  'Webpack', 'Vite', 'ESLint', 'Prettier', 'Lodash',
] as const;

// Normalize for matching: lowercase, collapse non-alphanumerics.
function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9+.#]+/g, ' ').trim();
}

const SKILL_NORMALIZED = Array.from(new Set(SKILL_DICTIONARY)).map((skill) => ({
  original: skill,
  norm: normalize(skill),
}));

// Sort by descending normalized length so longer phrases win (e.g. "React Native" before "React").
const SKILL_SORTED = [...SKILL_NORMALIZED].sort((a, b) => b.norm.length - a.norm.length);

export function extractSkills(text: string): string[] {
  const normalizedText = ' ' + normalize(text) + ' ';
  const found = new Set<string>();
  const matchedRanges: Array<[number, number]> = [];

  for (const { original, norm } of SKILL_SORTED) {
    if (!norm) continue;
    let searchFrom = 0;
    let idx = normalizedText.indexOf(norm, searchFrom);
    while (idx !== -1) {
      // Word-boundary check: surrounding chars must not be alphanumeric.
      const before = normalizedText[idx - 1] || ' ';
      const after = normalizedText[idx + norm.length] || ' ';
      const boundaryOk = !/[a-z0-9]/.test(before) && !/[a-z0-9]/.test(after);
      // Avoid overlapping with an already matched longer skill.
      const overlaps = matchedRanges.some(
        ([s, e]) => idx < e && idx + norm.length > s,
      );
      if (boundaryOk && !overlaps) {
        found.add(original);
        matchedRanges.push([idx, idx + norm.length]);
      }
      searchFrom = idx + 1;
      idx = normalizedText.indexOf(norm, searchFrom);
    }
  }

  return Array.from(found).sort((a, b) => a.localeCompare(b));
}

// ---- Skill matching (admin feature) ----

export type SkillMatchResult = {
  candidate: Candidate;
  matchedSkills: string[];
  matchCount: number;
  matchPercentage: number;
};

export function matchSkills(candidate: Candidate, requiredSkills: string[]): SkillMatchResult {
  const candidateSkillsLower = candidate.skills.map((s) => s.toLowerCase());
  const matched = requiredSkills.filter((req) =>
    candidateSkillsLower.some((cs) => cs === req.toLowerCase() || cs.includes(req.toLowerCase()) || req.toLowerCase().includes(cs)),
  );
  const matchPercentage =
    requiredSkills.length > 0
      ? Math.round((matched.length / requiredSkills.length) * 100)
      : 0;
  return {
    candidate,
    matchedSkills: matched,
    matchCount: matched.length,
    matchPercentage,
  };
}
