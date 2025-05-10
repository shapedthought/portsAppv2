import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NavbarTabsComponent } from './navbar-tabs.component';

describe('NavbarTabsComponent', () => {
  let component: NavbarTabsComponent;
  let fixture: ComponentFixture<NavbarTabsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavbarTabsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NavbarTabsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
