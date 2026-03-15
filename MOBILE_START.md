# Mobile app (React Native + Expo)

## 1. Start backend

```powershell
cd server
npm install
npm start
```

Backend runs on `http://localhost:3000`.

## 2. Start mobile app

```powershell
cd mobile
npm install
npm start
```

Then:
- press `a` for Android emulator
- press `i` for iOS simulator (macOS)
- or scan QR in Expo Go

## 3. Real iPhone setup (Expo Go)

1. Connect iPhone + laptop on the same Wi-Fi.
2. Install **Expo Go** from App Store.
3. In `mobile`, run:

```powershell
npm install
npm start -- --lan
```

4. Scan QR code with Expo Go.

The app auto-detects your development machine IP from Expo and calls the backend on port `3000`.

If LAN detection does not work on your network, set manual IP in `mobile/src/config.js`:

```js
const DEV_MACHINE_IP = '192.168.1.100';
```

Fallback option:

```powershell
npm start -- --tunnel
```
