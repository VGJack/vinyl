const {app} = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const profile = process.env.VINYL_TEST_PROFILE;
if (!profile) throw new Error('An isolated test profile is required');
fs.mkdirSync(profile,{recursive:true});
app.setPath('userData',path.resolve(profile));
if (process.env.VINYL_TEST_WEATHER === '1') {
  const home = require('../home-data');
  home.resolveCity = async () => ({name:'Test City',latitude:40,longitude:-74});
  home.fetchWeather = async location => ({city:location.name,temperature:62,condition:'Partly cloudy',code:2,isDay:true,high:66,low:48,feelsLike:60,wind:8,humidity:55,
    hourly:Array.from({length:12},(_,i)=>({time:`2026-11-12T${String(i+10).padStart(2,'0')}:00`,temperature:62-i,code:[0,2,3,45,61,71,95][i%7],rain:i*5,isDay:i<8})),
    daily:Array.from({length:7},(_,i)=>({time:`2026-11-${12+i}`,high:66-i,low:48-i,code:[0,2,3,45,61,71,95][i],rain:i*10}))});
}
require('../main');
