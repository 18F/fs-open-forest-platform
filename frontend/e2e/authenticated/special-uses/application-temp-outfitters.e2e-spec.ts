import { browser, element, by } from 'protractor';
import { loginPublic } from '../../support/auth-helper';
import { TempOutfittersForm } from './app.po';
import { FieldValidation } from './field-validation.po';
const path = require('path');

const testSuccessFile = path.resolve(__dirname, 'test-files/success.pdf');

const page = new TempOutfittersForm();
const fieldValidation = new FieldValidation();

describe('Apply for a temp outfitters permit', () => {
  beforeAll(() => {
    browser.driver.manage().deleteAllCookies();
    browser.driver.manage().window().setSize(1400, 900);

    page.navigateTo();

    loginPublic();
  });

  it('should display the permit name in the header', () => {
    page.navigateTo();
    expect<any>(element(by.css('app-root h2')).getText()).toEqual('Apply for a temporary outfitters permit with Open Forest.');
  });

  it('should not show errors by default', () => {
    expect<any>(element(by.id('form-errors')).isPresent()).toBeFalsy();
  });

  fieldValidation.validateFileUploadField('insurance-certificate', 'pdf', true);

  it('should display good standing evidence upload field and business name if organization is clicked', () => {
    element(by.id('organization-label')).click();
    expect<any>(element(by.id('good-standing-evidence-wrapper')).isPresent()).toBeTruthy();
    expect<any>(element(by.id('organization-name')).isPresent()).toBeTruthy();
  });

  it('should not submit application if not all required fields are entered', () => {
    element(by.id('good-standing-evidence')).sendKeys(testSuccessFile);
    element(by.css('.primary-permit-holder-first-name')).sendKeys('test');
    element(by.css('.primary-permit-holder-last-name')).sendKeys('test');
    element(by.id('organization-name')).sendKeys('test');
    element(by.css('.primary-permit-holder-address')).sendKeys('test');
    element(by.css('.primary-permit-holder-address-line-2')).sendKeys('test');
    element(by.css('.primary-permit-holder-city')).sendKeys('test');
    element(by.css('.primary-permit-holder-state')).sendKeys('AK');
    element(by.css('.primary-permit-holder-zip')).sendKeys('55555');
    element(by.id('day-phone')).sendKeys('2222222222');
    element(by.id('day-phone-ext')).sendKeys('2222');
    element(by.id('submit-application')).click();
    expect<any>(element(by.id('form-errors')).isPresent()).toBeTruthy();
  });

  it('should submit an application with only the required fields populated', () => {
    element(by.css('.primary-permit-holder-first-name')).sendKeys('test');
    element(by.css('.primary-permit-holder-last-name')).sendKeys('test');
    element(by.css('.primary-permit-holder-address')).sendKeys('test');
    element(by.css('.primary-permit-holder-city')).sendKeys('test');
    element(by.css('.primary-permit-holder-state')).sendKeys('AK');
    element(by.css('.primary-permit-holder-zip')).sendKeys('55555');
    element(by.id('day-phone')).sendKeys('2222222222');
    element(by.id('email')).sendKeys('test@test.com');
    element(by.id('email-confirmation')).sendKeys('test@test.com');
    element(by.id('number-of-trips')).sendKeys('10');
    element(by.id('party-size')).sendKeys('11');
    element(by.id('start-month')).sendKeys('10');
    element(by.id('start-day')).sendKeys('10');
    element(by.id('start-year')).sendKeys('2020');
    element(by.id('individual-label')).click();
    element(by.id('insurance-certificate')).sendKeys(testSuccessFile);
    element(by.id('good-standing-evidence')).sendKeys(testSuccessFile);
    element(by.id('location-description')).sendKeys('test');
    element(by.id('services-provided')).sendKeys('test');
    element(by.id('audience-description')).sendKeys('test');
    element(by.id('description-of-cleanup-and-restoration')).sendKeys('test');
    element(by.id('advertising-url')).sendKeys('http://test.com');
    element(by.id('client-charges')).sendKeys('test');
    element(by.id('signature')).sendKeys('test');
    element(by.id('submit-application')).click();

    /* TODO - remove when S3 is mocked correctly locally */
    element.all(by.buttonText('Retry uploading files.')).each(el => el.click());
    /*                                           */

    expect<any>(element(by.css('app-root h2')).getText()).toEqual('Submitted for review!');
  });

  it('should navigate back to temp outfitter', () => {
    page.navigateTo();
    expect<any>(element(by.css('app-root h2')).getText()).toEqual('Apply for a temporary outfitters permit with Open Forest.');
  });

  fieldValidation.validateFileUploadField('guide-document', 'xls');
  fieldValidation.validateFileUploadField('acknowledgement-of-risk-form', 'pdf');
  fieldValidation.validateFileUploadField('insurance-certificate', 'pdf');
  fieldValidation.validateFileUploadField('operating-plan', 'pdf');
  fieldValidation.validateFileUploadField('location-map', 'pdf');

  it('should submit an application', () => {
    element(by.css('.primary-permit-holder-first-name')).sendKeys('test');
    element(by.css('.primary-permit-holder-last-name')).sendKeys('test');
    element(by.css('.primary-permit-holder-address')).sendKeys('test');
    element(by.css('.primary-permit-holder-address-line-2')).sendKeys('test');
    element(by.css('.primary-permit-holder-city')).sendKeys('test');
    element(by.css('.primary-permit-holder-state')).sendKeys('AK');
    element(by.css('.primary-permit-holder-zip')).sendKeys('55555');
    element(by.id('day-phone')).sendKeys('2222222222');
    element(by.id('day-phone-ext')).sendKeys('2222');
    element(by.id('add-additional-phone-label')).click();
    element(by.id('evening-phone')).sendKeys('1111111111');
    element(by.id('evening-phone-ext')).sendKeys('1111');
    element(by.id('fax')).sendKeys('3333333333');
    element(by.id('fax-extension')).sendKeys('');
    element(by.id('email')).sendKeys('test@test.com');
    element(by.id('email-confirmation')).sendKeys('test@test.com');
    element(by.id('website')).sendKeys('http://test.com');
    element(by.id('llc-label')).click();
    element(by.id('individual-label')).click();
    element(by.id('individual-citizen-label')).click();
    element(by.id('small-business-label')).click();
    element(by.id('insurance-certificate')).sendKeys(testSuccessFile);
    element(by.id('good-standing-evidence')).sendKeys(testSuccessFile);
    element(by.id('insurance-certificate')).sendKeys(testSuccessFile);
    element(by.id('number-of-trips')).sendKeys('10');
    element(by.id('party-size')).sendKeys('11');
    element(by.id('start-month')).sendKeys('10');
    element(by.id('start-day')).sendKeys('10');
    element(by.id('start-year')).sendKeys('2020');
    element(by.id('location-description')).sendKeys('test');
    element(by.id('services-provided')).sendKeys('test');
    element(by.id('audience-description')).sendKeys('test');
    element(by.id('need-government-facilities-label')).click();
    element(by.id('list-of-government-facilities')).sendKeys('test');
    element(by.id('need-temporary-improvements-label')).click();
    element(by.id('list-of-temporary-improvements')).sendKeys('test');
    element(by.id('have-motorized-equipment-label')).click();
    element(by.id('statement-of-motorized-equipment')).sendKeys('test');
    element(by.id('have-livestock-label')).click();
    element(by.id('statement-of-transportation-of-livestock')).sendKeys('test');
    element(by.id('need-assigned-site-label')).click();
    element(by.id('statement-of-assigned-site')).sendKeys('test');
    element(by.id('description-of-cleanup-and-restoration')).sendKeys('test');
    element(by.id('no-promotional-website-label')).click();
    element(by.id('advertising-description')).sendKeys('test');
    element(by.id('client-charges')).sendKeys('test');
    element(by.id('have-national-forest-permits-label')).click();
    element(by.id('list-all-national-forest-permits')).sendKeys('test');
    element(by.id('have-other-permits-label')).click();
    element(by.id('list-all-other-permits')).sendKeys('test');
    element(by.id('have-citations-label')).click();
    element(by.id('list-all-citations')).sendKeys('test');
    element(by.id('signature')).sendKeys('test');
    element(by.id('submit-application')).click();

    /* TODO - remove when S3 is mocked correctly locally */
    element.all(by.buttonText('Retry uploading files.')).each(el => el.click());
    /*                                           */

    expect<any>(element(by.css('app-root h2')).getText()).toEqual('Submitted for review!');
  });
});
