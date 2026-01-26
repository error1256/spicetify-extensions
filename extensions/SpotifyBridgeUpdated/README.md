# SpotifyBridgeUpdated
<img width="447" height="558" alt="Screenshot-2026-01-25-163516" src="https://github.com/user-attachments/assets/901b0e57-7376-45f2-b24b-a12a656d04fe" />
⚠️AI USED⚠️

I got the idea to make it after seeing a Marketplace Extension that didn't work but had a cool concept.
I couldn't find the original, but it was called Spotify Bridge and was on GitHub.
# Requirements
 [Spicetify](https://spicetify.app/) - For All Extensions
 [NPM](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) - Optional for Bridge
# Installation
 Windows PowerShell:
```
iwr "https://raw.githubusercontent.com/error1256/SpotifyBridgeUpdated/main/SpotifyBridgeAPI.js" -OutFile "$env:APPDATA\spicetify\Extensions\SpotifyBridgeAPI.js"
```
 Mac/Linux PowerShell:
```
curl -L "https://raw.githubusercontent.com/error1256/SpotifyBridgeUpdated/main/SpotifyBridgeAPI.js" -o ~/.config/spicetify/Extensions/SpotifyBridgeAPI.js
```
# Use
I provided a [Bridge File](https://github.com/error1256/SpotifyBridgeUpdated/blob/main/SpotifyBridge.js) that will run a [Local Web Server on port 4391](http://localhost:4390/).
You need NPM installed and run this command:
```
npm install express@5.1.0 socket.io@4.8.1 socket@1.1.25 ws@8.18.3
```
