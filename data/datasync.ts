import fs from 'fs';
import axios, {AxiosResponse} from 'axios';
import axiosRetry from "axios-retry";
import {Interval, Candle, IntervalDuration} from "./models";
import {merge} from "./merge";

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
  start: number

  constructor(start: number) {
    this.start = start
  }

  url(asset: string, interval: string, start: number, end: number) {
    return `https://cryptocandledata.com/api/candles?exchange=binance&tradingPair=${asset}USDT&interval=${interval}&startDateTime=${start}&endDateTime=${end}`
  }

  private resolveRange(interval: Interval): number[][] {
    const range: number[][] = []
    const now = Math.floor(Date.now() / 1000)
    const duration = now - this.start
    const dataPoints = Math.ceil(duration / IntervalDuration[interval]) // number of candles between start date and now
    const numCandlesInRequest = 500
    for (let i = 0; i < dataPoints / numCandlesInRequest; i++) {
      const s = this.start + IntervalDuration[interval] * numCandlesInRequest * i
      const f = Math.min(this.start + IntervalDuration[interval] * numCandlesInRequest * (i + 1), now)
      range.push([s, f])
    }
    return range
  }


  async fetchData(asset: string, interval: Interval) {
    const ranges = await this.resolveRange(interval)

    const destination = `./data-${asset}-${interval}.json`
    let candles: Candle[] = []
    const requests: AxiosResponse[] = []
    for (let i = 0; i < ranges.length; i++) {
      if (fs.existsSync('./temp/' + destination + '-part-' + i)) {
        console.log("skipping")
        continue
      }
      const [start, end] = ranges[i]
      const url = this.url(asset, interval, start, end)
      console.log(`P => ${i} URL => ${url}`)
      const r = await axios.get(this.url(asset, interval, start, end))
      merge(asset, interval)
      requests.push(r)
      await sleep(500)
    }

    await Promise.all(requests).then(responses => {
      candles = responses.map(response => {
        let r: { candles: Candle[] } = response.data
        return r.candles
      }).flat()
    })
    merge(asset, interval)
    console.log('Candles writte to file')
    return Promise.resolve()
  }

  async fetchAll(assets: string[], intervals: Interval[]) {
    for (const interval of intervals) {
      for (const asset of assets) {
        await this.fetchData(asset, interval)
      }
    }
  }
}
