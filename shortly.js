var express      = require('express');
var partials     = require('express-partials');
var bodyParser   = require('body-parser');
var cookieParser = require('cookie-parser')

// SQLite Session Store
var session     = require('express-session');
var SQLiteStore = require('connect-sqlite3')(session);

// Routes
var index    = require('./routes/index');
var signup   = require('./routes/signup');
var login    = require('./routes/login');
var logout   = require('./routes/logout');
var links    = require('./routes/links');
var create   = require('./routes/create');

var app = express();
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));

// Session Store
app.use(cookieParser("6B5AB77062FE3D565FBF7A253AD99BEC"));
app.use(session({
  store: new SQLiteStore({dir: 'db'}),
  secret: '2E0D558EBAE31E93BC4C92FCDDBE3F6F',
  dir: "db"
}));

// Routes
app.use('/signup', signup);
app.use('/login', login);
app.use('/logout', logout);
app.use('/links', links);
app.use('/create', create);
app.use('/', index);

console.log('Shortly is listening on 4568');
app.listen(4568);
