import {Interval} from "./models";
import Datasync from "./datasync";

const assets = ['BTC', 'ETH', 'DOT', 'BNB', 'POLY', 'NANO', 'ALGO', 'XLM']
const intervals: Interval[] = ['5m', '15m', '30m']
new Datasync(1625140800).fetchAll(assets, intervals)



