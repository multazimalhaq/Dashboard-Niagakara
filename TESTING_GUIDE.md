# PANDUAN TESTING - DASHBOARD NGKR
Generated: 2026-07-02 08:05:00

## FILE LOCATION
- Working File: C:\Users\LENOVO\Documents\Codex\2026-07-02\e-dashboard-ngkr\index.html
- Original: E:\Dashboard NGKR\index.html (permission denied, copy manual)
- Backup: C:\Users\LENOVO\Documents\Codex\2026-07-02\e-dashboard-ngkr\index_backup.html

## CARA TESTING

### 1. BULK IMPORT CSV/EXCEL
**Test Steps:**
1. Buka halaman "Weekly Budgeting"
2. Scroll ke section "Pengajuan Budget Marketing Advertiser"
3. Klik tombol "Import CSV/Excel"
4. Area import akan muncul dengan 2 opsi:
   - **Opsi A (Copy-Paste)**: Paste data CSV format
     `
     AdvertiserA,Shopee,ProductX,5000000,30
     AdvertiserB,TikTokShop,ProductY,3000000,25
     `
   - **Opsi B (Upload File)**: Click "Upload CSV / Excel" untuk pilih file .csv/.xlsx
5. Klik "Parse & Tambah"
6. Data akan ditambahkan ke tabel proposal

**Expected Result:**
- Data berhasil diparse
- Preview menunjukkan "✅ Berhasil mengimpor X baris!"
- Tabel proposal ter-update dengan data baru
- Auto-save berjalan setelah import

---

### 2. AUTO-SAVE (10 DETIK)
**Test Steps:**
1. Buat perubahan di tabel budgeting proposal (ubah budget atau CAC)
2. Tunggu 10 detik
3. Perhatikan indikator "Terakhir: HH:MM:SS" di bawah target cards
4. Refresh halaman (F5)
5. Data masih ada (tidak hilang)

**Expected Result:**
- Indikator waktu ter-update setiap 10 detik
- Data tersimpan di localStorage
- Setelah refresh, data tetap ada (auto-load)

---

### 3. PARETO 60% WARNING
**Test Steps:**
1. Buat proposal dengan dominasi Shopee atau TikTokShop
2. Atur budget & CAC sehingga revenue Shopee > 60% dari total
   - Contoh: Shopee budget 10jt CAC 20% = 50jt revenue
   - Total revenue = 70jt, maka Shopee = 71% > 60%
3. Perhatikan area di bawah tabel PAM Summary

**Expected Result:**
- Muncul warning box merah dengan pesan:
  "⚠️ Warning: Revenue share Shopee (71.4%) melebihi batas pareto 60%..."
- Row platform yang melanggar ter-highlight background merah muda
- Warning hilang jika proporsi dikurangi

---

### 4. WoW COMPARISON
**Test Steps:**
1. Pilih periode minggu di dropdown "Periode:"
2. Scroll ke section "Week-over-Week Comparison"
3. Lihat 4 metric cards:
   - Budget WoW
   - Gross Revenue WoW
   - CAC WoW
   - Omset Margin WoW

**Expected Result:**
- Setiap card menampilkan nilai current week
- % perubahan ditampilkan dengan arrow (▲ naik / ▼ turun)
- Warna hijau untuk improvement, merah untuk decline
- Data dibandingkan dengan minggu H-14 s/d H-7

---

### 5. TREND ANALYSIS CHART
**Test Steps:**
1. Scroll ke section "Trend Analysis (4 Minggu Terakhir)"
2. Chart akan auto-render saat halaman load
3. Klik "Update Chart" untuk refresh manual
4. Hover pada data points untuk lihat tooltip

**Expected Result:**
- Chart menampilkan 3 line:
  - Budget Iklan (Biru, solid)
  - Gross Revenue (Hijau, solid)
  - CAC % (Kuning, dashed)
- X-axis: Label periode 4 minggu terakhir
- Y-axis (kiri): Rupiah dalam jutaan
- Y-axis (kanan): Persentase CAC

---

