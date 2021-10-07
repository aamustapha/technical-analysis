import fs from "fs";
import {
  ApplyTo,
  Candle,
  IndicatorLevel,
  MovingAverageType,
  TalibFunctionReturn,
} from "./models";
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

  ema(
    period: number = 30,
    applyTo: ApplyTo = "close"
  ): Promise<TalibFunctionReturn> {
    return new Promise((resolve, reject) => {
      talib.execute(
        {
          name: "EMA",
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

  emaLine(
    period: number = 30,
    applyTo: ApplyTo = "close"
  ): Promise<IndicatorLevel[]> {
    return this.ema(period, applyTo).then((sma) => {
      const smaLine = sma.result.outReal;
      smaLine.splice(0, 0, ...Array(sma.begIndex));
      return this.marketData.map((candle, index) => {
        return { timestamp: candle.timestamp, level: smaLine[index] };
      });
    });
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
    applyTo: ApplyTo = "close"
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
    applyTo: ApplyTo = "close",
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
    applyTo: ApplyTo = "close",
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

  sma(
    period: number = 30,
    applyTo: ApplyTo = "close"
  ): Promise<TalibFunctionReturn> {
    return new Promise((resolve, reject) => {
      talib.execute(
        {
          name: "SMA",
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

  smaLine(
    period: number = 30,
    applyTo: ApplyTo = "close"
  ): Promise<IndicatorLevel[]> {
    return this.sma(period, applyTo).then((sma) => {
      const smaLine = sma.result.outReal;
      smaLine.splice(0, 0, ...Array(sma.begIndex));
      return this.marketData.map((candle, index) => {
        return { timestamp: candle.timestamp, level: smaLine[index] };
      });
    });
  }

  /**
   * A sma cross over buy signal is when the sma line cuts through a candle in an upward direction
   * A crossOver buy signal is a point where the sma price is higher than the open price but less than the close price
   *
   * @param period
   * @param applyTo
   * @returns
   */
  smaCrossOverBuy(period: number = 30, applyTo: ApplyTo = "close") {
    return this.sma(period, applyTo).then((sma) => {
      const smaLine = sma.result.outReal;
      smaLine.splice(0, 0, ...Array(sma.begIndex));
      const signalPoints: IndicatorLevel[] = this.marketData
        .map((candle, index) => {
          return { timestamp: candle.timestamp, level: smaLine[index] };
        })
        .filter((level, index) => {
          const candle = this.marketData[index];
          return level.level > candle.open && level.level < candle.close;
        });
      return signalPoints;
    });
  }

  /**
   * A sma cross over sell signal is when the sma line cuts through a candle in a downward direction
   * A crossOver sell signal is a point where the sma price is lower than the open price but higher than the close price
   *
   * @param period
   * @param applyTo
   * @returns
   */
  smaCrossOverSell(period: number = 30, applyTo: ApplyTo = "close") {
    return this.sma(period, applyTo).then((sma) => {
      const smaLine = sma.result.outReal;
      smaLine.splice(0, 0, ...Array(sma.begIndex));
      const signalPoints: IndicatorLevel[] = this.marketData
        .map((candle, index) => {
          return { timestamp: candle.timestamp, level: smaLine[index] };
        })
        .filter((level, index) => {
          const candle = this.marketData[index];
          return level.level < candle.open && level.level > candle.close;
        });
      return signalPoints;
    });
  }

  /**
   * A gollden cross would occur when we take 2 sequential points from both short and long MA lines,
   * and check if longMAline[0] is above shortMAline[1] but longMAline[1] is lower than shortMAline[2]
   * @param movingAverages
   * @param period
   * @param applyTo
   * @returns
   */
  maCrossBuy(
    movingAverages: [MovingAverageType, MovingAverageType],
    period: [number, number],
    applyTo: ApplyTo = "close"
  ): Promise<IndicatorLevel[]> {
    const [ma1, ma2] = movingAverages;
    const [period1, period2] = period;
    return Promise.all([
      this[ma1](period1, applyTo),
      this[ma2](period2, applyTo),
    ]).then((movingAverages) => {
      let shortMA: TalibFunctionReturn, longMA: TalibFunctionReturn;
      if (period1 < period2) {
        [shortMA, longMA] = movingAverages;
      } else {
        [longMA, shortMA] = movingAverages;
      }

      const shortMALine = shortMA.result.outReal;
      const longMALine = longMA.result.outReal;

      shortMALine.splice(0, 0, ...Array(shortMA.begIndex));
      longMALine.splice(0, 0, ...Array(longMA.begIndex));

      const crossOverPoints = shortMALine
        .map((point, index) => {
          return { timestamp: this.marketData[index].timestamp, level: point };
        })
        .filter((shortLine, index) => {
          const longLine = longMALine[index];
          if (
            index < 2 ||
            shortLine.level === undefined ||
            longLine === undefined
          ) {
            return false;
          }
          const prevShortLinePoint = shortMALine[index - 1];
          const prevLongLinePoint = longMALine[index - 1];
          if (
            prevLongLinePoint > prevShortLinePoint &&
            longLine < shortLine.level
          ) {
            return true;
          }
        });
      return crossOverPoints;
    });
  }

  /**
   * A death cross would occur when we take 2 sequential points from both short and long MA lines,
   * and check if longMAline[0] is below shortMAline[1] but longMAline[1] is higher than shortMAline[2]
   * @param movingAverages
   * @param period
   * @param applyTo
   * @returns
   */
  maCrossSell(
    movingAverages: [MovingAverageType, MovingAverageType],
    period: [number, number],
    applyTo: ApplyTo = "close"
  ): Promise<IndicatorLevel[]> {
    const [ma1, ma2] = movingAverages;
    const [period1, period2] = period;
    return Promise.all([
      this[ma1](period1, applyTo),
      this[ma2](period2, applyTo),
    ]).then((movingAverages) => {
      let shortMA: TalibFunctionReturn, longMA: TalibFunctionReturn;
      if (period1 < period2) {
        [shortMA, longMA] = movingAverages;
      } else {
        [longMA, shortMA] = movingAverages;
      }

      const shortMALine = shortMA.result.outReal;
      const longMALine = longMA.result.outReal;

      shortMALine.splice(0, 0, ...Array(shortMA.begIndex));
      longMALine.splice(0, 0, ...Array(longMA.begIndex));

      const crossOverPoints = shortMALine
        .map((point, index) => {
          return { timestamp: this.marketData[index].timestamp, level: point };
        })
        .filter((shortLine, index) => {
          const longLine = longMALine[index];
          if (
            index < 2 ||
            shortLine.level === undefined ||
            longLine === undefined
          ) {
            return false;
          }
          const prevShortLinePoint = shortMALine[index - 1];
          const prevLongLinePoint = longMALine[index - 1];
          if (
            prevLongLinePoint < prevShortLinePoint &&
            longLine > shortLine.level
          ) {
            return true;
          }
        });
      return crossOverPoints;
    });
  }
}

const analysis = new Analysis("./ohlc/ALGO15.json", 5000);
// new Analysis("./ohlc/ALGO15.json").adx(9).then(console.log);
// new Analysis("./ohlc/ALGO15.json").rsi(9).then(console.log);
// new Analysis("./ohlc/ALGO15.json").rsiBuyLevels(25).then(console.log);

Promise.all([
  // analysis.rsiBuyLevels(),
  analysis.smaLine(20),
  analysis.emaLine(100),
  analysis.maCrossBuy(["sma", "ema"], [20, 100]),
]).then((response) => {
  const [sma, ema, golden] = response;
  fs.writeFileSync(
    "./indicators/d.json",
    JSON.stringify({ sma, ema, golden }, null, 2),
    "utf-8"
  );
});

// new Analysis("./ohlc/ALGO15.json").explain("SMA").then((details) => {
//   console.dir(details, { depth: null });
// });
