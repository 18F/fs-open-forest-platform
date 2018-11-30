'use strict';

/**
 * Module for logging
 * @module services/logger
 */

const winston = require('winston');


//winston.remove(winston.transports.Console);
const logger = winston.createLogger({
  transports: [
    new winston.transports.Console(),
  ],
  format: winston.format.simple(),
});


module.exports = logger;
