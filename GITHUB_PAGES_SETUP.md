# 🔧 GitHub Pages Setup Instructions

## ⚠️ Important: Change GitHub Pages Source

Setelah push, Anda perlu mengubah GitHub Pages source setting:

### Step 1: Go to Repository Settings

1. Buka https://github.com/masrizram/reli
2. Klik tab **Settings**
3. Scroll ke bagian **Pages** (di sidebar kiri)

### Step 2: Change Source

**PENTING**: Ubah source dari "GitHub Actions" ke "Deploy from a branch"

- **Source**: Deploy from a branch
- **Branch**: gh-pages
- **Folder**: / (root)

### Step 3: Save & Wait

1. Klik **Save**
2. Tunggu 5-10 menit untuk deployment
3. Site akan available di: https://masrizram.github.io/reli/

## 🎯 Why This Change?

- **GitHub Actions** deploy ke root domain (masrizram.github.io)
- **gh-pages branch** deploy ke subdirectory (masrizram.github.io/reli/)
- Kita ingin yang kedua untuk path yang benar

## ✅ Expected Result

Setelah setup:

- ✅ URL: https://masrizram.github.io/reli/
- ✅ Assets load dari: https://masrizram.github.io/reli/assets/
- ✅ No console errors
- ✅ Full RELI functionality

## 🔍 Verification

Check these URLs should work:

- https://masrizram.github.io/reli/ (main app)
- https://masrizram.github.io/reli/assets/index-[hash].js (JS file)
- https://masrizram.github.io/reli/assets/manifest-[hash].json (manifest)

---

**Remember: Change Pages source to "Deploy from a branch" → "gh-pages"**
