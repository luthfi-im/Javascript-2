// =============================================================
// LAB 2 - app.js (SOLUSI) - berjalan di BROWSER
// DOM + event + async/await.
// Memakai function dari nilai.js (hitung nilai) dan api.js (data),
// yang sudah dimuat lebih dulu oleh index.html.
// =============================================================

// ---------- 1. Pilih elemen ----------
const tbody = document.querySelector('#tabel-body');
const form = document.querySelector('#form-mahasiswa');
const inputCari = document.querySelector('#cari');
const pesan = document.querySelector('#pesan');

let semuaData = [];   // hasil rekap (sudah ada nilaiAkhir, grade, lulus)

// ---------- 2. Ambil data dari API (api.js) ----------
async function muatData() {
  try {
    const daftar = await ambilMahasiswa();   // tunggu Promise: data mentah nim, nama, tugas, uts, uas
    semuaData = buatRekap(daftar);     // dihitung di browser (fungsi Lab 1)
    tampilkan();
  } catch (err) {
    tampilkanPesan(`Gagal memuat data: ${err.message}`, 'error');
  }
}

// ---------- 3. Render ----------
function tampilkan() {
  const hasilCari = cariMahasiswa(semuaData, inputCari.value);
  renderTabel(hasilCari);
  renderStatistik(semuaData);
}

function renderTabel(data) {
  tbody.replaceChildren();   // kosongkan isi tabel

  if (data.length === 0) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 8;
    td.className = 'kosong';
    td.textContent = 'Tidak ada data';
    tr.append(td);
    tbody.append(tr);
    return;
  }

  for (const m of data) {
    const tr = document.createElement('tr');
    tr.classList.add(m.lulus ? 'lulus' : 'tidak-lulus');

    const kolom = [m.nim, m.nama, m.tugas, m.uts, m.uas, m.nilaiAkhir, m.grade];
    for (const isi of kolom) {
      const td = document.createElement('td');
      td.textContent = isi;            // textContent, BUKAN innerHTML -> aman dari XSS
      tr.append(td);
    }

    const tdAksi = document.createElement('td');
    const btnHapus = document.createElement('button');
    btnHapus.type = 'button';
    btnHapus.className = 'btn-hapus';
    btnHapus.textContent = 'Hapus';
    btnHapus.dataset.nim = m.nim;      // -> atribut data-nim="2401001"
    tdAksi.append(btnHapus);
    tr.append(tdAksi);

    tbody.append(tr);
  }
}

function renderStatistik(data) {
  const jumlahLulus = data.filter((m) => m.lulus).length;
  const terbaik = cariTertinggi(data);
  const distribusi = hitungDistribusiGrade(data);

  document.querySelector('#stat-jumlah').textContent = data.length;
  document.querySelector('#stat-lulus').textContent = `${jumlahLulus}/${data.length}`;
  document.querySelector('#stat-rata').textContent = hitungRataRata(data);
  document.querySelector('#stat-tertinggi').textContent =
    terbaik ? `${terbaik.nama} (${terbaik.nilaiAkhir})` : '-';
  document.querySelector('#stat-distribusi').textContent = Object.entries(distribusi)
    .map(([grade, jumlah]) => `${grade}: ${jumlah}`)
    .join('  ·  ');
}

function tampilkanPesan(teks, jenis) {
  pesan.textContent = teks;
  pesan.className = jenis;
}

// ---------- 4. Event: pencarian ----------
inputCari.addEventListener('input', tampilkan);

// ---------- 5. Event: submit form ----------
form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const f = new FormData(form);
  const baru = {
    nim: f.get('nim').trim(),
    nama: f.get('nama').trim(),
    tugas: f.get('tugas') === '' ? NaN : Number(f.get('tugas')),
    uts: f.get('uts') === '' ? NaN : Number(f.get('uts')),
    uas: f.get('uas') === '' ? NaN : Number(f.get('uas')),
  };

  // Validasi cepat di browser (api.js tetap memvalidasi ulang)
  const errors = validasiMahasiswa(baru);
  if (errors.length > 0) {
    tampilkanPesan(errors.join(', '), 'error');
    return;
  }

  try {
    const hasil = await tambahMahasiswa(baru);   // reject (Error) jika tidak valid / NIM sudah ada
    const [r] = buatRekap([hasil]);
    tampilkanPesan(`${r.nama} tersimpan: nilai ${r.nilaiAkhir} (${r.grade})`, 'sukses');
    form.reset();
    form.elements.nim.focus();
    await muatData();
  } catch (err) {
    tampilkanPesan(`Gagal menyimpan: ${err.message}`, 'error');
  }
});

// ---------- 6. Event delegation: tombol hapus ----------
tbody.addEventListener('click', async (event) => {
  const tombol = event.target.closest('.btn-hapus');
  if (!tombol) return;

  const nim = tombol.dataset.nim;
  if (!confirm(`Hapus mahasiswa dengan NIM ${nim}?`)) return;

  try {
    const teks = await hapusMahasiswa(nim);   // reject (Error) jika NIM tidak ditemukan
    tampilkanPesan(teks, 'sukses');
    await muatData();
  } catch (err) {
    tampilkanPesan(`Gagal menghapus: ${err.message}`, 'error');
  }
});

// ---------- 7. Mulai ----------
muatData();