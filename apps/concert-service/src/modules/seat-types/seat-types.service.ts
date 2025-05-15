import { Injectable, NotFoundException, Inject, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { UpdateSeatTypeDto } from '../../common/dto/update-seat-type.dto';
import { CreateSeatTypesDto } from '../../common/dto/create-seat-types.dto';
import { REDIS_CLIENT } from '../redis/redis.provider';
import Redis from 'ioredis';
import { SeatType, SeatTypeDocument } from '../../schemas/seat-type.schema';

@Injectable()
export class SeatTypeService implements OnModuleInit {
  constructor(
    @InjectModel(SeatType.name) private seatTypeModel: Model<SeatTypeDocument>,
    @Inject(REDIS_CLIENT) private readonly redisClient: Redis,
  ) {}

  async onModuleInit() {
    try {
      console.log('Initializing seat types in Redis...');
      const seatTypes = await this.seatTypeModel.find().exec();
      
      for (const seatType of seatTypes) {
        const redisKey = `concert:${seatType.concertId}:seatType:${seatType._id}:available`;
        await this.redisClient.set(redisKey, seatType.capacity);
        console.log(`Initialized Redis key ${redisKey} with capacity ${seatType.capacity}`);
      }
      
      console.log(`Successfully initialized ${seatTypes.length} seat types in Redis`);
    } catch (error) {
      console.error('Failed to initialize seat types in Redis:', error);
      throw error;
    }
  }

  async create(concertId: string, createSeatTypeDto: CreateSeatTypesDto) {
    const seatTypes = createSeatTypeDto.seatTypes.map(seatType => ({
      name: seatType.name,
      description: seatType.description,
      price: seatType.price,
      capacity: seatType.capacity,
      total: seatType.capacity,
      concertId,
      isActive: true,
    }));
    const createdSeatTypes = await this.seatTypeModel.insertMany(seatTypes);
    // Set available seats in Redis for each seat type
    for (const seatType of createdSeatTypes) {
      await this.redisClient.set(
        `concert:${concertId}:seatType:${seatType._id}:available`,
        seatType.capacity
      );
    }
    return createdSeatTypes;
  }

  async findAll(): Promise<SeatType[]> {
    return this.seatTypeModel.find().exec();
  }

  async findOne(id: string): Promise<SeatTypeDocument> {
    const seatType = await this.seatTypeModel.findById(id).exec();
    if (!seatType) {
      throw new NotFoundException(`Seat type with ID ${id} not found`);
    }
    return seatType;
  }

  async update(id: string, updateSeatTypeDto: UpdateSeatTypeDto): Promise<SeatType> {
    const updatedSeatType = await this.seatTypeModel
      .findByIdAndUpdate(id, updateSeatTypeDto, { new: true })
      .exec();

    if (!updatedSeatType) {
      throw new NotFoundException(`Seat type with ID ${id} not found`);
    }

    return updatedSeatType;
  }

  async remove(id: string): Promise<void> {
    const result = await this.seatTypeModel.deleteOne({ _id: id }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(`Seat type with ID ${id} not found`);
    }
  }

  async findAllByConcertId(concertId: string) {
    return this.seatTypeModel.find({ concertId }).exec();
  }

  async findOneByConcertId(concertId: string, id: string) {
    const seatType = await this.seatTypeModel.findOne({ _id: id }).exec();

    if (!seatType) {
      throw new NotFoundException(`Seat type ${id} not found for concert ${concertId}`);
    }
    return seatType;
  }
} 