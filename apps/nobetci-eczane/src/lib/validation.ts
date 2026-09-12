import { isValidCoordinate } from '@/lib/geo';
import { normalizePhone } from '@/lib/format';
import type { PharmacyDraft } from '@/services/types';

export type ValidationErrors = Partial<Record<keyof PharmacyDraft, string>>;

/**
 * Eczane panelinden gelen formu doğrular.
 * Dönen nesne boşsa form geçerlidir.
 */
export function validatePharmacyDraft(draft: Partial<PharmacyDraft>): ValidationErrors {
  const errors: ValidationErrors = {};

  if (!draft.name || draft.name.trim().length < 3) {
    errors.name = 'Eczane adı en az 3 karakter olmalı.';
  }

  if (!draft.city || !draft.city.trim()) {
    errors.city = 'İl seçmelisiniz.';
  }

  if (!draft.district || draft.district.trim().length < 2) {
    errors.district = 'İlçe girmelisiniz.';
  }

  if (!draft.address || draft.address.trim().length < 10) {
    errors.address = 'Açık adres en az 10 karakter olmalı.';
  }

  if (!draft.phone || !normalizePhone(draft.phone)) {
    errors.phone = 'Geçerli bir telefon numarası girin (örn. 0312 123 45 67).';
  }

  if (!isValidCoordinate(draft.location)) {
    errors.location = 'Haritadan eczanenin konumunu seçin.';
  }

  return errors;
}

export function hasErrors(errors: ValidationErrors): boolean {
  return Object.keys(errors).length > 0;
}
