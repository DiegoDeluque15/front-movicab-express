import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { Passenger } from '../../core/models/passenger.model';
import { PassengerApi } from './passenger-api';

const BASE = `${environment.apiUrl}/pasajeros`;
const PASAJERO: Passenger = {
  id: 1,
  name: 'Ana Gómez',
  address: 'Calle 10 # 5-20',
  phone: '3001234567',
  email: 'ana@example.com',
  status: 'active',
};

describe('PassengerApi', () => {
  let api: PassengerApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(PassengerApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('should unwrap { passengers } into Passenger[]', () => {
    let resultado: Passenger[] | undefined;
    api.list().subscribe((passengers) => (resultado = passengers));

    const peticion = http.expectOne(BASE);
    expect(peticion.request.method).toBe('GET');
    peticion.flush({ passengers: [PASAJERO] });

    expect(resultado).toEqual([PASAJERO]);
  });

  it('should post to /registro for public passenger registration', () => {
    const payload = {
      name: 'Carlos Ruiz',
      email: 'carlos@example.com',
      password: 'password123',
      phone: '3109876543',
    };

    api.register(payload).subscribe((res) => {
      expect(res.message).toBe('Passenger successfully registered');
      expect(res.passenger.email).toBe('carlos@example.com');
    });

    const req = http.expectOne(`${BASE}/registro`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({
      message: 'Passenger successfully registered',
      passenger: {
        id: 2,
        name: 'Carlos Ruiz',
        email: 'carlos@example.com',
        phone: '3109876543',
        address: '',
        status: 'active',
        user_id: 10,
        username: 'carlos',
      },
    });
  });

  it('should build URLs from environment.apiUrl (no trailing slash)', () => {
    expect(environment.apiUrl.endsWith('/api')).toBe(true);
    api.list().subscribe();
    http.expectOne('http://localhost:4000/api/pasajeros').flush({ passengers: [] });
  });
});
