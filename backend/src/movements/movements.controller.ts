import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { CreateMovementDto } from './dto/create-movement.dto';
import { QueryMovementsDto } from './dto/query-movements.dto';
import {
  MovementTransactionResponse,
  MovementsService,
} from './movements.service';

@Controller('movements')
export class MovementsController {
  constructor(private readonly movementsService: MovementsService) {}

  @Post()
  recordMovement(
    @Body() dto: CreateMovementDto,
  ): Promise<MovementTransactionResponse> {
    return this.movementsService.recordMovement(dto);
  }

  @Get()
  findAll(@Query() query: QueryMovementsDto) {
    return this.movementsService.findAll(query);
  }
}

