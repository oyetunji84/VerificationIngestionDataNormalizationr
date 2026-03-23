
local key = KEYS[1]
local capacity = tonumber(ARGV[1])
local leakRate = tonumber(ARGV[2])  
local now = tonumber(ARGV[3])

local bucket = redis.call('HMGET', key, 'queue', 'lastLeakTime')
local queue = tonumber(bucket[1]) or 0
local lastLeakTime = tonumber(bucket[2]) or now


local elapsed = now - lastLeakTime
local leaked = math.floor(elapsed * leakRate)
queue = math.max(0, queue - leaked)


local allowed = 0
if queue < capacity then
  queue = queue + 1
  allowed = 1
end


redis.call('HMSET', key, 'queue', queue, 'lastLeakTime', now)
redis.call('EXPIRE', key, 120)

return { allowed, queue }