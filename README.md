# Laundrify — Admin Dashboard

Dashboard statis untuk pengelolaan laundry: ringkasan pesanan, pelanggan, layanan, pembayaran, karyawan, dan laporan. Dibuat dengan HTML, CSS, dan JavaScript tanpa framework.

## Jalankan lokal dengan Docker

```bash
docker compose up -d --build
```

Buka `http://localhost:8080`. Hentikan dengan `docker compose down`.

## CI/CD dengan GitHub self-hosted runner

Workflow berada di `.github/workflows/deploy.yml`. Saat ada push ke branch `main`, runner akan checkout kode, membangun image Docker, lalu menjalankan container pada port `8080`.

1. Pada server deployment, instal Docker Engine dan Docker Compose plugin.
2. Tambahkan self-hosted runner repository melalui **Settings → Actions → Runners → New self-hosted runner** di GitHub.
3. Beri label `linux` dan `docker` pada runner (atau sesuaikan `runs-on` di workflow).
4. Pastikan akun runner bisa menjalankan `docker` tanpa sudo.
5. Push proyek ke GitHub branch `main`.

Contoh menambahkan akun runner ke grup Docker di Linux:

```bash
sudo usermod -aG docker $USER
```

Keluar lalu masuk kembali agar perubahan grup aktif.
