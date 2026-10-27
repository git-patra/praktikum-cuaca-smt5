# Tugas 2 — Prakiraan Cuaca Jakarta

Aplikasi prakiraan cuaca Jakarta menggunakan Vue 3, Ionic Vue, dan TypeScript. Data diambil dari Open-Meteo dan ditampilkan dalam tabel dengan 10 data per halaman.

## Identitas

- Nama: Anugrah Patra Nurdiansyah
- NIM: 050145804
- Program studi: Sistem Informasi
- Universitas: Universitas Terbuka Bandung
- Mata kuliah: PEMROGRAMAN BERBASIS PERANGKAT BERGERAK/STSI4303

## Sumber Data

https://api.open-meteo.com/v1/forecast?latitude=-6.2&longitude=106.8&hourly=temperature_2m

Kolom yang ditampilkan adalah `time` (waktu dalam UTC) dan `temperature_2m` (suhu dalam °C). Gunakan tombol Sebelumnya dan Berikutnya untuk berpindah halaman. Tombol Muat ulang mengambil data terbaru dan mengembalikan tampilan ke halaman pertama.

## Menjalankan Aplikasi

Gunakan Node.js versi 20.19.0 atau lebih baru. Jalankan perintah berikut dari folder proyek:

```bash
npm ci
npm run dev
```

Buka http://127.0.0.1:5174/. Koneksi internet diperlukan untuk mengambil data API. Tekan Ctrl+C di terminal untuk menghentikan aplikasi.

## Pengujian dan Build

```bash
npm test
npm run build
npm run preview
```

Hasil build tersimpan di folder `dist`. Preview dapat dibuka di http://127.0.0.1:4174/.

## Struktur Program

- `src/main.ts`: inisialisasi Vue dan plugin IonicVue.
- `src/App.vue`: tampilan Ionic, pengambilan data, dan pagination.
- `src/weather.ts`: tipe data, validasi respons, dan akses API.
- `src/style.css`: pengaturan tampilan.
- `src/App.test.ts` dan `src/weather.test.ts`: pengujian aplikasi.
