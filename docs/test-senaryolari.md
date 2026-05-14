# Test Senaryoları

Base URL: `http://localhost:5198/api`

## Seed Müşteri Verileri

| # | Ad Soyad | TC No | Baz Skor | Risk | Bakiye | Kredi Durumu |
|---|----------|-------|----------|------|--------|--------------|
| 0 | Ahmet Yilmaz | 12345678905 | 1000 | Orta Riskli | 50.000 TL | 1 aktif (4/12 ödenmiş) + 1 kapalı |
| 1 | Fatma Kaya | 23456789016 | 1200 | Az Riskli | 120.000 TL | 1 aktif (hiç ödeme yok) |
| 2 | Mehmet Demir | 34567890127 | 1400 | Az Riskli | 75.000 TL | 1 aktif (2 taksit gecikmiş) |
| 3 | Ayse Celik | 45678901238 | 1600 | İyi | 30.000 TL | 1 aktif (1/12 ödenmiş) |
| 4 | Mustafa Sahin | 56789012349 | 1850 | Çok İyi | 200.000 TL | 2 aktif (ihtiyaç + taşıt) |
| 5 | Zeynep Ozturk | 67890123456 | 1200 | Az Riskli | 15.000 TL | 1 kapalı (tüm borç bitmiş) |
| 6 | Ali Yildiz | 11111111111 | 250 | En Riskli | 5.000 TL | Kredi yok |
| 7 | Elif Aksoy | 22222222222 | 450 | En Riskli | 2.500 TL | Kredi yok |
| 8 | Hasan Korkmaz | 33333333333 | 650 | En Riskli | 10.000 TL | Kredi yok |
| 9 | Selin Arslan | 99999999990 | 0 | Puanı Yok | 8.000 TL | Kredi yok |

---

## 1. Müşteri İşlemleri

### 1.1 Müşteri Oluşturma — Başarılı

```http
POST /customers
```
```json
{
  "firstName": "Deniz",
  "lastName": "Kara",
  "email": "deniz@mail.com",
  "tcNo": "55555555555",
  "birthDate": "1995-06-15",
  "phone": "05501112233",
  "address": "Ankara"
}
```
**Beklenen:** `201 Created`, kredi puanı otomatik hesaplanmış olarak döner.

### 1.2 Müşteri Oluşturma — TC Çakışması

```http
POST /customers
```
```json
{
  "firstName": "Test",
  "lastName": "User",
  "email": "test@mail.com",
  "tcNo": "12345678905",
  "birthDate": "1990-01-01"
}
```
**Beklenen:** `409 Conflict` — TC numarası zaten mevcut (Ahmet Yilmaz).

### 1.3 Müşteri Oluşturma — Geçersiz Email

```http
POST /customers
```
```json
{
  "firstName": "Test",
  "lastName": "User",
  "email": "gecersiz-email",
  "tcNo": "77777777777",
  "birthDate": "1990-01-01"
}
```
**Beklenen:** `400 Bad Request` — FluentValidation email format hatası.

### 1.4 Müşteri Oluşturma — 18 Yaş Altı

```http
POST /customers
```
```json
{
  "firstName": "Genç",
  "lastName": "Kullanıcı",
  "email": "genc@mail.com",
  "tcNo": "88888888888",
  "birthDate": "2015-01-01"
}
```
**Beklenen:** `400 Bad Request` — 18 yaşından küçük.

### 1.5 Müşteri Güncelleme — Başarılı

Ahmet Yilmaz'ın ID'sini kullanarak:
```http
PUT /customers/{ahmetId}
```
```json
{
  "firstName": "Ahmet",
  "lastName": "Yilmaz",
  "email": "ahmet.yeni@mail.com",
  "phone": "05309999999",
  "address": "İstanbul"
}
```
**Beklenen:** `200 OK`

### 1.6 Müşteri Silme (Soft Delete)

```http
DELETE /customers/{selinId}
```
**Beklenen:** `204 No Content` — Selin listeden kaybolur ama veritabanında `IsDeleted = true` olarak kalır.

### 1.7 Kredi Puanı Yenileme

```http
POST /customers/{ahmetId}/recalculate-credit-score
```
**Beklenen:** `200 OK` — Ahmet'in ödeme geçmişine göre güncel skor ve breakdown döner.

---

## 2. Kredi Başvurusu

### 2.1 Başvuru — Başarılı (Mustafa, skor: 1850)

```http
POST /loans
```
```json
{
  "customerId": "{mustafaId}",
  "loanType": "Ihtiyac",
  "principal": 25000,
  "interestRate": 0.02,
  "termMonths": 6,
  "startDate": "2026-06-01"
}
```
**Beklenen:** `201 Created` — 6 taksitlik plan oluşur.  
**Hesaplama:** Toplam = 25000 × (1 + 0.02 × 6) = 28000 TL, Aylık = 4666.67 TL

