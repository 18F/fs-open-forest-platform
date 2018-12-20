

/**
 * Module for login.gov integration
 * @module auth/login-gov
 */

const express = require('express');
const Issuer = require('openid-client').Issuer;
const jose = require('node-jose');
const passport = require('passport');
const { Strategy } = require('openid-client');
const url = require('url');
const util = require('../services/util.es6');
const vcapConstants = require('../vcap-constants.es6');
const logger = require('../services/logger.es6');

const loginGov = {};

// Basic auth is needed for the int version of login.gov.
const basicAuthOptions = {};
if (vcapConstants.LOGIN_GOV_IDP_USERNAME && vcapConstants.LOGIN_GOV_IDP_PASSWORD) {
  basicAuthOptions.headers = {
    Host: url.parse(vcapConstants.LOGIN_GOV_BASE_URL).hostname,
    Authorization: `Basic ${
      Buffer.from(`${vcapConstants.LOGIN_GOV_IDP_USERNAME}:${vcapConstants.LOGIN_GOV_IDP_PASSWORD}`).toString('base64')}`
  };
}

// Settings for the passport OpenIDConnectStrategy.
loginGov.params = {
  acr_values: 'http://idmanagement.gov/ns/assurance/loa/1',
  nonce: util.getRandomString(32),
  prompt: 'select_account',
  redirect_uri: `${vcapConstants.BASE_URL}/auth/login-gov/openid/callback`,
  response_type: 'code',
  scope: 'openid email',
  state: util.getRandomString(32)
};

/**
 * @function setup - Setup the passport OpenIDConnectStrategy.
 */
loginGov.setup = () => {
  logger.info('AUTHENTICATION: Login.gov passport.js middlelayer OpenIDConnectStrategy initiated.');
  Issuer.defaultHttpOptions = basicAuthOptions;
  // issuer discovery
  Issuer.discover(`${vcapConstants.LOGIN_GOV_BASE_URL}.well-known/openid-configuration`)
    .then((loginGovIssuer) => {
      loginGov.issuer = loginGovIssuer;
      const keys = {
        keys: [vcapConstants.LOGIN_GOV_JWK]
      };
      // a joseKeystore is required by openid-client
      jose.JWK.asKeyStore(keys).then((joseKeystore) => {
        const client = new loginGovIssuer.Client({
          client_id: vcapConstants.LOGIN_GOV_ISSUER,
          token_endpoint_auth_method: 'private_key_jwt',
          id_token_signed_response_alg: 'RS256'
        },
        joseKeystore);
        // instantiate the passport strategy
        passport.use(
          'oidc',
          new Strategy({
            client,
            params: loginGov.params
          }, (tokenset, done) => {
            logger.info(`AUTHENTICATION: Login.gov user ${tokenset.claims.email} logged in.`);
            return done(null, {
              email: tokenset.claims.email,
              role: 'user',
              // the token is required to logout of login.gov
              token: tokenset.id_token
            });
          })
        );
      });
    })
    .catch((e) => {
      logger.error(`ERROR: ServerError: AUTHENTICATION- ${e}`);
      throw new Error(e);
    });
};

// router for login.gov specific endpoints
loginGov.router = express.Router();

// Initiate authentication via login.gov.
loginGov.router.get('/auth/login-gov/openid/login', passport.authenticate('oidc'));

// Initiate logging out of login.gov
loginGov.router.get('/auth/login-gov/openid/logout', (req, res) => {
  // destroy the session
  req.logout();
  // res.redirect doesn't pass the Blink's Content Security Policy directive
  return res.send(`<script>window.location = '${vcapConstants.INTAKE_CLIENT_BASE_URL}'</script>`);
});

// Callback from login.gov.
loginGov.router.get(
  '/auth/login-gov/openid/callback',
  // the failureRedirect is used for a return to app link on login.gov, it's not actually an error in this case
  passport.authenticate('oidc', {
    failureRedirect: vcapConstants.INTAKE_CLIENT_BASE_URL
  }), (req, res) => res.send(`<script>window.location = '${vcapConstants.INTAKE_CLIENT_BASE_URL}/logged-in'</script>`)

);

module.exports = loginGov;
