import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import QRCode from 'qrcode'
import { QR_SAMPLES } from '../src/poc/qr-scanner/qrSamples.js'

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))
const outputDirectory = path.resolve(scriptDirectory, '../public/qr-samples')

await fs.mkdir(outputDirectory, { recursive: true })

for (const sample of QR_SAMPLES) {
  await QRCode.toFile(path.join(outputDirectory, sample.fileName), sample.value, {
    errorCorrectionLevel: 'M',
    margin: 3,
    width: 720,
    color: {
      dark: '#07111fff',
      light: '#ffffffff',
    },
  })
}

await fs.writeFile(
  path.join(outputDirectory, 'samples.json'),
  `${JSON.stringify(QR_SAMPLES, null, 2)}\n`,
  'utf8',
)

console.log(`Generated ${QR_SAMPLES.length} QR samples in ${outputDirectory}`)
