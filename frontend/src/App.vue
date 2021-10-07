<template>
  <div id="app">
  
    <market-data />
  </div>
</template>

<script>
import MarketData from "./components/MarketData";

export default {
  name: "App",
  components: {
    MarketData,
  },
};
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
}
</style>
