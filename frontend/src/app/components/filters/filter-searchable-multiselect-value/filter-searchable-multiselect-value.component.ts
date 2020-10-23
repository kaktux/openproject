
import {HalResource} from 'core-app/modules/hal/resources/hal-resource';
import {QueryFilterInstanceResource} from 'core-app/modules/hal/resources/query-filter-instance-resource';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';
import {I18nService} from 'core-app/modules/common/i18n/i18n.service';
import {AngularTrackingHelpers} from 'core-components/angular/tracking-functions';
import {HalResourceService} from 'core-app/modules/hal/services/hal-resource.service';
import {HalResourceSortingService} from "core-app/modules/hal/services/hal-resource-sorting.service";
import {NgSelectComponent} from "@ng-select/ng-select";
import {APIV3Service} from "core-app/modules/apiv3/api-v3.service";
import { DebouncedRequestSwitchmap, errorNotificationHandler } from 'core-app/helpers/rxjs/debounced-input-switchmap';
import { ValueOption } from 'core-app/modules/fields/edit/field-types/select-edit-field.component';
import { Observable } from 'rxjs';
import { HalResourceNotificationService } from 'core-app/modules/hal/services/hal-resource-notification.service';
import { CurrentProjectService } from 'core-app/components/projects/current-project.service';

@Component({
  selector: 'filter-searchable-multiselect-value',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template:''
})
export abstract class FilterSearchableMultiselectValueComponent implements OnInit {
  @Input() public shouldFocus:boolean = false;
  @Input() public filter:QueryFilterInstanceResource;
  @Output() public filterChanged = new EventEmitter<QueryFilterInstanceResource>();

  @ViewChild('ngSelectInstance', { static: true }) ngSelectInstance:NgSelectComponent;

  public _availableOptions:HalResource[] = [];
  public compareByHrefOrString = AngularTrackingHelpers.compareByHrefOrString;

  private _isEmpty:boolean;

  readonly text = {
    placeholder: this.I18n.t('js.placeholders.selection'),
  };

   constructor(readonly halResourceService:HalResourceService,
              readonly halSorting:HalResourceSortingService,
              readonly apiV3Service:APIV3Service,
              readonly cdRef:ChangeDetectorRef,
              readonly I18n:I18nService,
              protected currentProject:CurrentProjectService,
              readonly halNotification:HalResourceNotificationService) {
  }
  public requests = new DebouncedRequestSwitchmap<string, ValueOption>(
    (searchTerm:string) => this.loadAvailable(searchTerm),
    errorNotificationHandler(this.halNotification),
    true
  );
  public active:Set<string>;

  public abstract loadAvailable(matching:string):Observable<HalResource[]> ;

  initialization() {
    this
    .requests
    .output$
    .subscribe((values:unknown[]) => {
      this.availableOptions = values  as HalResource[];
      this.cdRef.detectChanges();
    });
  }

  ngOnInit() {
    this.initialization();

  // Request an empty value to load warning early on
  this.requests.input$.next('');
  }

  public get value() {
    return this.filter.values;
  }

  public setValues(val:any) {
    this.filter.values = _.castArray(val);
    this.filterChanged.emit(this.filter);
    this.requests.input$.next('');
    this.cdRef.detectChanges();
  }

  public get availableOptions() {
    return this._availableOptions;
  }

  public set availableOptions(val:HalResource[]) {
    this._availableOptions = this.halSorting.sort(val);
  }

  public get isEmpty():boolean {
    return this._isEmpty = this.value.length === 0;
  }

  public repositionDropdown() {
    if (this.ngSelectInstance) {
      setTimeout(() => {
        const component = (this.ngSelectInstance) as any;
        if (component && component.dropdownPanel) {
          component.dropdownPanel._updatePosition();
        }
      }, 20);
    }
  }

}