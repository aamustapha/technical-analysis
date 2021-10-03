import fs from 'fs';
import axios, {AxiosResponse} from 'axios';
import axiosRetry from "axios-retry";

enum IntervalDuration {
  '5m' = 300,
  '15m' = 900,
  '30m' = 1800,
  '1h' = 3600,
  '4h' = 3600 * 4,
  '1d' = 86400,
}

type Interval = keyof typeof IntervalDuration


interface Candle {
  open: number,
  high: number,
  low: number,
  close: number,
  timestamp: number
}

interface MetaCandle extends Candle {
  volume: number
}


function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

axiosRetry(axios, {
  retries: 3, // number of retries
  retryDelay: (retryCount) => {
    console.log(`retry attempt: ${retryCount}`);
    return retryCount * 30000; // time interval between retries
  },
  retryCondition: (error) => {
    // if retry condition is not specified, by default idempotent requests are retried
    return error.response?.status === 429;
  },
});

export default class Datasync {
  asset: string
  start: number
  interval: Interval
  ranges: number[][]

  constructor(asset: string, interval: Interval, start: number) {
    this.asset = asset
    this.interval = interval
    this.start = start
    this.ranges = this.resolveRange()
    console.log(this.ranges)
  }

  url(start: number, end: number) {
    return `https://cryptocandledata.com/api/candles?exchange=binance&tradingPair=${this.asset}USDT&interval=${this.interval}&startDateTime=${start}&endDateTime=${end}`
  }

  private resolveRange(): number[][] {
    const range: number[][] = []
    const now = Math.floor(Date.now() / 1000)
    const duration = now - this.start
    const dataPoints = Math.ceil(duration / IntervalDuration[this.interval]) // number of candles between start date and now
    const numCandlesInRequest = 500
    for (let i = 0; i < dataPoints / numCandlesInRequest; i++) {
      const s = this.start + IntervalDuration[this.interval] * numCandlesInRequest * i
      const f = Math.min(this.start + IntervalDuration[this.interval] * numCandlesInRequest * (i + 1), now)
      range.push([s, f])
    }
    return range
  }


  async fetchData(asset?: string, interval?: Interval) {
    if (asset) {
      this.asset = asset
    }
    if (interval) {
      this.interval = interval
    }
    const destination = `./data-${this.asset}-${this.interval}.json`
    let candles: Candle[] = []
    const requests: AxiosResponse[] = []
    for (let i = 0; i < this.ranges.length; i++) {
      if (fs.existsSync(      './temp/' + destination + '-part-' + i)) {
        console.log("skipping")
        continue
      }
      const [start, end] = this.ranges[i]
      const url = this.url(start, end)
      console.log(`P => ${i} URL => ${url}`)
      const r = await axios.get(this.url(start, end))
      fs.writeFileSync('./temp/' + destination + '-part-' + i, JSON.stringify(r.data), 'utf8')

      requests.push(r)
      await sleep(500)
    }

    await Promise.all(requests).then(responses => {
      candles = responses.map(response => {
        let r: { candles: Candle[] } = response.data
        return r.candles
      }).flat()
    })

    fs.writeFileSync(destination, JSON.stringify(candles), 'utf8')
    console.log('Candles writte to file')
    return Promise.resolve()
  }

  async fetchMany(assets: string[], intervals: Interval[]) {
    const estimatedTime = assets.length * intervals.length * this.ranges.length * 0.7
    console.log(`Estimated duration => ${(estimatedTime)}seconds`)
    for (const interval of intervals) {
      this.interval = interval
      this.ranges = await this.resolveRange()

      for (const asset of assets) {
        await this.fetchData(asset)
      }
    }
  }

}

const assets = ['BTC', 'ETH', 'DOT', 'BNB', 'POLY', 'NANO', 'ALGO', 'XLM']
const intervals: Interval[] = ['5m', '15m', '30m']
new Datasync('BTC', '5m', 1625140800).fetchMany(assets, intervals)



