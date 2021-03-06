/* eslint no-param-reassign: ["error", { "props": false }] */

/**
 * svg utility service for christmas trees
 * @module services/christmas-trees-permit-svg-util
 */

const jsdom = require('jsdom');

const {
  JSDOM
} = jsdom;
const moment = require('moment-timezone');
const fs = require('fs-extra');
const svg2png = require('svg2png');
const zpad = require('zpad');
const marked = require('marked');
const vcapConstants = require('../vcap-constants.es6');

const christmasTreesPermitSvgUtil = {};
const logger = require('./logger.es6');

/**
 * @function addApplicantInfo - Add applicatnt information to the SVG fragment
 * @param {Object} permit - permit object from database
 * @param {Object} fragment - jsdom fragment
 */
const addApplicantInfo = (permit, frag) => {
  frag.querySelector('#permit-id_1_').textContent = zpad(permit.permitNumber, 8);

  frag.querySelector('#issue-date_1_').textContent = moment
    .tz(permit.createdAt, permit.christmasTreesForest.timezone)
    .format('MMM DD, YYYY')
    .toUpperCase();

  frag.querySelector('#full-name_1_').textContent = `${permit.firstName
    .substring(0, 18)
    .toUpperCase()} ${permit.lastName.substring(0, 18).toUpperCase()}`;

  frag.querySelector('#quantity_1_').textContent = permit.quantity;

  // set additional trees to blank so that user can fill them in
  for (let i = 1; i < permit.quantity; i += 1) {
    let querySelector = `#additional-tree-${i}-${1}`;
    frag.querySelector(querySelector).style = 'display:none';
    querySelector = `#additional-tree-${i}-${2}`;
    frag.querySelector(querySelector).style = 'display:none';
  }
};

/**
 * @function addForestSpecificInfo - Add forest specific information to the SVG fragment
 * @param {Object} permit - permit object from database
 * @param {Object} fragment - jsdom fragment
 */
const addForestSpecificInfo = (permit, frag) => {
  frag.querySelector('#forest-name_1_').textContent = permit.christmasTreesForest.forestNameShort.toUpperCase();
  if (permit.christmasTreesForest.forestNameShort.indexOf(' and ') > 0) {
    frag.querySelector('#national-forest_1_').textContent = 'NATIONAL FORESTS';
  } else {
    frag.querySelector('#national-forest_1_').textContent = 'NATIONAL FOREST';
  }
  frag.querySelector('#permit-year-vertical_1_').textContent = permit.christmasTreesForest.startDate.getFullYear();

  frag.querySelector('#permit-expiration_1_').textContent = `${moment
    .tz(permit.christmasTreesForest.endDate, permit.christmasTreesForest.timezone)
    .format('MMM D, YYYY')
    .toUpperCase()} MIDNIGHT`;
  if (permit.christmasTreesForest.treeHeight > 0) {
    frag.querySelector('#tree-height_1_').textContent = permit.christmasTreesForest.treeHeight;
  } else {
    frag.querySelector('#tree-height_1_').textContent = 'N/A';
    frag.querySelector('#tree-height-feet_1_').textContent = '';
  }
  if (permit.christmasTreesForest.stumpHeight > 0) {
    frag.querySelector('#stump-height_1_').textContent = permit.christmasTreesForest.stumpHeight;
  } else {
    frag.querySelector('#stump-height_1_').textContent = 'N/A';
    frag.querySelector('#stump-height-inches_1_').textContent = '';
    frag.querySelector('#stump-height-or-less_1_').textContent = '';
  }
  if (permit.christmasTreesForest.stumpDiameter > 0) {
    frag.querySelector('#stump-diameter_1_').textContent = permit.christmasTreesForest.stumpDiameter;
  } else {
    frag.querySelector('#stump-diameter_1_').textContent = 'N/A';
    frag.querySelector('#stump-diameter-inches_1_').textContent = '';
  }
};

/**
 * @function generatePermitSvg - Generate Permit SVG from the permit data object
 * @param {Object} permit - permit object from database
 * @return {Object} jsdom fragment with svg buffer
 */
