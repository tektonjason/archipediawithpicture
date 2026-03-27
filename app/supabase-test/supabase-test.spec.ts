import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SupabaseTest } from './supabase-test';

describe('SupabaseTest', () => {
  let component: SupabaseTest;
  let fixture: ComponentFixture<SupabaseTest>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SupabaseTest]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SupabaseTest);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
