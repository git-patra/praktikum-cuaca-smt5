import { describe, expect, it, vi } from 'vitest';
import { API_URL, parseWeather, fetchWeather } from './weather';
const sample = (count = 12) => ({
  timezone: 'GMT', utc_offset_seconds: 0,
  hourly_units: { time: 'iso8601', temperature_2m: '°C' },
  hourly: {
    time: Array.from({length: count}, (_, i) => `2026-10-18T${String(i).padStart(2,'0')}:00`),
    temperature_2m: Array.from({length: count}, (_, i) => 25 + i / 10),
  },
});
describe('Data prakiraan cuaca', () => {
  it('memasangkan time dan suhu menurut indeks, seluruh data', () => {
    const data = parseWeather(sample());
    expect(data.rows).toHaveLength(12);
    expect(data.total).toBe(12);
    expect(data.rows[11]).toEqual({time:'2026-10-18T11:00',temperature:26.1});
    expect(data.rows[0]).toEqual({time:'2026-10-18T00:00',temperature:25});
    expect(data.rows[9]).toEqual({time:'2026-10-18T09:00',temperature:25.9});
  });
  it('menerima data kurang dari 10 dan hasil kosong', () => {
    expect(parseWeather(sample(3)).rows).toHaveLength(3);
    expect(parseWeather(sample(0)).rows).toEqual([]);
  });
  it('membedakan suhu null dari nol dan suhu negatif', () => {
    const value = sample(3) as any;
    value.hourly.temperature_2m = [null,0,-2];
    expect(parseWeather(value).rows.map(r=>r.temperature)).toEqual([null,0,-2]);
  });
  it.each([{}, null, {hourly:{time:[],temperature_2m:[1]}}])('menolak struktur tidak sesuai', value => {
    expect(()=>parseWeather(value)).toThrow();
  });
  it('menolak tipe suhu dan waktu yang tidak sesuai', () => {
    const value = sample(1) as any;
    value.hourly.temperature_2m[0] = 'panas';
    expect(()=>parseWeather(value)).toThrow();
    value.hourly.temperature_2m[0] = 0;
    value.hourly.time[0] = 'bukan tanggal';
    expect(()=>parseWeather(value)).toThrow();
  });
  it('memastikan zona waktu dan satuan dari endpoint soal', () => {
    expect(()=>parseWeather({...sample(),utc_offset_seconds:25200})).toThrow();
    expect(()=>parseWeather({...sample(),hourly_units:{time:'iso8601',temperature_2m:'°F'}})).toThrow();
  });
  it('mengambil endpoint soal persis dan meneruskan signal', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify(sample())));
    const signal = new AbortController().signal;
    expect((await fetchWeather(signal,fetcher)).rows).toHaveLength(12);
    expect(fetcher).toHaveBeenCalledWith(API_URL,{signal});
  });
  it('menangani HTTP error dan JSON rusak', async () => {
    await expect(fetchWeather(undefined,vi.fn().mockResolvedValue(new Response('',{status:500})))).rejects.toThrow('HTTP 500');
    await expect(fetchWeather(undefined,vi.fn().mockResolvedValue(new Response('rusak')))).rejects.toThrow();
  });
  it('meneruskan kegagalan jaringan', async () => {
    await expect(fetchWeather(undefined,vi.fn().mockRejectedValue(new TypeError('offline')))).rejects.toThrow('offline');
  });
});
