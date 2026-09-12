/**
 * Basit, süreli bellek içi önbellek.
 *
 * Aynı ili arka arkaya açan kullanıcıyı her seferinde ağ beklemeye
 * zorlamamak için kullanılır; süresi dolmuş kayıt "bayat" sayılır ama
 * ağ hatasında yine de gösterilebilsin diye silinmez.
 */
type Entry<T> = {
  value: T;
  storedAt: number;
};

export class TimedCache<T> {
  private readonly entries = new Map<string, Entry<T>>();

  constructor(private readonly ttlMs: number) {}

  get(key: string): { value: T; isStale: boolean } | null {
    const entry = this.entries.get(key);
    if (!entry) {
      return null;
    }
    return { value: entry.value, isStale: Date.now() - entry.storedAt > this.ttlMs };
  }

  set(key: string, value: T): void {
    this.entries.set(key, { value, storedAt: Date.now() });
  }

  clear(): void {
    this.entries.clear();
  }
}
