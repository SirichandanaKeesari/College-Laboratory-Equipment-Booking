
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { EquipmentService } from './equipment';

describe('EquipmentService', () => {
  let service: EquipmentService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        EquipmentService,
        provideHttpClient()
      ]
    });

    service = TestBed.inject(EquipmentService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
