const USERNAME_REGEX = /^[a-z0-9._-]{3,40}$/;

export function isValidUsername(username: string): boolean {
  return USERNAME_REGEX.test(username);
}

export function normalizeUsername(username: string): string {
  return username.toLowerCase().trim();
}
