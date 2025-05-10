import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddServerDialogComponent } from './add-server-dialog.component';

describe('AddServerDialogComponent', () => {
  let component: AddServerDialogComponent;
  let fixture: ComponentFixture<AddServerDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddServerDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddServerDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
