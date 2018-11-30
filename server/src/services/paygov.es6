'use strict';

/**
 * pay.gov utility
 * @module services/paygov
 */
const jwt = require('jsonwebtoken');
const xml = require('xml');
const logger = require('./logger.es6');
const vcapConstants = require('../vcap-constants.es6');

const paygov = {};

/**
 * @function createSuccessUrl - create success url for paygov request
 * @param {string} forestAbbr - forest abbreviation
 * @param {string} permitId - permit id
 * @return {string} - jwt signed token
 */
paygov.createToken = (permitId) => {
  const claims = {
    issuer: 'trees-permit-api',
    subject: 'christmas tree permit orders',
    audience: 'fs-trees-permit-api-users'
  };
  return jwt.sign(
    {
      data: permitId
    },
    vcapConstants.PERMIT_SECRET,
    claims
  );
};

/**
 * @function createReturnUrl - create success url for paygov request
 * @param {string} forestAbbr - forest abbreviation
 * @param {string} permitId - permit id
 * @param {string} cancel - whether you want to create a cancel url
 * @return {string} - success URL for payGov
 */
paygov.createReturnUrl = (forestAbbr, permitId, cancel) => {
  const token = paygov.createToken(permitId);
  let cancelCondition = '';
  if(cancel){
    cancelCondition = 'cancel=true&';
  }
  return `${
    vcapConstants.INTAKE_CLIENT_BASE_URL
  }/christmas-trees/forests/${forestAbbr}/applications/permits/${permitId}?${cancelCondition}t=${token}`;
};

/**
 * @function getXmlForToken - Generate XML from the template to use for getting pay.gov transaction token.
 * @param {string} forestAbbr - forest abbreviation
 * @param {string} possFinancialId - forest's financial id
 * @param {Object} permit - permit object from database
 * @return {string} - XML for payGov startOnlineCollection request
 */
paygov.getXmlForToken = (forestAbbr, possFinancialId, permit) => {
  
  const tcsAppID = vcapConstants.PAY_GOV_APP_ID;
  const urlSuccess = paygov.createSuccessUrl(forestAbbr, permit.permitId, false);
  const urlCancel = paygov.createCancelUrl(forestAbbr, permit.permitId, true);

  const xmlTemplate = [
    {
      'soap:Envelope': [
        {
          _attr: {
            'xmlns:soap': 'http://schemas.xmlsoap.org/soap/envelope/'
          }
        },
        {
          'soap:Body': [
            {
              'ns2:startOnlineCollection': [
                {
                  _attr: {
                    'xmlns:ns2': 'http://fms.treas.gov/services/tcsonline'
                  }
                },
                {
                  startOnlineCollectionRequest: [
                    {
                      tcs_app_id: tcsAppID
                    },
                    {
                      agency_tracking_id: permit.permitNumber
                    },
                    {
                      transaction_type: 'Sale'
                    },
                    {
                      transaction_amount: permit.totalCost
                    },
                    {
                      language: 'EN'
                    },
                    {
                      url_success: urlSuccess
                    },
                    {
                      url_cancel: urlCancel
                    },
                    {
                      account_holder_name: permit.firstName + ' ' + permit.lastName
                    },
                    {
                      custom_fields: [
                        {
                          custom_field_1: possFinancialId
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  ];

  return xml(xmlTemplate);
};

/**
 * @function getXmlToCompleteTransaction - Generate XML from the template to use for completing pay.gov transaction.
 * @param {string} paygovToken - payGov token
 * @return {string} - XML for payGov completeOnlineCollection request
 */
paygov.getXmlToCompleteTransaction = paygovToken => {
  const xmlTemplate = [
    {
      'soap:Envelope': [
        {
          _attr: {
            'xmlns:soap': 'http://schemas.xmlsoap.org/soap/envelope/'
          }
        },
        {
          'soap:Header': []
        },
        {
          'soap:Body': [
            {
              'ns2:completeOnlineCollection': [
                {
                  _attr: {
                    'xmlns:ns2': 'http://fms.treas.gov/services/tcsonline'
                  }
                },
                {
                  completeOnlineCollectionRequest: [
                    {
                      tcs_app_id: vcapConstants.PAY_GOV_APP_ID
                    },
                    {
                      token: paygovToken
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  ];
  return xml(xmlTemplate);
};

/**
 * @function getToken - Get token out of the paygov response XML
 * @param {Object} result - payGov result for startOnlineCollection
 * @return {string} - paygov token
 */
paygov.getToken = result => {
  const startOnlineCollectionResponse =
    result['S:Envelope']['S:Body'][0]['ns2:startOnlineCollectionResponse'][0]['startOnlineCollectionResponse'][0];
  return startOnlineCollectionResponse.token[0];
};

/**
 * @function getResponseError - Get error out of the paygov response XML
 * @param {string} requestType - type of paygov request: startOnlineCollection/completeOnlineCollection
 * @param {Object} result - response error object
 */
paygov.getResponseError = (requestType, result) => {
  let resultMesssage = { faultcode: '9999', faultstring: requestType };
  try {
    let faultMesssage = result['soapenv:Envelope']['soapenv:Body'][0]['soapenv:Fault'][0];
    resultMesssage.faultcode = faultMesssage.faultcode;
    resultMesssage.faultstring = faultMesssage.faultstring;

    if (faultMesssage && faultMesssage['detail'][0]['TCSServiceFault'][0]) {
      resultMesssage.faultcode = faultMesssage['detail'][0]['TCSServiceFault'][0].return_code;
      resultMesssage.faultstring = faultMesssage['detail'][0]['TCSServiceFault'][0].return_detail;
    }
  } catch (e) {
    logger.error('paygov error while parsing error response=', e);
    // return the default error messages
  } finally {
    return {
      errorCode: resultMesssage.faultcode,
      errorMessage: resultMesssage.faultstring
    };
  }
};

/**
 * @function getTrackingId - Get paygov tracking id out of the paygov response XML
 * @param {Object} result - result from paygov request for completeOnlineCollection
 * @return {string} - paygov tracking id 
 */
paygov.getTrackingId = result => {
  return new Promise((resolve, reject) => {
    const completeOnlineCollectionResponse =
      result['S:Envelope']['S:Body'][0]['ns2:completeOnlineCollectionResponse'][0]['completeOnlineCollectionResponse'][0];
    if (typeof (completeOnlineCollectionResponse) == 'undefined') {
      reject();
    }
    resolve(completeOnlineCollectionResponse.paygov_tracking_id[0]);
  });
};

module.exports = paygov;
