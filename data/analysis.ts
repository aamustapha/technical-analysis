import fs from "fs";
import { ApplyTo, Candle, IndicatorLevel, TalibFunctionReturn } from "./models";
const talib = require("../node_modules/talib/build/Release/talib.node");

export default class Analysis {
  private path: String;
  private marketData: Candle[];

  constructor(path: string, depth = 1000) {
    this.path = path;

    if (!fs.existsSync(path)) {
      throw Error("File does not exist");
    }
    this.marketData = JSON.parse(fs.readFileSync(path, "utf-8"));
    this.marketData = this.marketData.splice(
      Math.max(0, this.marketData.length - depth)
    );
  }

  explain(func: string) {
    return new Promise((resolve, reject) => {
      const function_desc = talib.explain(func);
      resolve(function_desc);
    });
  }

  adx(period: number) {
    return new Promise((resolve, reject) => {
      talib.execute(
        {
          name: "ADX",
          startIdx: 0,
          endIdx: this.marketData.length - 1,
          high: this.marketData.map((candle) => candle.high),
          low: this.marketData.map((candle) => candle.low),
          close: this.marketData.map((candle) => candle.close),
          optInTimePeriod: period,
        },
        function (err: Object, result: Object) {
          if (err) {
            return reject(err);
          }
          resolve(result);
        }
      );
    });
  }

  rsi(
    period: number = 14,
    applyTo: ApplyTo = "high"
  ): Promise<TalibFunctionReturn> {
    return new Promise((resolve, reject) => {
      talib.execute(
        {
          name: "RSI",
          startIdx: 0,
          endIdx: this.marketData.length - 1,
          inReal: this.marketData.map((candle) => candle[applyTo]),
          optInTimePeriod: period,
        },
        function (err: Object, result: TalibFunctionReturn) {
          if (err) {
            return reject(err);
          }
          resolve(result);
        }
      );
    });
  }

  rsiBuyLevels(
    period: number = 14,
    applyTo: ApplyTo = "high",
    threshold = 23.5
  ) {
    return this.rsi().then((rsi) => {
      const rsiLevels = rsi.result.outReal;
      rsiLevels.splice(0, 0, ...Array(rsi.begIndex));
      const marketData: IndicatorLevel[] = this.marketData
        .map((candle, index) => {
          return { timestamp: candle.timestamp, level: rsiLevels[index] };
        })
        .filter((level) => level.level <= threshold);
      return marketData;
    });
  }

  rsiSellLevels(
    period: number = 14,
    applyTo: ApplyTo = "high",
    threshold = 75
  ) {
    return this.rsi().then((rsi) => {
      const rsiLevels = rsi.result.outReal;
      rsiLevels.splice(0, 0, ...Array(rsi.begIndex));
      const marketData: IndicatorLevel[] = this.marketData
        .map((candle, index) => {
          return { timestamp: candle.timestamp, level: rsiLevels[index] };
        })
        .filter((level) => level.level >= threshold);
      return marketData;
    });
  }
}

// new Analysis("./ohlc/ALGO15.json").adx(9).then(console.log);
// new Analysis("./ohlc/ALGO15.json").rsi(9).then(console.log);
// new Analysis("./ohlc/ALGO15.json").rsiBuyLevels(25).then(console.log);
new Analysis("./ohlc/ALGO15.json").rsiSellLevels().then(console.log);

// new Analysis("./ohlc/ALGO15.json").explain("CDL3BLACKCROWS").then((details) => {
//   console.dir(details, { depth: null });
// });
