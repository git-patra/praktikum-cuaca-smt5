// @vitest-environment jsdom
import { mount, flushPromises } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from './App.vue';
import { nextTick } from 'vue';
import { fetchWeather } from './weather';

vi.mock('./weather', async importOriginal => ({
  ...await importOriginal<typeof import('./weather')>(),
  fetchWeather: vi.fn(),
}));
const fetchMock = vi.mocked(fetchWeather);
// Uji state Vue; komponen Ionic asli diperiksa pada browser.
const stubs = {
  IonApp: { template: '<div><slot /></div>' },
  IonPage: { template: '<div><slot /></div>' },
  IonContent: { template: '<div><slot /></div>' },
  IonCard: { template: '<section><slot /></section>' },
  IonCardContent: { template: '<div><slot /></div>' },
  IonButton: { props: ['disabled'], template: '<button :disabled="disabled"><slot /></button>' },
  IonSpinner: { template: '<span />' },
};
const data = {
  total: 23,
  rows: Array.from({ length: 23 }, (_, i) => ({
    time: `2026-10-27T${String(i).padStart(2, '0')}:00`,
    temperature: i === 1 ? null : i,
  })),
};
let wrapper: ReturnType<typeof mount>;
afterEach(() => { wrapper?.unmount(); vi.resetAllMocks(); });
function render() { wrapper = mount(App, { global: { stubs } }); return wrapper; }

describe('Tampilan Vue cuaca', () => {
  it('menampilkan loading, pagination, suhu nol/null, dan reset setelah muat ulang', async () => {
    let resolve!: (value: typeof data) => void;
    fetchMock.mockReturnValueOnce(new Promise(done => { resolve = done; }));
    const app = render();
    await nextTick();
    expect(app.get('#reload').attributes('disabled')).toBeDefined();
    expect(app.get('#status').text()).toContain('Mengambil');
    resolve(data);
    await flushPromises();
    expect(app.findAll('tbody tr')).toHaveLength(10);
    expect(app.get('tbody').text()).toContain('0,0 °C');
    expect(app.get('tbody').text()).toContain('Tidak tersedia');
    expect(app.get('#previous-page').attributes('disabled')).toBeDefined();
    await app.get('#next-page').trigger('click');
    expect(app.get('#page-info').text()).toBe('Halaman 2 dari 3');
    expect(app.get('tbody time').text()).toBe('2026-10-27 · 10:00');
    await app.get('#next-page').trigger('click');
    expect(app.findAll('tbody tr')).toHaveLength(3);
    expect(app.get('#next-page').attributes('disabled')).toBeDefined();
    await app.get('#previous-page').trigger('click');
    expect(app.get('#page-info').text()).toBe('Halaman 2 dari 3');
    fetchMock.mockResolvedValueOnce(data);
    await app.get('#reload').trigger('click');
    await flushPromises();
    expect(app.get('#page-info').text()).toBe('Halaman 1 dari 3');
  });
  it('menampilkan error, lalu dapat mencoba kembali', async () => {
    fetchMock.mockRejectedValueOnce(new Error('offline'));
    const app = render();
    await flushPromises();
    expect(app.get('#error').text()).toContain('offline');
    expect(app.find('table').exists()).toBe(false);
    fetchMock.mockResolvedValueOnce(data);
    await app.get('#reload').trigger('click');
    await flushPromises();
    expect(app.find('#error').exists()).toBe(false);
    expect(app.findAll('tbody tr')).toHaveLength(10);
  });
  it('menangani respons kosong tanpa tabel atau pagination', async () => {
    fetchMock.mockResolvedValueOnce({ rows: [], total: 0 });
    const app = render();
    await flushPromises();
    expect(app.get('#status').text()).toContain('tidak mengembalikan');
    expect(app.find('table').exists()).toBe(false);
    expect(app.find('#next-page').exists()).toBe(false);
  });
  it('membatalkan permintaan saat komponen ditutup', () => {
    fetchMock.mockReturnValueOnce(new Promise(() => {}));
    const app = render();
    const signal = fetchMock.mock.calls[0][0];
    app.unmount();
    expect(signal?.aborted).toBe(true);
  });
});
