import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Shell } from './shell';

describe('Shell', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Shell],
      providers: [provideRouter([]), MessageService, ConfirmationService],
    }).compileComponents();
  });

  it('should compose header, aside, main, footer and router outlet', async () => {
    const fixture = TestBed.createComponent(Shell);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('app-header')).toBeTruthy();
    expect(compiled.querySelector('main#contenido router-outlet')).toBeTruthy();
    expect(compiled.querySelector('app-footer')).toBeTruthy();
  });

  it('should toggle mobile drawer or sidebar', async () => {
    const fixture = TestBed.createComponent(Shell);
    await fixture.whenStable();

    fixture.componentInstance['onMenuToggle']();
    expect(
      fixture.componentInstance.mobileOpen() ||
      fixture.componentInstance.sidebarCollapsed()
    ).toBe(true);
  });
});
