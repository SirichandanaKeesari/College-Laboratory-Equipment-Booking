
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface Student {
  id: string;
  studentName: string;
  rollNumber: string;
  email: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  data?: Student;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/api/auth';
  private tokenKey = 'labspaceToken';
  private studentKey = 'labspaceStudent';

  constructor(private http: HttpClient) {}

  signup(details: {
    studentName: string;
    rollNumber: string;
    email: string;
    password: string;
  }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      `${this.apiUrl}/signup`,
      details
    );
  }

  login(identifier: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      `${this.apiUrl}/login`,
      { identifier, password }
    ).pipe(
      tap(response => {
        if (response.success && response.token && response.data) {
          localStorage.setItem(this.tokenKey, response.token);
          localStorage.setItem(
            this.studentKey,
            JSON.stringify(response.data)
          );
        }
      })
    );
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  getStudent(): Student | null {
    const student = localStorage.getItem(this.studentKey);

    if (!student) {
      return null;
    }

    try {
      return JSON.parse(student) as Student;
    } catch {
      localStorage.removeItem(this.studentKey);
      return null;
    }
  }

  getCurrentStudent(): Observable<AuthResponse> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.getToken()}`
    });

    return this.http.get<AuthResponse>(
      `${this.apiUrl}/me`,
      { headers }
    );
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.studentKey);
  }
}
