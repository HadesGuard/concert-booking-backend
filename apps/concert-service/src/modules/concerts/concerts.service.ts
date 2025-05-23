import { Injectable, NotFoundException, BadRequestException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Concert, ConcertDocument } from '../../schemas/concert.schema';
import { CreateConcertDto } from '../../common/dto/create-concert.dto';
import { UpdateConcertDto } from '../../common/dto/update-concert.dto';
import { ListConcertsDto } from '../../common/dto/list-concerts.dto';
import { SeatTypeService } from '../seat-types/seat-types.service';
import { CacheService } from '../redis/cache.service';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { Cron } from '@nestjs/schedule';
import { Inject } from '@nestjs/common';
import { REDIS_CLIENT } from '../redis/redis.provider';
import Redis from 'ioredis';
import { SeatTypeDto } from '../../common/dto/create-seat-types.dto';
import { BookingStatus } from '../../common/enums/booking-status.enum';
import { ConcertWithSeatTypes } from '../../interfaces/concert-with-seats.interface';
import { SeatTypeEnum } from '../../common/enums/seat-type.enum';

@Injectable()
export class ConcertsService implements OnModuleInit {
  private readonly CACHE_TTL = 3600; // 1 hour
  private readonly CACHE_PREFIX = 'concert';
  private readonly bookingServiceUrl: string;
  private readonly DISABLE_SCHEDULE_KEY = 'concert:disable:schedule';

  constructor(
    @InjectModel(Concert.name) private concertModel: Model<ConcertDocument>,
    private readonly seatTypeService: SeatTypeService,
    private readonly cacheService: CacheService,
    private readonly httpService: HttpService,
    @Inject(REDIS_CLIENT) private readonly redisClient: Redis,
  ) {
    this.bookingServiceUrl = process.env.BOOKING_SERVICE_URL || 'http://localhost:3002';
  }

  async onModuleInit() {
    // Recover disable schedule from MongoDB on service startup
    await this.recoverDisableSchedule();
  }

  private async recoverDisableSchedule() {
    try {
      // Get all active concerts that haven't started yet
      const now = new Date();
      const activeConcerts = await this.concertModel.find({
        isActive: true,
        startTime: { $gt: now }
      }).exec();

      // Clear existing schedule
      await this.redisClient.del(this.DISABLE_SCHEDULE_KEY);

      // Reschedule all active concerts
      if (activeConcerts.length > 0) {
        const scheduleData = activeConcerts.map(concert => [
          concert.startTime.getTime(),
          concert._id.toString()
        ]).flat();

        await this.redisClient.zadd(this.DISABLE_SCHEDULE_KEY, ...scheduleData);
      }

      console.log(`[CONCERT] Recovered ${activeConcerts.length} concerts in disable schedule`);
    } catch (error) {
      console.error('[CONCERT] Failed to recover disable schedule:', error);
    }
  }

  @Cron('* * * * *')
  async handleConcertDisable() {
    const now = Date.now();
    
    // Get all concerts that need to be disabled
    const concertsToDisable = await this.redisClient.zrangebyscore(
      this.DISABLE_SCHEDULE_KEY,
      0,
      now
    );
    
    if (concertsToDisable.length > 0) {
      // Disable all concerts in one update
      const result = await this.concertModel.updateMany(
        {
          _id: { $in: concertsToDisable },
          isActive: true
        },
        {
          $set: { isActive: false }
        }
      ).exec();

      if (result.modifiedCount > 0) {
        // Remove from schedule
        await this.redisClient.zrem(this.DISABLE_SCHEDULE_KEY, ...concertsToDisable);
        
        // Invalidate cache
        await this.invalidateCache();
      }
    }
  }

  private validateConcertDates(startTime: Date, endTime: Date): void {
    if (startTime <= new Date()) {
      throw new BadRequestException('Start time must be in the future');
    }

    if (endTime <= startTime) {
      throw new BadRequestException('End time must be after start time');
    }
  }

