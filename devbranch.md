# 🧭 Project Workflow Guide — Development & Production Branch Setup

Dokumentasi ini menjelaskan cara kerja dua branch utama:

* **`dev`** → buat pengembangan di komputer lokal (CRUD, logic, UI)
* **`main`** → buat versi production yang jalan di VPS (stabil, aman)

---

## 🪜 1. Setup Awal

### Clone Repository

```bash
git clone https://github.com/username/project-name.git
cd project-name
```

### Buat Branch `dev`

```bash
git checkout -b dev
```

> Branch ini tempat lu coding, ubah logic, tambah fitur, dan testing lokal.

---

## 🔐 2. Keamanan `.env`

### Tambahkan `.env` ke `.gitignore`

Edit file `.gitignore` dan pastikan ada baris ini:

```
.env
```

### Hapus `.env` dari Git kalau terlanjur ke-push

```bash
git rm --cached .env
git commit -m "Remove .env from repo"
git push origin dev
```

### Simpan `.env` Lokal dan di VPS Secara Terpisah

* **Lokal:** `.env` disimpan hanya di PC lu.
* **VPS:** `.env` diletakkan di root project VPS (`/root/project-name/.env`).

> Jadi environment beda antara development dan production.

---

## 🧩 3. Workflow Development

### Bikin atau Edit Fitur Baru

```bash
# Pastikan lagi di branch dev
git checkout dev

# Tambah/ubah file
git add .
git commit -m "Add new CRUD feature"
```

### Push ke Branch `dev`

```bash
git push origin dev
```

---

## 🚀 4. Merge ke Production

Setelah fitur di `dev` siap dan udah dites:

```bash
# Pindah ke branch main (production)
git checkout main

# Merge dari dev
git merge dev

# Push hasil merge ke remote
git push origin main
```

> Setelah ini, VPS bisa pull update terbaru dari `main`.

---

## 🧱 5. VPS Deployment

### Di VPS (hanya branch main)

Masuk ke direktori project:

```bash
cd /root/project-name
```

Lalu update project:

```bash
git pull origin main
```

Kalau ada proses build:

```bash
npm install
npm run build
pm2 restart all
```

---

## ⚙️ 6. Optional — Auto Deploy via Git Hook (Opsional)

Biar VPS otomatis update tiap kali `main` di-push:

```bash
cd /root/project-name/.git/hooks
nano post-merge
```

Isi script:

```bash
#!/bin/bash
cd /root/project-name
npm install
npm run build
pm2 restart all
```

Simpan, lalu kasih permission:

```bash
chmod +x post-merge
```

---

## 💡 Tips

* Gunakan **branch terpisah** (dev → main) untuk jaga kestabilan production.
* Jangan pernah push `.env`, `node_modules`, atau file rahasia.
* Gunakan `pm2` atau `docker` di VPS buat jaga app tetap nyala.
* Bisa tambahkan `.env.example` biar tim lain tau struktur environment variable-nya.

---

## 📂 Struktur Folder (Contoh)

```
project-name/
├── src/
│   ├── routes/
│   ├── controllers/
│   ├── models/
│   └── utils/
├── dist/               # hasil build
├── .gitignore
├── .env.example
├── package.json
└── README.md
```

---

## ✅ Summary

| Environment | Branch | Lokasi | Aksi                      |
| ----------- | ------ | ------ | ------------------------- |
| Development | `dev`  | Local  | Edit CRUD, Logic, UI      |
| Production  | `main` | VPS    | Pull dan Run Stable Build |

---

Made with ❤️ by Indra
Keep your production clean and your dev messy 😄
