# Nöbetçi Eczane

Türkiye için nöbetçi eczane bulucu. Tek kod tabanı, **iOS ve Android** (Expo + React Native + TypeScript).

İki tarafı var:

- **Kullanıcı tarafı** — konuma göre en yakın nöbetçi eczaneleri listeler, haritada gösterir, tek dokunuşla arar / yol tarifi verir / paylaşır.
- **Eczane paneli** — eczaneler kendi bilgilerini girer, konumlarını **haritadan işaretler** ve nöbet günlerini bildirir.

## Neden bir tane daha?

Mevcut uygulamaların mağaza yorumları okundu ve en çok tekrar eden şikayetler doğrudan tasarıma alındı:

| Şikayet | Bu uygulamadaki karşılığı |
|---|---|
| "Harita sadece en yakın eczaneleri gösteriyor, gideceğim yerdekileri göremiyorum" | Haritayı istediğiniz bölgeye kaydırıp **Bu bölgede ara** düğmesiyle orayı tarayabilirsiniz. Arama bulunduğunuz konuma bağlı değil. |
| "Adres doğru ama konumu yanlış gösterip mağdur etti" | Her koordinat ait olduğu ilin merkezine göre denetlenir; şüpheli kayıtlar **"Konum yaklaşık olabilir"** uyarısıyla işaretlenir. Eczanenin panelden kendi işaretlediği konum, servis verisinin önüne geçer. |
| "2 kere kapalı eczaneye yönlendirdi" | Kartlarda kaynak ve son güncelleme zamanı görünür; her kayıtta **"Bilgiler yanlış / eczane kapalı"** bildirimi vardır. Saatler bildirilmemişse geri sayım gösterilmez, tahmin kesinmiş gibi sunulmaz. |
| "Başkasına konum göndermek tam bir kabus" | **Paylaş** düğmesi eczane bilgisini ve doğrudan açılabilir bir harita bağlantısını birlikte gönderir. |
| "Tam sayfa reklamlar, hastayım eczane arıyorum" | Reklam yok. |
| "Eczane aranıyor ekranında donup kalıyor" | Her ağ isteğinin zaman aşımı var; bağlantı koparsa elde kalan son kayıtlar gösterilir, ekran boş kalmaz. |

## Ekranlar

- **Nöbetçi** — il seçimi, arama, ilçe süzgeci, konuma göre sıralı liste. Nöbette olanlar üstte.
- **Harita** — nöbetçi eczaneler haritada; "bu bölgede ara" ile istenen bölgeyi tarama.
- **Favoriler** — sık kullanılan eczaneler (cihazda saklanır).
- **Eczane Paneli** — eczanenin kendi kaydı, haritadan konum seçimi, nöbet takvimi.

## Kurulum

```bash
cd apps/nobetci-eczane
npm install
cp .env.example .env   # veri kaynağını yapılandırın (aşağıya bakın)
```

Harita (`expo-maps`) yerel bir modüldür ve **Expo Go içinde çalışmaz**. Bir geliştirme derlemesi gerekir:

```bash
npx expo run:android    # ya da
npx expo run:ios        # (macOS gerekir)
```

Harita modülü bulunamazsa uygulama çökmez: harita alanı yerine açıklayıcı bir kutu çıkar, panelde koordinatlar elle girilebilir. Listeler, arama, arama/yol tarifi/paylaşma her ortamda çalışır.

## Veri kaynağı

Uygulama API anahtarı olmadan **örnek (demo) veriyle** açılır; bu moddayken ekranda büyük bir uyarı görünür ve kayıtların adında "(Örnek)" yazar. Gerçek veri için `.env` dosyasını doldurun:

```bash
EXPO_PUBLIC_PHARMACY_PROVIDER=collectapi   # demo | collectapi | nosyapi | custom
EXPO_PUBLIC_PHARMACY_API_KEY=...
```

Desteklenen sağlayıcılar `src/services/providers/` altında, her biri kendi yanıt biçimini uygulamanın veri modeline çevirir:

