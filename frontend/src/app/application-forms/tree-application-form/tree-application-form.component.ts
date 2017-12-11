import { Title } from '@angular/platform-browser';
import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { alphanumericValidator } from '../validators/alphanumeric-validation';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { currencyValidator } from '../validators/currency-validation';
import { lessThanOrEqualValidator } from '../validators/less-than-or-equal-validation';
import { TreesService } from '../../trees/_services/trees.service';
import { ApplicationFieldsService } from '../_services/application-fields.service';
import { ChristmasTreesApplicationService } from '../../trees/_services/christmasTreesApplication.service';

@Component({
  selector: 'app-tree-application-form',
  templateUrl: './tree-application-form.component.html'
})
export class TreeApplicationFormComponent implements OnInit {
  forest: any;
  submitted = false;
  application: any;
  applicationForm: FormGroup;
  maxNumberOfTrees: number;
  quantityLength: number;
  costPerTree: number;
  apiErrors: any;

  constructor(
    private route: ActivatedRoute,
    private titleService: Title,
    public formBuilder: FormBuilder,
    public applicationService: ChristmasTreesApplicationService,
    public applicationFieldsService: ApplicationFieldsService,
    private treesService: TreesService
  ) {
    this.applicationForm = this.formBuilder.group({
      forestId: ['', [Validators.required]],
      orgStructureCode: ['', [Validators.required]],
      treeCost: [''],
      firstName: ['', [Validators.required, alphanumericValidator(), Validators.maxLength(255)]],
      lastName: ['', [Validators.required, alphanumericValidator(), Validators.maxLength(255)]],
      emailAddress: ['', [Validators.required, Validators.email, alphanumericValidator(), Validators.maxLength(255)]],
      quantity: ['', [Validators.required]],
      totalCost: [0, [Validators.required, currencyValidator()]]
    });
    this.applicationForm.get('quantity').valueChanges.subscribe(value => {
      this.applicationForm
        .get('quantity')
        .setValidators([Validators.required, lessThanOrEqualValidator(this.maxNumberOfTrees)]);
      this.updateTotalCost();
    });
  }

  ngOnInit() {
    this.route.data.subscribe(data => {
      this.forest = data.forest;
      this.titleService.setTitle(
        'Apply for a permit in ' +
          data.forest.forestName +
          ' National Forest | U.S. Forest Service Christmas Tree Permitting'
      );
      this.applicationForm.get('forestId').setValue(data.forest.id);
      this.applicationForm.get('orgStructureCode').setValue(data.forest.orgStructureCode);
      this.costPerTree = data.forest.treeCost;
      this.applicationForm.get('treeCost').setValue(this.costPerTree);
      this.maxNumberOfTrees = data.forest.maxNumTrees;
      if (this.maxNumberOfTrees) {
        this.quantityLength = this.maxNumberOfTrees.toString().length;
      }
    });
  }
  onSubmit() {
    this.submitted = true;
    this.applicationFieldsService.touchAllFields(this.applicationForm);
    if (this.applicationForm.valid) {
      this.createApplication();
    } else {
      this.applicationFieldsService.scrollToFirstError();
    }
  }

  createApplication() {
    this.applicationService.create(JSON.stringify(this.applicationForm.value) ).subscribe(
      response => {
        window.location.href = `${response.payGovUrl}?token=${response.token}&tcsAppID=${response.tcsAppID}`;
      },
      (e: any) => {
        this.apiErrors = e;
        window.scroll(0, 0);
      }
    );
  }

  updateTotalCost() {
    const quantity = this.applicationForm.get('quantity').value;
    if (!isNaN(parseInt(quantity, 10))) {
      this.applicationForm.get('totalCost').setValue(parseInt(quantity, 10) * this.costPerTree);
    } else {
      this.applicationForm.get('totalCost').setValue(0);
    }
  }
}