### 2.2 Başvuru — Red (Ali, skor: 250)

```http
POST /loans
```
```json
{
  "customerId": "{aliId}",
  "loanType": "Ihtiyac",
  "principal": 10000,
  "interestRate": 0.02,
  "termMonths": 12,
  "startDate": "2026-06-01"
}
```
**Beklenen:** `422 Unprocessable Entity` — Kredi puanı 700'ün altında.

### 2.3 Başvuru — Red (Selin, skor: 0)

```http
POST /loans
```
```json
{
  "customerId": "{selinId}",
  "loanType": "Egitim",
  "principal": 5000,
  "interestRate": 0.015,
  "termMonths": 6,
  "startDate": "2026-06-01"
}
```
**Beklenen:** `422` — Kredi geçmişi olmayan müşteri, puanı 0.

### 2.4 Başvuru — Geçersiz Anapara (Sınır Dışı)

```http
POST /loans
```
```json
{
  "customerId": "{fatmaId}",
  "loanType": "Ihtiyac",
  "principal": 500,
  "interestRate": 0.02,
  "termMonths": 12,
  "startDate": "2026-06-01"
}
```
**Beklenen:** `400 Bad Request` — Anapara minimum 1.000 TL olmalı.

### 2.5 Başvuru — Geçersiz Kâr Oranı

```http
POST /loans
```
```json
{
  "customerId": "{fatmaId}",
  "loanType": "Tasit",
  "principal": 50000,
  "interestRate": 0.15,
  "termMonths": 24,
  "startDate": "2026-06-01"
}
```
**Beklenen:** `400 Bad Request` — Kâr oranı maksimum %10 (0.10) olmalı.

### 2.6 Kredi Türü Güncelleme — Aktif Kredi

```http
PUT /loans/{fatmaAktifLoanId}
```
```json
{
  "loanType": "Egitim"
}
```
**Beklenen:** `200 OK` — Taşıt → Eğitim olarak güncellenir.

### 2.7 Kredi Türü Güncelleme — Kapalı Kredi

```http
PUT /loans/{ahmetKapaliLoanId}
```
```json
{
  "loanType": "Ihtiyac"
}
```
**Beklenen:** `409 Conflict` — Kapatılmış kredi güncellenemez.

---

## 3. Ödeme İşlemleri

### 3.1 Ödeme — Başarılı (Geçerli Kart)

Fatma'nın aktif kredisinden sıradaki taksiti öde:
```http
POST /payments
```
```json
{
  "loanId": "{fatmaLoanId}",
  "amount": 2708.33,
  "cardNumber": "4000 0000 0000 0000",
  "cardHolder": "FATMA KAYA",
  "expiryDate": "12/28",
  "cvv": "123"
}
```
**Beklenen:** `200 OK` — Taksit #1 ödendi, bakiyeden düşüldü, `paymentRef` döner.

> **Not:** `amount` değerini Fatma'nın kredisinin aylık taksit tutarına göre ayarlayın.

### 3.2 Ödeme — Yetersiz Bakiye

Elif'in bakiyesi 2.500 TL. Önce ona yüksek puanlı bir kredi vermek mümkün olmadığından, bakiyesi düşük bir müşteri ile test edin.

Alternatif: Bakiyesi taksit tutarından az olan müşteri ile deneyin.

**Beklenen:** `422 Unprocessable Entity` — "Yetersiz bakiye" mesajı.

### 3.3 Ödeme — Geçersiz Kart (6xxx)

```http
POST /payments
```
```json
{
  "loanId": "{ahmetLoanId}",
  "amount": 2066.67,
  "cardNumber": "6000 0000 0000 0000",
  "cardHolder": "AHMET YILMAZ",
  "expiryDate": "12/28",
  "cvv": "123"
}
```
**Beklenen:** `402 Payment Failed` — "Yetersiz bakiye" (gateway tarafından reddedildi).

> **Not:** `amount` değerini Ahmet'in sıradaki taksit tutarına göre ayarlayın.

### 3.4 Ödeme — Son Kullanma Tarihi Geçmiş Kart

```http
POST /payments
```
```json
{
  "loanId": "{ahmetLoanId}",
  "amount": 2066.67,
  "cardNumber": "4000 0000 0000 0000",
  "cardHolder": "AHMET YILMAZ",
  "expiryDate": "01/23",
  "cvv": "123"
}
```
**Beklenen:** `402 Payment Failed` — "Kartınızın son kullanma tarihi geçmiş."

### 3.5 Ödeme — Desteklenmeyen Kart Tipi (3xxx)

