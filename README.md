# Dijital Kredi ve Geri Ödeme Yönetim Sistemi

Müşteri yönetimi, kredi başvurusu, taksit planı oluşturma, ödeme işleme ve kredi puanı takibi yapabilen full-stack bir bankacılık uygulamasıdır.

## Teknoloji Stack

### Backend
- **.NET 10** — ASP.NET Core Web API
- **Entity Framework Core** — SQL Server, Code-First migration
- **FluentValidation** — DTO doğrulama
- **Katmanlı Mimari** — API / Application / Domain / Infrastructure

### Frontend
- **React 18** + **TypeScript**
- **Vite** — Build tool
- **Tailwind CSS** — UI framework
- **Axios** — HTTP client

## Proje Yapısı

```
backend/
├── LoanManagement.API/            # Controller, DTO, Middleware
├── LoanManagement.Application/    # Service, Interface, Model
├── LoanManagement.Domain/         # Entity, Enum, Exception
└── LoanManagement.Infrastructure/ # DbContext, Repository, ExternalService

frontend/
└── src/
    ├── api/          # Axios API çağrıları
    ├── components/   # Navbar, Footer, StatusBadge
    ├── pages/        # Sayfa bileşenleri
    └── types/        # TypeScript tip tanımları
```

## Kurulum ve Çalıştırma

### Gereksinimler
- .NET 10 SDK
- Node.js 18+
- SQL Server (LocalDB veya tam sürüm)

### Backend

```bash
cd backend/LoanManagement.API
dotnet restore
dotnet ef database update --project ../LoanManagement.Infrastructure
dotnet run
```

API varsayılan olarak `https://localhost:7062` adresinde çalışır.  
Scalar API dokümantasyonu: `https://localhost:7062/scalar/v1`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Uygulama `http://localhost:5173` adresinde açılır.

## Temel Özellikler

| Özellik | Açıklama |
|---------|----------|
| Müşteri Yönetimi | CRUD işlemleri, soft delete, TC/email benzersizlik kontrolü |
| Kredi Başvurusu | Kredi puanı kontrolü (min 700), kâr oranı hesaplama, otomatik taksit planı |
| Taksit Takibi | Durum filtreleme (Bekliyor/Ödendi/Gecikmiş), ilerleme çubuğu |
| Ödeme İşleme | Fake payment gateway, kart doğrulama, 3D Secure simülasyonu |
| Taksit Ödeme | Her taksit tam tutarıyla ödenir, taksit başına tek ödeme |
| Kredi Puanı | KKB/Findeks benzeri 1-1900 skor sistemi, otomatik yenileme |

## İş Kuralları

- **Kredi Puanı Eşiği:** Başvuru için minimum 700 puan gereklidir
- **Kâr Oranı Hesaplama:** `Toplam = Anapara × (1 + Aylık Kâr Oranı × Vade)`
 MVP aşaması olduğu için basit kâr modeli tercih edilmiştir.
- **Ödeme Kuralı:** Her taksit tam tutarıyla ödenir, taksit başına yalnızca bir ödeme yapılabilir
- **Otomatik Kapanış:** Tüm taksitler ödendiğinde kredi otomatik kapatılır
- **Skor Tazeliği:** 1 günden eski skorlar müşteri sorgulandığında otomatik yenilenir

## Mock Servisler

### Payment Gateway
- `4xxx` veya `5xxx` ile başlayan kartlar: Başarılı
- `6xxx` ile başlayan kartlar: Yetersiz bakiye
- Tek seferde maksimum 50.000 TL
- SKT (son kullanma tarihi) kontrolü

### 3D Secure
- Hardcoded doğrulama kodu: `123456`

### Kredi Bürosu (KKB)
- TC numarasına göre deterministik baz skor
- Kredi geçmişine göre dinamik ayarlama (+/- puan)

## API Dokümantasyonu

Detaylı endpoint listesi: [docs/api-endpoints.md](docs/api-endpoints.md)

## Diyagramlar

- [ER Diyagramı](docs/er-diagram.drawio) — Entity ilişkileri (draw.io)
- [Akış Diyagramı](docs/flow-diagram.drawio) — İş akışları (draw.io)
