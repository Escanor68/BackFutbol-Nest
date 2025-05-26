import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SoccerField } from '../src/soccer-field/entities/soccer-field.entity';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard';

describe('SoccerFieldController (e2e)', () => {
  let app: INestApplication;
  const mockJwtGuard = { canActivate: jest.fn() };
  const mockRepository = {
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      addSelect: jest.fn().mockReturnThis(),
      having: jest.fn().mockReturnThis(),
      setParameters: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    })),
  };

  const validToken = 'valid.jwt.token';
  const invalidToken = 'invalid.token';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(getRepositoryToken(SoccerField))
      .useValue(mockRepository)
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockJwtGuard.canActivate.mockImplementation((context) => {
      const request = context.switchToHttp().getRequest();
      const token = request.headers.authorization?.split(' ')[1];
      return token === validToken;
    });
  });

  describe('/api/v1/soccer-fields/create (POST)', () => {
    const createDto = {
      userField: 1,
      fieldName: 'Field 1',
      availableFrom: '09:00',
      availableUntil: '18:00',
      price: 100,
    };

    it('should create shifts successfully with valid token', () => {
      return request(app.getHttpServer())
        .post('/api/v1/soccer-fields/create')
        .set('Authorization', `Bearer ${validToken}`)
        .send(createDto)
        .expect(HttpStatus.CREATED);
    });

    it('should fail with invalid token', () => {
      return request(app.getHttpServer())
        .post('/api/v1/soccer-fields/create')
        .set('Authorization', `Bearer ${invalidToken}`)
        .send(createDto)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should fail without token', () => {
      return request(app.getHttpServer())
        .post('/api/v1/soccer-fields/create')
        .send(createDto)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should fail with invalid data', () => {
      const invalidDto = {
        userField: 'invalid',
        fieldName: 'Field 1',
        availableFrom: '9:00',
        availableUntil: '18:00',
        price: 'invalid',
        extraField: 'should not be here',
      };

      return request(app.getHttpServer())
        .post('/api/v1/soccer-fields/create')
        .set('Authorization', `Bearer ${validToken}`)
        .send(invalidDto)
        .expect(HttpStatus.BAD_REQUEST)
        .expect(res => {
          expect(res.body.message).toContain('validation failed');
        });
    });

    it('should handle server errors', () => {
      mockRepository.save.mockRejectedValueOnce(new Error('Database error'));

      return request(app.getHttpServer())
        .post('/api/v1/soccer-fields/create')
        .set('Authorization', `Bearer ${validToken}`)
        .send(createDto)
        .expect(HttpStatus.INTERNAL_SERVER_ERROR);
    });
  });

  describe('/api/v1/soccer-fields (GET)', () => {
    it('should return fields by owner with valid token', async () => {
      const mockFields = [
        { id: '1', fieldName: 'Field 1' },
        { id: '2', fieldName: 'Field 2' },
      ];
      mockRepository.find.mockResolvedValue(mockFields);

      const response = await request(app.getHttpServer())
        .get('/api/v1/soccer-fields')
        .set('Authorization', `Bearer ${validToken}`)
        .query({ userField: 1 })
        .expect(HttpStatus.OK);

      expect(response.body).toEqual(mockFields);
    });

    it('should return empty array when no fields found', async () => {
      mockRepository.find.mockResolvedValue([]);

      const response = await request(app.getHttpServer())
        .get('/api/v1/soccer-fields')
        .set('Authorization', `Bearer ${validToken}`)
        .query({ userField: 1 })
        .expect(HttpStatus.OK);

      expect(response.body).toEqual([]);
    });

    it('should fail with invalid token', () => {
      return request(app.getHttpServer())
        .get('/api/v1/soccer-fields')
        .set('Authorization', `Bearer ${invalidToken}`)
        .query({ userField: 1 })
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should handle server errors', () => {
      mockRepository.find.mockRejectedValueOnce(new Error('Database error'));

      return request(app.getHttpServer())
        .get('/api/v1/soccer-fields')
        .set('Authorization', `Bearer ${validToken}`)
        .query({ userField: 1 })
        .expect(HttpStatus.INTERNAL_SERVER_ERROR);
    });
  });

  describe('/api/v1/soccer-fields/reserve (POST)', () => {
    const reserveDto = {
      owner: 1,
      fieldName: 'Field 1',
      schedule: '09:00 a 10:30',
      whoReservedId: 2,
      whoReservedName: 'John Doe',
    };

    it('should reserve a field successfully with valid token', () => {
      mockRepository.findOne.mockResolvedValue({
        ...reserveDto,
        id: '1',
        reservation: 'Inactive',
      });

      return request(app.getHttpServer())
        .post('/api/v1/soccer-fields/reserve')
        .set('Authorization', `Bearer ${validToken}`)
        .send(reserveDto)
        .expect(HttpStatus.OK);
    });

    it('should fail when field is already reserved', () => {
      mockRepository.findOne.mockResolvedValue({
        ...reserveDto,
        id: '1',
        reservation: 'Active',
      });

      return request(app.getHttpServer())
        .post('/api/v1/soccer-fields/reserve')
        .set('Authorization', `Bearer ${validToken}`)
        .send(reserveDto)
        .expect(HttpStatus.CONFLICT);
    });

    it('should fail when field does not exist', () => {
      mockRepository.findOne.mockResolvedValue(null);

      return request(app.getHttpServer())
        .post('/api/v1/soccer-fields/reserve')
        .set('Authorization', `Bearer ${validToken}`)
        .send(reserveDto)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should validate required fields', () => {
      const invalidDto = {
        owner: 1,
        // Missing required fields
      };

      return request(app.getHttpServer())
        .post('/api/v1/soccer-fields/reserve')
        .set('Authorization', `Bearer ${validToken}`)
        .send(invalidDto)
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('/api/v1/soccer-fields/release (POST)', () => {
    it('should release a field successfully with valid token', () => {
      mockRepository.findOne.mockResolvedValue({
        id: '1',
        reservation: 'Active',
        whoReservedId: 1,
        whoReservedName: 'John Doe',
      });

      return request(app.getHttpServer())
        .post('/api/v1/soccer-fields/release')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ id: '1' })
        .expect(HttpStatus.OK);
    });

    it('should fail when field does not exist', () => {
      mockRepository.findOne.mockResolvedValue(null);

      return request(app.getHttpServer())
        .post('/api/v1/soccer-fields/release')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ id: '1' })
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should fail when field is already available', () => {
      mockRepository.findOne.mockResolvedValue({
        id: '1',
        reservation: 'Inactive',
      });

      return request(app.getHttpServer())
        .post('/api/v1/soccer-fields/release')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ id: '1' })
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('/api/v1/soccer-fields/nearby (GET)', () => {
    it('should return nearby fields with valid parameters', async () => {
      const mockFields = [
        { id: '1', fieldName: 'Field 1', latitude: 1, longitude: 1 },
        { id: '2', fieldName: 'Field 2', latitude: 1.1, longitude: 1.1 },
      ];
      mockRepository.createQueryBuilder().getMany.mockResolvedValue(mockFields);

      const response = await request(app.getHttpServer())
        .get('/api/v1/soccer-fields/nearby')
        .set('Authorization', `Bearer ${validToken}`)
        .query({ latitude: 1, longitude: 1, radius: 10 })
        .expect(HttpStatus.OK);

      expect(response.body).toEqual(mockFields);
    });

    it('should use default radius when not provided', () => {
      return request(app.getHttpServer())
        .get('/api/v1/soccer-fields/nearby')
        .set('Authorization', `Bearer ${validToken}`)
        .query({ latitude: 1, longitude: 1 })
        .expect(HttpStatus.OK);
    });

    it('should fail with invalid coordinates', () => {
      return request(app.getHttpServer())
        .get('/api/v1/soccer-fields/nearby')
        .set('Authorization', `Bearer ${validToken}`)
        .query({ latitude: 'invalid', longitude: 'invalid' })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should fail with invalid radius', () => {
      return request(app.getHttpServer())
        .get('/api/v1/soccer-fields/nearby')
        .set('Authorization', `Bearer ${validToken}`)
        .query({ latitude: 1, longitude: 1, radius: -1 })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should handle empty results', async () => {
      mockRepository.createQueryBuilder().getMany.mockResolvedValue([]);

      const response = await request(app.getHttpServer())
        .get('/api/v1/soccer-fields/nearby')
        .set('Authorization', `Bearer ${validToken}`)
        .query({ latitude: 1, longitude: 1 })
        .expect(HttpStatus.OK);

      expect(response.body).toEqual([]);
    });
  });
}); 