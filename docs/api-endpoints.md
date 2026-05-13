# API Endpoint Dokümantasyonu

Base URL: `http://localhost:5198/api`

## Müşteriler (`/customers`)

| Metot | Yol | Açıklama |
|-------|-----|----------|
| GET | `/customers` | Tüm müşterileri listele (soft delete hariç) |
| GET | `/customers/{id}` | Müşteri detayı (skor eskiyse otomatik yeniler) |
| POST | `/customers` | Yeni müşteri oluştur |
| PUT | `/customers/{id}` | Müşteri bilgilerini güncelle |
| DELETE | `/customers/{id}` | Müşteriyi soft delete ile sil |
| POST | `/customers/{id}/recalculate-credit-score` | Kredi puanını yeniden hesapla |

### POST `/customers` — Yeni Müşteri

**Request Body:**
```json
{
  "firstName": "Ayşe",
  "lastName": "Yılmaz",
  "email": "ayse@example.com",
  "tcNo": "12345678901",
  "birthDate": "1990-05-15",
  "phone": "05551234567",
  "address": "İstanbul"
}
```

**Response (201):**
```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "firstName": "Ayşe",
  "lastName": "Yılmaz",
  "email": "ayse@example.com",
  "tcNo": "12345678901",
  "birthDate": "1990-05-15",
  "phone": "05551234567",
  "address": "İstanbul",
  "balance": 0,
  "creditScore": 1250,
  "creditScoreUpdatedAt": "2026-05-13T10:30:00Z",
  "createdAt": "2026-05-13T10:30:00Z"
}
```

### PUT `/customers/{id}` — Müşteri Güncelle

**Request Body:**
```json
{
  "firstName": "Ayşe",
  "lastName": "Yılmaz",
  "email": "ayse.yilmaz@example.com",
  "phone": "05559876543",
  "address": "Ankara"
}
```

### POST `/customers/{id}/recalculate-credit-score` — Kredi Puanı Yenile

**Response (200):**
```json
{
  "score": 1350,
  "riskLevel": "Az Riskli",
  "queriedAt": "2026-05-13T10:30:00Z",
  "breakdown": {
    "baseScore": 1200,
    "onTimePaymentBonus": 200,
    "latePaymentPenalty": -50,
    "activeLoanCount": 2,
    "closedLoanBonus": 0
  }
}
```

---

## Krediler (`/loans`)

| Metot | Yol | Açıklama |
|-------|-----|----------|
| GET | `/loans` | Tüm kredileri listele |
| GET | `/loans/{id}` | Kredi detayı (taksitlerle birlikte) |
| GET | `/loans/by-customer/{customerId}` | Müşterinin kredilerini listele |
| POST | `/loans` | Yeni kredi başvurusu |
| PUT | `/loans/{id}` | Kredi türünü güncelle (sadece aktif) |
| PATCH | `/loans/{id}/status` | Kredi durumunu değiştir |

### POST `/loans` — Kredi Başvurusu

**Request Body:**
```json
{
  "customerId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "loanType": "Ihtiyac",
  "principal": 50000,
  "interestRate": 0.02,
  "termMonths": 12,
  "startDate": "2026-05-15"
}
```

**Response (201):**
```json
{
  "id": "...",
  "customerId": "...",
  "loanType": "Ihtiyac",
  "principal": 50000,
  "interestRate": 0.02,
  "termMonths": 12,
  "totalAmount": 62000,
  "monthlyPayment": 5166.67,
  "startDate": "2026-05-15",
  "status": "Active",
  "creditScore": 1250,
  "installments": [
    {
      "installmentNo": 1,
      "amount": 5166.67,
      "paidAmount": 0,
      "remainingAmount": 5166.67,
      "dueDate": "2026-06-15",
      "status": "Pending"
    }
  ]
}
```

**Hata Durumları:**
- `404` — Müşteri bulunamadı
- `422` — Kredi puanı yetersiz (min 700)

### PUT `/loans/{id}` — Kredi Türü Güncelle

**Request Body:**
```json
{
  "loanType": "Egitim"
}
```

**Hata Durumları:**
- `409` — Kapatılmış kredi güncellenemez

---

## Taksitler (`/installments`)

| Metot | Yol | Açıklama |
|-------|-----|----------|
| GET | `/installments/{id}` | Taksit detayı |
| GET | `/installments/by-loan/{loanId}` | Kredinin tüm taksitleri |

### GET `/installments/by-loan/{loanId}` — Taksit Listesi

**Response (200):**
```json
[
  {
    "id": "...",
    "loanId": "...",
    "installmentNo": 1,
    "amount": 5166.67,
    "paidAmount": 5166.67,
    "remainingAmount": 0,
    "dueDate": "2026-06-15",
    "status": "Paid",
    "payment": {
      "amountPaid": 5166.67,
      "paidAt": "2026-06-10T14:00:00Z",
      "paymentRef": "PAY-ABC123"
    }
  }
]
```

---

## Ödemeler (`/payments`)

| Metot | Yol | Açıklama |
|-------|-----|----------|
| GET | `/payments/{id}` | Ödeme detayı |
| GET | `/payments/by-loan/{loanId}` | Kredinin tüm ödemeleri |
| POST | `/payments` | Ödeme yap (kart bilgileriyle) |

### POST `/payments` — Ödeme İşle

Sıradaki ödenmemiş taksiti tam tutarıyla öder. Tutar taksit tutarına eşit olmalıdır.

**Request Body:**
```json
{
  "loanId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "amount": 5166.67,
  "cardNumber": "4000 0000 0000 0000",
  "cardHolder": "AYSE YILMAZ",
  "expiryDate": "12/28",
  "cvv": "123"
}
```

**Response (200):**
```json
{
  "id": "...",
  "loanId": "...",
  "installmentId": "...",
  "amountPaid": 5166.67,
  "paidAt": "2026-05-13T14:30:00Z",
  "paymentRef": "PAY-XYZ789",
  "gatewayStatus": "Success"
}
```

**Hata Durumları:**
- `402` — Ödeme başarısız (geçersiz kart, SKT geçmiş, gateway hatası)
- `404` — Kredi bulunamadı
- `409` — Kapatılmış krediye ödeme yapılamaz / Bu taksit için zaten ödeme yapılmış
- `422` — Yetersiz bakiye / Ödeme tutarı taksit tutarıyla eşleşmiyor

---

## Müşteri Özeti (`/customers/{customerId}/summary`)

| Metot | Yol | Açıklama |
|-------|-----|----------|
| GET | `/customers/{customerId}/summary` | Müşterinin borç özeti |

**Response (200):**
```json
{
  "activeLoanCount": 2,
  "totalDebt": 45000,
  "remainingPrincipal": 38000,
  "overdueInstallmentCount": 1,
  "paidInstallmentCount": 5,
  "unpaidInstallmentCount": 19
}
```

---

## Hata Formatı (RFC 7807)

Tüm hatalar `ProblemDetails` formatında döner:

```json
{
  "type": "https://tools.ietf.org/html/rfc7807",
  "title": "Conflict",
  "status": 409,
  "detail": "Kapatılmış bir kredi güncellenemez."
}
```

| HTTP Kodu | Exception | Açıklama |
|-----------|-----------|----------|
| 404 | NotFoundException | Kayıt bulunamadı |
| 402 | PaymentFailedException | Ödeme gateway hatası |
| 409 | ConflictException | İş kuralı çakışması |
| 422 | ValidationException | Doğrulama hatası |