### 6. EXPORT TO EXCEL
**Test Steps:**
1. Pastikan ada data di proposal rows (minimal 1 baris)
2. Klik tombol "Export ke Excel"
3. File akan ter-download otomatis

**Expected Result:**
- File download: Weekly_Budget_Proposal_2026-07-02.xlsx
- Format Excel (.xlsx) jika SheetJS berhasil load
- Fallback ke CSV jika ada masalah
- Kolom: Nama ADV, Platform, Produk, Mode, Budget, Target Revenue, Target CAC, Admin Rate

---

### 7. SAVE REKOMENDASI
**Test Steps:**
1. Tambah/edit proposal rows
2. Klik tombol "Save Rekomendasi" (warna primary/hijau)
3. Confirmation dialog muncul
4. Klik OK

**Expected Result:**
- Alert: "Rekomendasi budgeting berhasil disimpan secara permanen!"
- Data tersimpan ke localStorage
- Indikator "Terakhir: HH:MM:SS" ter-update

---

### 8. TARGET BULANAN & MINGGUAN
**Test Steps:**
1. Di section "Target Revenue Bulanan", input angka (misal: 500000000)
2. Klik "Simpan Target" atau tekan Enter
3. Perhatikan:
   - Target display ter-update
   - Progress bar menampilkan pencapaian saat ini
   - Target mingguan otomatis = target bulanan ÷ 4

**Expected Result:**
- Monthly target: Rp500,000,000
- Weekly target: Rp125,000,000
- Progress bar terisi sesuai revenue real bulan/minggu ini
- Persentase ditampilkan (misal: 45%)

---

## TROUBLESHOOTING

### Chart tidak muncul
- Cek console browser (F12) untuk error
- Pastikan CDN Chart.js berhasil load
- Cek internet connection

### Import Excel gagal
- Pastikan file format .xlsx/.xls valid
- Cek console untuk error SheetJS
- Fallback: Convert to CSV dan paste manual

### Auto-save tidak jalan
- Cek localStorage di browser (F12 > Application > Local Storage)
- Key: 'ngkr_budgeting_proposal'
- Pastikan browser tidak dalam incognito mode

### Warning 60% tidak muncul
- Pastikan total revenue > 0
- Cek perhitungan: revenue = budget / (CAC/100)
- Minimal 1 platform harus >60% untuk trigger

---

## NEXT STEPS

1. **Copy file ke E:\Dashboard NGKR\**
   - Close semua program yang buka file index.html di E:\
   - Copy manual dari: C:\Users\LENOVO\Documents\Codex\2026-07-02\e-dashboard-ngkr\index.html
   - Atau rename file lama, lalu copy yang baru

2. **Test di browser**
   - Buka index.html di Chrome/Edge
   - Test semua fitur satu per satu
   - Cek console untuk error (F12)

3. **Deploy ke server (jika ada)**
   - Upload file index.html yang sudah dimodifikasi
   - Test di server environment
   - Pastikan CDN Chart.js & SheetJS accessible

4. **User Training**
   - Buat dokumentasi singkat untuk user
   - Demo cara import CSV/Excel
   - Jelaskan pareto warning system

---

## TECHNICAL NOTES

### Dependencies Added:
- Chart.js v4.x (CDN): https://cdn.jsdelivr.net/npm/chart.js
- SheetJS v0.18.5 (CDN): https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js

### localStorage Keys:
- 'ngkr_budgeting_proposal': Weekly proposal rows (auto-save)
- 'ngkr_monthly_target': Monthly revenue target
- (existing keys tetap dipertahankan)

### New Functions:
- setupAutoSave()
- setupBulkImport()
- parseBulkTextData()
- setupExportFunctions()
- setupSaveRecommendation()
- checkParetoWarnings()
- renderWoWComparison()
- renderTrendChart()
- updateMonthlyAndWeeklyTargetProgress()

### Hooks Added:
- renderWeeklyBudgetingPage() now calls:
  - updateMonthlyAndWeeklyTargetProgress()
  - renderWoWComparison()
  - renderTrendChart()
  - checkParetoWarnings()

---

Jika ada bug atau pertanyaan, silakan laporkan dengan detail:
- Browser & version
- Error message di console
- Screenshot issue