```http
POST /payments
```
```json
{
  "loanId": "{ahmetLoanId}",
  "amount": 2066.67,
  "cardNumber": "3000 0000 0000 0000",
  "cardHolder": "AHMET YILMAZ",
  "expiryDate": "12/28",
  "cvv": "123"
}
```
**Beklenen:** `402 Payment Failed` — "Desteklenmeyen kart tipi."

### 3.6 Ödeme — Kısmi Tutar (Taksit Tutarından Düşük)

```http
POST /payments
```
```json
{
  "loanId": "{ahmetLoanId}",
  "amount": 500,
  "cardNumber": "4000 0000 0000 0000",
  "cardHolder": "AHMET YILMAZ",
  "expiryDate": "12/28",
  "cvv": "123"
}
```
**Beklenen:** `422` — "Ödeme tutarı taksit tutarından düşük olamaz."

### 3.7 Ödeme — Fazla Tutar (Taksit Tutarından Yüksek)

```http
POST /payments
```
```json
{
  "loanId": "{ahmetLoanId}",
  "amount": 99999,
  "cardNumber": "4000 0000 0000 0000",
  "cardHolder": "AHMET YILMAZ",
  "expiryDate": "12/28",
  "cvv": "123"
}
```
**Beklenen:** `422` — "Ödeme tutarı taksit tutarından yüksek olamaz."

### 3.8 Ödeme — Kapalı Krediye Ödeme

```http
POST /payments
```
```json
{
  "loanId": "{ahmetKapaliLoanId}",
  "amount": 1000,
  "cardNumber": "4000 0000 0000 0000",
  "cardHolder": "AHMET YILMAZ",
  "expiryDate": "12/28",
  "cvv": "123"
}
```
**Beklenen:** `409 Conflict` — "Bu kredi zaten kapatılmıştır."

### 3.9 Ödeme — 50.000 TL Üzeri (Gateway Limiti)

Bakiyesi yeterli bir müşterinin taksit tutarı 50.000 TL'yi geçiyorsa:

**Beklenen:** `402 Payment Failed` — "Tek seferde maksimum 50.000 TL ödeme yapılabilir."

---

## 4. Otomatik Kredi Kapanışı

Zeynep'in kapalı eğitim kredisi (3 taksit, hepsi ödenmiş) zaten seed'de bu durumda.

Canlı test için: **Ayse'nin 12 taksitli eğitim kredisinde** tüm kalan taksitleri sırayla ödeyerek son taksitte kredinin otomatik `Closed` statüsüne geçtiğini doğrulayın.

```http
GET /loans/{ayseLoanId}
```
**Son ödeme sonrası beklenen:** `"status": "Closed"`

---

## 5. Sorgu Endpoint'leri

### 5.1 Müşteri Listesi

```http
GET /customers
```
**Beklenen:** Soft delete yapılmış müşteriler listede görünmez.

### 5.2 Müşteri Detayı (Skor Tazeliği)

```http
GET /customers/{ahmetId}
```
**Beklenen:** Skor 1 günden eskiyse otomatik yenilenir, `creditScoreUpdatedAt` güncellenir.

### 5.3 Müşterinin Kredileri

```http
GET /loans/by-customer/{mustafaId}
```
**Beklenen:** 2 (veya daha fazla) aktif kredi listelenir.

### 5.4 Kredinin Taksitleri

```http
GET /installments/by-loan/{mehmetLoanId}
```
**Beklenen:** 18 taksit — ilk 2'si `Overdue`, geri kalanı `Pending`.

### 5.5 Kredinin Ödemeleri

```http
GET /payments/by-loan/{ahmetAktifLoanId}
```
**Beklenen:** 4 ödeme kaydı (seed'de 4 taksit ödenmiş).

### 5.6 Müşteri Borç Özeti

```http
GET /customers/{ahmetId}/summary
```
**Beklenen:**
```json
{
  "activeLoanCount": 1,
  "totalDebt": "...",
  "remainingPrincipal": "...",
  "overdueInstallmentCount": 0,
  "paidInstallmentCount": 10,
  "unpaidInstallmentCount": 8
}
```

---

## Mock Servis Kart Kuralları (Özet)

| Kart Numarası | Sonuç |
|---------------|-------|
| `4xxx xxxx xxxx xxxx` | Başarılı |
| `5xxx xxxx xxxx xxxx` | Başarılı |
| `6xxx xxxx xxxx xxxx` | Yetersiz bakiye |
| `3xxx xxxx xxxx xxxx` | Desteklenmeyen kart |
| SKT geçmiş (ör. `01/23`) | Son kullanma tarihi geçmiş |
| Tutar > 50.000 TL | Gateway limit aşımı |

## 3D Secure

Doğrulama kodu: `123456`
