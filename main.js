const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');
const { URL } = require('url');
let win;
function createWindow() {
  win = new BrowserWindow({
    width: 1440, height: 900, minWidth: 1080, minHeight: 700,
    backgroundColor: '#080b10', title: 'Birds Client',
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false }
  });
  win.loadFile(path.join(__dirname, 'src', 'index.html'));
}
app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (!BrowserWindow.getAllWindows().length) createWindow(); });

function requestJson(url, headers={}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    https.get({ hostname:u.hostname, path:u.pathname+u.search, headers:{'User-Agent':'BirdsClient/1.0 (desktop mod manager)', ...headers} }, r => {
      let body=''; r.on('data', d=>body+=d); r.on('end',()=> {
        if (r.statusCode < 200 || r.statusCode >= 300) return reject(new Error(`HTTP ${r.statusCode}: ${body.slice(0,220)}`));
        try { resolve(JSON.parse(body)); } catch(e) { reject(e); }
      });
    }).on('error', reject);
  });
}
ipcMain.handle('modrinth-search', async (_, q, loader, version) => {
  const facets = [];
  if (loader && loader !== 'Any') facets.push(`["categories:${loader.toLowerCase()}"]`);
  if (version && version !== 'Any') facets.push(`["versions:${version}"]`);
  const url = 'https://api.modrinth.com/v2/search?query='+encodeURIComponent(q||'')+'&limit=30&facets='+encodeURIComponent(JSON.stringify(facets.length?facets:[]));
  return requestJson(url);
});
ipcMain.handle('curseforge-search', async (_, q, gameVersion, modLoader) => {
  const key = app.getPath('userData') + '/curseforge-key.txt';
  if (!fs.existsSync(key)) throw new Error('CurseForge needs an API key. Add it in Settings → CurseForge API key.');
  const apiKey = fs.readFileSync(key,'utf8').trim();
  const params = new URLSearchParams({gameId:'432', searchFilter:q||'', pageSize:'30', index:'0', classId:'6'});
  if (gameVersion && gameVersion !== 'Any') params.set('gameVersion',gameVersion);
  if (modLoader && modLoader !== 'Any') params.set('modLoaderType', ({Forge:'1',Fabric:'4',Quilt:'5',NeoForge:'6'})[modLoader] || '');
  return requestJson('https://api.curseforge.com/v1/mods/search?'+params.toString(), {'x-api-key':apiKey});
});

ipcMain.handle('modrinth-files', async (_, projectId, loader, version) => {
  const loaders = loader && loader !== 'Any' ? [loader.toLowerCase()] : ['fabric','forge','neoforge','quilt'];
  const versions = await requestJson('https://api.modrinth.com/v2/project/'+encodeURIComponent(projectId)+'/version?loaders='+encodeURIComponent(JSON.stringify(loaders))+'&game_versions='+encodeURIComponent(JSON.stringify(version && version !== 'Any' ? [version] : [])));
  return versions.slice(0,20).map(v=>({name:v.name||v.version_number, version:v.version_number, files:(v.files||[]).filter(f=>f.primary||/\\.jar$/i.test(f.filename)).map(f=>({filename:f.filename,url:f.url,primary:f.primary}))})).filter(v=>v.files.length);
});
ipcMain.handle('curseforge-files', async (_, modId, gameVersion, loader) => {
  const key = app.getPath('userData') + '/curseforge-key.txt';
  if (!fs.existsSync(key)) throw new Error('CurseForge needs an API key. Add it in Settings → CurseForge API key.');
  const params = new URLSearchParams({gameVersion:gameVersion && gameVersion!=='Any'?gameVersion:'', pageSize:'20', index:'0'});
  if (loader && loader!=='Any') params.set('modLoaderType', ({Forge:'1',Fabric:'4',Quilt:'5',NeoForge:'6'})[loader]||'');
  const data=await requestJson('https://api.curseforge.com/v1/mods/'+encodeURIComponent(modId)+'/files?'+params.toString(), {'x-api-key':fs.readFileSync(key,'utf8').trim()});
  return (data.data||[]).map(f=>({name:f.displayName||f.fileName,version:f.gameVersions?.[0]||'',files:[{filename:f.fileName,url:f.downloadUrl,primary:true}]})).filter(v=>v.files[0].url);
});

ipcMain.handle('pick-folder', async () => {
  const result = await dialog.showOpenDialog(win,{properties:['openDirectory','createDirectory']});
  return result.canceled ? null : result.filePaths[0];
});
ipcMain.handle('install-mod', async (_, {url, filename, folder}) => {
  if (!folder || !fs.existsSync(folder)) throw new Error('Choose a valid Minecraft mods folder first.');
  if (!url.startsWith('https://')) throw new Error('Only secure HTTPS downloads are allowed.');
  const safe = path.basename(filename).replace(/[<>:"/\\\\|?*]/g,'_');
  const dest = path.join(folder,safe);
  await new Promise((resolve,reject)=>{
    https.get(url, r=>{
      if (r.statusCode>=300 && r.statusCode<400 && r.headers.location) return https.get(r.headers.location, rr=>{ const out=fs.createWriteStream(dest); rr.pipe(out); out.on('finish',()=>out.close(resolve)); out.on('error',reject); }).on('error',reject);
      if (r.statusCode!==200) return reject(new Error('Download failed: HTTP '+r.statusCode));
      const out=fs.createWriteStream(dest); r.pipe(out); out.on('finish',()=>out.close(resolve)); out.on('error',reject);
    }).on('error',reject);
  });
  return {path:dest};
});
ipcMain.handle('list-mods', async (_, folder) => {
  if (!folder || !fs.existsSync(folder)) return [];
  return fs.readdirSync(folder).filter(f=>/\\.jar$/i.test(f)).map(name=>({name, path:path.join(folder,name)}));
});
ipcMain.handle('remove-mod', async (_, file) => { if (fs.existsSync(file)) fs.unlinkSync(file); return true; });
ipcMain.handle('save-curseforge-key', async (_, key) => {
  if (!key || key.length < 12) throw new Error('That API key looks too short.');
  fs.writeFileSync(app.getPath('userData')+'/curseforge-key.txt',key.trim(),{mode:0o600}); return true;
});
ipcMain.handle('open-external', async (_, url) => { if (url.startsWith('https://')) await shell.openExternal(url); });
