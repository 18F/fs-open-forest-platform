import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EmailComponent } from './email.component';
import { alphanumericValidator } from '../validators/alphanumeric-validation';
import { ApplicationFieldsService } from '../_services/application-fields.service';
import { TestService } from '../../_services/test.service';

describe('Email Component', () => {
  let component: EmailComponent;
  let fixture: ComponentFixture<EmailComponent>;
  let formBuilder: FormBuilder;
  let testService: TestService;

  beforeEach(
    async(() => {
      testService = new TestService();
      testService.configureTestingModule([EmailComponent], [FormBuilder, ApplicationFieldsService]);
      formBuilder = new FormBuilder();
      fixture = TestBed.createComponent(EmailComponent);
      component = fixture.debugElement.componentInstance;
      component.applicantInfo = formBuilder.group({
        emailAddress: ['', [Validators.required, Validators.email, alphanumericValidator()]]
      });
      fixture.detectChanges();
    })
  );

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should be valid', () => {
    const field = component.applicantInfo.controls.emailAddress;
    field.markAsTouched();
    expect(field.valid).toBeFalsy();
    field.setValue('test');
    expect(field.valid).toBeFalsy();
    field.setValue('test@test.com');
    expect(field.valid).toBeTruthy();
  });
});