christmasTreesPermitSvgUtil.generatePermitSvg = permit => new Promise((resolve, reject) => {
  fs.readFile('src/templates/christmas-trees/permit-design.svg', (err, svgData) => {
    if (err) {
      logger.error('problem creating permit svg=', err);
      reject(err);
    }

    const frag = JSDOM.fragment(svgData.toString('utf8'));
    addApplicantInfo(permit, frag);
    addForestSpecificInfo(permit, frag);

    if (frag && frag.firstChild && frag.firstChild.outerHTML) {
      resolve(frag.firstChild.outerHTML);
    } else {
      logger.error('problem creating permit svg=', err);
      reject(err);
    }
  });
});

/**
 * @function generatePng - Generate Permit PNG from the permit SVG buffer
 * @param {Object} svgBuffer - permit svg Buffer
 * @return {Object} - png buffer for the svg
 */
christmasTreesPermitSvgUtil.generatePng = svgBuffer => new Promise((resolve) => {
  svg2png(svgBuffer, {
    width: 740,
    height: 958
  })
    .then((data) => {
      resolve(data);
    })
    .catch((err) => {
      logger.error(err);
    });
});

/**
 * @function generateRulesHtml - Generate permit rules HTML from permit object
 * @param {boolean} createHtmlBody - wrap rules into html body
 * @param {Object} permit - permit object
 * @return {string} - permit rules in html format
 */
christmasTreesPermitSvgUtil.generateRulesHtml = (createHtmlBody, permit) => new Promise((resolve, reject) => {
  const rulesMarkdown = christmasTreesPermitSvgUtil.getRulesMarkdown(permit.christmasTreesForest.forestAbbr);
  if (rulesMarkdown) {
    let rulesHtml = marked(rulesMarkdown);
    rulesHtml = christmasTreesPermitSvgUtil.processRulesText(rulesHtml, permit);
    resolve(
      christmasTreesPermitSvgUtil.createRulesHtmlPage(createHtmlBody, rulesHtml, permit.christmasTreesForest)
    );
  } else {
    logger.error(`problem creating rules html for permit ${permit.permitId}`);
    reject(new Error(`problem reading rules markdown files in ${permit.permitId}`));
  }
});

/**
 * @function getRulesMarkdown - Get the rules markdown files for the given forest
 * @param {string} forestAbbr - forest abbreviation
 * @return {string} - rules from markdown files
 */
christmasTreesPermitSvgUtil.getRulesMarkdown = (forestAbbr) => {
  const permitRules = fs.readFileSync('frontend-assets/content/common/permit-rules.md');
  const forestRules = fs.readFileSync(`frontend-assets/content/${forestAbbr}/tree-cutting-rules.md`);
  if (permitRules && forestRules) {
    return `${permitRules}\n${forestRules}`;
  }
  return null;
};

/**
 * @function createRulesHtmlPage - Generate HTML wrapper aroung the permit rules HTML content
 * @param {string} createHtmlBody - wrap rules into html body
 * @param {string} rules - permit rules text
 * @param {string} forest - forest object from database
 * @return {string} - formatted rules html
 */
christmasTreesPermitSvgUtil.createRulesHtmlPage = (createHtmlBody, rules, forest) => {
  let rulesHtml = '';
  if (createHtmlBody) {
    rulesHtml = '<html lang="en"><head><title="U.S. National Forest Christmas Tree Permitting - Rules"></title></head>'
      + '<body style="font-family:Arial; margin:20px;">';
  }
  rulesHtml
    += '<div>'
    + '<h1 style="background-color:#000; text-align:center; padding:8px;">'
    + '<span style="color:#FFF; font-size: 36px;">CHRISTMAS TREE CUTTING RULES</span></h1>';

  rulesHtml
    += `<h2><img alt="Department of Agriculture - US Forest Service" class="fs-logo" role="img" src="${
      vcapConstants.INTAKE_CLIENT_BASE_URL
    }/assets/img/site-wide/usfslogo.svg" width="50" style="vertical-align: middle;padding-right: 1rem;">${
      forest.forestName.toUpperCase()
    }</h2><br/>`;
  rulesHtml
    += `Christmas trees may be taken from the ${
      forest.forestName
    } under the below rules and guidelines. Failure to follow these rules and guidelines may result in a fine<br/><br/>`;
  const regex = new RegExp('"/assets/', 'g');
  const rulesWithUrl = rules.replace(regex, `"${vcapConstants.INTAKE_CLIENT_BASE_URL}/assets/`);

  const rulesWithMiddleAlign = rulesWithUrl.replace(
    'alt="rules icon"',
    'alt="rules icon" style="width: 50px; vertical-align: middle; padding-right: 1rem;"'
  );
  rulesHtml += `${rulesWithMiddleAlign}</div>`;
  if (createHtmlBody) {
    rulesHtml += '</body></html>';
  }
  return rulesHtml;
};

