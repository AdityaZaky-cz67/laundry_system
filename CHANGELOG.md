# Changelog

## 2026-09-09 — Lock status `Selesai` (final, seperti Lunas)

### Konteks
Admin meminta: setelah status pesanan mencapai **Selesai**, statusnya tidak bisa diubah lagi — dropdown tidak bisa diklik.

### Yang berubah
- `server.js` — `PUT /api/:type/:id`: satu `SELECT` membaca baris pesanan saat ini; jika statusnya sudah `Selesai` dan body meminta status selain `Selesai` → 400 `Pesanan yang sudah selesai tidak dapat diubah statusnya`. Lock Lunas digabung di check yang sama. Lock pembayaran tetap independen (pesanan Selesai+Belum Lunas masih bisa di-Setor).
- `app.js` — `statusCell`: pesanan `Selesai` menampilkan chip **Selesai ✓ terkunci** (bukan dropdown, tidak bisa diklik); selain itu dropdown seperti semula.

### Bukti
- e2e (jsdom) dijalankan di **DB test terpisah** (container disposable, port 8090) agar data produksi user tidak tersentuh: **51 pass / 0 fail**, termasuk: dropdown hanya di pesanan belum selesai (2 dari 3); pesanan Selesai tampil chip terkunci; setelah diubah ke Selesai via dropdown → chip terkunci muncul; `PUT {status:'Diproses'}` pada pesanan Selesai → **400** dan data tetap `Selesai`; Setor tetap berfungsi pada Selesai+Belum Lunas; lock Lunas tetap jalan; laporan pendapatan otomatis.
- Data live user (4 pesanan, termasuk LD-1049 hasil pemakaian) tidak berubah selama pengujian.

### Dampak
- Alur status final: Diproses → Menunggu diambil → Selesai (terkunci). Pembayaran tetap bebas dicatat kapan pun sampai Lunas (terkunci).

### Rollback
`git revert <hash>` → dropdown muncul lagi di semua baris; backend menerima perubahan status pesanan Selesai.

## 2026-09-09 — Fitur ubah status pesanan & pembayaran (dengan penguncian Lunas)

### Konteks
Admin butuh kendali langsung dari dashboard: ubah status pesanan (Diproses / Menunggu diambil / Selesai), catat pembayaran (Belum Lunas → Lunas) di menu Pesanan dan Pembayaran, serta melihat detail pesanan per pelanggan. Aturan bisnis: pembayaran yang sudah disetujui (Lunas) **tidak boleh** dikembalikan ke Belum Lunas; nilai yang dilunasi otomatis masuk ke pendapatan di Laporan.

### Yang berubah
- `server.js`:
  - `PUT /api/:type/:id` — aturan lock: mengubah `payment_status` pesanan yang sudah `Lunas` menjadi selain Lunas → 400 `Pembayaran yang sudah lunas tidak dapat diubah kembali` (sumber kebenaran di backend, bukan hanya di UI).
  - Endpoint baru `GET /api/customers/:id/orders` — profil pelanggan + semua pesanannya (JOIN layanan & total, untuk halaman detail).
  - `orderSql` dipecah jadi `orderBase` + `ORDER BY` agar bisa dipakai dengan `WHERE`.
- `app.js`:
  - Baris tabel **Pesanan** & **Pembayaran**: status menjadi dropdown (`Diproses / Menunggu diambil / Selesai`, simpan saat diubah) + kolom pembayaran: pesanan Belum Lunas dapat tombol **Setor**, pesanan Lunas tampil chip **Lunas ✓ terkunci** (tanpa kontrol).
  - Halaman **Pelanggan**: tombol **Lihat** di tiap baris → halaman detail per pelanggan (nama, telepon, daftar pesanannya dengan dropdown status + tombol Setor/chip terkunci, tombol ← Kembali).
  - Konfirmasi sebelum Setor ("tidak dapat diubah kembali"); toast sukses/gagal memakai pesan server.
- `style.css` — kelas `.sel` (dropdown kompak di tabel).

### Bukti
- e2e (jsdom ke docker compose): **47 pass / 0 fail**, termasuk: ubah status tersimpan ke DB; Setor → `Lunas` di DB + chip terkunci; upaya balik ke `Belum Lunas` → **400** dan data tetap `Lunas`; Laporan pendapatan otomatis bertambah (Rp73.500 → **Rp101.500** setelah LD-1047 dilunasi); detail pelanggan menampilkan pesanannya + kontrol; tombol kembali berfungsi.
- `curl`: `PUT /api/orders/2 {payment_status:'Belum Lunas'}` pada baris Lunas → 400 + pesan lock; `PUT {status:'Selesai'}` → 200 (status tetap bisa diubah); `GET /api/customers/2/orders` → JSON customer + orders.
- Data dikembalikan ke kondisi sebelum tes; data pelanggan baru (Rahmat) hasil pemakaian user dipertahankan.

