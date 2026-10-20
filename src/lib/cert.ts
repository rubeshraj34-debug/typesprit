export const CERT_LEVELS = {
  1: { level: 1 as const, name: 'Beginner', duration: 120, wpm: 20, acc: 90, color: 'bg-go-soft', blurb: 'For students who have learned touch typing and want proof of basic proficiency.' },
  2: { level: 2 as const, name: 'Intermediate', duration: 300, wpm: 30, acc: 95, color: 'bg-accent-soft', blurb: 'Close to most government typing-test standards. Ideal for clerk & data-entry roles.' },
  3: { level: 3 as const, name: 'Professional', duration: 600, wpm: 40, acc: 97, color: 'bg-sun', blurb: 'A demanding 10-minute endurance test for professional typists and court/steno aspirants.' },
};
export type CertLevel = 1 | 2 | 3;
export const LEVEL_LIST = [CERT_LEVELS[1], CERT_LEVELS[2], CERT_LEVELS[3]];

export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan',
  'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Andaman and Nicobar Islands', 'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
];

export const AGE_GROUPS = ['Under 18', '18–24', '25–34', '35–44', '45+'];

export interface ServerCertificate {
  serial: string;
  code: string;
  name: string;
  level: CertLevel;
  levelName: string;
  wpm: number;
  accuracy: number;
  duration: number;
  lang: 'en' | 'hi';
  location: string;
  issuedAt: number;
}

export interface SubmitResponse {
  wpm: number;
  rawWpm: number;
  accuracy: number;
  errors: number;
  correctWords: number;
  incorrectWords: number;
  chars: number;
  level: CertLevel;
  levelName: string;
  duration: number;
  required: { wpm: number; accuracy: number };
  passed: boolean;
  certificate?: ServerCertificate;
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, { ...init, headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) } });
  } catch {
    throw new Error('Could not reach the certification server. Check your internet connection and try again.');
  }
  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    throw new Error('The certification server returned an unexpected response.');
  }
  if (!res.ok) throw new Error((data as { error?: string })?.error || `Request failed (${res.status}).`);
  return data as T;
}

export const startCertTest = (level: CertLevel, lang: 'en' | 'hi', name: string, location: string) =>
  api<{ token: string; text: string; duration: number; level: CertLevel }>('/api/cert-start', { method: 'POST', body: JSON.stringify({ level, lang, name, location }) });

export const submitCertTest = (token: string, typed: string, keystrokes: number, errors: number) =>
  api<SubmitResponse>('/api/cert-submit', { method: 'POST', body: JSON.stringify({ token, typed, keystrokes, errors }) });

export const verifyCode = (code: string) =>
  api<{ valid: boolean; reason?: string; certificate?: Omit<ServerCertificate, 'code'> }>(`/api/verify?code=${encodeURIComponent(code)}`);

export const adminLogin = (key: string) => api<{ ok: boolean; adminToken: string }>('/api/admin-login', { method: 'POST', body: JSON.stringify({ key }) });

export const verifyUrl = (code: string) => `${window.location.origin}/verify/${code}`;

export const fmtMin = (sec: number) => `${sec / 60} min`;
