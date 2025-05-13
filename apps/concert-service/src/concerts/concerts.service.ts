import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Concert, ConcertDocument } from './schemas/concert.schema';
import { CreateConcertDto } from './dto/create-concert.dto';
import { UpdateConcertDto } from './dto/update-concert.dto';
import { SeatTypeService } from '../seat-types/seat-types.service';
import { CacheService } from '../common/services/cache.service';

@Injectable()
export class ConcertsService {
  private readonly CACHE_TTL = 3600; // 1 hour
  private readonly CACHE_PREFIX = 'concert';

  constructor(
    @InjectModel(Concert.name) private concertModel: Model<ConcertDocument>,
    private readonly seatTypeService: SeatTypeService,
    private readonly cacheService: CacheService,
  ) {}

  async create(createConcertDto: CreateConcertDto): Promise<ConcertDocument> {
    await this.validateSeatTypes(createConcertDto.seatTypes);
    const createdConcert = await this.concertModel.create(createConcertDto);
    await this.invalidateCache();
    return createdConcert;
  }

  async findAll(query: any = {}): Promise<ConcertDocument[]> {
    const cacheKey = this.cacheService.generateKey(this.CACHE_PREFIX, 'list', JSON.stringify(query));
    const cached = await this.cacheService.get<ConcertDocument[]>(cacheKey);
    
    if (cached) {
      return cached;
    }

    const concerts = await this.concertModel.find(query).exec();
    await this.cacheService.set(cacheKey, concerts, this.CACHE_TTL);
    return concerts;
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
    if (updateConcertDto.seatTypes) {
      await this.validateSeatTypes(updateConcertDto.seatTypes);
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
    await this.invalidateCache(id);
  }

  async getConcertWithSeatTypes(id: string): Promise<any> {
    const cacheKey = this.cacheService.generateKey(this.CACHE_PREFIX, 'with-seats', id);
    const cached = await this.cacheService.get<any>(cacheKey);

    if (cached) {
      return cached;
    }

    const concert = await this.findOne(id);
    const seatTypes = await Promise.all(
      concert.seatTypes.map(seatTypeId => 
        this.seatTypeService.findOne(seatTypeId)
      )
    );

    const result = {
      ...concert.toObject(),
      seatTypes,
    };

    await this.cacheService.set(cacheKey, result, this.CACHE_TTL);
    return result;
  }

  async checkSeatAvailability(concertId: string, seatTypeId: string): Promise<boolean> {
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

  private async validateSeatTypes(seatTypeIds: string[]): Promise<void> {
    const seatTypes = await Promise.all(
      seatTypeIds.map(id => this.seatTypeService.findOne(id))
    );

    const invalidIds = seatTypeIds.filter(
      (id, index) => !seatTypes[index],
    );

    if (invalidIds.length > 0) {
      throw new BadRequestException(
        `Invalid seat type IDs: ${invalidIds.join(', ')}`,
      );
    }
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
} 