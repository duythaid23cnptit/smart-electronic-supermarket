# QR Scanner PoC - Mobile Test Guide

## Scope

This PoC compares `html5-qrcode` and `@zxing/browser` on an isolated React page:

- URL: `/qr-poc.html`
- No backend API calls.
- No database writes.
- No automatic URL navigation.
- QR content is kept as a JavaScript string, including leading zeroes and whitespace.
- Repeated callbacks containing the same exact value are ignored until the operator resets the guard.

## Local preparation

```powershell
cd frontend
npm install
npm run generate:qr-samples
npm run test:qr
npm run build
```

The generated samples are in `frontend/public/qr-samples/`.

## Run on a phone through HTTPS

Mobile camera APIs normally require a secure context. `http://localhost` is trusted only on
the same device, so `http://<PC-LAN-IP>:5173` is not a reliable phone-camera test URL.

### Option A - local HTTPS for a quick LAN check

1. Connect the computer and phone to the same LAN.
2. Find the computer LAN IPv4 address with `ipconfig`.
3. Run:

   ```powershell
   cd frontend
   npm run dev:qr:https
   ```

4. On the phone, open `https://<PC-LAN-IP>:5173/qr-poc.html`.
5. The development certificate is self-signed. If the phone does not trust it, the browser may
   still block camera access even after the warning page is accepted. Record this as an HTTPS/certificate
   environment problem, not as a decoding failure.

### Option B - trusted HTTPS tunnel (recommended for mobile evidence)

1. Run the HTTP development server:

   ```powershell
   cd frontend
   npm run dev:qr
   ```

2. Forward port `5173` with an approved HTTPS tunnel such as Cloudflare Tunnel, ngrok, or an
   institution-provided HTTPS forwarding service.
3. Open the trusted public HTTPS URL ending in `/qr-poc.html` on the phone.
4. Do not expose the server longer than required for the PoC. Stop both processes after testing.

## Test procedure

For each library:

1. Select the library.
2. Tap **Bật camera** and record the permission behavior.
3. Scan every QR sample under the same conditions.
4. Compare the displayed result character-for-character with the expected string.
5. Confirm `00001234567890` still starts with four zeroes.
6. Keep a QR in view and confirm the duplicate counter increases while the accepted result stays single.
7. Scan the URL sample and confirm the application displays a warning but does not navigate.
8. Enter a value manually and confirm it is displayed without trimming or numeric conversion.
9. Repeat under good light, low light and an angled camera position.
10. Capture screenshots named with device, library and test case.

## Test samples

| File | Expected exact value | Purpose |
|---|---|---|
| `01-leading-zeroes.png` | `00001234567890` | Preserve leading zeroes |
| `02-sasms-code.png` | `SASMS-TV4-W1-QR-001` | Normal ASCII identifier |
| `03-unicode-vietnamese.png` | `SASMS\|Ghi chú: Kiểm thử QR tiếng Việt` | UTF-8/Vietnamese text |
| `04-url-display-only.png` | `https://example.com/qr-test?code=000123` | Verify no automatic navigation |

## Result recording rule

Do not enter accuracy, scan time or a PASS result before executing the test on a real phone.
Use `NOT RUN`, `PASS`, `FAIL` or `BLOCKED`. Record device, OS, browser, lighting and evidence filename.

| Library | Device / browser | Lighting | Sample | Exact match | Time | Camera permission | Evidence | Status |
|---|---|---|---|---|---|---|---|---|
| html5-qrcode |  |  | Leading zeroes |  |  |  |  | NOT RUN |
| html5-qrcode |  |  | SASMS code |  |  |  |  | NOT RUN |
| html5-qrcode |  |  | Unicode |  |  |  |  | NOT RUN |
| html5-qrcode |  |  | URL display only |  |  |  |  | NOT RUN |
| @zxing/browser |  |  | Leading zeroes |  |  |  |  | NOT RUN |
| @zxing/browser |  |  | SASMS code |  |  |  |  | NOT RUN |
| @zxing/browser |  |  | Unicode |  |  |  |  | NOT RUN |
| @zxing/browser |  |  | URL display only |  |  |  |  | NOT RUN |

## Screenshots to capture

- Phone showing the PoC over a trusted HTTPS URL.
- Camera permission prompt or permission error.
- Successful leading-zero scan with each library.
- Unicode scan with each library.
- URL result plus the no-navigation warning.
- Duplicate callback counter.
- Low-light and angled-camera tests.
