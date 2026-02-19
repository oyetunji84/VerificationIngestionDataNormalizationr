const client = require("prom-client");

const cacheHitCounter = new client.Counter({
  name: "cache_hit_total",
  help: "Total cache hits",
});

const cacheMissCounter = new client.Counter({
  name: "cache_miss_total",
  help: "Total cache misses",
});


module.exports={cacheHitCounter, cacheMissCounter}