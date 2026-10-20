// TypeSprint local database layer (IndexedDB).
// Passwords are hashed with PBKDF2-SHA256 + per-user salt. Every data call
// requires a valid session token and is scoped to that session's user.

export interface Goals {
  dailyMinutes: number;
  targetWpm: number;
  targetAccuracy: number;
}

export interface LessonProgress {
  attempts: number;
  bestWpm: number;
  bestAccuracy: number;
  passed: boolean;
  lastAt: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: number;
  goals: Goals;
  lessons: Record<string, LessonProgress>;
  isAdmin?: boolean;
}

interface UserRecord extends User {
  salt: string;
  hash: string;
}

interface Session {
  token: string;
  userId: string;
  expiresAt: number;
}

export interface TestResult {
  id: string;
  userId: string;
  modeId: string;
  modeName: string;
  lessonId?: string;
  lang: 'en' | 'hi';
  wpm: number;
  rawWpm: number;
  accuracy: number;
  errors: number;
  correctWords: number;
  incorrectWords: number;
  totalWords: number;
  chars: number;
  duration: number;
  timeLimit?: number;
  targetWpm?: number;
  targetAccuracy?: number;
  passed?: boolean;
  score?: number;
  missed: Record<string, number>;
  createdAt: number;
}

export type NewResult = Omit<TestResult, 'id' | 'userId' | 'createdAt'>;

export class AuthError extends Error {}

const SESSION_DAYS = 30;
let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('Your browser does not support local database storage.'));
      return;
    }
    const req = indexedDB.open('typesprint', 2);
    req.onupgradeneeded = (ev) => {
      const db = req.result;
      if (ev.oldVersion < 1) {
        const users = db.createObjectStore('users', { keyPath: 'id' });
        users.createIndex('email', 'email', { unique: true });
        db.createObjectStore('sessions', { keyPath: 'token' });
        const results = db.createObjectStore('results', { keyPath: 'id' });
        results.createIndex('userId', 'userId');
      }
      if (ev.oldVersion < 2) {
        const regs = db.createObjectStore('registrations', { keyPath: 'id' });
        regs.createIndex('userId', 'userId');
        const att = db.createObjectStore('certAttempts', { keyPath: 'id' });
        att.createIndex('userId', 'userId');
        att.createIndex('serial', 'serial');
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => {
      dbPromise = null;
      reject(new Error('Could not open the database. Private browsing may block storage.'));
    };
  });
  return dbPromise;
}

function wrap<T>(r: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error ?? new Error('Database error'));
  });
}

async function store(name: string, mode: IDBTransactionMode = 'readonly') {
  const db = await openDB();
  return db.transaction(name, mode).objectStore(name);
}

const enc = new TextEncoder();

function randomHex(bytes: number) {
  const a = new Uint8Array(new ArrayBuffer(bytes));
  crypto.getRandomValues(a);
  return Array.from(a, (b) => b.toString(16).padStart(2, '0')).join('');
}

function fromHex(hex: string) {
  const out = new Uint8Array(new ArrayBuffer(hex.length / 2));
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.substr(i * 2, 2), 16);
  return out;
}

