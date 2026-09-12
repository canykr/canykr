import { useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CityPicker } from '@/components/city-picker';
import { LocationPicker } from '@/components/location-picker';
import { ThemedText } from '@/components/themed-text';
import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Field } from '@/components/ui/field';
import { BottomTabInset, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useMyPharmacy } from '@/hooks/use-my-pharmacy';
import { useTheme } from '@/hooks/use-theme';
import {
  DEFAULT_SHIFT_END,
  DEFAULT_SHIFT_START,
  dropPastShifts,
  formatShift,
  isValidDateString,
  isValidTimeString,
  normalizeShifts,
  toDateString,
} from '@/lib/duty';
import { formatTimestamp } from '@/lib/format';
import { hasErrors, validatePharmacyDraft, type ValidationErrors } from '@/lib/validation';
import type { Coordinate, DutyShift, PharmacyDraft } from '@/services/types';

type FormState = {
  name: string;
  pharmacistName: string;
  city: string | null;
  district: string;
  address: string;
  phone: string;
  notes: string;
  location: Coordinate | null;
  duties: DutyShift[];
};

const EMPTY_FORM: FormState = {
  name: '',
  pharmacistName: '',
  city: null,
  district: '',
  address: '',
  phone: '',
  notes: '',
  location: null,
  duties: [],
};

function addDays(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return toDateString(date);
}

/**
 * Eczane paneli.
 *
 * Eczaneler kendi bilgilerini girer, konumlarını haritadan işaretler ve nöbet
 * günlerini bildirir. Panelden gelen kayıtlar arama sonuçlarında API
 * kayıtlarının önüne geçer: konumu eczacının kendisi işaretlediği için daha
 * güvenilirdir.
 */
