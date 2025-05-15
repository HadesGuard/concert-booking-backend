import { Test, TestingModule } from '@nestjs/testing';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { BookingStatus } from './schemas/booking.schema';

describe('BookingsController', () => {
  let controller: BookingsController;
  let service: BookingsService;

  const mockBooking = {
    _id: 'mockId',
    userId: 'userId',
    concertId: 'concertId',
    seatTypeId: 'seat-type-uuid-v4',
    status: BookingStatus.ACTIVE,
  };

  const mockBookingsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByUser: jest.fn(),
    cancelBooking: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BookingsController],
      providers: [
        {
          provide: BookingsService,
          useValue: mockBookingsService,
        },
      ],
    }).compile();

    controller = module.get<BookingsController>(BookingsController);
    service = module.get<BookingsService>(BookingsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a booking', async () => {
      const createBookingDto: CreateBookingDto = {
        userId: 'userId',
        concertId: 'concertId',
        seatTypeId: 'seat-type-uuid-v4',
      };

      mockBookingsService.create.mockResolvedValue(mockBooking);

      const result = await controller.create(createBookingDto);

      expect(result).toEqual(mockBooking);
      expect(mockBookingsService.create).toHaveBeenCalledWith(createBookingDto);
    });
  });

  describe('findAll', () => {
    it('should return an array of bookings', async () => {
      const mockBookings = [mockBooking];
      mockBookingsService.findAll.mockResolvedValue(mockBookings);

      const result = await controller.findAll();

      expect(result).toEqual(mockBookings);
      expect(mockBookingsService.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a booking by id', async () => {
      mockBookingsService.findOne.mockResolvedValue(mockBooking);

      const result = await controller.findOne('mockId');

      expect(result).toEqual(mockBooking);
      expect(mockBookingsService.findOne).toHaveBeenCalledWith('mockId');
    });
  });

  describe('findMyBookings', () => {
    it('should return user bookings', async () => {
      const mockBookings = [mockBooking];
      mockBookingsService.findByUser.mockResolvedValue(mockBookings);

      const result = await controller.findMyBookings({ user: { sub: 'userId' } });

      expect(result).toEqual(mockBookings);
      expect(mockBookingsService.findByUser).toHaveBeenCalledWith('userId');
    });
  });

  describe('cancelBooking', () => {
    it('should cancel a booking', async () => {
      mockBookingsService.cancelBooking.mockResolvedValue({
        success: true,
        message: 'Booking cancelled and seat released.',
      });

      const result = await controller.cancelBooking(
        { user: { sub: 'userId' } },
        'concertId',
      );

      expect(result).toEqual({
        success: true,
        message: 'Booking cancelled and seat released.',
      });
      expect(mockBookingsService.cancelBooking).toHaveBeenCalledWith(
        'userId',
        'concertId',
      );
    });
  });
}); 