<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { IonApp, IonPage, IonContent, IonCard, IonCardContent, IonButton, IonSpinner } from '@ionic/vue';
import { fetchWeather, type WeatherRow } from './weather';

const PAGE_SIZE = 10;
const allRows = ref<WeatherRow[]>([]);
const page = ref(1);
const loading = ref(false);
const statusMessage = ref('Menyiapkan data cuaca…');
const errorMessage = ref('');
const updatedText = ref('');
const totalPages = computed(() => Math.ceil(allRows.value.length / PAGE_SIZE));
const start = computed(() => (page.value - 1) * PAGE_SIZE);
const visibleRows = computed(() => allRows.value.slice(start.value, start.value + PAGE_SIZE));
let controller: AbortController | undefined;
let timeout: ReturnType<typeof setTimeout> | undefined;
let disposed = false;

function formatTemperature(value: number | null): string {
  return value === null ? 'Tidak tersedia' : `${value.toLocaleString('id-ID', {
    minimumFractionDigits: 1, maximumFractionDigits: 1,
  })} °C`;
}

async function loadWeather(): Promise<void> {
  if (loading.value) return;
  loading.value = true;
  allRows.value = [];
  page.value = 1;
  errorMessage.value = '';
  updatedText.value = '';
  statusMessage.value = 'Mengambil data cuaca dari Open-Meteo…';
  controller = new AbortController();
  timeout = setTimeout(() => controller?.abort(), 15000);
  try {
    const data = await fetchWeather(controller.signal);
    if (disposed) return;
    allRows.value = data.rows;
    statusMessage.value = data.rows.length
      ? `Berhasil memuat ${data.total} data prakiraan per jam. Maksimal 10 data per halaman.`
      : 'API tidak mengembalikan data prakiraan. Silakan muat ulang.';
    updatedText.value = `Terakhir diambil: ${new Intl.DateTimeFormat('id-ID', {
      dateStyle: 'medium', timeStyle: 'medium', timeZone: 'Asia/Jakarta',
    }).format(new Date())} WIB.`;
  } catch (cause) {
    if (disposed) return;
    statusMessage.value = 'Data cuaca belum dapat ditampilkan.';
    errorMessage.value = controller.signal.aborted
      ? 'Waktu tunggu habis (15 detik). Periksa koneksi lalu pilih Muat ulang.'
      : `Gagal memuat data. ${cause instanceof Error ? cause.message : ''} Periksa koneksi lalu pilih Muat ulang.`;
  } finally {
    clearTimeout(timeout);
    if (!disposed) loading.value = false;
  }
}

onMounted(() => void loadWeather());
onBeforeUnmount(() => {
  disposed = true;
  controller?.abort();
  clearTimeout(timeout);
});
</script>

<template>
  <IonApp>
    <IonPage>
      <IonContent>
        <main class="container">
          <header>
            <div class="eyebrow"><span class="logo">TS</span><span>LAB PEMROGRAMAN</span><span class="badge">Praktikum 02</span></div>
            <p class="kicker">OPEN-METEO / JAKARTA</p>
            <h1>Prakiraan cuaca...<br /><span>Suhu Jakarta per jam.</span></h1>
            <p class="intro">Mengambil data dari API online, lalu menampilkan waktu dan temperatur dalam tabel yang mudah dibaca.</p>
          </header>
          <section class="summary" aria-label="Informasi prakiraan">
            <div><span class="label">LOKASI</span><strong>Jakarta, Indonesia</strong><span>Lintang −6.2 · Bujur 106.8</span></div>
            <div><span class="label">PARAMETER</span><strong>Temperatur 2 meter</strong><span>temperature_2m · °C</span></div>
            <div><span class="label">ZONA WAKTU</span><strong>UTC / GMT</strong><span>WIB = UTC + 7 jam</span></div>
          </section>
          <IonCard class="card" aria-labelledby="data-title"><IonCardContent>
            <div class="section-heading"><div><p class="kicker">DATA PRAKIRAAN</p><h2 id="data-title">Temperatur per jam</h2></div><IonButton id="reload" :disabled="loading" @click="loadWeather">{{ loading ? 'Memuat…' : 'Muat ulang ↻' }}</IonButton></div>
            <p id="status" role="status" aria-live="polite"><IonSpinner v-if="loading" name="dots" aria-hidden="true" />{{ statusMessage }}</p>
            <p v-if="errorMessage" id="error" role="alert">{{ errorMessage }}</p>
            <div v-if="!loading && allRows.length" id="table-area">
              <div class="table-scroll">
                <table>
                  <caption>Data {{ start + 1 }}–{{ Math.min(start + PAGE_SIZE, allRows.length) }} dari {{ allRows.length }} prakiraan per jam</caption>
                  <thead><tr><th scope="col">Waktu (UTC)<small>time</small></th><th scope="col">Suhu (°C)<small>temperature_2m</small></th></tr></thead>
                  <tbody id="weather-rows">
                    <tr v-for="item in visibleRows" :key="item.time">
                      <td><time :datetime="`${item.time}Z`">{{ item.time.replace('T', ' · ') }}</time></td>
                      <td>{{ formatTemperature(item.temperature) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <nav class="pagination" aria-label="Halaman data suhu">
                <IonButton id="previous-page" :disabled="page === 1" @click="page--">Sebelumnya</IonButton>
                <span id="page-info" role="status" aria-live="polite">Halaman {{ page }} dari {{ totalPages }}</span>
                <IonButton id="next-page" :disabled="page === totalPages" @click="page++">Berikutnya</IonButton>
              </nav>
              <p id="updated" class="note">{{ updatedText }}</p>
            </div>
            <p class="note">Waktu ditampilkan sesuai respons API dalam UTC, bukan WIB. Data ini merupakan <strong>prakiraan</strong>, bukan hasil pengukuran langsung. Data diurutkan sesuai respons API, tidak selalu dimulai dari jam saat ini.</p>
          </IonCardContent></IonCard>
          <details class="source"><summary>Sumber data dan cara kerja</summary><p>Aplikasi mengirim GET ke endpoint berikut. Array <code>hourly.time</code> dan <code>hourly.temperature_2m</code> dipasangkan berdasarkan indeks yang sama, lalu ditampilkan 10 pasangan per halaman.</p><a id="api-link" href="https://api.open-meteo.com/v1/forecast?latitude=-6.2&amp;longitude=106.8&amp;hourly=temperature_2m" target="_blank" rel="noopener noreferrer">https://api.open-meteo.com/v1/forecast?latitude=-6.2&amp;longitude=106.8&amp;hourly=temperature_2m</a></details>
          <footer><span>Tugas 2 · STSI4303</span><span>Vue · Ionic · TypeScript · Data cuaca oleh <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer">Open-Meteo</a></span></footer>
        </main>
      </IonContent>
    </IonPage>
  </IonApp>
</template>
