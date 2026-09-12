import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type BannerProps = {
  tone: 'info' | 'warning' | 'danger';
  title: string;
  description?: string;
};

/** Veri tazeliği, demo modu ve hata durumları için uyarı şeridi. */
export function Banner({ tone, title, description }: BannerProps) {
  const theme = useTheme();
  const color =
    tone === 'danger' ? theme.danger : tone === 'warning' ? theme.warning : theme.accent;

  return (
    <View
      accessibilityRole="alert"
      style={[styles.container, { borderColor: color, backgroundColor: theme.backgroundElement }]}>
      <View style={[styles.stripe, { backgroundColor: color }]} />
      <View style={styles.content}>
        <ThemedText type="smallBold" style={{ color }}>
          {title}
        </ThemedText>
        {description ? (
          <ThemedText type="small" themeColor="textSecondary">
            {description}
          </ThemedText>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: Radius.medium,
    overflow: 'hidden',
  },
  stripe: {
    width: 4,
  },
  content: {
    flex: 1,
    padding: Spacing.three,
    gap: Spacing.half,
  },
});
