# Birds Client

A Windows desktop Minecraft mod discovery and local mod-folder manager with a premium dark / silver / icy-blue interface.

## What works in this release
- Electron desktop app for Windows.
- Live Modrinth project search through the official public API.
- CurseForge project search through the official API (requires your own API key).
- Choose a Minecraft instance `mods` directory.
- List and remove `.jar` files in that directory.
- Selects a matching version/loader file from each source and installs its `.jar` into your selected mods folder. Always double-check compatibility and dependencies.

## Run on Windows
1. Install Node.js 20 LTS or newer.
2. Extract this folder.
3. Open PowerShell in the folder.
4. Run `npm install`
5. Run `npm start`

## Build an installer
Run `npm run dist`. The Windows NSIS installer will be created in `dist/`.

## CurseForge API key
CurseForge requires an API key. Obtain one through the CurseForge developer portal. In Birds Client → Settings, paste it into the API key field and save. The key is stored in the app's local Electron user-data folder and is not sent anywhere except the official CurseForge API.

## Minecraft folder
Select the `mods` folder for the exact Minecraft instance you want to manage. For example, a standard Windows Java Edition folder may be `%AppData%\\.minecraft\\mods`, but launchers such as Prism use per-instance folders.

## Important limitations
This is a first-release mod manager, not yet a full Minecraft launcher. It does not sign into Microsoft, download Minecraft itself, create Fabric/Forge instances, launch the game, or automatically resolve mod dependencies. Modrinth and CurseForge are independent services; CurseForge API access is subject to its developer terms. Always verify that a mod file matches your Minecraft version and mod loader before installing it.

Birds Client is independent and is not affiliated with Mojang, Microsoft, Modrinth or CurseForge.

## Build a Windows `.exe`

On a Windows PC, install Node.js LTS, extract this project, then double-click `build-exe.bat`. The installer will be created in the `dist` folder.

You can also push this folder to a GitHub repository, open **Actions**, choose **Build Birds Client for Windows**, and click **Run workflow**. When it finishes, download the `Birds-Client-Windows-Installer` artifact from that workflow run.
