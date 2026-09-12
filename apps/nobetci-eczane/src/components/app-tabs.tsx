import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  return (
    <NativeTabs
      backgroundColor={colors.background}
      indicatorColor={colors.backgroundSelected}
      labelStyle={{ selected: { color: colors.primary } }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Nöbetçi</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="cross.case.fill" md="local_pharmacy" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="map">
        <NativeTabs.Trigger.Label>Harita</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="map.fill" md="map" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="favorites">
        <NativeTabs.Trigger.Label>Favoriler</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="star.fill" md="star" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="panel">
        <NativeTabs.Trigger.Label>Eczane Paneli</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="building.2.fill" md="storefront" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
