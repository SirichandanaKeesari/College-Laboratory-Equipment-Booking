
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Equipment, EquipmentService } from '../services/equipment';
import {
  BookingService,
  BookingRequest,
  SlotAvailability
} from '../services/booking';

@Component({
  selector: 'app-booking',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './booking.html',
  styleUrl: './booking.css'
})
export class Booking implements OnInit {
  equipment?: Equipment;
  loading = true;
  errorMessage = '';
  successMessage = '';
  submitting = false;
  bookingId = '';

  selectedDate = '';
  selectedSlot = '';
  slotAvailability: SlotAvailability[] = [];
availabilityLoading = false;
  studentName = '';
  rollNumber = '';
  email = '';

  timeSlots = [
    '09:00 AM - 10:00 AM',
    '10:00 AM - 11:00 AM',
    '11:00 AM - 12:00 PM',
    '12:00 PM - 01:00 PM',
    '02:00 PM - 03:00 PM',
    '03:00 PM - 04:00 PM',
    '04:00 PM - 05:00 PM'
  ];

  minDate = this.getToday();

  constructor(
    private route: ActivatedRoute,
    private equipmentService: EquipmentService,
    private bookingService: BookingService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      this.loading = false;
      this.errorMessage = 'Equipment ID is missing.';
      this.cdr.detectChanges();
      return;
    }

    this.equipmentService.getEquipment().subscribe({
      next: (response) => {
        this.equipment = response.data.find(
          item => String(item.id) === id
        );

        this.loading = false;

        if (!this.equipment) {
          this.errorMessage = 'Equipment not found.';
        }

        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Equipment loading error:', error);
        this.loading = false;
        this.errorMessage = 'Unable to load equipment. Check the backend.';
        this.cdr.detectChanges();
      }
    });
  }

  getToday(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  onDateChange(): void {
  this.selectedSlot = '';
  this.errorMessage = '';
  this.successMessage = '';
  this.slotAvailability = [];

  if (!this.equipment || !this.selectedDate) {
    return;
  }

  this.availabilityLoading = true;

  this.bookingService
    .getAvailability(String(this.equipment.id), this.selectedDate)
    .subscribe({
      next: (response) => {
        this.slotAvailability = response.data.slots;
        this.availabilityLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Availability loading error:', error);
        this.availabilityLoading = false;
        this.errorMessage = 'Unable to load slot availability.';
        this.cdr.detectChanges();
      }
    });
}

isSlotAvailable(slot: string): boolean {
  const availability = this.slotAvailability.find(
    item => item.timeSlot === slot
  );

  return availability ? availability.available : false;
}

getAvailableUnits(slot: string): number {
  const availability = this.slotAvailability.find(
    item => item.timeSlot === slot
  );

  return availability?.availableUnits ?? 0;
}

selectSlot(slot: string): void {
  if (!this.isSlotAvailable(slot)) {
    return;
  }

  this.selectedSlot = slot;
  this.errorMessage = '';
}

  confirmBooking(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.equipment) {
      this.errorMessage = 'Equipment details are unavailable.';
      return;
    }

    if (
      !this.studentName.trim() ||
      !this.rollNumber.trim() ||
      !this.email.trim() ||
      !this.selectedDate ||
      !this.selectedSlot
    ) {
      this.errorMessage = 'Please complete all fields and select a date and time slot.';
      return;
    }

    const booking: BookingRequest = {
      equipmentId: String(this.equipment.id),
      studentName: this.studentName.trim(),
      rollNumber: this.rollNumber.trim(),
      email: this.email.trim(),
      date: this.selectedDate,
      timeSlot: this.selectedSlot
    };

    this.submitting = true;

    this.bookingService.createBooking(booking).subscribe({
      next: (response) => {
        this.submitting = false;

        if (response.success) {
          this.successMessage = response.message;
          this.bookingId = response.data?.id ?? '';
        } else {
          this.errorMessage = response.message;
        }

        this.cdr.detectChanges();
      },
      error: (error) => {
        this.submitting = false;
        this.errorMessage =
          error.error?.message || 'Booking failed. Please try again.';
        this.cdr.detectChanges();
      }
    });
  }
}