  async create(createConcertDto: CreateConcertDto): Promise<ConcertDocument> {
    this.validateConcertDates(createConcertDto.startTime, createConcertDto.endTime);
    const createdConcert = await this.concertModel.create(createConcertDto);
    
    // Schedule disable at concert start time
    await this.redisClient.zadd(
      this.DISABLE_SCHEDULE_KEY,
      createdConcert.startTime.getTime(),
      createdConcert._id.toString()
    );
    
    await this.invalidateCache();
    return createdConcert;
  }

  async findAll(query: ListConcertsDto) {
    const cacheKey = `concerts:${JSON.stringify(query)}`;
    const cached = await this.cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    const { search, startDate, endDate, isActive = true, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const filter: any = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { artist: { $regex: search, $options: 'i' } },
        { venue: { $regex: search, $options: 'i' } },
      ];
    }

    if (startDate) {
      filter.startTime = { $gte: startDate };
    }

    if (endDate) {
      filter.startTime = { ...filter.startTime, $lte: endDate };
    }

    if (isActive !== undefined) {
      filter.isActive = isActive;
    }

    const [concerts, total] = await Promise.all([
      this.concertModel
        .find(filter)
        .sort({ startTime: 1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.concertModel.countDocuments(filter),
    ]);

    const result = {
      data: concerts,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };

    await this.cacheService.set(cacheKey, result, 300); // Cache for 5 minutes
    return result;
  }

  async findOne(id: string): Promise<ConcertDocument> {
    const cacheKey = this.cacheService.generateKey(this.CACHE_PREFIX, 'detail', id);
    const cached = await this.cacheService.get<ConcertDocument>(cacheKey);

    if (cached) {
      return cached;
    }

    const concert = await this.concertModel.findById(id).exec();
    if (!concert) {
      throw new NotFoundException(`Concert with ID ${id} not found`);
    }

    await this.cacheService.set(cacheKey, concert, this.CACHE_TTL);
    return concert;
  }

  async update(id: string, updateConcertDto: UpdateConcertDto): Promise<ConcertDocument> {
    if (updateConcertDto.startTime || updateConcertDto.endTime) {
      const concert = await this.concertModel.findById(id);
      const startTime = updateConcertDto.startTime || concert.startTime;
      const endTime = updateConcertDto.endTime || concert.endTime;
      this.validateConcertDates(startTime, endTime);

      // Update disable schedule if start time changed
      if (updateConcertDto.startTime) {
        await this.redisClient.zrem(this.DISABLE_SCHEDULE_KEY, id);
        await this.redisClient.zadd(
          this.DISABLE_SCHEDULE_KEY,
          updateConcertDto.startTime.getTime(),
          id
        );
      }
    }

    const updatedConcert = await this.concertModel
      .findByIdAndUpdate(id, updateConcertDto, { new: true })
      .exec();

    if (!updatedConcert) {
      throw new NotFoundException(`Concert with ID ${id} not found`);
    }

    await this.invalidateCache(id);
    return updatedConcert;
  }

  async remove(id: string): Promise<void> {
    const result = await this.concertModel.deleteOne({ _id: id }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(`Concert with ID ${id} not found`);
    }
    
    // Remove from disable schedule
    await this.redisClient.zrem(this.DISABLE_SCHEDULE_KEY, id);
    
    await this.invalidateCache(id);
  }

  async getConcertWithSeatTypes(id: string): Promise<ConcertWithSeatTypes> {
    const cacheKey = this.cacheService.generateKey(this.CACHE_PREFIX, 'with-seats', id);
    const cached = await this.cacheService.get<ConcertWithSeatTypes>(cacheKey);

    if (cached) {
      return cached;
    }

    const concert = await this.findOne(id);
    const seatTypes = await Promise.all(
      concert.seatTypes.map(async (seatTypeId) => {
        const seatType = await this.seatTypeService.findOne(seatTypeId);
        const { data: bookings } = await firstValueFrom(
          this.httpService.get(`${this.bookingServiceUrl}/bookings/count`, {
            params: {
              concertId: id,
              seatTypeId: seatTypeId,
              status: BookingStatus.ACTIVE,
            },
          })
        );
        
        return {
          _id: seatType._id,
          name: seatType.name,
          description: seatType.description,
          price: seatType.price,
          capacity: seatType.capacity,
          isActive: seatType.isActive,
          remainingTickets: seatType.capacity - bookings.count,
        };
      })
    );

    const result: ConcertWithSeatTypes = {
      ...concert.toObject(),
      seatTypes,
    };

    await this.cacheService.set(cacheKey, result, this.CACHE_TTL);
    return result;
  }

  async checkSeatAvailability(concertId: string, seatTypeId: SeatTypeEnum): Promise<boolean> {
    const concert = await this.findOne(concertId);
    const seatType = await this.seatTypeService.findOne(seatTypeId);

    if (!concert.seatTypes.includes(seatTypeId)) {
      throw new BadRequestException(
        `Seat type ${seatTypeId} is not available for concert ${concertId}`,
      );
    }

    // TODO: Implement actual seat availability check with booking service
    return true;
  }

  async findUpcomingConcerts(): Promise<ConcertDocument[]> {
    const cacheKey = this.cacheService.generateKey(this.CACHE_PREFIX, 'upcoming');
    const cached = await this.cacheService.get<ConcertDocument[]>(cacheKey);

    if (cached) {
      return cached;
    }

    const now = new Date();
    const concerts = await this.concertModel
      .find({
        startTime: { $gt: now },
        isActive: true,
      })
      .sort({ startTime: 1 })
      .exec();

    await this.cacheService.set(cacheKey, concerts, this.CACHE_TTL);
    return concerts;
  }

  async searchConcerts(query: string): Promise<ConcertDocument[]> {
    const cacheKey = this.cacheService.generateKey(this.CACHE_PREFIX, 'search', query);
    const cached = await this.cacheService.get<ConcertDocument[]>(cacheKey);

    if (cached) {
      return cached;
    }

    const concerts = await this.concertModel
      .find({
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { artist: { $regex: query, $options: 'i' } },
          { venue: { $regex: query, $options: 'i' } },
        ],
        isActive: true,
      })
      .exec();

    await this.cacheService.set(cacheKey, concerts, this.CACHE_TTL);
    return concerts;
  }

