import fs from "fs";

export function merge(asset: String, interval: String) {
  const destination = `./data-${asset}-${interval}.json`
  let files = []
  let i = 0
  while (fs.existsSync('./temp/' + destination + '-part-' + i)) {
    files.push('./temp/' + destination + '-part-' + i)
    i++
  }
  // @ts-ignore
  const candles = files.map(path => JSON.parse(fs.readFileSync(path)).candles).flat()
  fs.writeFileSync('./ohlc/' + destination, JSON.stringify(candles), 'utf-8')
  files.map(path => fs.unlinkSync(path))
}


const assets = ['BTC', 'ETH', 'DOT', 'BNB', 'POLY', 'NANO', 'ALGO', 'XLM'].map( asset => {
  merge(asset, '5m')
})
