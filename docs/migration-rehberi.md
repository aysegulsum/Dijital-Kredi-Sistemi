# EF Core Migration Rehberi

Bu projede **Code-First** yaklaşımı kullanılmaktadır. Veritabanı yapısı C# entity sınıfları tarafından belirlenir.

## Temel Akış

```
Entity değiştir → Migration oluştur → Veritabanını güncelle
```

Tüm komutlar `LoanManagement.API` dizininden çalıştırılır:

```bash
cd backend/LoanManagement.API
```

---

## 1. Yeni Alan Ekleme

**Entity'ye property ekle:**
```csharp
// Domain/Entities/Customer.cs
public string? Occupation { get; set; }
```

**Migration oluştur ve uygula:**
```bash
dotnet ef migrations add AddOccupationToCustomer --project ../LoanManagement.Infrastructure
dotnet ef database update --project ../LoanManagement.Infrastructure
```

---

## 2. Alan Güncelleme

**Entity'de değişikliği yap** (örn. `string?` → `string`):
```csharp
public string Phone { get; set; } = string.Empty;  // nullable değil artık
```

**Migration oluştur ve uygula:**
```bash
dotnet ef migrations add MakePhoneRequired --project ../LoanManagement.Infrastructure
dotnet ef database update --project ../LoanManagement.Infrastructure
```

> ⚠️ Mevcut veride NULL değer varsa migration hata verir. Migration dosyasını açıp önce default değer atanmalıdır.

---

## 3. Alan Silme

**Entity'den property'yi kaldır**, ardından:

```bash
dotnet ef migrations add RemoveAddressFromCustomer --project ../LoanManagement.Infrastructure
dotnet ef database update --project ../LoanManagement.Infrastructure
```

---

## 4. Manuel DB Değişikliği Yapıldıysa (Senkron Bozuldu)

Veritabanına elle kolon eklenip entity'ye de eklendi ama migration oluşturulmadıysa, bir sonraki `migrations add` aynı kolonu tekrar eklemeye çalışır ve `database update` hata verir.

**Çözüm — Boş migration ile snapshot'ı senkronla:**

```bash
dotnet ef migrations add SyncManualChanges --project ../LoanManagement.Infrastructure
```

Oluşan migration dosyasını aç, `Up()` ve `Down()` metotlarının içini **tamamen boşalt**:

```csharp
public partial class SyncManualChanges : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        // Boş bırak — değişiklik zaten DB'de mevcut
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        // Boş bırak
    }
}
```

Ardından uygula:

```bash
dotnet ef database update --project ../LoanManagement.Infrastructure
```

Bu sayede EF Core'un snapshot'ı güncellenir, migration geçmişine kayıt düşer ve gelecekteki migration'lar doğru farkı üretir.

---

## 5. Sık Kullanılan Komutlar

| Komut | Açıklama |
|-------|----------|
| `dotnet ef migrations add <İsim>` | Entity değişikliklerinden migration dosyası üretir |
| `dotnet ef database update` | Bekleyen migration'ları DB'ye uygular |
| `dotnet ef migrations remove` | Son migration'ı siler (henüz uygulanmamışsa) |
| `dotnet ef migrations list` | Tüm migration'ları listeler |
| `dotnet ef database update <MigrationAdı>` | Belirli bir migration'a geri döner (rollback) |

---

## Nasıl Çalışıyor?

EF Core, `Migrations/` klasöründe bir **ModelSnapshot** dosyası tutar. Her `migrations add` komutunda:

1. Mevcut entity sınıflarını tarar
2. Snapshot ile karşılaştırır
3. Farkı bulur → migration dosyasına yazar
4. Snapshot'ı günceller

Bu yüzden SQL elle yazılmaz, sadece entity değiştirilir ve migration komutu çalıştırılır.