/**
 * @function processRulesText - Parse and update rules HTML with forest specific keys
 * @param {string} rulesHtml - permit rules in html format
 * @param {Object} permit - permit object from database
 * @return {string} - processed rules html
 */
christmasTreesPermitSvgUtil.processRulesText = (rulesHtml, permit) => {
  const forest = permit.christmasTreesForest.dataValues;
  let cuttingAreas = {};
  let textWithReplacements = rulesHtml;
  if (forest && forest.cuttingAreas) {
    cuttingAreas = forest.cuttingAreas;
    for (const cuttingArea in cuttingAreas) {
      if (Object.prototype.hasOwnProperty.call(cuttingAreas, cuttingArea)) {
        forest[`${cuttingArea}Date`] = christmasTreesPermitSvgUtil.formatCuttingAreaDate(
          forest.timezone, cuttingAreas[cuttingArea].startDate, cuttingAreas[cuttingArea].endDate
        );
      }
    }
  }
  for (const key in forest) {
    if (Object.prototype.hasOwnProperty.call(forest, key)) {
      textWithReplacements = textWithReplacements.replace(`{{${key}}}`, forest[key]);
    }
  }
  return textWithReplacements;
};

/**
 * @function parseCuttingAreaDates - Parse and update rules HTML with forest cutting area keys
 * @param {string} rulesText - rules text
 * @param {string} forest - forest object from database
 * @return {string} - processed rules
 */
christmasTreesPermitSvgUtil.parseCuttingAreaDates = (rulesText, forest) => {
  const cuttingAreaKeys = ['ELKCREEK', 'REDFEATHERLAKES', 'SULPHUR', 'CANYONLAKES'];
  let rulesTextWithDate = rulesText;
  for (const key of cuttingAreaKeys) {
    const areaKey = key.toUpperCase();
    const cuttingAreas = forest.cuttingAreas;
    if (cuttingAreas && cuttingAreas[areaKey] && cuttingAreas[areaKey].startDate) {
      rulesTextWithDate = rulesText.replace(
        `{{${key}Date}}`,
        christmasTreesPermitSvgUtil.formatCuttingAreaDate(
          forest.timezone,
          cuttingAreas[areaKey].startDate,
          cuttingAreas[areaKey].endDate
        )
      );
    }
  }
  return rulesTextWithDate;
};

/**
 * @function formatCuttingAreaDate - Format cutting area start and end dates in the rules HTML
 * @param {string} forestTimezone - forest's timezone
 * @param {string} startDate - forest season start date
 * @param {string} endDate - forest season end date
 * @return {string} - formatted date with start and end dates
 */
christmasTreesPermitSvgUtil.formatCuttingAreaDate = (forestTimezone, startDate, endDate) => {
  const start = moment(startDate).tz(forestTimezone);
  const end = moment(endDate).tz(forestTimezone);
  let startFormat = 'MMM. D -';
  let endFormat = ' D, YYYY';

  if (start.month() !== end.month()) {
    endFormat = ' MMM. D, YYYY';
  }
  if (start.year() !== end.year()) {
    startFormat = 'MMM. D, YYYY - ';
  }
  return start.format(startFormat) + end.format(endFormat);
};

module.exports = christmasTreesPermitSvgUtil;
