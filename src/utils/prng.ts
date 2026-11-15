/**
 * Deterministic Pseudo-Random Number Generator (Mulberry32)
 * Ensures reproducible mazes from any alphanumeric or numeric seed string.
 */

export class PRNG {
  private state: number;

  constructor(seed: string | number) {
    this.state = typeof seed === 'number' ? seed >>> 0 : PRNG.hashString(String(seed));
    if (this.state === 0) {
      this.state = 0x6d2b79f5;
    }
  }

  /**
   * Hashes any string into a 32-bit integer using FNV-1a.
   */
  public static hashString(str: string): number {
    let hash = 2166136261 >>> 0;
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      hash = Math.imul(hash, 16777619) >>> 0;
    }
    return hash >>> 0;
  }

  /**
   * Generates a float in [0, 1).
   */
  public next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * Generates an integer in [min, max] inclusive.
   */
  public nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /**
   * Deterministically shuffles an array in place (Fisher-Yates).
   */
  public shuffle<T>(array: T[]): T[] {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  /**
   * Picks a random element from an array.
   */
  public pick<T>(array: T[]): T {
    return array[Math.floor(this.next() * array.length)];
  }
}

const ADJECTIVES = [
  'GOLDEN', 'SUNNY', 'CORAL', 'EMERALD', 'AMBER', 'TOPAZ', 'JADE', 'PEACH',
  'TERRA', 'SOLAR', 'MYSTIC', 'VERDANT', 'AZURE', 'CRYSTAL', 'BRAVE', 'SERENE'
];

const NOUNS = [
  'HEARTH', 'GATE', 'PASS', 'VAULT', 'SANCTUM', 'GROVE', 'PATH', 'PORTAL',
  'ARCH', 'TOWER', 'SHRINE', 'VALE', 'TRAIL', 'ISLE', 'SPIRE', 'COVE'
];

/**
 * Generates an evocative, memorable seed string like "GOLDEN-GATE-42".
 */
export function generateRandomSeed(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const num = Math.floor(Math.random() * 900) + 100;
  return `${adj}-${noun}-${num}`;
}
