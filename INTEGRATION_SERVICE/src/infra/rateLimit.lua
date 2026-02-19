local key = KEYS[1]
local capacity = tonumber(ARGV[1])
local leak_rate = tonumber(ARGV[2])
local now = tonumber(ARGV[3])
local requested = tonumber(ARGV[4])

local bucket = redis.call('HMGET', key, 'tokens', 'last_refill')
local tokens = tonumber(bucket[1])
local last_refill = tonumber(bucket[2])


if tokens == nil then
  tokens = capacity
  last_refill = now
end


local elapsed = math.max(0, now - last_refill)
local tokens_to_add = elapsed * leak_rate
tokens = math.min(capacity, tokens + tokens_to_add)


last_refill = now


if tokens >= requested then
  tokens = tokens - requested
  

  redis.call('HMSET', key, 'tokens', tokens, 'last_refill', last_refill)
  redis.call('EXPIRE', key, 3600) 
  
  return {1, math.floor(tokens)} 
else

  redis.call('HMSET', key, 'tokens', tokens, 'last_refill', last_refill)
  redis.call('EXPIRE', key, 3600)
  
  local retry_after = math.ceil((requested - tokens) / leak_rate)
  return {0, math.floor(tokens), retry_after} 
end