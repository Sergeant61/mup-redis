module.exports = {
  setup: function(api, nodemiral) {
    if (!api.getConfig().redis) {
      console.log(
        'Not setting up redis since there is no redis config'
      );
      return;
    }

    var redisSessions = api.getSessions(['redis']);
    var redisConfig = api.getConfig().redis;

    var list = nodemiral.taskList('Setup Redis');

    list.executeScript('Setup Environment', {
      script: api.resolvePath(__dirname, 'assets/redis-setup.sh'),
      vars: {
        redisVersion: redisConfig.version || '3.2.10-alpine',
        redisHost: redisConfig.host || '127.0.0.1',
        redisPort: redisConfig.port || '6379',
        redisDir: '/opt/redis'
      }
    });

    return api.runTaskList(list, redisSessions, { verbose: api.getVerbose() });
  },
  logs: function(api) {
    var args = api.getArgs();
    var sessions = api.getSessions(['redis']);

    // remove redis from args sent to docker
    args.shift();

    return api.getDockerLogs('redis', sessions, args);
  },
  start: function(api, nodemiral) {
    var list = nodemiral.taskList('Start Redis');
    var sessions = api.getSessions(['redis']);
    var config = api.getConfig().redis;

    list.executeScript('Start Redis', {
      script: api.resolvePath(__dirname, 'assets/redis-start.sh'),
      vars: {
        redisVersion: config.version || '3.2.10-alpine',
        redisHost: config.host || '127.0.0.1',
        redisPort: config.port || '6379',
        redisDir: '/opt/redis'
      }
    });

    return api.runTaskList(list, sessions, { verbose: api.getVerbose() });
  },
  stop: function(api, nodemiral) {
    var sessions = api.getSessions(['redis']);
    var list = nodemiral.taskList('Stop Redis');
    
    list.executeScript('Stop Redis', {
      script: api.resolvePath(__dirname, 'assets/redis-stop.sh')
    });

    return api.runTaskList(list, sessions, { verbose: api.getVerbose() });
  }
};
