<template>
  <div class="hello">
    <trading-vue
      :data="candles"
      :chart-config="{ TB_ICON_BRI: 1.25 }"
      :toolbar="true"
      :width="this.width"
      :height="this.height"
      :color-back="colors.colorBack"
      :color-grid="colors.colorGrid"
      :color-text="colors.colorText"
    />
  </div>
</template>

<script>
import { DataCube } from "trading-vue-js";
import ohlcv from "@/ALGO15m.json";
import indicators from "@/indicator.json";

const settings = {
  rsa: {
    labelColor: "#888",
    legend: false,
    "z-index": 5,
  },
};

export default {
  name: "MarketData",
  data() {
    return {
      candles: new DataCube({
        ohlcv: ohlcv.map((ohlc) => {
          return [
            ohlc.timestamp,
            ohlc.open,
            ohlc.high,
            ohlc.low,
            ohlc.close,
          ].concat(ohlc.volume);
        }),
        onchart: [
          ...["sma", "ema"].map((indicator) => {
            return {
              name: indicator.toUpperCase() + ", 20",
              type: indicator.toUpperCase(),
              data: indicators[indicator]
                .map((point) => [point.timestamp, point.level])
                .splice(-2000),
              setting: settings[indicator] || {},
            };
          }),
          ...["golden"].map((indicator) => {
            return {
              name: "Crossover",
              type: "Trades",
              data: indicators[indicator]
                .map((point) => [
                  point.timestamp,
                  0,
                  ohlcv.find((candle) => {
                    return candle.timestamp == point.timestamp;
                  })?.low || point.level,
                ])
                .splice(-2000),
              setting: settings[indicator] || settings.rsa,
            };
          }),
          {
            name: "Data sections",
            type: "Splitters",
            data: [[1633277700000, "Welcome aboard 😎", 1, "#22b57f"]],
            settings: {
              legend: false,
              lineColor: "#22b57f",
            },
          },
        ],
      }),
      width: window.innerWidth - 23,
      height: window.innerHeight - 16,
      colors: {
        colorBack: "#fff",
        colorGrid: "#eee",
        colorText: "#333",
      },
    };
  },
  methods: {
    onResize() {
      this.width = window.innerWidth;
      this.height = window.innerHeight;
    },
  },
  mounted() {
    window.addEventListener("resize", this.onResize);
    window.dc = this.candles;
    window.candle = this.candles;
  },
  beforeDestroy() {
    window.removeEventListener("resize", this.onResize);
  },
};
</script>
