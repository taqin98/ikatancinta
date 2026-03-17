# Guest Query Params

Parameter query ini dipakai untuk mengubah nama tamu di halaman undangan tanpa mengubah data utama undangan di database.

## Param yang didukung

- `to` atau `nama`
- `gelar_depan` atau `title_prefix` atau `prefix`
- `gelar_belakang` atau `title_suffix` atau `suffix`
- `sapaan` atau `greeting`

## Contoh penggunaan

Nama tamu biasa:

```text
/undangan/202603-anisa-rio?to=Agus
```

Nama tamu dengan gelar depan:

```text
/undangan/202603-anisa-rio?to=Agus&gelar_depan=Dr.
```

Nama tamu dengan gelar belakang:

```text
/undangan/202603-anisa-rio?to=Agus&gelar_belakang=S.T.,%20M.Kom
```

Nama tamu dengan gelar depan dan belakang:

```text
/undangan/202603-anisa-rio?to=Agus&gelar_depan=Dr.&gelar_belakang=S.T.,%20M.Kom
```

Ubah label sapaan:

```text
/undangan/202603-anisa-rio?to=Agus&sapaan=Kepada%20Yth.
```

## Hasil format

Jika parameter lengkap diisi:

```text
Dr. Agus, S.T., M.Kom
```

## Catatan encoding

- Gunakan `%20` untuk spasi.
- Gunakan `%2C` bila ingin memastikan koma di-encode dengan aman.
- Untuk nama dengan tanda `&`, sebaiknya encode menjadi `%26`.
