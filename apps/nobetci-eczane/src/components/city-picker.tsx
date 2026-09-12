import { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { CITIES } from '@/data/cities';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { searchKey } from '@/lib/format';

export type CityPickerProps = {
  visible: boolean;
  selected: string | null;
  onSelect: (city: string) => void;
  onClose: () => void;
};

/** 81 il arasından arama yaparak seçim yapılan tam ekran liste. */
export function CityPicker({ visible, selected, onSelect, onClose }: CityPickerProps) {
  const theme = useTheme();
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    const key = searchKey(query);
    if (!key) {
      return CITIES;
    }
    return CITIES.filter((city) => searchKey(city.name).includes(key));
  }, [query]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.header}>
          <ThemedText type="smallBold">İl seçin</ThemedText>
          <Button label="Kapat" variant="ghost" onPress={onClose} />
        </View>

        <TextInput
          accessibilityLabel="İl ara"
          placeholder="İl ara"
          placeholderTextColor={theme.textSecondary}
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
          style={[
            styles.search,
            {
              backgroundColor: theme.backgroundElement,
              borderColor: theme.border,
              color: theme.text,
            },
          ]}
        />

        <FlatList
          data={results}
          keyExtractor={(city) => String(city.code)}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <ThemedText type="small" themeColor="textSecondary" style={styles.empty}>
              Aramanızla eşleşen il bulunamadı.
            </ThemedText>
          }
          renderItem={({ item }) => {
            const isSelected = selected === item.name;
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                onPress={() => {
                  onSelect(item.name);
                  setQuery('');
                  onClose();
                }}
                style={({ pressed }) => [
                  styles.row,
                  {
                    backgroundColor: isSelected ? theme.backgroundSelected : theme.backgroundElement,
                    borderColor: theme.border,
                  },
                  pressed && styles.pressed,
                ]}>
                <ThemedText type="small">{item.name}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {String(item.code).padStart(2, '0')}
                </ThemedText>
              </Pressable>
            );
          }}
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.three,
    gap: Spacing.two,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.two,
  },
  search: {
    minHeight: 46,
    borderWidth: 1,
    borderRadius: Radius.medium,
    paddingHorizontal: Spacing.three,
    fontSize: 16,
  },
  list: {
    gap: Spacing.two,
    paddingVertical: Spacing.two,
    paddingBottom: Spacing.six,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 48,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.medium,
    borderWidth: 1,
  },
  pressed: {
    opacity: 0.8,
  },
  empty: {
    textAlign: 'center',
    paddingVertical: Spacing.four,
  },
});
