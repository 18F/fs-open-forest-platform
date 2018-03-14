import { async, ComponentFixture, TestBed, inject } from '@angular/core/testing';

import { TreePermitViewComponent } from './tree-permit-view.component';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { RouterTestingModule } from '@angular/router/testing';
import { ChristmasTreesApplicationService } from '../../../trees/_services/christmas-trees-application.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import * as sinon from 'sinon';
import { UtilService } from '../../../_services/util.service';
import { WindowRef } from '../../../_services/native-window.service';
import { McBreadcrumbsService, McBreadcrumbsModule, McBreadcrumbsConfig } from 'ngx-breadcrumbs';
import { BreadcrumbsComponent } from '../../../breadcrumbs/breadcrumbs.component';
import { DomSanitizer } from '@angular/platform-browser';
import { MockSanitizer } from '../../../_mocks/domSanitizer.mock';

class MockWindowRef {
  location = { hash: 'WAOW-MOCK-HASH' };
  getNativeWindow() {
    return {
      open() {
        return { document: { open() {}, write() {}, close() {} } };
      }
    };
  }
}

class MockChristmasTreesApplicationService {
  create(): Observable<{}> {
    return Observable.throw('error');
  }
  cancelOldApp(permitId): Observable<{}> {
    return Observable.of({ success: 'success' });
  }
  getPrintablePermit(permitId, includeRules): Observable<{}> {
    return Observable.of([{'result': '<h1>test</h1>'}, {'result': '<h2>test</h2>'}]);
  }
}

describe('TreePermitViewComponent', () => {
  let component: TreePermitViewComponent;
  let fixture: ComponentFixture<TreePermitViewComponent>;
  const mockActivatedRoute = {
    data: Observable.of({
      permit: {
        permitId: '123',
        totalCost: 0,
        quantity: 0,
        emailAddress: '',
        forest: { forestName: 'Mt Hood', forestAbbr: 'mthood' }
      }
    })
  };

describe ('', () => {  beforeEach(
    async(() => {
      TestBed.configureTestingModule({
        imports: [RouterTestingModule, McBreadcrumbsModule, HttpClientTestingModule],
        declarations: [TreePermitViewComponent, BreadcrumbsComponent ],
        providers: [
          McBreadcrumbsService,
          McBreadcrumbsConfig,
          UtilService,
          { provide: ChristmasTreesApplicationService, useClass: MockChristmasTreesApplicationService },
          { provide: WindowRef, useClass: MockWindowRef },
          { provide: DomSanitizer, useClass: MockSanitizer }
]

      }).compileComponents();
    })
  );

    beforeEach(() => {
      TestBed.overrideProvider(ActivatedRoute, { useValue: mockActivatedRoute });
      fixture = TestBed.createComponent(TreePermitViewComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should set forest on init', () => {
      expect(component.forest.forestName).toEqual('Mt Hood');
    });

    it('should set permit on init', () => {
      expect(component.permit.permitId).toEqual('123');
    });

    it('should process error', () => {
      component.processError([{ error: 'test' }]);
      expect(component.error).toEqual([{ error: 'test' }]);
    });
  });

  describe ('', () => {
    beforeEach(
      async(() => {
        TestBed.configureTestingModule({
          imports: [RouterTestingModule, McBreadcrumbsModule, HttpClientTestingModule],
          declarations: [TreePermitViewComponent, BreadcrumbsComponent ],
          providers: [
            McBreadcrumbsService,
            McBreadcrumbsConfig,
            UtilService,
            { provide: ChristmasTreesApplicationService, useClass: MockChristmasTreesApplicationService },
            { provide: WindowRef, useClass: MockWindowRef },
            { provide: DomSanitizer, useClass: MockSanitizer }

          ]
        }).compileComponents();
      })
    );
    beforeEach(() => {
      TestBed.overrideProvider(ActivatedRoute, {useValue: mockActivatedRoute});
      fixture = TestBed.createComponent(TreePermitViewComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should open a popup window when print permit is clicked', () => {
      component.includeRules = false;
      component.printPermit();
      expect(component.image).not.toBeNull();
      expect(component.image).toEqual('<h1>test</h1>');
    });

    it('should include the rules if checkbox is selected', () => {
      component.includeRules = true;
      component.printPermit();
      expect(component.image).not.toBeNull();
      expect(component.image).toEqual('<h1>test</h1><h2>test</h2>');
    });
  });
});
