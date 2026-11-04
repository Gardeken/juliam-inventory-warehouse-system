import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { QueryProductsDto } from './dto/query-products.dto';
import {
  EnrichedProductView,
  ProductsService,
  WarehouseKpiSummary,
} from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findAll(@Query() query: QueryProductsDto): Promise<EnrichedProductView[]> {
    return this.productsService.findAll(query);
  }

  @Get('kpis')
  getKpis(): Promise<WarehouseKpiSummary> {
    return this.productsService.getWarehouseKpis();
  }

  @Get('replenishment-alerts')
  getReplenishmentAlerts(): Promise<EnrichedProductView[]> {
    return this.productsService.getReplenishmentAlerts();
  }

  @Get(':skuCode')
  findBySku(@Param('skuCode') skuCode: string) {
    return this.productsService.findBySku(skuCode);
  }

  @Post()
  create(@Body() dto: CreateProductDto): Promise<EnrichedProductView> {
    return this.productsService.create(dto);
  }
}