### Dampak
- Admin bisa kelola status & pembayaran langsung dari dashboard; laporan pendapatan selalu konsisten dengan data Lunas.
- Lock Lunas berlaku di semua jalur (UI maupun API langsung).

### Rollback
`git revert <hash>` → kembali ke tampilan read-only (tanpa dropdown/Setor), tanpa lock Lunas, tanpa halaman detail pelanggan.

## 2026-09-09 — Perbaikan backend (crash saat buat pesanan) & frontend (tampilan mati setelah revisi5)

### Konteks
Setelah commit `revisi5`, `index.html` diganti kerangka baru, tetapi `app.js` masih menunjuk DOM lama (`#menuToggle`, `#sidebar`, `#newOrder`, `#closeModal`, `#pageTitle`, `.nav-item`, `.content`) → `TypeError` di baris 3, seluruh script mati, semua halaman stuck di "Memuat data…" (gejala "tampilan CSS hilang").
Terpisah, ada bug backend nyata: `POST /api/orders` dengan body yang tidak menyertakan `status`/`payment_status` (persis yang dikirim form Pesanan Baru) membuat proses Node crash: `TypeError: Bind parameters must not contain undefined` (mysql2) — handler tanpa try/catch → unhandled rejection → seluruh app down, container restart berulang.

### Yang berubah
- `app.js` — ditulis ulang mengikuti `index.html` baru (id `#hamb`, `#side`, `#add`, `#title`, `#app`, `#modal`, `#close`, `#toast`, `nav a[data-p]`) dan `style.css` (`.stats`, `.grid`, `.panel`, `.panelhead`, `.tablewrap`, `.chip`, `.person`, `.avatar`, `.report`, `.setting`, `.filter`, `.act`, `.primary`).
- `server.js`:
  - `GET /api/:type` — tambah `payments:orderSql` (sebelumnya `/api/payments` → 404).
  - `POST /api/:type` — field yang tidak dikirim client dikecualikan dari INSERT, default DB dipakai untuk `status` dan `payment_status` (sebelumnya: 2 param `undefined` → crash proses).
  - `PUT /api/:type/:id` — update parsial, hanya field yang dikirim (sebelumnya: pola crash `undefined` yang sama).
  - Semua route API dibungkus error handler `h()` — error SQL/validasi membalas JSON 400/404/500, proses Node tetap hidup.
- `.gitignore` — baru, mengabaikan `.cooper/` (checkpoint sesi, sesuai aturan CooperAgent).

### Bukti
- e2e frontend (jsdom, terhadap container app yang hidup via docker compose): **33 pass / 0 fail** — dashboard (4 kartu, chart, ring, tabel, badge, avatar), 5 halaman daftar (pesanan, pelanggan, layanan, pembayaran, karyawan), laporan, pengaturan, modal pesanan baru (buka → pilih dari API → simpan → kode auto `LD-1049` → toast → muncul di tabel → hapus via UI).
- API (curl terhadap compose): POST 3 field → **201** dan server tetap `{"ok":true}` (sebelum fix: HTTP 000 + crash `at /app/server.js:10:348` di log container); POST field wajib kosong → 400; POST tipe tidak dikenal → 404; PUT parsial (status saja) → 200; DELETE pesanan → 204; DELETE pelanggan terpakai → 400 `Data masih dipakai oleh pesanan`.
- `docker compose logs app`: tanpa crash setelah fix; tes idle 75 detik stabil (healthcheck OK).
- Data dikembalikan ke seed: 3 pesanan (LD-1046/1047/1048), 3 pelanggan, 3 layanan, 2 staff.

### Dampak
- Frontend kembali berfungsi penuh: 7 halaman + modal tambah data + toast + konfirmasi hapus.
- Backend tidak lagi mati satu request; data invalid mendapat respons 4xx yang jelas.
- Tidak ada perubahan skema DB, env, atau docker-compose.

### Rollback
`git revert <hash-commit-ini>` → kembali ke keadaan sebelum fix (halaman stuck "Memuat data…", POST pesanan crash server).
