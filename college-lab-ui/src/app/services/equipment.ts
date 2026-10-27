
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, tap, catchError } from 'rxjs';

export interface Equipment {
  id: string | number;
  name: string;
  category: string;
  department: string;
  description?: string;
  available?: number;
  total?: number;
}

interface EquipmentResponse {
  success: boolean;
  data: Equipment[];
}

@Injectable({
  providedIn: 'root'
})
export class EquipmentService {
  private apiUrl = 'http://localhost:3000/api/equipment';
  private cacheKey = 'labspaceEquipment';

  constructor(private http: HttpClient) {}

  getEquipment(): Observable<EquipmentResponse> {
    const cachedData = localStorage.getItem(this.cacheKey);

    if (cachedData) {
      try {
        const cachedEquipment = JSON.parse(cachedData) as Equipment[];

        return this.http.get<EquipmentResponse>(this.apiUrl).pipe(
          tap(response => {
            if (response.success && Array.isArray(response.data)) {
              localStorage.setItem(
                this.cacheKey,
                JSON.stringify(response.data)
              );
            }
          }),
          catchError(() =>
            of({
              success: true,
              data: cachedEquipment
            })
          )
        );
      } catch {
        localStorage.removeItem(this.cacheKey);
      }
    }

    return this.http.get<EquipmentResponse>(this.apiUrl).pipe(
      tap(response => {
        if (response.success && Array.isArray(response.data)) {
          localStorage.setItem(
            this.cacheKey,
            JSON.stringify(response.data)
          );
        }
      })
    );
  }
}
