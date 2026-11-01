import { Component, output, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { SessionStore } from '../../core/auth/session.store';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  imports: [ButtonModule, TagModule, RouterLink],
  selector: 'app-header',
  styleUrl: './header.css',
  templateUrl: './header.html',
})
export class Header {
  readonly session = inject(SessionStore);
  private readonly auth = inject(AuthService);

  title = 'MoviCab';
  menuRequested = output<void>();

  openMenu(): void {
    this.menuRequested.emit();
  }

  logout(): void {
    this.auth.logout();
  }
}
