const {app} = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const profile = process.env.VINYL_TEST_PROFILE;
if (!profile) throw new Error('An isolated test profile is required');
fs.mkdirSync(profile,{recursive:true});
app.setPath('userData',path.resolve(profile));
if (process.env.VINYL_TEST_GOOGLE_PROFILE === '1') {
  app.whenReady().then(()=>require('electron').session.defaultSession.protocol.handle('https',request=>{
    const url=new URL(request.url);
    if (url.hostname==='yt3.ggpht.com') return new Response('<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><rect width="32" height="32" rx="16" fill="#efb858"/></svg>',{headers:{'content-type':'image/svg+xml'}});
    if (url.hostname==='www.youtube.com') return new Response('<style>body{margin:0;background:#246aa0;height:1600px;color:white}button{margin:20px}img{width:32px;height:32px}#marker{position:fixed;bottom:0;width:100%;height:160px;background:#246aa0}</style><button id="avatar-btn"><img src="https://yt3.ggpht.com/test-avatar" alt="Test account"/></button><h1>Floating controls test</h1><div id="marker"></div>',{headers:{'content-type':'text/html'}});
    return new Response('',{status:404});
  }));
}
if (process.env.VINYL_TEST_WEATHER === '1') {
  const home = require('../home-data');
  home.resolveCity = async () => ({name:'Test City',latitude:40,longitude:-74});
  home.fetchWeather = async location => ({city:location.name,temperature:62,condition:'Partly cloudy',code:2,isDay:true,high:66,low:48,feelsLike:60,wind:8,humidity:55,
    hourly:Array.from({length:12},(_,i)=>({time:`2026-11-12T${String(i+10).padStart(2,'0')}:00`,temperature:62-i,code:[0,2,3,45,61,71,95][i%7],rain:i*5,isDay:i<8})),
    daily:Array.from({length:7},(_,i)=>({time:`2026-11-${12+i}`,high:66-i,low:48-i,code:[0,2,3,45,61,71,95][i],rain:i*10}))});
}
require('../main');
