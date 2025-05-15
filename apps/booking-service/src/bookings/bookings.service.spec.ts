import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BookingsService } from './bookings.service';
import { Booking, BookingStatus } from './schemas/booking.schema';
import { CreateBookingDto } from './dto/create-booking.dto';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { REDIS_CLIENT } from '../redis/redis.provider';
import axios, { AxiosError } from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('BookingsService', () => {
  let service: BookingsService;
  let model: Model<Booking>;

  const mockBookingData = {
    _id: 'mockId',
    userId: 'userId',
    concertId: 'concertId',
    seatTypeId: 'seat-type-uuid-v4',
    status: BookingStatus.ACTIVE,
  };

  const mockBooking = {
    ...mockBookingData,
    save: jest.fn().mockResolvedValue(mockBookingData),
  };

  // Mock the model constructor
  const mockModel = function() {
    return mockBooking;
  };
  mockModel.find = jest.fn().mockReturnThis();
  mockModel.findOne = jest.fn().mockReturnThis();
  mockModel.findById = jest.fn().mockReturnThis();
  mockModel.findByIdAndUpdate = jest.fn().mockReturnThis();
  mockModel.findByIdAndDelete = jest.fn().mockReturnThis();
  mockModel.exec = jest.fn();

  const mockRedisClient = {
    eval: jest.fn(),
    publish: jest.fn().mockResolvedValue(1),
    incr: jest.fn().mockResolvedValue(1),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsService,
        {
          provide: getModelToken(Booking.name),
          useValue: mockModel,
        },
        {
          provide: REDIS_CLIENT,
          useValue: mockRedisClient,
        },
      ],
    }).compile();

    service = module.get<BookingsService>(BookingsService);
    model = module.get<Model<Booking>>(getModelToken(Booking.name));

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createBookingDto: CreateBookingDto = {
      userId: 'userId',
      concertId: 'concertId',
      seatTypeId: 'seat-type-uuid-v4',
    };

    it('should create a booking successfully', async () => {
      // Mock concert service response
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          isActive: true,
          seatTypes: [{
            id: 'seat-type-uuid-v4',
            capacity: 10
          }]
        }
      });

      // Mock auth service response
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          email: 'test@example.com'
        }
      });

      // Mock Redis response
      mockRedisClient.eval.mockResolvedValueOnce(9);
      mockModel.findOne.mockResolvedValue(null);

      const result = await service.create(createBookingDto);

      expect(result).toEqual(mockBookingData);
      expect(mockBooking.save).toHaveBeenCalled();
      expect(mockRedisClient.publish).toHaveBeenCalledWith(
        'booking-events',
        expect.stringContaining('booking.created')
      );
    });

    it('should throw BadRequestException when booking already exists', async () => {
      mockModel.findOne.mockResolvedValue(mockBooking);

      await expect(service.create(createBookingDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when concert service is unavailable', async () => {
      mockModel.findOne.mockResolvedValue(null);
      mockedAxios.get.mockRejectedValueOnce(new AxiosError('Service unavailable'));

      await expect(service.create(createBookingDto)).rejects.toThrow(
        'Service unavailable'
      );
    });

    it('should throw BadRequestException when concert is inactive', async () => {
      mockModel.findOne.mockResolvedValue(null);
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          isActive: false,
          seatTypes: [{
            id: 'seat-type-uuid-v4',
            capacity: 10
          }]
        }
      });

      await expect(service.create(createBookingDto)).rejects.toThrow(
        'This concert is no longer available for booking'
      );
    });

    it('should throw BadRequestException when seat type not found', async () => {
      mockModel.findOne.mockResolvedValue(null);
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          isActive: true,
          seatTypes: [{
            id: 'different-seat-type',
            capacity: 10
          }]
        }
      });

      await expect(service.create(createBookingDto)).rejects.toThrow(
        'Seat type not found'
      );
    });

    it('should handle Redis errors gracefully', async () => {
      mockModel.findOne.mockResolvedValue(null);
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          isActive: true,
          seatTypes: [{
            id: 'seat-type-uuid-v4',
            capacity: 10
          }]
        }
      });
      mockRedisClient.eval.mockRejectedValueOnce(new Error('Redis error'));

      await expect(service.create(createBookingDto)).rejects.toThrow(
        'Failed to check seat availability'
      );
    });

    it('should handle auth service errors gracefully', async () => {
      mockModel.findOne.mockResolvedValue(null);
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          isActive: true,
          seatTypes: [{
            id: 'seat-type-uuid-v4',
            capacity: 10
          }]
        }
      });
      mockRedisClient.eval.mockResolvedValueOnce(9);
      mockedAxios.get.mockRejectedValueOnce(new Error('Auth service error'));

      const result = await service.create(createBookingDto);
      expect(result).toBeDefined();
    });
  });

  describe('findAll', () => {
    it('should return an array of bookings', async () => {
      const mockBookings = [mockBooking];
      mockModel.exec.mockResolvedValue(mockBookings);

      const result = await service.findAll();

      expect(result).toEqual(mockBookings);
      expect(mockModel.find).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a booking by id', async () => {
      mockModel.exec.mockResolvedValue(mockBooking);

      const result = await service.findOne('mockId');

      expect(result).toEqual(mockBooking);
      expect(mockModel.findById).toHaveBeenCalledWith('mockId');
    });

    it('should throw NotFoundException when booking is not found', async () => {
      mockModel.exec.mockResolvedValue(null);

      await expect(service.findOne('mockId')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByUser', () => {
    it('should return bookings for a user', async () => {
      const mockBookings = [mockBooking];
      mockModel.exec.mockResolvedValue(mockBookings);

      const result = await service.findByUser('userId');

      expect(result).toEqual(mockBookings);
      expect(mockModel.find).toHaveBeenCalledWith({ userId: 'userId' });
    });
  });

  describe('cancelBooking', () => {
    it('should cancel a booking successfully', async () => {
      mockModel.findOne.mockResolvedValue(mockBooking);
      mockBooking.save.mockResolvedValue({
        ...mockBooking,
        status: BookingStatus.CANCELLED,
      });

      const result = await service.cancelBooking('userId', 'concertId');

      expect(result).toEqual({
        success: true,
        message: 'Booking cancelled and seat released.',
      });
      expect(mockModel.findOne).toHaveBeenCalledWith({
        userId: 'userId',
        concertId: 'concertId',
        status: BookingStatus.ACTIVE,
      });
      expect(mockBooking.save).toHaveBeenCalled();
      expect(mockRedisClient.incr).toHaveBeenCalled();
      expect(mockRedisClient.publish).toHaveBeenCalledWith(
        'booking-events',
        expect.stringContaining('booking.cancelled')
      );
    });

    it('should throw NotFoundException when booking is not found', async () => {
      mockModel.findOne.mockResolvedValue(null);

      await expect(service.cancelBooking('userId', 'concertId')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should handle Redis errors gracefully when cancelling', async () => {
      mockModel.findOne.mockResolvedValue(mockBooking);
      mockBooking.save.mockResolvedValue({
        ...mockBooking,
        status: BookingStatus.CANCELLED,
      });
      mockRedisClient.incr.mockRejectedValueOnce(new Error('Redis error'));

      const result = await service.cancelBooking('userId', 'concertId');
      expect(result.success).toBe(true);
    });
  });
}); 