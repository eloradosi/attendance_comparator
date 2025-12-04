# Frontend Attendance Comparator — Next.js + TypeScript (Single File Prompt)

Buatkan sebuah frontend lengkap menggunakan Next.js + TypeScript + TailwindCSS + shadcn/ui untuk membandingkan dua file attendance (File A dan File B). Satu file hanya berisi data untuk satu orang. User mengupload dua file (format CSV, XLSX, atau PDF), frontend mengirimkan file tersebut ke endpoint `/api/compare`, menerima hasil comparison berupa JSON, menampilkan tabel comparison, dan menyediakan fitur download hasil comparison dalam format CSV dan Excel. Seluruh instruksi dalam file ini harus diimplementasikan oleh GitHub Copilot.

================================================

## REQUIREMENTS (HARUS DIBUAT)

### Fitur Utama:
1. Upload dua file: File A & File B
2. Kirim file ke backend via FormData ke `/api/compare`
3. Terima response JSON dalam format:
   {
     "person": "John Doe",
     "diffs": [
       {
         "date": "2025-12-01",
         "fileA": { "checkin": "08:00", "checkout": "17:05" },
         "fileB": { "checkin": "08:15", "checkout": "17:05" },
         "status": "CHECKIN_MISMATCH"
       },
       {
         "date": "2025-12-02",
         "fileA": { "checkin": "08:01", "checkout": "17:00" },
         "fileB": null,
         "status": "MISSING_IN_B"
       }
     ]
   }
4. Tampilkan seluruh diff dalam tabel
5. Highlight row tabel berdasarkan status:
   - Merah → mismatch
   - Kuning → missing
   - Hijau → match
6. Tombol Export → CSV & Excel (xlsx)
7. Clean UI, responsive, pakai shadcn/ui
8. Buat mock API `/api/compare` yang return JSON di atas agar UI dapat berjalan sebelum backend siap

================================================

## TEKNOLOGI FRONTEND
- Next.js 14 (App Router)
- TypeScript
- TailwindCSS
- shadcn/ui
- papaparse → export CSV
- xlsx → export Excel

================================================

## STRUKTUR YANG HARUS DIBUAT (WAJIB)
Semua wajib dibuat:

src/app/page.tsx  
→ halaman upload file  

src/app/compare/page.tsx  
→ halaman hasil comparison  

src/app/api/compare/route.ts  
→ mock API  

src/components/FileUpload.tsx  
→ komponen upload File A & B  

src/components/DiffTable.tsx  
→ tabel hasil comparison  

src/components/DiffStatusBadge.tsx  
→ badge status warna  

src/components/ExportButtons.tsx  
→ export CSV & Excel  

src/utils/exportExcel.ts  
→ fungsi util export Excel  

src/utils/exportCsv.ts  
→ fungsi util export CSV  

src/utils/types.ts  
→ definisi interface: Attendance, DiffItem, CompareResponse  

================================================

## DETAIL IMPLEMENTASI (WAJIB)

### 1. Halaman Upload (page.tsx)
- Gunakan komponen FileUpload
- Minta user memilih File A dan File B
- Validasi: kedua file wajib ada
- Tombol "Compare Files"
- Submit form → kirim FormData ke `/api/compare`
- Redirect ke halaman `/compare` sambil mengirim hasil response

### 2. Komponen FileUpload.tsx
- Dua input file (File A & File B)
- Accept: `.csv, .xlsx, .pdf`
- Tampilkan nama file setelah dipilih
- Gunakan shadcn Form, Card, Button

### 3. Mock API Route (/api/compare)
- Terima FormData
- Return JSON dummy (yang disediakan di atas)

### 4. Halaman Comparison (compare/page.tsx)
- Ambil data comparison (JSON)
- Tampilkan dengan DiffTable
- Tampilkan ExportButtons

### 5. Tabel Comparison (DiffTable.tsx)
- Kolom: Date, Check-in A, Check-in B, Check-out A, Check-out B, Status
- Row coloring:
  - CHECKIN_MISMATCH → bg-red-100
  - CHECKOUT_MISMATCH → bg-red-100
  - MISSING_IN_A → bg-yellow-100
  - MISSING_IN_B → bg-yellow-100
  - MATCH → bg-green-50
- Gunakan shadcn Table

### 6. DiffStatusBadge.tsx
- Warna:
  - merah untuk mismatch
  - kuning untuk missing
  - hijau untuk match

### 7. ExportButtons.tsx
- Buat 2 tombol:
  - Export CSV
  - Export Excel
- Gunakan `papaparse` untuk CSV
- Gunakan `xlsx` untuk Excel

### 8. Utility exportExcel.ts
- Konversi diffs → worksheet
- Export file `comparison-result.xlsx`

### 9. Utility exportCsv.ts
- Gunakan `papaparse.unparse()`
- Export file `comparison-result.csv`

### 10. types.ts
Isi interface:

export interface Attendance {
  checkin: string | null;
  checkout: string | null;
}

export interface DiffItem {
  date: string;
  fileA: Attendance | null;
  fileB: Attendance | null;
  status: string;
}

export interface CompareResponse {
  person: string;
  diffs: DiffItem[];
}

================================================

## USER FLOW
1. User buka halaman
2. Upload File A & File B
3. Klik Compare
4. FE kirim FormData ke API
5. FE menerima JSON hasil comparison
6. FE tampilkan tabel diff
7. User export CSV/Excel jika perlu

================================================

## UI/UX GUIDELINE
- Simple, corporate, modern
- Putih, abu soft, border halus
- Card upload max-width 800px
- Tabel full width
- Mobile friendly

================================================

# INSTRUKSI AKHIR UNTUK GITHUB COPILOT (WAJIB DIBACA OLEH COPILOT)

**Generate a complete Next.js + TypeScript frontend project based entirely on this markdown file.  
Create all pages, components, utilities, and API mocks described above.  
Use TailwindCSS and shadcn/ui.  
Implement file upload, comparison table, row highlighting, and export CSV/Excel.  
The final project must be fully functional, clean, responsive, and production-ready.**

================================================

# END OF FILE
