/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function useTheme() {
  const scheme = useColorScheme();

  // `useColorScheme` null ya da 'unspecified' dönebilir; bilinmeyen her değer
  // açık temaya düşer, aksi halde `Colors[...]` undefined olur ve her renk
  // okuması çöker.
  return scheme === 'dark' ? Colors.dark : Colors.light;
}
