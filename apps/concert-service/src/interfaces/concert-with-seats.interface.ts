import { Concert } from '../schemas/concert.schema';
import { SeatType } from '../schemas/seat-type.schema';

export interface SeatTypeWithAvailability extends Omit<SeatType, 'capacity'> {
  capacity: number;
  remainingTickets: number;
}

export interface ConcertWithSeatTypes extends Omit<Concert, 'seatTypes'> {
  seatTypes: SeatTypeWithAvailability[];
} 