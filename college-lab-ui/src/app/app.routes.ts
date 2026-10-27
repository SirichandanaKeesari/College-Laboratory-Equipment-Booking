
import { Routes } from '@angular/router';
import { Dashboard } from './dashboard/dashboard';
import { Booking } from './booking/booking';
import { MyBookings } from './my-bookings/my-bookings';
import { Login } from './login/login';
import { Signup } from './signup/signup';

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'signup', component: Signup },
  { path: '', component: Dashboard },
  { path: 'booking/:id', component: Booking },
  { path: 'my-bookings', component: MyBookings },
  { path: '**', redirectTo: '' }
];
