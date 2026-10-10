# 31chan

Anonim bir imageboard. Hesap yok, kayıt yok, e-posta yok.

## Özellikler

- Panolar: `/b/` Rastgele, `/g/` Teknoloji, `/v/` Oyunlar, `/m/` Müzik, `/a/` Sanat
- Konu açma (görsel zorunlu) ve yanıt yazma (görsel isteğe bağlı)
- Anonim kimlik: `Anonim` varsayılan isim, konu başına sabit `ID`
- `>>123` ile alıntı, `>` ile yeşil yazı (greentext)
- `sage` seçeneği (yanıt konuyu öne çıkarmaz)
- Liste ve katalog görünümleri
- Kendi gönderilerini silme
- Koyu / açık tema
- Görseller tarayıcıda küçültülür (JPEG); küçük GIF'ler animasyonunu korur
- PWA / çevrimdışı önbellek

## Çalıştırma

Statik bir sitedir; build adımı yoktur. `index.html` dosyasını bir web sunucusundan açın
(GitHub Pages'te doğrudan çalışır):

```sh
python3 -m http.server 8000
```

## Depolama

Şu an gönderiler **yalnızca tarayıcıda** (`localStorage`) saklanır. Sunucu olmadığı için
gönderiler diğer ziyaretçilere görünmez. Ortak bir imageboard için `store.js` içindeki
`ChanStore` arayüzünü bir arka uca (API, veritabanı) bağlamak gerekir; arayüzün geri kalanı
değişmeden kalabilir.

Depolama alanı dolunca (≈5 MB) en eski konular otomatik silinir. Konu başına en fazla
300 yanıt bumplanır, 500 gönderiden sonra konu kilitlenir.

## Dosyalar

- `index.html` — iskelet
- `style.css` — tema ve düzen
- `store.js` — veri katmanı (panolar, konular, yanıtlar, depolama)
- `app.js` — yönlendirme, görünümler, formlar, görsel işleme
- `sw.js`, `manifest.json` — PWA

## Lisans

MIT
