
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './signup.html',
  styleUrl: './signup.css'
})
export class Signup {
  studentName = '';
  rollNumber = '';
  email = '';
  password = '';
  confirmPassword = '';
  errorMessage = '';
  successMessage = '';
  isLoading = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onSubmit(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (
      !this.studentName.trim() ||
      !this.rollNumber.trim() ||
      !this.email.trim() ||
      !this.password
    ) {
      this.errorMessage = 'Please fill in all required fields.';
      return;
    }

    if (this.password.length < 8) {
      this.errorMessage = 'Password must contain at least 8 characters.';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match.';
      return;
    }

    this.isLoading = true;

    this.authService.signup({
      studentName: this.studentName.trim(),
      rollNumber: this.rollNumber.trim(),
      email: this.email.trim(),
      password: this.password
    }).subscribe({
      next: response => {
        this.isLoading = false;

        if (response.success) {
          this.successMessage = 'Account created successfully! Redirecting to login...';

          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 1200);
        } else {
          this.errorMessage = response.message || 'Signup failed.';
        }
      },
      error: error => {
        this.isLoading = false;
        this.errorMessage =
          error.error?.message || 'Unable to create your account.';
      }
    });
  }
}
