
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Equipment, EquipmentService } from '../services/equipment';
import { RouterModule } from '@angular/router';
import { AuthService } from '../services/auth';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {
  equipment: Equipment[] = [];
  searchText = '';
  selectedDepartment = '';
  loading = true;
  errorMessage = '';
  studentName = '';

  constructor(
    private equipmentService: EquipmentService,
    private authService: AuthService
  ) {}

  
ngOnInit(): void {
  const student = this.authService.getStudent();
  this.studentName = student?.studentName || '';

  const cachedData = localStorage.getItem('labspaceEquipment');

  if (cachedData) {
    try {
      this.equipment = JSON.parse(cachedData) as Equipment[];
      this.loading = false;
    } catch {
      localStorage.removeItem('labspaceEquipment');
    }
  }

  this.loadEquipment();
}


  loadEquipment(): void {
    this.loading = !this.equipment.length;
    this.errorMessage = '';

    this.equipmentService.getEquipment().subscribe({
      next: (response) => {
        this.equipment = response.data ?? [];
        this.loading = false;
      },
      error: () => {
        this.errorMessage =
          'Unable to load equipment. Please check whether the backend is running.';
        this.loading = false;
      }
    });
  }

  get filteredEquipment(): Equipment[] {
    const search = this.searchText.trim().toLowerCase();

    return this.equipment.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(search) ||
        item.category.toLowerCase().includes(search) ||
        item.department.toLowerCase().includes(search);

      const matchesDepartment =
        !this.selectedDepartment ||
        item.department === this.selectedDepartment;

      return matchesSearch && matchesDepartment;
    });
  }

  get totalUnits(): number {
    return this.equipment.reduce(
      (sum, item) => sum + (Number(item.total) || 0),
      0
    );
  }

  get availableUnits(): number {
    return this.equipment.reduce(
      (sum, item) => sum + (Number(item.available) || 0),
      0
    );
  }

  get departments(): string[] {
    return [...new Set(this.equipment.map((item) => item.department))];
  }
}
