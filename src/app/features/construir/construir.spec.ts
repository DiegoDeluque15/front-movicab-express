import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Construir } from './construir';

describe('Construir', () => {
  let component: Construir;
  let fixture: ComponentFixture<Construir>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Construir],
    }).compileComponents();

    fixture = TestBed.createComponent(Construir);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
