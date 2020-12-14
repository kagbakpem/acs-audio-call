import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CallInformationComponent } from './call-information.component';

describe('CallInformationComponent', () => {
  let component: CallInformationComponent;
  let fixture: ComponentFixture<CallInformationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CallInformationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CallInformationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
