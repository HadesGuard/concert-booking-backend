export enum BookingStatus {
  ACTIVE = 'ACTIVE',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
}

export interface IBooking {
  id: string;
  userId: string;
  concertId: string;
  seatTypeId: string;
  status: BookingStatus;
  createdAt: Date;
  updatedAt: Date;
} 