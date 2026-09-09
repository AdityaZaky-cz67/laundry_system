# Changelog

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
