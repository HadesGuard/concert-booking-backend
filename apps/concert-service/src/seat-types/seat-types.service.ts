import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SeatType, SeatTypeDocument } from './schemas/seat-type.schema';
import { CreateSeatTypeDto } from './dto/create-seat-type.dto';
import { UpdateSeatTypeDto } from './dto/update-seat-type.dto';

@Injectable()
export class SeatTypeService {
  constructor(
    @InjectModel(SeatType.name) private seatTypeModel: Model<SeatTypeDocument>,
  ) {}

  async create(createSeatTypeDto: CreateSeatTypeDto): Promise<SeatType> {
    const createdSeatType = new this.seatTypeModel(createSeatTypeDto);
    return createdSeatType.save();
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
} 