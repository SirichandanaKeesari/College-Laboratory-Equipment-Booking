
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth';

export interface BookingRequest {
  equipmentId: string;
  studentName: string;
  rollNumber: string;
  email: string;
  date: string;
  timeSlot: string;
}

export interface BookingResponse {
  success: boolean;
  message: string;
  data?: {
    id: string;
    equipmentId: string;
    equipmentName: string;
    studentName: string;
    rollNumber: string;
    email: string;
    date: string;
    timeSlot: string;
    status: string;
  };
}

export interface SlotAvailability {
  timeSlot: string;
  bookedUnits: number;
  availableUnits: number;
  available: boolean;
}

export interface AvailabilityResponse {
  success: boolean;
  data: {
    equipmentId: string;
    date: string;
    totalUnits: number;
    availableUnits: number;
    slots: SlotAvailability[];
  };
}

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  private apiUrl = 'http://localhost:3000/api/bookings';
  private availabilityUrl = 'http://localhost:3000/api/availability';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();

    return new HttpHeaders(
      token ? { Authorization: `Bearer ${token}` } : {}
    );
  }

  createBooking(booking: BookingRequest): Observable<BookingResponse> {
    return this.http.post<BookingResponse>(
      this.apiUrl,
      booking,
      { headers: this.getAuthHeaders() }
    );
  }

  getBookings(): Observable<any> {
    return this.http.get<any>(
      this.apiUrl,
      { headers: this.getAuthHeaders() }
    );
  }

  cancelBooking(id: string): Observable<any> {
    return this.http.patch(
      `${this.apiUrl}/${id}/cancel`,
      {},
      { headers: this.getAuthHeaders() }
    );
  }

  getAvailability(
    equipmentId: string,
    date: string
  ): Observable<AvailabilityResponse> {
    return this.http.get<AvailabilityResponse>(
      this.availabilityUrl,
      { params: { equipmentId, date } }
    );
  }
}