  private async invalidateCache(id?: string): Promise<void> {
    if (id) {
      await this.cacheService.del(
        this.cacheService.generateKey(this.CACHE_PREFIX, 'detail', id)
      );
      await this.cacheService.del(
        this.cacheService.generateKey(this.CACHE_PREFIX, 'with-seats', id)
      );
    }
    await this.cacheService.del(
      this.cacheService.generateKey(this.CACHE_PREFIX, 'list')
    );
    await this.cacheService.del(
      this.cacheService.generateKey(this.CACHE_PREFIX, 'upcoming')
    );
  }

  async createSeatTypes(concertId: string, seatTypes: SeatTypeDto[]) {
    const concert = await this.concertModel.findById(concertId);
    if (!concert) {
      throw new NotFoundException(`Concert with ID ${concertId} not found`);
    }

    // Create seat types and get their IDs
    const seatTypeDtos = seatTypes.map(seatType => ({
      name: seatType.name,
      description: `${seatType.name} seats for ${concert.name}`,
      price: seatType.price,
      capacity: seatType.capacity
    }));
    const createdSeatTypes = await this.seatTypeService.create(concertId, { seatTypes: seatTypeDtos });
    const seatTypeIds = createdSeatTypes.map(seatType => seatType._id.toString());

    // Update concert with seat type IDs
    if (!concert.seatTypes) {
      concert.seatTypes = [];
    }
    concert.seatTypes.push(...seatTypeIds);
    await concert.save();

    // Invalidate cache
    await this.invalidateCache(concertId);

    return concert;
  }

  async getSeatTypeById(concertId: string, seatTypeId: string) {
    const concert = await this.concertModel.findById(concertId);
    if (!concert) throw new NotFoundException('Concert not found');
    if (!concert.seatTypes.includes(seatTypeId)) throw new NotFoundException('Seat type not found for this concert');
    return this.seatTypeService.findOneByConcertId(concertId, seatTypeId);
  }
} 