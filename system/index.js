/**
 * Load dependencies
 */
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var fs = require('fs');
var mongoose = require('mongoose');
var Config = require('./config/' + (process.env.NODE_ENV || 'development'));
var bodyParser = require('body-parser');
var multer = require('multer');
var morgan = require('morgan');
var path = require('path');
var nodemailer = require('nodemailer');

/* load modules */
require('./models/settings');
var SystemSettings = mongoose.model('settings');


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(multer({ dest: './public/uploads/'}));
app.use(morgan("dev"));
app.use(function(req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type, Authorization');
  next();
});
var options = {
  dotfiles: 'ignore',
  etag: false,
  index: false,
  maxAge: '1d',
  redirect: false,
  setHeaders: function (res, path, stat) {
    res.set('x-timestamp', Date.now())
  }
};
app.use(express.static('public', options));
app.use('/dist', express.static('dist', options));
app.use('/system', express.static('system/public', options));
app.use('/system/public/views', express.static('system/public/views', options));

/**
 * Path where modules are located
 */
var modulePath = __dirname + '/../modules';
var moduleURL = 'modules';

/**
 * Create new server
 * @return {Void}
 */
function startServer() {
  app.use(function(req, res, next) {
    var output = fs.readFileSync(__dirname + '/../public/index.html');
    res.type('html').send(output);
    next();
  });
  var server = http.listen(Config.server.port, function() {
    var host = server.address().address
    var port = server.address().port

    console.log('educo running at http://%s:%s', host, port);
  });
}

/**
 * Load built-in system routes
 * @param  {Object} System The system object
 * @return {Void}
 */
function systemRoutes(System) {
  var routes = [];
  routes = routes.concat(require('./routes/search')(System));
  routes = routes.concat(require('./routes/settings')(System));

  routes.forEach(function(route) {
    var moduleRouter = express.Router();
    if (!route.authorized) {
      moduleRouter[route.method](route.path, System.auth.justGetUser, function(req, res) {
        setTimeout(function() {
          route.handler(req, res);
        }, System.config.REQUESTS_DELAY_SYSTEM);
      });
    } else {
      moduleRouter[route.method](route.path, System.auth.ensureAuthorized, function(req, res) {
        setTimeout(function() {
          route.handler(req, res);
        }, System.config.REQUESTS_DELAY_SYSTEM);
      });
    }
    app.use('/', moduleRouter);
  });
}

/**
 * Load system settings
 * @param  {Object} System The system object
 * @return {Void}
 */
function loadSettings(System, cb) {
  SystemSettings.find({}).exec(function(err, settings) {
    if (err) throw err;
    settings.map(function(setting) {
      System.settings[setting.name] = setting.value;
    });
    System.mailer = nodemailer.createTransport({
      service: Config.settings.email.service,
      auth: {
        user: System.settings.email,
        pass: System.settings.emailPassword
      }
    });
    cb();
  });
}

/**
 * Connect to the database
 * @return {Object} Returns the connection object
 */
var dbConnect = function() {
  var db = mongoose.connect(Config.db);
  return db;
};

/**
 * Connect to the database
 * @return {Object} Returns the connection object
 */
var loadPlugins = function(startingPath, System) {
  var helpersPath = startingPath + '/helpers';
  if (!fs.existsSync(helpersPath)) {
    return false;
  }
  var files = fs.readdirSync(helpersPath); //not allowing subfolders for now inside 'helpers' folder
  files.forEach(function(file) {
    if (path.extname(file) !== '.js') {
      return true;
    }
    var plugin = require(helpersPath + '/' + file)(System);
    System.plugins[plugin.register.attributes.key] = plugin.register();
    console.log('Loaded plugin: ' + file);
  });


  System.auth = System.plugins.auth;

  return true;
};


var loadDBModels = function(startingPath) {
  var modelsPath = startingPath + '/models';
  if (!fs.existsSync(modelsPath)) {
    return false;
  }
  var files = fs.readdirSync(modelsPath); //not allowing subfolders for now inside 'models' folder
  files.forEach(function(file) {
    require(modelsPath + '/' + file);
    console.log('Loaded model: ' + file);
  });
  return true;
};


var loadModules = function(System, callback) {
  var list = fs.readdirSync(modulePath);
  var requires = [];

  list.forEach(function(folder) {
    var serverPath = modulePath + '/' + folder + '/server';
    var publicPath = moduleURL + '/' + folder;


    app.use('/' + publicPath, express.static(publicPath + '/public', options));


    loadDBModels(serverPath);


    var moduleFile = serverPath + '/main.js';
    if (fs.existsSync(moduleFile)) {
      requires.push(require(moduleFile));
    }
  });

  requires.map(function(module) {
    module(System);
  });

  callback();
};


module.exports = {


  plugins: {},


  webSocket: io,


  settings: {},


  boot: function() {

    var $this = this;


    this.config = Config;

    dbConnect();


    loadPlugins(__dirname, this);


    loadModules($this, function() {
      loadSettings($this, function() {
        systemRoutes($this);
        startServer();
      });
    });
  },


  config: {},

  mailer: {},

  route: function(routes, moduleName) {
    var $this = this;

    moduleName = moduleName || 'unidentified';

    routes.forEach(function(route) {
      var moduleRouter = express.Router();
      if (!route.authorized) {
        moduleRouter[route.method](route.path, $this.auth.justGetUser, function(req, res) {
          setTimeout(function() {
            route.handler(req, res);
          }, $this.config.REQUESTS_DELAY);
        });
      } else {
        moduleRouter[route.method](route.path, $this.auth.ensureAuthorized, function(req, res) {
          setTimeout(function() {
            route.handler(req, res);
          }, $this.config.REQUESTS_DELAY);
        });
      }
      app.use('/' + moduleName, moduleRouter);
    });
  }

};