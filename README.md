# Laundrify — Admin Dashboard

Dashboard admin laundry full-stack dengan frontend HTML/CSS/JavaScript, API Node.js/Express, dan database MySQL.

## Jalankan lokal dengan Docker

```bash
docker compose up -d --build
```

Buka `http://localhost:8080`. Data disimpan pada volume Docker `mysql_data`. Hentikan dengan `docker compose down`.

Endpoint API utama: `/api/dashboard`, `/api/orders`, `/api/customers`, `/api/services`, `/api/payments`, dan `/api/staff`.

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
