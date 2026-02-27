var commandHandlers = require('./command-handlers');
var validate = require('./validate');

module.exports = {
  name: 'redis',
  description: 'Commands to setup and manage Redis',
  commands: {
    setup: {
      description: 'Installs and starts Redis',
      handler: commandHandlers.setup
    },
    logs: {
      description: 'View Redis logs',
      builder: function(yargs) {
        return yargs.strict(false);
      },
      handler: commandHandlers.logs
    },
    start: {
      description: 'Start Redis',
      handler: commandHandlers.start
    },
    stop: {
      description: 'Stop Redis',
      handler: commandHandlers.stop
    }
  },
  validate: {
    redis: validate
  },
  prepareConfig: function(config) {
    if (config.app && config.redis) {
      if (!config.app.docker) {
        config.app.docker = {};
      }
      if (!config.app.docker.args) {
        config.app.docker.args = [];
      }

      var redisHost = config.redis.host || '127.0.0.1';
      var redisPort = config.redis.port || 6379;

      var redisServerName = Object.keys(config.redis.servers)[0];
      var appServerNames = Object.keys(config.app.servers);
      var sameHost = redisServerName
        && appServerNames.length === 1
        && config.servers[redisServerName]
        && config.servers[appServerNames[0]]
        && config.servers[redisServerName].host === config.servers[appServerNames[0]].host;

      if (sameHost && redisHost === '127.0.0.1') {
        // Single machine — use Docker link
        config.app.docker.args.push('--link=redis:redis');
        config.app.docker.args.push('--env=REDIS_URL=redis://redis:' + redisPort);
      } else {
        // Multi machine — connect over network
        config.app.docker.args.push('--env=REDIS_URL=redis://' + redisHost + ':' + redisPort);
      }
    }
  },
  hooks: {
    'post.setup': function(api) {
      if (!api.getConfig().redis) {
        return;
      }

      return api.runCommand('redis.setup')
        .then(function() {
          return api.runCommand('redis.start');
        });
    }
  }
};
