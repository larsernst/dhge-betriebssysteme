const PLACEHOLDER_PATTERNS = [
  /bitte-durch/i,
  /please-change/i,
  /change-?me/i,
  /ersetzen/i,
];

export function validateJwtSecret(secret: string | undefined): void {
  if (!secret || secret.length < 16) {
    throw new Error(
      "JWT_SECRET ist nicht gesetzt oder kürzer als 16 Zeichen. Bitte in .env einen langen Zufallswert eintragen."
    );
  }
  if (PLACEHOLDER_PATTERNS.some((re) => re.test(secret))) {
    throw new Error(
      "JWT_SECRET ist noch der Platzhalter aus der Vorlage. Bitte in .env einen echten Zufallswert eintragen."
    );
  }
}

export function assertEnv(): void {
  validateJwtSecret(process.env.JWT_SECRET ?? process.env.NEXTAUTH_SECRET);
}
