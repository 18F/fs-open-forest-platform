'use strict';

/**
 * Module for FS Intake API Server
 * @module app
 */

const bodyParser = require('body-parser');
const express = require('express');
const helmet = require('helmet');
const session = require('cookie-session');
const moment = require('moment');

const passportConfig = require('./auth/passport-config.es6');
const router = require('./routers/router.es6');
const util = require('./services/util.es6');
const vcapConstants = require('./vcap-constants.es6');
const payGovMocks = require('./mocks/pay-gov-mocks.es6');
const loginGovMocks = require('./mocks/login-gov-mocks.es6');
require('body-parser-xml')(bodyParser);
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./docs/swagger.json');
const logger = require('winston');
logger.remove(logger.transports.Console);
logger.add(logger.transports.Console, {json:true, colorize: true });
const expressWinston = require('express-winston');

// Create the express application.
const app = express();

vcapConstants.nodeEnv = process.env.NODE_ENV;

/** Use helmet for increased security. */
app.use(helmet());

/** Body parsers are necessary for restful JSON and passport. */
app.use(
  bodyParser.urlencoded({
    extended: false
  })
);
app.use(bodyParser.json());
app.use(bodyParser.xml());

/** Logging middlelayer */
if (logger.levels[logger.level] >= 2) {
  app.use(expressWinston.logger({
    transports: [
      new logger.transports.Console({ json:true, colorize: true })
    ],
    requestWhitelist: expressWinston.requestWhitelist.concat('body')
  }));
}

app.use(expressWinston.errorLogger({
  transports: [
    new logger.transports.Console({ json: true, colorize: true })
  ]
}));

/**  Cookies for session management. Passport needs cookies, otherwise we'd be using JWTs. */
app.use(
  session({
    name: 'session',
    keys: [util.getRandomString(32), util.getRandomString(32)],
    cookie: {
      secure: true,
      httpOnly: true,
      domain: vcapConstants.BASE_URL,
      expires: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
    }
  })
);

/** set meridiem format to a.m. and p.m. */
moment.updateLocale('en', {
  meridiem(hour, minute, isLowerCase) {
    return hour < 12 ? 'a.m.' : 'p.m.';
  }
});
/** Configure passport for login.gov and eAuth. */
passportConfig.setup(app);

/** Pay.gov mock route */
if (util.isLocalOrCI()) {
  app.use(payGovMocks.router);
}
app.use(loginGovMocks.router);

/** serve up docs api */
app.use('/docs/api', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

/** Add the routes. */
app.use(router);

/** Listen on port. */
app.listen(process.env.PORT || 8080, () => {
  logger.info('Express server initiated');
});

module.exports = app;
