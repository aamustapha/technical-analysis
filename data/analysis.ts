import { rejects } from "assert";
import fs from "fs";
import { resolve } from "path/posix";
import { start } from "repl";
import { Candle } from "./models";
const talib = require("../node_modules/talib/build/Release/talib.node");

export default class Analysis {
  private path: String;
  private marketData: Candle[];

  constructor(path: string) {
    this.path = path;

    if (!fs.existsSync(path)) {
      throw Error("File does not exist");
    }
    this.marketData = JSON.parse(fs.readFileSync(path, "utf-8"));
    console.log(this.marketData.length);
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
          startIdx: Math.max(0, this.marketData.length - 2000),
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

  rsi(period: number) {
    return new Promise((resolve, reject) => {
      talib.execute(
        {
          name: "RSI",
          startIdx: Math.max(0, this.marketData.length - 2000),
          endIdx: this.marketData.length - 1,
          inReal: this.marketData.map((candle) => candle.high),
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
}

// new Analysis("./ohlc/ALGO15.json").adx(9).then(console.log);
// new Analysis("./ohlc/ALGO15.json").rsi(9).then(console.log);

// new Analysis("./ohlc/ALGO15.json").explain("CDL3BLACKCROWS").then((details) => {
//   console.dir(details, { depth: null });
// });
