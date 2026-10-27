
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BookingService } from '../services/booking';
import { RouterLink } from '@angular/router';

interface Booking {
  id: string;
  equipmentId: string;
  equipmentName: string;
  studentName: string;
  rollNumber: string;
  email: string;
  date: string;
  timeSlot: string;
  status: string;
}

@Component({
  selector: 'app-my-bookings',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './my-bookings.html',
  styleUrl: './my-bookings.css'
})
export class MyBookings implements OnInit {
  bookings: Booking[] = [];
  loading = true;
  errorMessage = '';
  successMessage = '';
  cancellingId = '';

  constructor(
    private bookingService: BookingService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadBookings();
  }

  loadBookings(): void {
    this.loading = true;
    this.errorMessage = '';

    this.bookingService.getBookings().subscribe({
      next: (response: any) => {
        this.bookings = Array.isArray(response.data)
          ? response.data
          : response.data?.bookings ?? [];

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Loading bookings error:', error);
        this.loading = false;
        this.errorMessage = 'Unable to load bookings. Please check the backend.';
        this.cdr.detectChanges();
      }
    });
  }
  
cancelBooking(id: string): void {
  const confirmed = window.confirm(
    'Are you sure you want to cancel this booking?'
  );

  if (!confirmed) {
    return;
  }

  this.cancellingId = id;
  this.errorMessage = '';
  this.successMessage = '';

  this.bookingService.cancelBooking(id).subscribe({
    next: (response) => {
      this.cancellingId = '';

      if (response.success) {
        this.successMessage = response.message;
        this.loadBookings();
      } else {
        this.errorMessage = response.message;
      }

      this.cdr.detectChanges();
    },
    error: (error) => {
      this.cancellingId = '';
      this.errorMessage =
        error.error?.message || 'Unable to cancel this booking.';
      this.cdr.detectChanges();
    }
  });
}

}
