# SpotifyBridgeUpdated
⚠️AI USED⚠️

I got the idea to make it after seeing a Marketplace Extension that didn't work but had a cool concept.
I couldn't find the original, but it was called Spotify Bridge and was on GitHub.
# Requirements
 [Spicetify](https://spicetify.app/) - For All Extensions
 [NPM](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) - Optional for Bridge
# Installation
 Windows PowerShell:
```
iwr "https://raw.github.com/error1256/spicetify-extensions/blob/main/extensions/SpotifyBridgeUpdated/SpotifyBridgeAPI.js" -OutFile "$env:APPDATA\spicetify\Extensions\SpotifyBridgeAPI.js"
```
 Mac/Linux PowerShell:
```
curl -L "https://raw.github.com/error1256/spicetify-extensions/blob/main/extensions/SpotifyBridgeUpdated/SpotifyBridgeAPI.js" -o ~/.config/spicetify/Extensions/SpotifyBridgeAPI.js
```
# Use
I provided a [Bridge File](https://raw.github.com/error1256/spicetify-extensions/blob/main/extensions/SpotifyBridgeUpdated/SpotifyBridge.js) that will run a [Local Web Server on port 4391](http://localhost:4390/).
You need NPM installed and run this command:
```
npm install express@5.1.0 socket.io@4.8.1 socket@1.1.25 ws@8.18.3
```
