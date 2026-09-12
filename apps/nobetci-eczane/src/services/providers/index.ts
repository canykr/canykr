import { config as defaultConfig, type AppConfig } from '@/services/config';
import { createCollectApiProvider } from '@/services/providers/collectapi';
import { createCustomProvider } from '@/services/providers/custom';
import { createDemoProvider } from '@/services/providers/demo';
import { createNosyApiProvider } from '@/services/providers/nosyapi';
import type { PharmacyProvider } from '@/services/providers/types';

export type { PharmacyProvider } from '@/services/providers/types';

/**
 * Yapılandırmaya uygun sağlayıcıyı seçer. Anahtar/adres eksikse sessizce
 * örnek veriye düşer; uygulama hiçbir durumda açılışta çökmez.
 */
export function resolveProvider(config: AppConfig = defaultConfig): PharmacyProvider {
  switch (config.provider) {
    case 'collectapi':
      return config.apiKey ? createCollectApiProvider(config) : createDemoProvider();
    case 'nosyapi':
      return config.apiKey ? createNosyApiProvider(config) : createDemoProvider();
    case 'custom':
      return config.baseUrl ? createCustomProvider(config) : createDemoProvider();
    case 'demo':
    default:
      return createDemoProvider();
  }
}
