
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  identifier = '';
  password = '';
  errorMessage = '';
  isLoading = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onSubmit(): void {
    if (!this.identifier.trim() || !this.password) {
      this.errorMessage = 'Please enter your email or roll number and password.';
      return;
    }

    this.errorMessage = '';
    this.isLoading = true;

    this.authService.login(this.identifier.trim(), this.password).subscribe({
      next: response => {
        this.isLoading = false;

        if (response.success) {
          this.router.navigate(['/']);
        } else {
          this.errorMessage = response.message || 'Login failed.';
        }
      },
      error: error => {
        this.isLoading = false;
        this.errorMessage =
          error.error?.message || 'Unable to log in. Please try again.';
      }
    });
  }
}
