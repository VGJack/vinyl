'use strict';

const NEWS_URL = 'https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en';
const WEATHER_CODES = Object.freeze({0:'Clear',1:'Mostly clear',2:'Partly cloudy',3:'Cloudy',45:'Fog',48:'Fog',51:'Light drizzle',53:'Drizzle',55:'Drizzle',56:'Freezing drizzle',57:'Freezing drizzle',61:'Light rain',63:'Rain',65:'Heavy rain',66:'Freezing rain',67:'Freezing rain',71:'Light snow',73:'Snow',75:'Heavy snow',77:'Snow grains',80:'Rain showers',81:'Rain showers',82:'Heavy showers',85:'Snow showers',86:'Snow showers',95:'Thunderstorms',96:'Thunderstorms',99:'Thunderstorms'});

function decodeXml(text) {
  return String(text || '').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/<[^>]+>/g, '').replace(/&#(x[0-9a-f]+|\d+);|&(amp|lt|gt|quot|apos|nbsp);/gi, (_full, numeric, named) => {
    if (numeric) {
      const n = numeric.toLowerCase().startsWith('x') ? parseInt(numeric.slice(1),16) : parseInt(numeric,10);
      return Number.isInteger(n) && n >= 32 && n <= 0x10FFFF ? String.fromCodePoint(n) : '';
    }
    return {amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:' '}[named.toLowerCase()] || '';
  }).trim();
}
function tag(xml, name) {
  const m = xml.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`, 'i'));
  return m ? decodeXml(m[1]) : '';
}
function parseNewsRss(xml) {
  if (typeof xml !== 'string' || xml.length > 2_000_000) throw new Error('Invalid news response');
  const items = [];
  for (const match of xml.matchAll(/<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/gi)) {
    const value = match[1];
    const url = tag(value, 'link');
    const title = tag(value, 'title');
    const date = Date.parse(tag(value, 'pubDate'));
    if (!url.startsWith('https://news.google.com/') || !title || (Number.isFinite(date) && date < Date.now() - 7*86400000)) continue;
    const source = tag(value, 'source') || (title.includes(' - ') ? title.split(' - ').at(-1) : 'Google News');
    const cleaned = title.endsWith(` - ${source}`) ? title.slice(0,-source.length-3) : title;
    if (!items.some(item => item.title === cleaned)) items.push({title:cleaned.slice(0,190),source:source.slice(0,60),url,date:Number.isFinite(date)?date:null});
    if (items.length >= 5) break;
  }
  return items;
}
function weatherLabel(code) { return WEATHER_CODES[code] || 'Current conditions'; }
async function fetchText(url, timeout = 8000) {
  const response = await fetch(url, { signal: AbortSignal.timeout(timeout), headers: { Accept:'application/rss+xml, application/xml, application/json' } });
  if (!response.ok) throw new Error(`Service returned ${response.status}`);
  const text = await response.text();
  if (text.length > 2_000_000) throw new Error('Response too large');
  return text;
}
async function resolveCity(query) {
  const city = String(query || '').trim().slice(0,80);
  if (city.length < 2) throw new Error('Enter a city name');
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=5&language=en&format=json`;
  const result = JSON.parse(await fetchText(url));
  const matches = result.results || [];
  if (!matches.length) throw new Error('City not found. Try adding a state or country.');
  const direct = matches.find(item => item.name.toLowerCase() === city.toLowerCase()) || matches[0];
  return {name:[direct.name,direct.admin1,direct.country_code].filter(Boolean).join(', '),latitude:direct.latitude,longitude:direct.longitude};
}
async function fetchWeather(location) {
  if (!location || !Number.isFinite(location.latitude) || !Number.isFinite(location.longitude)) return null;
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  Object.entries({latitude:location.latitude,longitude:location.longitude,current:'temperature_2m,weather_code,is_day',daily:'temperature_2m_max,temperature_2m_min',timezone:'auto',temperature_unit:'fahrenheit',forecast_days:1}).forEach(([key,value])=>url.searchParams.set(key,String(value)));
  const info = JSON.parse(await fetchText(url.href));
  if (!Number.isFinite(info.current?.temperature_2m)) throw new Error('Weather response incomplete');
  return {city:location.name,temperature:Math.round(info.current.temperature_2m),condition:weatherLabel(info.current.weather_code),code:info.current.weather_code,isDay:Boolean(info.current.is_day),high:Math.round(info.daily?.temperature_2m_max?.[0] ?? info.current.temperature_2m),low:Math.round(info.daily?.temperature_2m_min?.[0] ?? info.current.temperature_2m),updated:Date.now()};
}
module.exports = {parseNewsRss,decodeXml,weatherLabel,resolveCity,fetchWeather,fetchNews:async()=>parseNewsRss(await fetchText(NEWS_URL))};