export default function PanelScreen() {
  const theme = useTheme();
  const { pharmacy, isLoading, save, remove } = useMyPharmacy();

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isEditing, setEditing] = useState(false);
  const [isSaving, setSaving] = useState(false);
  const [isPickerVisible, setPickerVisible] = useState(false);
  const [notice, setNotice] = useState<{ tone: 'info' | 'warning'; text: string } | null>(null);

  const [newDutyDate, setNewDutyDate] = useState(addDays(0));
  const [newDutyStart, setNewDutyStart] = useState(DEFAULT_SHIFT_START);
  const [newDutyEnd, setNewDutyEnd] = useState(DEFAULT_SHIFT_END);

  // Kayıt depodan geldiğinde formu bir kez doldur. Efekt yerine çizim sırasında
  // düzeltme kalıbı kullanılıyor; böylece fazladan bir tur çizim olmuyor.
  const [loadedId, setLoadedId] = useState<string | null>(null);
  if (pharmacy && pharmacy.id !== loadedId) {
    setLoadedId(pharmacy.id);
    setForm({
      name: pharmacy.name,
      pharmacistName: pharmacy.pharmacistName ?? '',
      city: pharmacy.city,
      district: pharmacy.district,
      address: pharmacy.address,
      phone: pharmacy.phone,
      notes: pharmacy.notes ?? '',
      location: pharmacy.location,
      duties: pharmacy.duties,
    });
  }

  const upcomingDuties = useMemo(
    () => normalizeShifts(dropPastShifts(form.duties)),
    [form.duties]
  );

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const addDuty = (date: string, startTime: string, endTime: string) => {
    if (!isValidDateString(date)) {
      Alert.alert('Tarih hatalı', 'Tarihi YYYY-AA-GG biçiminde girin, örn. 2026-09-12.');
      return;
    }
    if (!isValidTimeString(startTime) || !isValidTimeString(endTime)) {
      Alert.alert('Saat hatalı', 'Saatleri SS:DD biçiminde girin, örn. 18:30.');
      return;
    }
    update(
      'duties',
      normalizeShifts([...form.duties, { date, startTime, endTime, declared: true }])
    );
  };

  const removeDuty = (date: string) => {
    update(
      'duties',
      form.duties.filter((duty) => duty.date !== date)
    );
  };

  const handleSave = async () => {
    const draft: Partial<PharmacyDraft> = {
      id: pharmacy?.id,
      name: form.name.trim(),
      pharmacistName: form.pharmacistName.trim() || undefined,
      city: form.city ?? '',
      district: form.district.trim(),
      address: form.address.trim(),
      phone: form.phone.trim(),
      notes: form.notes.trim() || undefined,
      location: form.location ?? undefined,
      duties: normalizeShifts(form.duties),
    };

    const found = validatePharmacyDraft(draft);
    setErrors(found);
    if (hasErrors(found)) {
      setNotice({ tone: 'warning', text: 'Eksik ya da hatalı alanları düzeltin.' });
      return;
    }

    setSaving(true);
    try {
      const outcome = await save(draft as PharmacyDraft);
      setEditing(false);
      setNotice(
        outcome.published
          ? { tone: 'info', text: 'Bilgileriniz kaydedildi ve sunucuya gönderildi.' }
          : {
              tone: 'warning',
              text:
                outcome.publishError ??
                'Bilgileriniz bu cihaza kaydedildi. Merkezî sunucu tanımlı olmadığı için başka kullanıcılara henüz dağıtılmıyor.',
            }
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Kaydı sil',
      'Eczane kaydınız bu cihazdan silinecek. Devam edilsin mi?',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: () => {
            void remove().then(() => {
              setForm(EMPTY_FORM);
              setNotice(null);
            });
          },
        },
      ]
    );
  };

  const showForm = isEditing || !pharmacy;

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <ThemedText type="smallBold">Eczane Paneli</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Eczanenizi kaydedin, konumunuzu haritadan işaretleyin ve nöbet günlerinizi
              bildirin. Girdiğiniz konum, servis verisinin önüne geçer.
            </ThemedText>
          </View>

          {notice ? <Banner tone={notice.tone} title={notice.text} /> : null}

          {isLoading ? (
            <ThemedText type="small" themeColor="textSecondary">
              Yükleniyor…
            </ThemedText>
          ) : null}

          {pharmacy && !isEditing ? (
            <View style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
              <ThemedText type="smallBold">{pharmacy.name}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {pharmacy.district} / {pharmacy.city}
              </ThemedText>
              <ThemedText type="small">{pharmacy.address}</ThemedText>
              <ThemedText type="small">{pharmacy.phone}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Son güncelleme: {formatTimestamp(pharmacy.updatedAt)}
              </ThemedText>

              <View style={styles.row}>
                <Button label="Bilgileri düzenle" onPress={() => setEditing(true)} style={styles.grow} />
                <Button label="Kaydı sil" variant="danger" onPress={handleDelete} />
              </View>
            </View>
          ) : null}

          {showForm ? (
            <View style={styles.form}>
              <Field
                label="Eczane adı"
                value={form.name}
                onChangeText={(value) => update('name', value)}
                placeholder="Örn. Papatya Eczanesi"
                error={errors.name}
              />

              <Field
                label="Sorumlu eczacı (isteğe bağlı)"
                value={form.pharmacistName}
                onChangeText={(value) => update('pharmacistName', value)}
                placeholder="Ecz. Ad Soyad"
              />

              <View style={styles.fieldBlock}>
                <ThemedText type="smallBold">İl</ThemedText>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="İl seç"
                  onPress={() => setPickerVisible(true)}
                  style={({ pressed }) => [
                    styles.selectInput,
                    {
                      backgroundColor: theme.backgroundElement,
                      borderColor: errors.city ? theme.danger : theme.border,
                    },
                    pressed && styles.pressed,
                  ]}>
                  <ThemedText type="small" themeColor={form.city ? 'text' : 'textSecondary'}>
                    {form.city ?? 'İl seçin'}
                  </ThemedText>
                </Pressable>
                {errors.city ? (
                  <ThemedText type="small" style={{ color: theme.danger }}>
                    {errors.city}
                  </ThemedText>
                ) : null}
              </View>

              <Field
                label="İlçe"
                value={form.district}
                onChangeText={(value) => update('district', value)}
                placeholder="Örn. Kadıköy"
                error={errors.district}
              />

              <Field
                label="Açık adres"
                value={form.address}
                onChangeText={(value) => update('address', value)}
                placeholder="Mahalle, cadde, sokak, kapı no"
                multiline
                numberOfLines={3}
                style={styles.multiline}
                error={errors.address}
              />

              <Field
                label="Telefon"
                value={form.phone}
                onChangeText={(value) => update('phone', value)}
                placeholder="0216 123 45 67"
                keyboardType="phone-pad"
                error={errors.phone}
              />

              <Field
                label="Tarif / not (isteğe bağlı)"
                value={form.notes}
                onChangeText={(value) => update('notes', value)}
                placeholder="Örn. Devlet Hastanesi karşısı, köşe bina"
                multiline
                numberOfLines={2}
                style={styles.multiline}
              />

              <LocationPicker
                value={form.location}
                onChange={(coordinate) => update('location', coordinate)}
                city={form.city}
                error={errors.location}
              />

              <View style={styles.fieldBlock}>
                <ThemedText type="smallBold">Nöbet günleri</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  Nöbetçi olduğunuz günleri bildirin. Bildirdiğiniz saatler kullanıcılara
                  geri sayım olarak gösterilir.
                </ThemedText>

                <View style={styles.chips}>
                  <Chip
                    label="Bugün nöbetçiyim"
                    onPress={() => addDuty(addDays(0), DEFAULT_SHIFT_START, DEFAULT_SHIFT_END)}
                  />
                  <Chip
                    label="Yarın nöbetçiyim"
                    onPress={() => addDuty(addDays(1), DEFAULT_SHIFT_START, DEFAULT_SHIFT_END)}
                  />
                  <Chip
                    label="Bugün 24 saat"
                    onPress={() => addDuty(addDays(0), '00:00', '23:59')}
                  />
                </View>

                <View style={styles.row}>
                  <Field
                    label="Tarih"
                    value={newDutyDate}
                    onChangeText={setNewDutyDate}
                    placeholder="2026-09-12"
                    autoCapitalize="none"
                    style={styles.grow}
                  />
                </View>
                <View style={styles.row}>
                  <Field
                    label="Başlangıç"
                    value={newDutyStart}
                    onChangeText={setNewDutyStart}
                    placeholder="18:30"
                    style={styles.grow}
                  />
                  <Field
                    label="Bitiş"
                    value={newDutyEnd}
                    onChangeText={setNewDutyEnd}
                    placeholder="08:30"
                    style={styles.grow}
                  />
                </View>
                <Button
                  label="Nöbet ekle"
                  variant="secondary"
                  onPress={() => addDuty(newDutyDate, newDutyStart, newDutyEnd)}
                />

                {upcomingDuties.length === 0 ? (
                  <ThemedText type="small" themeColor="textSecondary">
                    Henüz nöbet bildirmediniz.
                  </ThemedText>
                ) : (
                  upcomingDuties.map((duty) => (
                    <View
                      key={duty.date}
                      style={[styles.dutyRow, { borderColor: theme.border }]}>
                      <ThemedText type="small" style={styles.grow}>
                        {formatShift(duty)}
                      </ThemedText>
                      <Button
                        label="Kaldır"
                        variant="ghost"
                        onPress={() => removeDuty(duty.date)}
                      />
                    </View>
                  ))
                )}
              </View>

              <View style={styles.row}>
                <Button
                  label={pharmacy ? 'Değişiklikleri kaydet' : 'Eczanemi kaydet'}
                  loading={isSaving}
                  onPress={() => void handleSave()}
                  style={styles.grow}
                />
                {pharmacy ? (
                  <Button label="Vazgeç" variant="ghost" onPress={() => setEditing(false)} />
                ) : null}
              </View>
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>

      <CityPicker
        visible={isPickerVisible}
        selected={form.city}
        onSelect={(value) => update('city', value)}
        onClose={() => setPickerVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  content: {
    padding: Spacing.three,
    gap: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.five,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  header: {
    gap: Spacing.half,
  },
  card: {
    borderWidth: 1,
    borderRadius: Radius.large,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  form: {
    gap: Spacing.three,
  },
  fieldBlock: {
    gap: Spacing.two,
  },
  selectInput: {
    minHeight: 46,
    borderWidth: 1,
    borderRadius: Radius.medium,
    paddingHorizontal: Spacing.three,
    justifyContent: 'center',
  },
  multiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
    alignItems: 'flex-end',
  },
  grow: {
    flex: 1,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  dutyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: Radius.medium,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
  },
  pressed: {
    opacity: 0.8,
  },
});
