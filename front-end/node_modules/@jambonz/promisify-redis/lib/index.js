const assert = require('assert');
const { promisify } = require('util');
const commands = require('redis-commands');

const promisifyRedis = (redis) => {
  const {Multi, RedisClient} = redis;
  assert(RedisClient && Multi);

  Multi.prototype.execAsync = promisify(Multi.prototype.exec);

  commands.list.forEach((cmd) => {
    const original = RedisClient.prototype[cmd];
    const asycFunc = `${cmd}Async`;
    if (typeof original === 'function') {
      RedisClient.prototype[asycFunc] = promisify(original);
    }
  });
  return redis;
};

module.exports = promisifyRedis;
