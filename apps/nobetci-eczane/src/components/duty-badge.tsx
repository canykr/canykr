import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { formatShift, isOnDutyAt, nextShiftAfter, remainingDutyLabel } from '@/lib/duty';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Pharmacy } from '@/services/types';

export type DutyBadgeProps = {
  pharmacy: Pharmacy;
  now?: Date;
};

/**
 * Eczanenin nöbet durumunu gösterir.
 *
 * Saatler API tarafından bildirilmediyse geri sayım göstermeyiz; tahmin edilen
 * bir saati kesinmiş gibi sunmak kullanıcıyı kapalı bir eczaneye yollayabilir.
 */
export function DutyBadge({ pharmacy, now = new Date() }: DutyBadgeProps) {
  const theme = useTheme();
  const onDuty = isOnDutyAt(pharmacy, now);
  const declared = pharmacy.duties.some((duty) => duty.declared);
  const remaining = declared ? remainingDutyLabel(pharmacy, now) : null;
  const upcoming = onDuty ? null : nextShiftAfter(pharmacy, now);

  const color = onDuty ? theme.success : theme.textSecondary;
  const label = onDuty ? 'Şu an nöbetçi' : upcoming ? 'Sırada' : 'Nöbetçi değil';

  return (
    <View style={styles.container}>
      <View style={[styles.pill, { borderColor: color }]}>
        <View style={[styles.dot, { backgroundColor: color }]} />
        <ThemedText type="small" style={{ color }}>
          {label}
        </ThemedText>
      </View>
      {remaining ? (
        <ThemedText type="small" themeColor="textSecondary">
          {remaining}
        </ThemedText>
      ) : upcoming ? (
        <ThemedText type="small" themeColor="textSecondary">
          {formatShift(upcoming)}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    borderWidth: 1,
    borderRadius: Radius.large,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
