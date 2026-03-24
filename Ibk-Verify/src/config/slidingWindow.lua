local key = KEYS[1]
local now = tonumber(ARGV[1])
local windowSize = tonumber(ARGV[2])  
local limit = tonumber(ARGV[3])       

local windowStart = now - windowSize


redis.call('ZREMRANGEBYSCORE', key, '-inf', windowStart)

local count = redis.call('ZCARD', key)

local allowed = 0
if count < limit then
  redis.call('ZADD', key, now, now)
  allowed = 1
end

redis.call('EXPIRE', key, windowSize)

return { allowed, count + 1 }