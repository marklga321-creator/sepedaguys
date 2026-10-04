const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzJ5Sfnd7C6rw-mxGKJwycVVKRzGoIrteNWrRbckSbo3oLDxHs-McaUcaYeiiv-yX5XXQ/exec";
    const NO_ADMIN_WA = "6289686238783";
    const ADMIN_PASSWORD = "admin123";
    let isAdminLoggedIn = false;
    
    let globalSepedaList = [];
    let globalPemesananList = [];

    document.addEventListener("DOMContentLoaded", function() {
      // Set default input tanggal ke hari ini
      const todayISO = new Date().toISOString().split('T')[0];
      document.getElementById('tglCekStok').value = todayISO;

      toggleTipeSewa();
      togglePembayaran();
      loadStatusSepeda();
    });

    function switchTab(tabName) {
      document.getElementById('tab-pesan').classList.add('hidden');
      document.getElementById('tab-admin').classList.add('hidden');

      const sidePesan = document.getElementById('side-btn-pesan');
      const sideAdmin = document.getElementById('side-btn-admin');

      sidePesan.className = "w-full text-left px-4 py-3 rounded-xl font-bold text-sm flex items-center justify-between transition text-slate-300 hover:bg-brand-teal/30 hover:text-white";
      sideAdmin.className = "w-full text-left px-4 py-3 rounded-xl font-bold text-sm flex items-center justify-between transition text-slate-300 hover:bg-brand-teal/30 hover:text-white";

      if (tabName === 'pesan') {
        document.getElementById('tab-pesan').classList.remove('hidden');
        sidePesan.className = "w-full text-left px-4 py-3 rounded-xl font-bold text-sm flex items-center justify-between transition bg-brand-rust text-white shadow-md";
      } else if (tabName === 'admin') {
        document.getElementById('tab-admin').classList.remove('hidden');
        sideAdmin.className = "w-full text-left px-4 py-3 rounded-xl font-bold text-sm flex items-center justify-between transition bg-brand-rust text-white shadow-md";

        if (isAdminLoggedIn) {
          loadAdminData();
        }
      }
    }

    function autentikasiAdmin(e) {
      e.preventDefault();
      const inputPass = document.getElementById('inputPassAdmin').value;
      const errorMsg = document.getElementById('errorLogin');

      if (inputPass === ADMIN_PASSWORD) {
        isAdminLoggedIn = true;
        document.getElementById('adminLoginBox').classList.add('hidden');
        document.getElementById('adminMainContent').classList.remove('hidden');
        document.getElementById('userRoleText').innerText = "Administrator";
        document.getElementById('badgeAdminStatus').innerText = "Terbuka";
        document.getElementById('badgeAdminStatus').className = "text-[10px] bg-emerald-500 text-white font-bold px-2 py-0.5 rounded-full";
        document.getElementById('btnLogout').classList.remove('hidden');

        errorMsg.classList.add('hidden');
        loadAdminData();
      } else {
        errorMsg.innerText = "Kata sandi salah! Silakan coba lagi.";
        errorMsg.classList.remove('hidden');
      }
    }

    function logoutAdmin() {
      isAdminLoggedIn = false;
      document.getElementById('adminMainContent').classList.add('hidden');
      document.getElementById('adminLoginBox').classList.remove('hidden');
      document.getElementById('inputPassAdmin').value = '';
      document.getElementById('userRoleText').innerText = "Pengunjung";
      document.getElementById('badgeAdminStatus').innerText = "Terkunci";
      document.getElementById('badgeAdminStatus').className = "text-[10px] bg-slate-700 text-slate-300 font-bold px-2 py-0.5 rounded-full";
      document.getElementById('btnLogout').classList.add('hidden');
      switchTab('pesan');
    }

    function switchAdminSubTab(subTabName) {
      ['dashboard', 'jadwal', 'history'].forEach(t => {
        document.getElementById(`admin-sub-${t}`).classList.add('hidden');
        const btn = document.getElementById(`sub-btn-${t}`);
        btn.classList.remove('border-brand-rust', 'text-brand-rust');
        btn.classList.add('border-transparent', 'text-slate-500');
      });

      document.getElementById(`admin-sub-${subTabName}`).classList.remove('hidden');
      const activeBtn = document.getElementById(`sub-btn-${subTabName}`);
      activeBtn.classList.remove('border-transparent', 'text-slate-500');
      activeBtn.classList.add('border-brand-rust', 'text-brand-rust');
    }

    // FETCH DATA SEPEDA & PEMESANAN DARI APPS SCRIPT
    function loadStatusSepeda() {
      const container = document.getElementById('containerStatus');
      container.innerHTML = `<div class="col-span-full text-center py-4 text-slate-400 text-sm">Memuat status...</div>`;

      // Mengambil data stok sepeda
      fetch(SCRIPT_URL)
        .then(res => res.json())
        .then(sepedaData => {
          globalSepedaList = sepedaData;
          
          // Mengambil data pemesanan untuk menghitung reservasi tanggal tertentu
          return fetch(`${SCRIPT_URL}?action=adminData`);
        })
        .then(res => res.json())
        .then(pemesananData => {
          globalPemesananList = pemesananData;
          renderStatusCards();
          updateDropdownSepeda();
        })
        .catch(err => {
          container.innerHTML = `<div class="col-span-full text-center py-4 text-rose-500 text-sm">Gagal memuat status sepeda. Pastikan URL Web App sudah benar.</div>`;
        });
    }

    // RENDER KARTU STOK DENGAN PERHITUNGAN TANGGAL DINAMIS
    function renderStatusCards() {
      const container = document.getElementById('containerStatus');
      const tglTargetVal = document.getElementById('tglCekStok').value;
      if (!tglTargetVal || globalSepedaList.length === 0) return;

      container.innerHTML = '';
      const tglTarget = new Date(tglTargetVal + "T12:00:00");

      globalSepedaList.forEach(item => {
        // Hitung berapa unit sepeda tipe ini yang terpakai pada tanggal yang dipilih
        let terpakaiPadaTanggal = 0;

        globalPemesananList.forEach(p => {
          if (p.sepeda === item.nama && p.status === 'Sedang Disewa') {
            const tglMulai = new Date(p.tglMulai);
            const tglSelesai = new Date(p.tglSelesai);

            // Set batas waktu tanggal tanpa jam untuk perbandingan presisi
            const startDay = new Date(tglMulai.getFullYear(), tglMulai.getMonth(), tglMulai.getDate());
            const endDay = new Date(tglSelesai.getFullYear(), tglSelesai.getMonth(), tglSelesai.getDate());
            const targetDay = new Date(tglTarget.getFullYear(), tglTarget.getMonth(), tglTarget.getDate());

            if (targetDay >= startDay && targetDay <= endDay) {
              terpakaiPadaTanggal += (Number(p.jumlah) || 1);
            }
          }
        });

        const sisaStokTanggal = Math.max(0, item.totalStok - terpakaiPadaTanggal);
        const isTersedia = sisaStokTanggal > 0;

        const card = document.createElement('div');
        card.className = `p-4 rounded-xl border ${isTersedia ? 'border-brand-teal/20 bg-white' : 'border-rose-200 bg-rose-50/30'} flex flex-col justify-between space-y-3 shadow-sm`;

        // Format tanggal Indonesia sederhana
        const dateParts = tglTargetVal.split('-');
        const tglFormatted = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;

        card.innerHTML = `
          <div>
            <h3 class="font-bold text-brand-teal-dark text-sm">${item.nama}</h3>
            <p class="text-xs text-slate-500 mt-0.5">Rp ${item.hargaHari.toLocaleString('id-ID')}/hari | Rp ${item.hargaJam.toLocaleString('id-ID')}/jam</p>
          </div>
          <div class="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
            <span class="font-semibold text-slate-600">Stok (${tglFormatted}):</span>
            <div class="flex items-center gap-1.5">
              <span class="px-2.5 py-0.5 rounded-full font-bold ${isTersedia ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}">
                ${sisaStokTanggal} Unit
              </span>
              <span class="text-slate-400">/ ${item.totalStok}</span>
            </div>
          </div>
          <div class="text-[11px] text-slate-400">
            Dipesan tgl ini: <strong class="text-slate-600">${terpakaiPadaTanggal} unit</strong>
          </div>
        `;
        container.appendChild(card);
      });
    }

    function updateDropdownSepeda() {
      const select = document.getElementById('sepeda');
      select.innerHTML = '<option value="" disabled selected>-- Pilih Jenis Sepeda --</option>';
      globalSepedaList.forEach(item => {
        const option = document.createElement('option');
        option.value = item.nama;
        option.setAttribute('data-harga-hari', item.hargaHari);
        option.setAttribute('data-harga-jam', item.hargaJam);
        option.textContent = `${item.nama} (Total Stok: ${item.totalStok} unit)`;
        select.appendChild(option);
      });
    }

    function toggleTipeSewa() {
      const tipeSewa = document.querySelector('input[name="tipeSewa"]:checked').value;
      const gridWaktu = document.getElementById('gridWaktu');

      if (tipeSewa === 'hari') {
        gridWaktu.className = "grid grid-cols-1 sm:grid-cols-2 gap-4";
        gridWaktu.innerHTML = `
          <div>
            <label class="block text-xs font-bold uppercase text-slate-700 mb-1">Tanggal Mulai</label>
            <input type="date" id="tglMulai" required onchange="hitungTotal()" class="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-teal outline-none text-slate-800 text-sm">
          </div>
          <div>
            <label class="block text-xs font-bold uppercase text-slate-700 mb-1">Tanggal Selesai</label>
            <input type="date" id="tglSelesai" required onchange="hitungTotal()" class="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-teal outline-none text-slate-800 text-sm">
          </div>
        `;
      } else {
        gridWaktu.className = "grid grid-cols-1 sm:grid-cols-3 gap-3";
        gridWaktu.innerHTML = `
          <div>
            <label class="block text-xs font-bold uppercase text-slate-700 mb-1">Tanggal Sewa</label>
            <input type="date" id="tglSewaJam" required onchange="hitungTotal()" class="w-full px-3 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-teal outline-none text-slate-800 text-sm">
          </div>
          <div>
            <label class="block text-xs font-bold uppercase text-slate-700 mb-1">Jam Mulai</label>
            <input type="time" id="jamMulai" required onchange="hitungTotal()" class="w-full px-3 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-teal outline-none text-slate-800 text-sm">
          </div>
          <div>
            <label class="block text-xs font-bold uppercase text-slate-700 mb-1">Durasi (Jam)</label>
            <input type="number" id="durasiJam" min="1" value="1" required onchange="hitungTotal()" onkeyup="hitungTotal()" class="w-full px-3 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-teal outline-none text-slate-800 text-sm">
          </div>
        `;
      }
      hitungTotal();
    }

    function togglePembayaran() {
      const metode = document.querySelector('input[name="metodeBayar"]:checked').value;
      const detailBox = document.getElementById('boxDetailPembayaran');
      const boxBuktiBayar = document.getElementById('boxBuktiBayar');

      if (metode === 'Cash') {
        detailBox.innerHTML = `
          <p class="font-bold text-brand-teal-dark">Pembayaran Tunai (Cash):</p>
          <p class="text-slate-600">Pembayaran dilakukan langsung di lokasi saat serah terima unit sepeda SEPEDAGUYS.</p>
        `;
        boxBuktiBayar.classList.add('hidden');
      } else {
        detailBox.innerHTML = `
          <p class="font-bold text-brand-teal-dark">Instruksi Transfer Bank:</p>
          <div class="bg-white p-3 rounded-lg border border-brand-teal/20 space-y-1">
            <p><span class="font-semibold text-slate-600">Bank:</span> BCA / Mandiri</p>
            <p><span class="font-semibold text-slate-600">No. Rekening:</span> <span class="font-mono font-bold text-brand-teal-dark">123-456-7890</span></p>
            <p><span class="font-semibold text-slate-600">Atas Nama:</span> SEPEDAGUYS</p>
          </div>
          <p class="text-[11px] text-slate-500">Transfer sesuai total estimasi biaya, lalu kirimkan bukti transfer lewat form ini atau via WhatsApp.</p>
        `;
        boxBuktiBayar.classList.remove('hidden');
      }
    }

    function hitungTotal() {
      const selectSepeda = document.getElementById('sepeda');
      const selectedOption = selectSepeda.options[selectSepeda.selectedIndex];
      const tipeSewa = document.querySelector('input[name="tipeSewa"]:checked').value;

      if (!selectedOption || selectedOption.disabled) {
        document.getElementById('labelTotal').innerText = "Rp 0";
        document.getElementById('labelDurasi').innerText = "0 " + tipeSewa;
        return;
      }

      const hargaHari = parseFloat(selectedOption.getAttribute('data-harga-hari')) || 0;
      const hargaJam = parseFloat(selectedOption.getAttribute('data-harga-jam')) || 0;
      const jumlahUnit = parseInt(document.getElementById('jumlahUnit').value) || 1;

      if (tipeSewa === 'hari') {
        const valMulai = document.getElementById('tglMulai')?.value;
        const valSelesai = document.getElementById('tglSelesai')?.value;

        if (!valMulai || !valSelesai) {
          document.getElementById('labelTotal').innerText = "Rp 0";
          document.getElementById('labelDurasi').innerText = "0 Hari";
          return;
        }

        const tglMulai = new Date(valMulai + "T00:00:00");
        const tglSelesai = new Date(valSelesai + "T00:00:00");

        if (tglSelesai >= tglMulai) {
          const diffMs = Math.abs(tglSelesai - tglMulai);
          const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
          const total = diffDays * hargaHari * jumlahUnit;

          document.getElementById('labelDurasi').innerText = `${diffDays} Hari (${jumlahUnit} Unit)`;
          document.getElementById('labelTotal').innerText = "Rp " + total.toLocaleString('id-ID');
        } else {
          document.getElementById('labelTotal').innerText = "Rp 0";
          document.getElementById('labelDurasi').innerText = "Tanggal tidak valid";
        }
      } else {
        const tglSewa = document.getElementById('tglSewaJam')?.value;
        const jamMulai = document.getElementById('jamMulai')?.value;
        const durasiJam = parseInt(document.getElementById('durasiJam')?.value) || 0;

        if (!tglSewa || !jamMulai || durasiJam <= 0) {
          document.getElementById('labelTotal').innerText = "Rp 0";
          document.getElementById('labelDurasi').innerText = "0 Jam";
          return;
        }

        const total = durasiJam * hargaJam * jumlahUnit;
        const dateParts = tglSewa.split('-');
        const tglFormatted = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;

        document.getElementById('labelDurasi').innerText = `${durasiJam} Jam (${tglFormatted} @ ${jamMulai})`;
        document.getElementById('labelTotal').innerText = "Rp " + total.toLocaleString('id-ID');
      }
    }

    function readFileAsBase64(file) {
      return new Promise((resolve, reject) => {
        if (!file) { resolve(""); return; }
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
      });
    }

    document.getElementById('bookingForm').addEventListener('submit', async function(e) {
      e.preventDefault();

      const btnSubmit = document.getElementById('btnSubmit');
      const btnText = document.getElementById('btnText');
      const btnSpinner = document.getElementById('btnSpinner');
      const alertBox = document.getElementById('alertBox');
      
      const nama = document.getElementById('nama').value;
      const whatsapp = document.getElementById('whatsapp').value;
      const sepeda = document.getElementById('sepeda').value;
      const tipeSewa = document.querySelector('input[name="tipeSewa"]:checked').value;
      const metodeBayar = document.querySelector('input[name="metodeBayar"]:checked').value;
      const jumlahUnit = document.getElementById('jumlahUnit').value;
      const totalBiaya = document.getElementById('labelTotal').innerText;

      btnSubmit.disabled = true;
      btnText.innerText = "Memproses...";
      btnSpinner.classList.remove('hidden');
      alertBox.classList.add('hidden');

      let tglMulaiVal = "";
      let tglSelesaiVal = "";
      let durasiTambahan = 0;

      if (tipeSewa === 'hari') {
        tglMulaiVal = document.getElementById('tglMulai').value;
        tglSelesaiVal = document.getElementById('tglSelesai').value;
      } else {
        const tgl = document.getElementById('tglSewaJam').value;
        const jam = document.getElementById('jamMulai').value;
        durasiTambahan = parseInt(document.getElementById('durasiJam').value) || 1;

        const startDate = new Date(`${tgl}T${jam}:00`);
        const endDate = new Date(startDate.getTime() + (durasiTambahan * 60 * 60 * 1000));

        tglMulaiVal = startDate.toISOString();
        tglSelesaiVal = endDate.toISOString();
      }

      const fileInput = document.getElementById('buktiBayar');
      let fileBase64 = "";
      if (metodeBayar === 'Transfer Bank' && fileInput.files.length > 0) {
        try {
          fileBase64 = await readFileAsBase64(fileInput.files[0]);
        } catch (error) {
          console.error("Gagal membaca file bukti bayar", error);
        }
      }

      const payload = {
        nama: nama,
        whatsapp: whatsapp,
        sepeda: sepeda,
        tipeSewa: tipeSewa,
        tglMulai: tglMulaiVal,
        tglSelesai: tglSelesaiVal,
        durasiJam: durasiTambahan,
        jumlahUnit: jumlahUnit,
        metodeBayar: metodeBayar,
        buktiBayar: fileBase64
      };

      fetch(SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify(payload)
      })
      .then(res => res.json())
      .then(response => {
        btnSubmit.disabled = false;
        btnText.innerText = "Pesan sekarang";
        btnSpinner.classList.add('hidden');

        if (response.success) {
          let pesanWA = `*HALO ADMIN SEPEDAGUYS, SAYA INGIN KONFIRMASI SEWA SEPEDA*\n\n`;
          pesanWA += `👤 *Nama:* ${nama}\n`;
          pesanWA += `📱 *WhatsApp:* ${whatsapp}\n`;
          pesanWA += `🚲 *Sepeda:* ${sepeda} (${jumlahUnit} Unit)\n`;
          pesanWA += `💳 *Metode Pembayaran:* ${metodeBayar}\n`;
          pesanWA += `💰 *Total Biaya:* ${totalBiaya}\n\n`;

          if (metodeBayar === 'Transfer Bank') {
            pesanWA += `_Saya telah melampirkan/akan menyertakan bukti transfer di pesan ini._`;
          } else {
            pesanWA += `_Saya akan melakukan pembayaran tunai di tempat._`;
          }

          const urlWA = `https://wa.me/${NO_ADMIN_WA}?text=${encodeURIComponent(pesanWA)}`;
          alert("Pemesanan berhasil disimpan! Anda akan diarahkan ke WhatsApp SEPEDAGUYS untuk konfirmasi.");
          window.open(urlWA, '_blank');

          document.getElementById('bookingForm').reset();
          toggleTipeSewa();
          togglePembayaran();
          loadStatusSepeda();
        } else {
          alertBox.classList.remove('hidden');
          alertBox.className = "mx-6 mb-6 p-4 rounded-xl text-sm font-medium bg-rose-50 text-rose-800 border border-rose-200";
          alertBox.innerHTML = `<strong>Pemesanan Gagal!</strong><br>${response.message}`;
        }
      })
      .catch(err => {
        btnSubmit.disabled = false;
        btnText.innerText = "Pesan sekarang";
        btnSpinner.classList.add('hidden');

        alertBox.classList.remove('hidden');
        alertBox.className = "mx-6 mb-6 p-4 rounded-xl text-sm font-medium bg-rose-50 text-rose-800 border border-rose-200";
        alertBox.innerHTML = `<strong>Terjadi Kesalahan Network!</strong><br>Pastikan koneksi internet stabil.`;
      });
    });

    async function loadAdminData() {
      if (!isAdminLoggedIn) return;

      const tbodyJadwal = document.getElementById('tableJadwalBody');
      const tbodyHistory = document.getElementById('tableHistoryBody');
      const containerPenyewa = document.getElementById('containerPenyewaAktif');

      tbodyJadwal.innerHTML = `<tr><td colspan="10" class="text-center py-8 text-slate-400">Memuat data...</td></tr>`;
      tbodyHistory.innerHTML = `<tr><td colspan="8" class="text-center py-8 text-slate-400">Memuat riwayat...</td></tr>`;
      containerPenyewa.innerHTML = `<div class="col-span-full text-center py-8 text-slate-400 text-sm">Memuat data penyewa...</div>`;

      try {
        const res = await fetch(`${SCRIPT_URL}?action=adminData`);
        const data = await res.json();
        renderDashboardAndTables(data);
      } catch (err) {
        tbodyJadwal.innerHTML = `<tr><td colspan="10" class="text-center py-8 text-rose-500">Gagal mengambil data dari Google Sheets.</td></tr>`;
        tbodyHistory.innerHTML = `<tr><td colspan="8" class="text-center py-8 text-rose-500">Gagal mengambil data riwayat.</td></tr>`;
        containerPenyewa.innerHTML = `<div class="col-span-full text-center py-8 text-rose-500 text-sm">Terjadi kesalahan koneksi.</div>`;
      }
    }

    function renderDashboardAndTables(data) {
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];

      let tersewaHariIniUnit = 0;
      let totalPemesananHariIniCount = 0;
      let pendapatanHariIni = 0;
      let pendapatanMingguIni = 0;
      let pendapatanBulanIni = 0;
      let transaksiSuksesHariIniCount = 0;

      let htmlJadwal = '';
      let htmlHistory = '';
      let penyewaAktifHariIni = [];

      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(now.getDate() - 7);
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const reversedData = [...data].reverse();

      reversedData.forEach(item => {
        const tglMulai = new Date(item.tglMulai);
        const tglSelesai = new Date(item.tglSelesai);
        const tglPesan = item.tglPesan ? new Date(item.tglPesan) : tglMulai;
        const biaya = Number(item.biaya) || 0;
        const jumlah = Number(item.jumlah) || 1;

        let durasiStr = "";
        if (item.tipe === 'jam' || item.durasiJam) {
          durasiStr = `${item.durasiJam || 1} Jam`;
        } else {
          const diffTime = Math.abs(tglSelesai - tglMulai);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
          durasiStr = `${diffDays} Hari`;
        }

        const isAktifHariIni = (now >= tglMulai && now <= tglSelesai && item.status === 'Sedang Disewa');

        if (isAktifHariIni) {
          tersewaHariIniUnit += jumlah;
          penyewaAktifHariIni.push({
            pemesan: item.pemesan,
            sepeda: item.sepeda,
            jumlah: jumlah,
            tipe: item.tipe,
            durasiStr: durasiStr,
            whatsapp: item.whatsapp,
            biaya: biaya,
            tglMulai: tglMulai,
            tglSelesai: tglSelesai
          });
        }

        const tglPesanStr = tglPesan.toISOString().split('T')[0];
        if (tglPesanStr === todayStr) {
          totalPemesananHariIniCount++;
        }

        if (item.status === 'Sedang Disewa' || item.status === 'Selesai') {
          if (tglPesanStr === todayStr) {
            pendapatanHariIni += biaya;
            transaksiSuksesHariIniCount++;
          }
          if (tglPesan >= oneWeekAgo) {
            pendapatanMingguIni += biaya;
          }
          if (tglPesan >= startOfMonth) {
            pendapatanBulanIni += biaya;
          }
        }

        const formatMulai = tglMulai.toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' });
        const formatSelesai = tglSelesai.toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' });

        let badgeClass = 'bg-sky-100 text-sky-800';
        if (item.status === 'Selesai') badgeClass = 'bg-emerald-100 text-emerald-800';
        if (item.status === 'Dibatalkan') badgeClass = 'bg-rose-100 text-rose-800';

        htmlJadwal += `
          <tr class="hover:bg-slate-50 transition">
            <td class="p-3.5 font-bold text-slate-800">${item.pemesan}</td>
            <td class="p-3.5 font-medium text-brand-teal-dark">${item.sepeda}</td>
            <td class="p-3.5">${jumlah} Unit</td>
            <td class="p-3.5 text-slate-600">${formatMulai}</td>
            <td class="p-3.5 text-slate-600">${formatSelesai}</td>
            <td class="p-3.5">
              <span class="px-2 py-0.5 rounded-full text-[11px] font-bold bg-brand-teal/10 text-brand-teal-dark uppercase">${item.tipe}</span>
              <span class="block text-[11px] text-slate-500 font-semibold mt-0.5">${durasiStr}</span>
            </td>
            <td class="p-3.5 font-mono text-xs">
              <a href="https://wa.me/${item.whatsapp}" target="_blank" class="text-brand-rust hover:underline flex items-center gap-1 font-semibold">
                📱 ${item.whatsapp}
              </a>
            </td>
            <td class="p-3.5 font-bold text-slate-800">Rp ${biaya.toLocaleString('id-ID')}</td>
            <td class="p-3.5">
              <span class="px-2.5 py-1 rounded-full text-xs font-bold ${badgeClass}">${item.status}</span>
            </td>
            <td class="p-3.5">
              <select onchange="updateStatus(${item.rowIndex}, this.value)" class="text-xs p-1.5 rounded-lg border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-brand-teal outline-none">
                <option value="Sedang Disewa" ${item.status === 'Sedang Disewa' ? 'selected' : ''}>Sedang Disewa</option>
                <option value="Selesai" ${item.status === 'Selesai' ? 'selected' : ''}>Selesai (Dikembalikan)</option>
                <option value="Dibatalkan" ${item.status === 'Dibatalkan' ? 'selected' : ''}>Dibatalkan</option>
              </select>
            </td>
          </tr>
        `;

        if (item.status === 'Selesai' || item.status === 'Dibatalkan') {
          htmlHistory += `
            <tr class="hover:bg-slate-50 transition">
              <td class="p-3.5 font-bold text-slate-800">${item.pemesan}</td>
              <td class="p-3.5 font-medium text-brand-teal-dark">${item.sepeda}</td>
              <td class="p-3.5">${jumlah} Unit</td>
              <td class="p-3.5 text-slate-600 text-xs">${formatMulai} s.d ${formatSelesai}</td>
              <td class="p-3.5">
                <span class="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 uppercase">${item.tipe}</span>
              </td>
              <td class="p-3.5 font-mono text-xs">
                <a href="https://wa.me/${item.whatsapp}" target="_blank" class="text-slate-600 hover:text-brand-rust">
                  ${item.whatsapp}
                </a>
              </td>
              <td class="p-3.5 font-bold text-slate-800">Rp ${biaya.toLocaleString('id-ID')}</td>
              <td class="p-3.5">
                <span class="px-2.5 py-1 rounded-full text-xs font-bold ${badgeClass}">${item.status}</span>
              </td>
            </tr>
          `;
        }
      });

      const containerPenyewa = document.getElementById('containerPenyewaAktif');
      document.getElementById('countPenyewaAktif').innerText = `${penyewaAktifHariIni.length} Orang`;

      if (penyewaAktifHariIni.length === 0) {
        containerPenyewa.innerHTML = `
          <div class="col-span-full text-center py-8 text-slate-400 text-sm bg-slate-50 rounded-xl border border-dashed border-slate-200">
            🚲 Tidak ada penyewa aktif saat ini.
          </div>
        `;
      } else {
        containerPenyewa.innerHTML = '';
        penyewaAktifHariIni.forEach(p => {
          const card = document.createElement('div');
          card.className = "bg-brand-cream/60 p-4 rounded-xl border border-brand-teal/20 space-y-3 relative overflow-hidden";
          card.innerHTML = `
            <div class="flex items-start justify-between">
              <div>
                <h3 class="font-extrabold text-brand-teal-dark text-base">${p.pemesan}</h3>
                <p class="text-xs text-slate-500 font-medium">${p.sepeda} (${p.jumlah} Unit)</p>
              </div>
              <span class="px-2.5 py-1 bg-brand-rust text-white text-[11px] font-bold rounded-full shadow-sm">
                ${p.durasiStr}
              </span>
            </div>

            <div class="text-xs bg-white p-2.5 rounded-lg border border-brand-gold/40 space-y-1">
              <div class="flex justify-between text-slate-600">
                <span>Tipe Sewa:</span>
                <strong class="uppercase text-brand-teal-dark">${p.tipe}</strong>
              </div>
              <div class="flex justify-between text-slate-600">
                <span>Total Biaya:</span>
                <strong class="text-brand-rust">Rp ${p.biaya.toLocaleString('id-ID')}</strong>
              </div>
            </div>

            <div class="flex items-center justify-between pt-1">
              <span class="text-[11px] text-slate-500">Mulai: ${p.tglMulai.toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})} WITA</span>
              <a href="https://wa.me/${p.whatsapp}" target="_blank" class="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded-lg transition flex items-center gap-1 shadow-sm">
                Hubungi WA
              </a>
            </div>
          `;
          containerPenyewa.appendChild(card);
        });
      }

      document.getElementById('tableJadwalBody').innerHTML = htmlJadwal || `<tr><td colspan="10" class="text-center py-8 text-slate-400">Belum ada transaksi.</td></tr>`;
      document.getElementById('tableHistoryBody').innerHTML = htmlHistory || `<tr><td colspan="8" class="text-center py-8 text-slate-400">Belum ada riwayat selesai/batal.</td></tr>`;

      document.getElementById('statPendapatanHariIni').innerText = `Rp ${pendapatanHariIni.toLocaleString('id-ID')}`;
      document.getElementById('subStatHariIni').innerText = `${transaksiSuksesHariIniCount} Transaksi Selesai/Aktif`;
      document.getElementById('statPendapatanMingguIni').innerText = `Rp ${pendapatanMingguIni.toLocaleString('id-ID')}`;
      document.getElementById('statPendapatanBulanIni').innerText = `Rp ${pendapatanBulanIni.toLocaleString('id-ID')}`;
      document.getElementById('statTersewaHariIni').innerText = `${tersewaHariIniUnit} Unit`;
      document.getElementById('statTotalTransaksi').innerText = `${totalPemesananHariIniCount} Pemesanan Masuk Hari Ini`;
    }

    async function updateStatus(rowIndex, newStatus) {
      if (!confirm(`Ubah status pemesanan ini menjadi "${newStatus}"?`)) {
        loadAdminData();
        return;
      }

      try {
        const response = await fetch(SCRIPT_URL, {
          method: 'POST',
          body: JSON.stringify({
            action: "updateStatus",
            rowIndex: rowIndex,
            status: newStatus
          })
        });

        const res = await response.json();
        if (res.success) {
          alert("Status berhasil diperbarui!");
          loadAdminData();
        } else {
          alert("Gagal update status: " + res.message);
        }
      } catch (err) {
        alert("Terjadi kesalahan koneksi saat memperbarui status.");
      }
    }