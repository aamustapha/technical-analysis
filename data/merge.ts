import fs from "fs";
import {Interval} from "./models";

export function merge(asset: String, interval: Interval) {
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