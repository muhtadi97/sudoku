# Sudoku 5x5 Game

Game Sudoku klasik dengan ukuran 5x5 yang dibuat dengan HTML, CSS, dan JavaScript murni.

## Fitur

1. **Tiga Level Kesulitan**:
   - Mudah: 10 sel kosong
   - Normal: 15 sel kosong
   - Sulit: 20 sel kosong

2. **Sistem Skor**:
   - Dihitung berdasarkan waktu, langkah, dan level
   - Bonus untuk penyelesaian cepat dengan langkah minimal

3. **Fitur Gameplay**:
   - Undo/Redo untuk membatalkan/mengulangi langkah
   - Tampilkan solusi jika stuck
   - Reset game ke keadaan awal
   - Game baru dengan papan acak

4. **High Score**:
   - Simpan skor tertinggi dengan nama pemain
   - Tampilkan 10 skor terbaik
   - Data disimpan di localStorage browser

5. **Pengalaman Pengguna**:
   - Musik latar yang dapat dikontrol (volume on/off)
   - Desain responsif untuk semua perangkat
   - Dukungan keyboard (angka 1-5, arrow keys, delete)
   - Petunjuk permainan yang jelas

6. **Visual**:
   - Desain klasik namun modern
   - Warna yang nyaman untuk mata
   - Animasi dan transisi halus
   - Feedback visual untuk sel yang dipilih, error, dll.

## Cara Menjalankan

1. Unduh semua file ke dalam satu folder
2. Buka file `index.html` di browser web
3. Jika ingin musik lokal, letakkan file MP3 di folder `sounds/`

## Struktur File

- `index.html` - Struktur halaman utama
- `style.css` - Styling dan desain responsif
- `script.js` - Logika game dan interaktivitas
- `sounds/` - Folder untuk file musik (opsional)

## Teknologi

- HTML5
- CSS3 (Flexbox, Grid, Custom Properties)
- JavaScript ES6+
- Font Awesome untuk ikon
- Google Fonts untuk tipografi
- localStorage untuk penyimpanan data

## Kontrol

- **Klik/Tap**: Pilih sel atau tombol
- **Keyboard**:
  - Angka 1-5: Pilih angka
  - Arrow keys: Navigasi antar sel
  - Backspace/Delete: Hapus angka
- **Tombol UI**: Semua fungsi tersedia melalui tombol di panel kontrol

## Lisensi

Game ini dibuat untuk tujuan edukasi dan dapat dimodifikasi sesuai kebutuhan.
