import Vue from 'vue'
import TradingVue from 'trading-vue-js'

import App from './App.vue'

Vue.config.productionTip = false

Vue.component('TradingVue', TradingVue)
new Vue({
  render: h => h(App),
}).$mount('#app')
