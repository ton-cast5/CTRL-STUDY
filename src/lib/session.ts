const SESSION_KEY = 'ctrlstudy_profile_id';

export function saveSession(profileId: string): void {
  localStorage.setItem(SESSION_KEY, profileId);
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

export function getSavedSessionId(): string | null {
  return localStorage.getItem(SESSION_KEY);
}
