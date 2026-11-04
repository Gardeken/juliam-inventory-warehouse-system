import { Controller, Get, Module } from '@nestjs/common';
import { MovementsModule } from './movements/movements.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProductsModule } from './products/products.module';

@Controller('health')
export class HealthController {
  @Get()
  check() {
    return {
      status: 'ok',
      service: 'juliam-warehouse-backend',
      timestamp: new Date().toISOString(),
    };
  }
}

@Module({
  imports: [PrismaModule, ProductsModule, MovementsModule],
  controllers: [HealthController],
})
export class AppModule {}