| Sağlayıcı | Uç nokta | Kimlik doğrulama |
|---|---|---|
| `collectapi` | `GET https://api.collectapi.com/health/dutyPharmacy?il=&ilce=` | `authorization: apikey <anahtar>` |
| `nosyapi` | `GET https://www.nosyapi.com/apiv2/service/pharmacies-on-duty?city=&district=` | `authorization: Bearer <anahtar>` |
| `custom` | `GET {EXPO_PUBLIC_PHARMACY_API_URL}/nobetci?il=&ilce=` | isteğe bağlı `Bearer` |
| `demo` | — | — |

> **Güvenlik:** `EXPO_PUBLIC_` ile başlayan değişkenler JavaScript paketine gömülür; uygulamayı indiren herkes anahtarı okuyabilir. Yayına çıkarken anahtarı kendi sunucunuzda tutan küçük bir vekil (proxy) servis yazıp `custom` sağlayıcısını kullanın.

### `custom` sağlayıcı sözleşmesi

```
GET {baseUrl}/nobetci?il=Ankara&ilce=Çankaya
200 → { "data": [ {
  "name": "Papatya Eczanesi",
  "address": "…", "phone": "0312 123 45 67",
  "city": "Ankara", "district": "Çankaya",
  "latitude": 39.92, "longitude": 32.85,
  "startTime": "18:30", "endTime": "08:30"   // isteğe bağlı
} ] }
```

`data` yerine düz dizi döndüren sunucular da kabul edilir. `startTime`/`endTime` verilirse arayüzde geri sayım gösterilir; verilmezse nöbet saatleri tahmini sayılır.

Eczane panelinden gelen kayıtlar ve hatalı bilgi bildirimleri, tanımlıysa şu adreslere gönderilir:

```
POST {EXPO_PUBLIC_PHARMACY_SUBMIT_URL}            # eczane kaydı
POST {EXPO_PUBLIC_PHARMACY_SUBMIT_URL}/reports    # hatalı bilgi bildirimi
```

Tanımlı değilse kayıtlar yalnızca cihazda saklanır ve panel bunu kullanıcıya açıkça söyler.

## Proje yapısı

```
src/
  app/            Ekranlar (expo-router): index, map, favorites, panel
  components/     Arayüz bileşenleri (kart, harita, konum seçici, il seçici…)
  hooks/          use-location, use-pharmacies, use-favorites, use-my-pharmacy
  lib/            Saf yardımcılar: geo, duty, format, validation, actions, http
  services/       Veri katmanı: sağlayıcılar, birleştirme/süzme, yerel depo
  data/           81 il ve örnek kayıtlar
__tests__/        Saf mantık testleri (85 test)
```

Veri akışı: **sağlayıcı → normalleştirme → panel kayıtlarıyla birleştirme → süzme/sıralama → ekran.** Normalleştirme katmanı her sağlayıcının farklı alan adlarını (`loc`, `lat`/`lng`, `enlem`/`boylam`) ve koordinat kalitesini tek biçime indirger.

## Geliştirme

```bash
npm run check       # lint + tip kontrolü + testler
npm test            # yalnızca testler
npm run typecheck
npm run lint
```

Testler React Native çalışma ortamı gerektirmez; saf mantık katmanını (mesafe hesabı, nöbet saatleri, telefon/metin biçimlendirme, sağlayıcı normalleştirme, süzme-sıralama, form doğrulama) düz Node üzerinde çalıştırır.

## Bilinen sınırlar

- Nöbet saatleri çoğu sağlayıcı tarafından verilmez; bu durumda varsayılan aralık kullanılır ve arayüzde "saatler tahmini" olarak işaretlenir.
- Eczane paneli kaydı, merkezî sunucu tanımlı değilken yalnızca kaydı yapan cihazda görünür.
- Panelde kimlik doğrulama yoktur. Gerçek kullanımda eczacı kimliğinin (GLN / ruhsat no) sunucu tarafında doğrulanması gerekir.
