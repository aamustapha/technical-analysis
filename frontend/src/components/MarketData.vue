<template>
  <div class="hello">
    <trading-vue
        :data="candles" :width="this.width" :height="this.height"
        :color-back="colors.colorBack"
        :color-grid="colors.colorGrid"
        :color-text="colors.colorText" />
  </div>
</template>

<script>

import ohlcv from '@/data-ALGO-30m.json'


export default {
  name: 'MarketData',
  data() {
    return {
      candles: {
        "type": "Candles",
        ohlcv: ohlcv.map(ohlc => {
          return [ohlc.timestamp, ohlc.open, ohlc.high, ohlc.low, ohlc.close].concat(ohlc.volume)
        }),
        settings: {
          showVolume: false,
          priceLine: false
        }
      },
      width: window.innerWidth - 23,
      height: window.innerHeight - 16,
      colors: {
        colorBack: '#fff',
        colorGrid: '#eee',
        colorText: '#333',
      }
    }
  },
  methods: {
    onResize() {
      this.width = window.innerWidth
      this.height = window.innerHeight
    }
  },
  mounted() {
    window.addEventListener('resize', this.onResize)
    window.dc = this.candles
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.onResize)
  }
}
</script>
