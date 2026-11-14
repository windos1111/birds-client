const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('birds', {
  searchModrinth:(q,l,v)=>ipcRenderer.invoke('modrinth-search',q,l,v),
  searchCurseForge:(q,v,l)=>ipcRenderer.invoke('curseforge-search',q,v,l),
  getModrinthFiles:(id,l,v)=>ipcRenderer.invoke('modrinth-files',id,l,v),
  getCurseForgeFiles:(id,v,l)=>ipcRenderer.invoke('curseforge-files',id,v,l),
  pickFolder:()=>ipcRenderer.invoke('pick-folder'),
  installMod:data=>ipcRenderer.invoke('install-mod',data),
  listMods:folder=>ipcRenderer.invoke('list-mods',folder),
  removeMod:file=>ipcRenderer.invoke('remove-mod',file),
  saveCurseForgeKey:key=>ipcRenderer.invoke('save-curseforge-key',key),
  openExternal:url=>ipcRenderer.invoke('open-external',url)
});