async function hashPassword(password: string, salt: string) {
  if (!crypto?.subtle) throw new Error('Secure context required for authentication.');
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: fromHex(salt), iterations: 120000, hash: 'SHA-256' },
    key,
    256,
  );
  return Array.from(new Uint8Array(bits), (b) => b.toString(16).padStart(2, '0')).join('');
}

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function publicUser(u: UserRecord): User {
  const { salt: _s, hash: _h, ...rest } = u;
  void _s;
  void _h;
  return rest;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

async function createSession(userId: string) {
  const s: Session = { token: randomHex(32), userId, expiresAt: Date.now() + SESSION_DAYS * 86400000 };
  await wrap((await store('sessions', 'readwrite')).put(s));
  return s.token;
}

export async function signup(name: string, email: string, password: string) {
  const n = name.trim();
  const e = email.trim().toLowerCase();
  if (n.length < 2) throw new Error('Please enter your name (at least 2 characters).');
  if (n.length > 40) throw new Error('Name is too long (max 40 characters).');
  if (!EMAIL_RE.test(e)) throw new Error('Please enter a valid email address.');
  if (password.length < 6) throw new Error('Password must be at least 6 characters.');
  const existing = await wrap((await store('users')).index('email').get(e));
  if (existing) throw new Error('An account with this email already exists. Please log in.');
  const salt = randomHex(16);
  const hash = await hashPassword(password, salt);
  const rec: UserRecord = {
    id: randomHex(12),
    name: n,
    email: e,
    createdAt: Date.now(),
    goals: { dailyMinutes: 15, targetWpm: 35, targetAccuracy: 95 },
    lessons: {},
    salt,
    hash,
  };
  await wrap((await store('users', 'readwrite')).add(rec));
  const token = await createSession(rec.id);
  return { token, user: publicUser(rec) };
}

export async function login(email: string, password: string) {
  const e = email.trim().toLowerCase();
  if (!e || !password) throw new Error('Please enter your email and password.');
  const rec = (await wrap((await store('users')).index('email').get(e))) as UserRecord | undefined;
  if (!rec) throw new Error('Incorrect email or password.');
  const hash = await hashPassword(password, rec.salt);
  if (!safeEqual(hash, rec.hash)) throw new Error('Incorrect email or password.');
  const token = await createSession(rec.id);
  return { token, user: publicUser(rec) };
}

async function requireUserRecord(token: string | null): Promise<UserRecord> {
  if (!token) throw new AuthError('Not signed in');
  const s = (await wrap((await store('sessions')).get(token))) as Session | undefined;
  if (!s || s.expiresAt < Date.now()) {
    if (s) await wrap((await store('sessions', 'readwrite')).delete(token));
    throw new AuthError('Your session has expired. Please log in again.');
  }
  const u = (await wrap((await store('users')).get(s.userId))) as UserRecord | undefined;
  if (!u) throw new AuthError('Account not found');
  return u;
}

export async function getSessionUser(token: string | null) {
  return publicUser(await requireUserRecord(token));
}

export async function logout(token: string | null) {
  if (!token) return;
  await wrap((await store('sessions', 'readwrite')).delete(token));
}

export async function updateProfile(token: string | null, patch: { name?: string; goals?: Partial<Goals> }) {
  const u = await requireUserRecord(token);
  if (patch.name !== undefined) {
    const n = patch.name.trim();
    if (n.length < 2 || n.length > 40) throw new Error('Name must be 2–40 characters.');
    u.name = n;
  }
  if (patch.goals) {
    const g = { ...u.goals, ...patch.goals };
    if (g.dailyMinutes < 1 || g.dailyMinutes > 240) throw new Error('Daily goal must be 1–240 minutes.');
    if (g.targetWpm < 5 || g.targetWpm > 200) throw new Error('Target WPM must be 5–200.');
    if (g.targetAccuracy < 50 || g.targetAccuracy > 100) throw new Error('Target accuracy must be 50–100%.');
    u.goals = g;
  }
  await wrap((await store('users', 'readwrite')).put(u));
  return publicUser(u);
}

export async function saveResult(token: string | null, r: NewResult) {
  const u = await requireUserRecord(token);
  const result: TestResult = { ...r, id: randomHex(10), userId: u.id, createdAt: Date.now() };
  await wrap((await store('results', 'readwrite')).add(result));
  if (r.lessonId) {
    const prev = u.lessons[r.lessonId] ?? { attempts: 0, bestWpm: 0, bestAccuracy: 0, passed: false, lastAt: 0 };
    u.lessons[r.lessonId] = {
      attempts: prev.attempts + 1,
      bestWpm: Math.max(prev.bestWpm, r.wpm),
      bestAccuracy: Math.max(prev.bestAccuracy, r.accuracy),
      passed: prev.passed || !!r.passed,
      lastAt: Date.now(),
    };
    await wrap((await store('users', 'readwrite')).put(u));
  }
  return result;
}

export async function getResults(token: string | null) {
  const u = await requireUserRecord(token);
  const list = (await wrap((await store('results')).index('userId').getAll(u.id))) as TestResult[];
  return list.sort((a, b) => b.createdAt - a.createdAt);
}

export async function getResult(token: string | null, id: string) {
  const u = await requireUserRecord(token);
  const r = (await wrap((await store('results')).get(id))) as TestResult | undefined;
  if (!r || r.userId !== u.id) throw new Error('Result not found.');
  return r;
}

export async function deleteAllResults(token: string | null) {
  const u = await requireUserRecord(token);
  const s = await store('results', 'readwrite');
  const keys = await wrap(s.index('userId').getAllKeys(u.id));
  await Promise.all(keys.map((k) => wrap(s.delete(k))));
  u.lessons = {};
  await wrap((await store('users', 'readwrite')).put(u));
  return publicUser(u);
}

// ---------------------------------------------------------------- certification

export interface Registration {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  mobile?: string;
  state: string;
  city: string;
  address?: string;
  ageGroup?: string;
  lang: 'en' | 'hi';
  level: 1 | 2 | 3;
  consent: boolean;
  status: 'registered' | 'passed' | 'failed';
  attempts: number;
  createdAt: number;
}

export type NewRegistration = Omit<Registration, 'id' | 'userId' | 'status' | 'attempts' | 'createdAt'>;

export interface CertAttempt {
  id: string;
  userId: string;
  registrationId: string;
  name: string;
  email: string;
  location: string;
  level: 1 | 2 | 3;
  levelName: string;
  lang: 'en' | 'hi';
  wpm: number;
  rawWpm: number;
  accuracy: number;
  errors: number;
  correctWords: number;
  incorrectWords: number;
  chars: number;
  duration: number;
  requiredWpm: number;
  requiredAccuracy: number;
  passed: boolean;
  serial?: string;
  code?: string;
  revoked?: boolean;
  createdAt: number;
}

const MOBILE_RE = /^(\+91[\s-]?)?[6-9]\d{9}$/;
export const CERT_NAME_RE = /^[A-Za-z][A-Za-z .'-]{1,59}$/;

export async function createRegistration(token: string | null, r: NewRegistration) {
  const u = await requireUserRecord(token);
  const fullName = r.fullName.trim().replace(/\s+/g, ' ');
  const email = r.email.trim().toLowerCase();
  if (!CERT_NAME_RE.test(fullName)) throw new Error('Full name must use English letters only (2\u201360 characters) \u2014 it is printed on your certificate.');
  if (!EMAIL_RE.test(email)) throw new Error('Please enter a valid email address.');
  const mobile = (r.mobile ?? '').trim();
  if (mobile && !MOBILE_RE.test(mobile.replace(/\s/g, ''))) throw new Error('Please enter a valid 10-digit Indian mobile number, or leave it blank.');
  if (!r.state) throw new Error('Please select your state / union territory.');
  if (r.city.trim().length < 2) throw new Error('Please enter your city.');
  if (![1, 2, 3].includes(r.level)) throw new Error('Please select a test level.');
  if (!r.consent) throw new Error('You must agree to the privacy notice to register.');
  const reg: Registration = {
    ...r, fullName, email, mobile, city: r.city.trim(), address: (r.address ?? '').trim().slice(0, 300),
    id: randomHex(10), userId: u.id, status: 'registered', attempts: 0, createdAt: Date.now(),
  };
  await wrap((await store('registrations', 'readwrite')).add(reg));
  return reg;
}

export async function getRegistration(token: string | null, id: string) {
  const u = await requireUserRecord(token);
  const r = (await wrap((await store('registrations')).get(id))) as Registration | undefined;
  if (!r || (r.userId !== u.id && !u.isAdmin)) throw new Error('Registration not found.');
  return r;
}

export async function listMyCertData(token: string | null) {
  const u = await requireUserRecord(token);
  const regs = (await wrap((await store('registrations')).index('userId').getAll(u.id))) as Registration[];
  const attempts = (await wrap((await store('certAttempts')).index('userId').getAll(u.id))) as CertAttempt[];
  return {
    registrations: regs.sort((a, b) => b.createdAt - a.createdAt),
    attempts: attempts.sort((a, b) => b.createdAt - a.createdAt),
  };
}

export async function saveCertAttempt(token: string | null, a: Omit<CertAttempt, 'id' | 'userId' | 'createdAt'>) {
  const u = await requireUserRecord(token);
  const reg = (await wrap((await store('registrations')).get(a.registrationId))) as Registration | undefined;
  if (!reg || reg.userId !== u.id) throw new Error('Registration not found.');
  const att: CertAttempt = { ...a, id: randomHex(10), userId: u.id, createdAt: Date.now() };
  await wrap((await store('certAttempts', 'readwrite')).add(att));
  reg.attempts += 1;
  if (reg.status !== 'passed') reg.status = a.passed ? 'passed' : 'failed';
  await wrap((await store('registrations', 'readwrite')).put(reg));
  return att;
}

export async function getCertAttempt(token: string | null, id: string) {
  const u = await requireUserRecord(token);
  const a = (await wrap((await store('certAttempts')).get(id))) as CertAttempt | undefined;
  if (!a || (a.userId !== u.id && !u.isAdmin)) throw new Error('Test result not found.');
  return a;
}

/** Public lookup (no auth): returns only non-personal fields for verification. */
export async function lookupSerial(serial: string) {
  const list = (await wrap((await store('certAttempts')).index('serial').getAll(serial.trim().toUpperCase()))) as CertAttempt[];
  const a = list[0];
  if (!a) return null;
  return { serial: a.serial!, code: a.code!, revoked: !!a.revoked };
}

export async function grantAdmin(token: string | null) {
  const u = await requireUserRecord(token);
  u.isAdmin = true;
  await wrap((await store('users', 'readwrite')).put(u));
  return publicUser(u);
}

async function requireAdmin(token: string | null) {
  const u = await requireUserRecord(token);
  if (!u.isAdmin) throw new AuthError('Admin access required.');
  return u;
}

export async function adminListAll(token: string | null) {
  await requireAdmin(token);
  const registrations = (await wrap((await store('registrations')).getAll())) as Registration[];
  const attempts = (await wrap((await store('certAttempts')).getAll())) as CertAttempt[];
  const users = (await wrap((await store('users')).count())) as number;
  return {
    users,
    registrations: registrations.sort((a, b) => b.createdAt - a.createdAt),
    attempts: attempts.sort((a, b) => b.createdAt - a.createdAt),
  };
}

export async function adminSetRevoked(token: string | null, attemptId: string, revoked: boolean) {
  await requireAdmin(token);
  const s = await store('certAttempts', 'readwrite');
  const a = (await wrap(s.get(attemptId))) as CertAttempt | undefined;
  if (!a) throw new Error('Certificate not found.');
  a.revoked = revoked;
  await wrap(s.put(a));
  return a;
}

export async function adminDeleteRegistration(token: string | null, id: string) {
  await requireAdmin(token);
  await wrap((await store('registrations', 'readwrite')).delete(id));
  const s = await store('certAttempts', 'readwrite');
  const all = (await wrap(s.getAll())) as CertAttempt[];
  await Promise.all(all.filter((a) => a.registrationId === id).map((a) => wrap(s.delete(a.id))));
}
