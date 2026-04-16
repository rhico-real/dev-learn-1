# RunHop Phase 3 Payments Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a manual payment verification flow for race registrations — users submit proof-of-payment screenshots, org admins review and approve or reject them.

**Architecture:** One new `payment` module inside the Event context (`src/domain/event/payment/`). Payment drives registration status through domain events: approved payment auto-confirms registration, 3rd rejected payment auto-cancels it. Free races (price = 0) auto-confirm at registration time with no payment needed.

**Tech Stack:** NestJS 11, TypeScript (strict), Prisma, PostgreSQL 16, Jest, Supertest, class-validator, `@nestjs/event-emitter` (already installed)

**Spec:** `docs/superpowers/specs/2026-04-16-runhop-phase3-payments-design.md`

**Audience:** Flutter/Dart developer who completed Phase 1 and Phase 2 and is comfortable with the NestJS module-controller-service flow, DTOs, guards, cursor pagination, and domain events.

**Learning approach:** Still guided, but leaning harder on business logic. This phase pushes you on status state machines, admin review workflows, retry limits, and cross-module side effects that mutate another entity's state.

---

## What Gets Harder In Phase 3

Phase 1 was write-focused CRUD. Phase 2 added read-heavy patterns (feed, notifications, viewer flags). Phase 3 introduces **transactional business flows**:

- A payment has a lifecycle with enforced status transitions (not just create/update/delete)
- An action in one module (approve payment) must trigger a state change in another module (confirm registration)
- Retry logic with a hard limit that triggers a different side effect on the final failure
- Admin review endpoints that require verifying org membership through the event's parent org
- The "free race" rule cuts across registration and payment — you need to decide where each concern lives

This is closer to real production backend work: state machines, business rules, and cross-module coordination.

---

## File Map

### Prisma

- Modify: `prisma/schema.prisma` — add `PaymentMethod` enum, `PaymentStatus` enum, and `Payment` model

### Payment Module

- Create: `src/domain/event/payment/payment.module.ts`
- Create: `src/domain/event/payment/payment.controller.ts`
- Create: `src/domain/event/payment/payment.service.ts`
- Create: `src/domain/event/payment/payment.service.spec.ts`
- Create: `src/domain/event/payment/dto/create-payment.dto.ts`
- Create: `src/domain/event/payment/dto/review-payment.dto.ts`

### Registration Module (small update)

- Modify: `src/domain/event/registration/registration.service.ts` — add free-race auto-confirm logic and payment event listeners

### Event Context Wiring

- Modify: `src/domain/event/event-context.module.ts` — import and export `PaymentModule`

### End-to-End Tests

- Create: `test/e2e/payment.e2e-spec.ts`

---

## Task 1: Extend The Prisma Schema For Payment

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add the new enums**

Add near the existing enums in `prisma/schema.prisma`:

```prisma
enum PaymentMethod {
  GCASH
  MAYA
}

enum PaymentStatus {
  SUBMITTED
  UNDER_REVIEW
  APPROVED
  REJECTED
}
```

- [ ] **Step 2: Add the `Payment` model**

```prisma
model Payment {
  id String @id @default(uuid())

  registration   Registration @relation(fields: [registrationId], references: [id])
  registrationId String

  method   PaymentMethod
  amount   Int
  currency String        @default("PHP")

  proofImage String

  status PaymentStatus @default(SUBMITTED)

  reviewedBy      String?
  reviewedAt      DateTime?
  rejectionReason String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([registrationId, status])
  @@index([status, createdAt])
}
```

- [ ] **Step 3: Add the back-relation on `Registration`**

Add to the existing `Registration` model:

```prisma
  payments Payment[]
```

- [ ] **Step 4: Run Prisma format and generate**

Run:

```bash
npx prisma format
npx prisma generate
```

Expected: schema formats successfully and Prisma Client regenerates without relation errors.

- [ ] **Step 5: Create and apply the migration**

Run:

```bash
npx prisma migrate dev --name add_payment_model
```

Expected: a new migration directory is created and the local database is updated.

- [ ] **Step 6: Regenerate the ERD**

Run:

```bash
npx prisma generate
```

Expected: `docs/erd.svg` updates to include the `Payment` table.

- [ ] **Step 7: Commit**

```bash
git add prisma/schema.prisma prisma/migrations docs/erd.svg
git commit -m "feat: add Payment prisma model for Phase 3"
```

---

## Task 2: Scaffold The Payment Module And Context Wiring

**Files:**
- Create: `src/domain/event/payment/payment.module.ts`
- Create: `src/domain/event/payment/payment.controller.ts`
- Create: `src/domain/event/payment/payment.service.ts`
- Modify: `src/domain/event/event-context.module.ts`

- [ ] **Step 1: Create the payment module file**

```ts
// src/domain/event/payment/payment.module.ts
import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { RegistrationModule } from '../registration/registration.module';
import { RaceModule } from '../race/race.module';
import { OrganizationContextModule } from '../../organization/organization-context.module';

@Module({
  imports: [RegistrationModule, RaceModule, OrganizationContextModule],
  providers: [PaymentService],
  controllers: [PaymentController],
  exports: [PaymentService],
})
export class PaymentModule {}
```

- [ ] **Step 2: Create an empty controller**

```ts
// src/domain/event/payment/payment.controller.ts
import { Controller } from '@nestjs/common';
import { PaymentService } from './payment.service';

@Controller()
export class PaymentController {
  constructor(private paymentService: PaymentService) {}
}
```

- [ ] **Step 3: Create an empty service**

```ts
// src/domain/event/payment/payment.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';

@Injectable()
export class PaymentService {
  constructor(private prisma: PrismaService) {}
}
```

- [ ] **Step 4: Wire the payment module into the event context**

Update `src/domain/event/event-context.module.ts`:

```ts
import { Module } from '@nestjs/common';
import { EventModule } from './event/event.module';
import { RaceModule } from './race/race.module';
import { RegistrationModule } from './registration/registration.module';
import { PaymentModule } from './payment/payment.module';
import { OrganizationContextModule } from '../organization/organization-context.module';

@Module({
  imports: [
    EventModule,
    RaceModule,
    RegistrationModule,
    PaymentModule,
    OrganizationContextModule,
  ],
  exports: [EventModule, RaceModule, RegistrationModule, PaymentModule],
})
export class EventContextModule {}
```

- [ ] **Step 5: Verify the app still boots**

Run:

```bash
npm run build
```

Expected: the project builds with the empty payment module and no import-path errors.

- [ ] **Step 6: Commit**

```bash
git add src/domain/event/payment src/domain/event/event-context.module.ts
git commit -m "feat: scaffold payment module"
```

---

## Task 3: Create The Payment DTOs

**Files:**
- Create: `src/domain/event/payment/dto/create-payment.dto.ts`
- Create: `src/domain/event/payment/dto/review-payment.dto.ts`

- [ ] **Step 1: Create the submission DTO**

```ts
// src/domain/event/payment/dto/create-payment.dto.ts
import { IsEnum, IsInt, IsString, Min } from 'class-validator';
import { PaymentMethod } from '@prisma/client';

export class CreatePaymentDto {
  @IsEnum(PaymentMethod)
  method!: PaymentMethod;

  @IsInt()
  @Min(1)
  amount!: number;

  @IsString()
  currency!: string;

  @IsString()
  proofImage!: string;
}
```

- [ ] **Step 2: Create the review DTO**

```ts
// src/domain/event/payment/dto/review-payment.dto.ts
import { IsEnum, IsOptional, IsString, ValidateIf } from 'class-validator';

export enum ReviewAction {
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
}

export class ReviewPaymentDto {
  @IsEnum(ReviewAction)
  action!: ReviewAction;

  @ValidateIf((o) => o.action === ReviewAction.REJECT)
  @IsString()
  rejectionReason?: string;
}
```

- [ ] **Step 3: Verify build**

Run:

```bash
npm run build
```

Expected: no TypeScript errors from the new DTOs.

- [ ] **Step 4: Commit**

```bash
git add src/domain/event/payment/dto
git commit -m "feat: add payment DTOs"
```

---

## Task 4: Implement Payment Submission

**Files:**
- Modify: `src/domain/event/payment/payment.service.ts`
- Create: `src/domain/event/payment/payment.service.spec.ts`

- [ ] **Step 1: Write the failing tests for payment submission**

Create `src/domain/event/payment/payment.service.spec.ts`:

```ts
import { Test, TestingModule } from '@nestjs/testing';
import { PaymentService } from './payment.service';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { RegistrationService } from '../registration/registration.service';
import { RaceService } from '../race/race.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';

describe('PaymentService', () => {
  let service: PaymentService;
  let prisma: any;
  let registrationService: any;
  let raceService: any;

  beforeEach(async () => {
    prisma = {
      payment: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
      registration: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };

    registrationService = {
      findById: jest.fn(),
    };

    raceService = {
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        { provide: PrismaService, useValue: prisma },
        { provide: RegistrationService, useValue: registrationService },
        { provide: RaceService, useValue: raceService },
        { provide: EventEmitter2, useValue: { emit: jest.fn() } },
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
  });

  describe('create', () => {
    const userId = 'user-1';
    const registrationId = 'reg-1';
    const dto = {
      method: 'GCASH' as const,
      amount: 50000,
      currency: 'PHP',
      proofImage: 'https://example.com/proof.jpg',
    };

    it('should create a payment for own registration', async () => {
      registrationService.findById.mockResolvedValue({
        id: registrationId,
        userId,
        raceId: 'race-1',
        status: 'PENDING',
      });
      raceService.findById.mockResolvedValue({
        id: 'race-1',
        price: 50000,
        currency: 'PHP',
      });
      prisma.payment.count.mockResolvedValue(0);
      prisma.payment.findFirst = jest.fn().mockResolvedValue(null);
      prisma.payment.create.mockResolvedValue({
        id: 'payment-1',
        registrationId,
        ...dto,
        status: 'SUBMITTED',
      });

      const result = await service.create(userId, registrationId, dto);
      expect(result.status).toBe('SUBMITTED');
    });

    it('should throw ForbiddenException for someone elses registration', async () => {
      registrationService.findById.mockResolvedValue({
        id: registrationId,
        userId: 'other-user',
        raceId: 'race-1',
        status: 'PENDING',
      });

      await expect(
        service.create(userId, registrationId, dto),
      ).rejects.toThrow('You can only submit payment for your own registration');
    });

    it('should throw BadRequestException if registration is not PENDING', async () => {
      registrationService.findById.mockResolvedValue({
        id: registrationId,
        userId,
        raceId: 'race-1',
        status: 'CONFIRMED',
      });

      await expect(
        service.create(userId, registrationId, dto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if amount does not match race price', async () => {
      registrationService.findById.mockResolvedValue({
        id: registrationId,
        userId,
        raceId: 'race-1',
        status: 'PENDING',
      });
      raceService.findById.mockResolvedValue({
        id: 'race-1',
        price: 75000,
        currency: 'PHP',
      });
      prisma.payment.count.mockResolvedValue(0);
      prisma.payment.findFirst = jest.fn().mockResolvedValue(null);

      await expect(
        service.create(userId, registrationId, dto),
      ).rejects.toThrow('amount does not match');
    });

    it('should throw ConflictException if an active payment exists', async () => {
      registrationService.findById.mockResolvedValue({
        id: registrationId,
        userId,
        raceId: 'race-1',
        status: 'PENDING',
      });
      raceService.findById.mockResolvedValue({
        id: 'race-1',
        price: 50000,
        currency: 'PHP',
      });
      prisma.payment.count.mockResolvedValue(0);
      prisma.payment.findFirst = jest.fn().mockResolvedValue({
        id: 'existing-payment',
        status: 'SUBMITTED',
      });

      await expect(
        service.create(userId, registrationId, dto),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException if 3 rejected payments already exist', async () => {
      registrationService.findById.mockResolvedValue({
        id: registrationId,
        userId,
        raceId: 'race-1',
        status: 'PENDING',
      });
      raceService.findById.mockResolvedValue({
        id: 'race-1',
        price: 50000,
        currency: 'PHP',
      });
      prisma.payment.count.mockResolvedValue(3);

      await expect(
        service.create(userId, registrationId, dto),
      ).rejects.toThrow('Maximum payment attempts reached');
    });
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run:

```bash
npm test -- payment.service.spec.ts
```

Expected: all tests fail because `create()` does not exist on `PaymentService`.

- [ ] **Step 3: Implement the `create` method**

Update `src/domain/event/payment/payment.service.ts`:

```ts
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { RegistrationService } from '../registration/registration.service';
import { RaceService } from '../race/race.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

const MAX_PAYMENT_ATTEMPTS = 3;

@Injectable()
export class PaymentService {
  constructor(
    private prisma: PrismaService,
    private registrationService: RegistrationService,
    private raceService: RaceService,
    private eventEmitter: EventEmitter2,
  ) {}

  async create(userId: string, registrationId: string, dto: CreatePaymentDto) {
    const registration = await this.registrationService.findById(registrationId);

    if (!registration) {
      throw new NotFoundException('Registration not found');
    }

    if (registration.userId !== userId) {
      throw new ForbiddenException(
        'You can only submit payment for your own registration',
      );
    }

    if (registration.status !== 'PENDING') {
      throw new BadRequestException(
        'Payment can only be submitted for pending registrations',
      );
    }

    const race = await this.raceService.findById(registration.raceId);

    if (!race) {
      throw new NotFoundException('Race not found');
    }

    const rejectedCount = await this.prisma.payment.count({
      where: { registrationId, status: 'REJECTED' },
    });

    if (rejectedCount >= MAX_PAYMENT_ATTEMPTS) {
      throw new BadRequestException('Maximum payment attempts reached');
    }

    const activePayment = await this.prisma.payment.findFirst({
      where: {
        registrationId,
        status: { in: ['SUBMITTED', 'UNDER_REVIEW'] },
      },
    });

    if (activePayment) {
      throw new ConflictException(
        'A payment is already pending review for this registration',
      );
    }

    if (dto.amount !== race.price) {
      throw new BadRequestException(
        `Payment amount does not match race price. Expected ${race.price}, got ${dto.amount}`,
      );
    }

    return this.prisma.payment.create({
      data: {
        registrationId,
        method: dto.method,
        amount: dto.amount,
        currency: dto.currency,
        proofImage: dto.proofImage,
      },
    });
  }
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run:

```bash
npm test -- payment.service.spec.ts
```

Expected: all submission tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/domain/event/payment/payment.service.ts src/domain/event/payment/payment.service.spec.ts
git commit -m "feat: implement payment submission with validation"
```

---

## Task 5: Implement Payment Review (Approve/Reject)

**Files:**
- Modify: `src/domain/event/payment/payment.service.ts`
- Modify: `src/domain/event/payment/payment.service.spec.ts`

- [ ] **Step 1: Write the failing tests for review**

Add to `payment.service.spec.ts`:

```ts
  describe('review', () => {
    const adminId = 'admin-1';
    const paymentId = 'payment-1';

    it('should approve a submitted payment', async () => {
      prisma.payment.findUnique.mockResolvedValue({
        id: paymentId,
        registrationId: 'reg-1',
        status: 'SUBMITTED',
      });
      prisma.payment.update.mockResolvedValue({
        id: paymentId,
        status: 'APPROVED',
        reviewedBy: adminId,
        reviewedAt: expect.any(Date),
      });

      const result = await service.review(paymentId, adminId, {
        action: 'APPROVE' as any,
      });

      expect(result.status).toBe('APPROVED');
      expect(result.reviewedBy).toBe(adminId);
    });

    it('should reject a submitted payment with reason', async () => {
      prisma.payment.findUnique.mockResolvedValue({
        id: paymentId,
        registrationId: 'reg-1',
        status: 'SUBMITTED',
      });
      prisma.payment.update.mockResolvedValue({
        id: paymentId,
        status: 'REJECTED',
        rejectionReason: 'Blurry screenshot',
        reviewedBy: adminId,
      });
      prisma.payment.count.mockResolvedValue(1);

      const result = await service.review(paymentId, adminId, {
        action: 'REJECT' as any,
        rejectionReason: 'Blurry screenshot',
      });

      expect(result.status).toBe('REJECTED');
    });

    it('should throw BadRequestException when rejecting without reason', async () => {
      prisma.payment.findUnique.mockResolvedValue({
        id: paymentId,
        registrationId: 'reg-1',
        status: 'SUBMITTED',
      });

      await expect(
        service.review(paymentId, adminId, {
          action: 'REJECT' as any,
        }),
      ).rejects.toThrow('Rejection reason is required');
    });

    it('should throw BadRequestException for already reviewed payment', async () => {
      prisma.payment.findUnique.mockResolvedValue({
        id: paymentId,
        status: 'APPROVED',
      });

      await expect(
        service.review(paymentId, adminId, { action: 'APPROVE' as any }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should emit payment.approved event on approval', async () => {
      const emitSpy = jest.spyOn(service['eventEmitter'], 'emit');
      prisma.payment.findUnique.mockResolvedValue({
        id: paymentId,
        registrationId: 'reg-1',
        status: 'SUBMITTED',
      });
      prisma.payment.update.mockResolvedValue({
        id: paymentId,
        registrationId: 'reg-1',
        status: 'APPROVED',
        reviewedBy: adminId,
      });

      await service.review(paymentId, adminId, { action: 'APPROVE' as any });

      expect(emitSpy).toHaveBeenCalledWith('payment.approved', {
        paymentId,
        registrationId: 'reg-1',
      });
    });

    it('should emit payment.rejected event with attempt count on rejection', async () => {
      const emitSpy = jest.spyOn(service['eventEmitter'], 'emit');
      prisma.payment.findUnique.mockResolvedValue({
        id: paymentId,
        registrationId: 'reg-1',
        status: 'SUBMITTED',
      });
      prisma.payment.update.mockResolvedValue({
        id: paymentId,
        registrationId: 'reg-1',
        status: 'REJECTED',
        rejectionReason: 'Invalid proof',
        reviewedBy: adminId,
      });
      prisma.payment.count.mockResolvedValue(3);

      await service.review(paymentId, adminId, {
        action: 'REJECT' as any,
        rejectionReason: 'Invalid proof',
      });

      expect(emitSpy).toHaveBeenCalledWith('payment.rejected', {
        paymentId,
        registrationId: 'reg-1',
        rejectedCount: 3,
      });
    });
  });
```

- [ ] **Step 2: Run the tests to verify they fail**

Run:

```bash
npm test -- payment.service.spec.ts
```

Expected: review tests fail because `review()` does not exist.

- [ ] **Step 3: Implement the `review` method**

Add to `PaymentService`:

```ts
import { ReviewPaymentDto, ReviewAction } from './dto/review-payment.dto';

  async review(
    paymentId: string,
    reviewerId: string,
    dto: ReviewPaymentDto,
  ) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.status !== 'SUBMITTED') {
      throw new BadRequestException(
        'Only submitted payments can be reviewed',
      );
    }

    if (dto.action === ReviewAction.REJECT && !dto.rejectionReason) {
      throw new BadRequestException('Rejection reason is required');
    }

    const now = new Date();

    if (dto.action === ReviewAction.APPROVE) {
      const updated = await this.prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: 'APPROVED',
          reviewedBy: reviewerId,
          reviewedAt: now,
        },
      });

      this.eventEmitter.emit('payment.approved', {
        paymentId: updated.id,
        registrationId: updated.registrationId,
      });

      return updated;
    }

    const updated = await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'REJECTED',
        reviewedBy: reviewerId,
        reviewedAt: now,
        rejectionReason: dto.rejectionReason,
      },
    });

    const rejectedCount = await this.prisma.payment.count({
      where: { registrationId: payment.registrationId, status: 'REJECTED' },
    });

    this.eventEmitter.emit('payment.rejected', {
      paymentId: updated.id,
      registrationId: updated.registrationId,
      rejectedCount,
    });

    return updated;
  }
```

- [ ] **Step 4: Run the tests to verify they pass**

Run:

```bash
npm test -- payment.service.spec.ts
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/domain/event/payment/payment.service.ts src/domain/event/payment/payment.service.spec.ts
git commit -m "feat: implement payment review (approve/reject)"
```

---

## Task 6: Implement Payment Read Methods

**Files:**
- Modify: `src/domain/event/payment/payment.service.ts`
- Modify: `src/domain/event/payment/payment.service.spec.ts`

- [ ] **Step 1: Write failing tests for read methods**

Add to `payment.service.spec.ts`:

```ts
  describe('findById', () => {
    it('should return a payment by id', async () => {
      prisma.payment.findUnique.mockResolvedValue({
        id: 'payment-1',
        status: 'SUBMITTED',
      });

      const result = await service.findById('payment-1');
      expect(result.id).toBe('payment-1');
    });

    it('should throw NotFoundException if payment does not exist', async () => {
      prisma.payment.findUnique.mockResolvedValue(null);

      await expect(service.findById('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('listByRegistration', () => {
    it('should return payments for a registration with cursor pagination', async () => {
      prisma.payment.findMany.mockResolvedValue([
        { id: 'p-1', status: 'REJECTED', createdAt: new Date() },
        { id: 'p-2', status: 'SUBMITTED', createdAt: new Date() },
      ]);

      const result = await service.listByRegistration('reg-1');
      expect(result.data).toHaveLength(2);
      expect(result.meta.cursor).toBe('p-2');
    });
  });

  describe('listByEvent', () => {
    it('should return payments for all registrations in an event', async () => {
      prisma.payment.findMany.mockResolvedValue([
        { id: 'p-1', status: 'SUBMITTED', createdAt: new Date() },
      ]);

      const result = await service.listByEvent('event-1');
      expect(result.data).toHaveLength(1);
    });

    it('should filter by status when provided', async () => {
      prisma.payment.findMany.mockResolvedValue([]);

      await service.listByEvent('event-1', undefined, 20, 'SUBMITTED');
      expect(prisma.payment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'SUBMITTED',
          }),
        }),
      );
    });
  });
```

- [ ] **Step 2: Run the tests to verify they fail**

Run:

```bash
npm test -- payment.service.spec.ts
```

Expected: read method tests fail because the methods do not exist.

- [ ] **Step 3: Implement the read methods**

Add to `PaymentService`:

```ts
  async findById(paymentId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return payment;
  }

  async listByRegistration(
    registrationId: string,
    cursor?: string,
    take: number = 20,
  ) {
    const args: Prisma.PaymentFindManyArgs = {
      take,
      where: { registrationId },
      orderBy: { createdAt: 'desc' },
    };

    if (cursor) {
      args.skip = 1;
      args.cursor = { id: cursor };
    }

    const payments = await this.prisma.payment.findMany(args);
    const nextCursor = payments.at(-1)?.id;

    return {
      data: payments,
      meta: { cursor: nextCursor, hasMore: payments.length === take, limit: take },
    };
  }

  async listByEvent(
    eventId: string,
    cursor?: string,
    take: number = 20,
    status?: string,
  ) {
    const where: Prisma.PaymentWhereInput = {
      registration: {
        race: {
          eventId,
        },
      },
    };

    if (status) {
      where.status = status as any;
    }

    const args: Prisma.PaymentFindManyArgs = {
      take,
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        registration: {
          select: {
            id: true,
            userId: true,
            raceId: true,
            status: true,
          },
        },
      },
    };

    if (cursor) {
      args.skip = 1;
      args.cursor = { id: cursor };
    }

    const payments = await this.prisma.payment.findMany(args);
    const nextCursor = payments.at(-1)?.id;

    return {
      data: payments,
      meta: { cursor: nextCursor, hasMore: payments.length === take, limit: take },
    };
  }
```

- [ ] **Step 4: Run the tests to verify they pass**

Run:

```bash
npm test -- payment.service.spec.ts
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/domain/event/payment/payment.service.ts src/domain/event/payment/payment.service.spec.ts
git commit -m "feat: add payment read methods with cursor pagination"
```

---

## Task 7: Implement The Payment Controller

**Files:**
- Modify: `src/domain/event/payment/payment.controller.ts`

- [ ] **Step 1: Implement the user-facing endpoints**

Update `src/domain/event/payment/payment.controller.ts`:

```ts
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { RegistrationService } from '../registration/registration.service';
import { RaceService } from '../race/race.service';
import { OrgMembershipService } from '../../organization/org-membership/org-membership.service';
import { CurrentUser } from '../../../shared/decorators/current-user.decorator';
import * as interfaces from '../../../shared/types/interfaces';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { ReviewPaymentDto } from './dto/review-payment.dto';
import { SystemRole } from '@prisma/client';

@Controller()
export class PaymentController {
  constructor(
    private paymentService: PaymentService,
    private registrationService: RegistrationService,
    private raceService: RaceService,
    private orgMembershipService: OrgMembershipService,
  ) {}

  @Post('/registrations/:id/payments')
  async create(
    @CurrentUser() user: interfaces.AuthenticatedUser,
    @Param('id') registrationId: string,
    @Body() dto: CreatePaymentDto,
  ) {
    return this.paymentService.create(user.userId, registrationId, dto);
  }

  @Get('/registrations/:id/payments')
  async listByRegistration(
    @CurrentUser() user: interfaces.AuthenticatedUser,
    @Param('id') registrationId: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: number,
  ) {
    const registration = await this.registrationService.findById(registrationId);

    if (registration.userId !== user.userId && user.role !== SystemRole.SUPER_ADMIN) {
      throw new ForbiddenException(
        'You can only view payments for your own registration',
      );
    }

    return this.paymentService.listByRegistration(
      registrationId,
      cursor,
      limit,
    );
  }

  @Get('/payments/:id')
  async findOne(
    @CurrentUser() user: interfaces.AuthenticatedUser,
    @Param('id') paymentId: string,
  ) {
    const payment = await this.paymentService.findById(paymentId);
    const registration = await this.registrationService.findById(
      payment.registrationId,
    );

    if (registration.userId !== user.userId && user.role !== SystemRole.SUPER_ADMIN) {
      const race = await this.raceService.findRaceByEvent(registration.raceId);
      await this.orgMembershipService.verifyRole(
        user.userId,
        race!.event.orgId,
        'ADMIN',
      );
    }

    return payment;
  }
}
```

- [ ] **Step 2: Add the admin-facing endpoints**

Add to the same controller:

```ts
  @Get('/events/:eventId/payments')
  async listByEvent(
    @CurrentUser() user: interfaces.AuthenticatedUser,
    @Param('eventId') eventId: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
  ) {
    if (user.role !== SystemRole.SUPER_ADMIN) {
      const event = await this.eventService.findById(eventId);
      await this.orgMembershipService.verifyRole(
        user.userId,
        event.orgId,
        'ADMIN',
      );
    }

    return this.paymentService.listByEvent(eventId, cursor, limit, status);
  }

  @Patch('/payments/:id/review')
  async review(
    @CurrentUser() user: interfaces.AuthenticatedUser,
    @Param('id') paymentId: string,
    @Body() dto: ReviewPaymentDto,
  ) {
    const payment = await this.paymentService.findById(paymentId);
    const registration = await this.registrationService.findById(
      payment.registrationId,
    );

    if (user.role !== SystemRole.SUPER_ADMIN) {
      const race = await this.raceService.findRaceByEvent(registration.raceId);
      await this.orgMembershipService.verifyRole(
        user.userId,
        race!.event.orgId,
        'ADMIN',
      );
    }

    return this.paymentService.review(paymentId, user.userId, dto);
  }
```

Note: You will need to inject `EventService` into the controller for the `listByEvent` endpoint. Add it to the constructor:

```ts
import { EventService } from '../event/event.service';

constructor(
  private paymentService: PaymentService,
  private registrationService: RegistrationService,
  private raceService: RaceService,
  private orgMembershipService: OrgMembershipService,
  private eventService: EventService,
) {}
```

And add the missing `ForbiddenException` import:

```ts
import { ForbiddenException } from '@nestjs/common';
```

- [ ] **Step 3: Update payment module imports**

Update `payment.module.ts` to import `EventModule` so `EventService` is available:

```ts
import { EventModule } from '../event/event.module';

@Module({
  imports: [RegistrationModule, RaceModule, OrganizationContextModule, EventModule],
  providers: [PaymentService],
  controllers: [PaymentController],
  exports: [PaymentService],
})
export class PaymentModule {}
```

- [ ] **Step 4: Verify build**

Run:

```bash
npm run build
```

Expected: no TypeScript errors. All endpoints are wired.

- [ ] **Step 5: Commit**

```bash
git add src/domain/event/payment
git commit -m "feat: add payment controller with user and admin endpoints"
```

---

## Task 8: Add Payment Event Listeners To Registration

**Files:**
- Modify: `src/domain/event/registration/registration.service.ts`

- [ ] **Step 1: Add the `payment.approved` listener**

Add event listener methods to `RegistrationService`:

```ts
import { OnEvent } from '@nestjs/event-emitter';

  @OnEvent('payment.approved')
  async handlePaymentApproved(event: {
    paymentId: string;
    registrationId: string;
  }) {
    await this.prisma.registration.update({
      where: { id: event.registrationId },
      data: { status: 'CONFIRMED' },
    });
  }
```

- [ ] **Step 2: Add the `payment.rejected` listener for 3rd rejection**

```ts
  @OnEvent('payment.rejected')
  async handlePaymentRejected(event: {
    paymentId: string;
    registrationId: string;
    rejectedCount: number;
  }) {
    if (event.rejectedCount >= 3) {
      await this.prisma.registration.update({
        where: { id: event.registrationId },
        data: { status: 'CANCELLED' },
      });
    }
  }
```

- [ ] **Step 3: Add the free-race auto-confirm in `create()`**

Find the `create` method in `RegistrationService`. After the registration is created, add a check:

```ts
    const registration = await this.prisma.registration.create({
      data: { userId, raceId },
    });

    // Free race: auto-confirm immediately
    if (race.price === 0) {
      return this.prisma.registration.update({
        where: { id: registration.id },
        data: { status: 'CONFIRMED' },
      });
    }

    return registration;
```

Note: the `race` variable should already be available from the capacity check earlier in the method. If the method only loads the race via `raceService.checkCapacity()`, you may need to also call `raceService.findById()` to get the price. Check the existing code and adapt.

- [ ] **Step 4: Run existing registration tests to verify no regressions**

Run:

```bash
npm test -- registration
```

Expected: existing tests still pass. If any fail because mocks don't account for the new `race.price` check, update the mocks to include `price: 50000` (a non-zero value so existing behavior is preserved).

- [ ] **Step 5: Commit**

```bash
git add src/domain/event/registration/registration.service.ts
git commit -m "feat: add payment event listeners and free-race auto-confirm"
```

---

## Task 9: Add End-To-End Coverage For Payment Flows

**Files:**
- Create: `test/e2e/payment.e2e-spec.ts`

- [ ] **Step 1: Set up the test file with required fixtures**

Create `test/e2e/payment.e2e-spec.ts`:

```ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/infrastructure/database/prisma.service';

describe('Payment (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  // Auth tokens
  let userAccessToken: string;
  let adminAccessToken: string;
  let otherUserAccessToken: string;

  // Fixture IDs
  let orgId: string;
  let eventId: string;
  let raceId: string;
  let freeRaceId: string;
  let registrationId: string;
  let freeRegistrationId: string;
  let paymentId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    prisma = app.get(PrismaService);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // Setup: register users, create org, event, races, registrations
  // Follow the same setup pattern as registration.e2e-spec.ts
  // Create:
  //   1. A normal user (registers for race)
  //   2. An admin user (org ADMIN who reviews payments)
  //   3. Another user (for ownership tests)
  //   4. An org with the admin as OWNER
  //   5. A published event
  //   6. A paid race (price: 50000)
  //   7. A free race (price: 0)
  //   8. Registrations for both races
});
```

- [ ] **Step 2: Add the setup fixtures**

Add setup `describe` blocks that:

1. Register three users and store their access tokens
2. Create an org (admin becomes OWNER)
3. Create an event, publish it
4. Create a paid race (price: 50000) and a free race (price: 0)
5. Register the normal user for both races

Follow the existing e2e test patterns — use `request(app.getHttpServer()).post(...)` with `.set('Authorization', ...)`.

- [ ] **Step 3: Add the free race auto-confirm test**

```ts
  describe('Free race auto-confirm', () => {
    it('should auto-confirm registration for free race', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/users/me/registrations`)
        .set('Authorization', `Bearer ${userAccessToken}`);

      const freeReg = res.body.data.find(
        (r: any) => r.id === freeRegistrationId,
      );
      expect(freeReg.status).toBe('CONFIRMED');
    });
  });
```

- [ ] **Step 4: Add the happy path test**

```ts
  describe('Payment submission and approval', () => {
    it('should submit payment for a pending registration', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/registrations/${registrationId}/payments`)
        .set('Authorization', `Bearer ${userAccessToken}`)
        .send({
          method: 'GCASH',
          amount: 50000,
          currency: 'PHP',
          proofImage: 'https://example.com/proof.jpg',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.data.status).toBe('SUBMITTED');
      paymentId = res.body.data.id;
    });

    it('should approve the payment and auto-confirm registration', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/payments/${paymentId}/review`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ action: 'APPROVE' });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.status).toBe('APPROVED');

      // Verify registration is now CONFIRMED
      const regRes = await request(app.getHttpServer())
        .get(`/api/v1/users/me/registrations`)
        .set('Authorization', `Bearer ${userAccessToken}`);

      const reg = regRes.body.data.find(
        (r: any) => r.id === registrationId,
      );
      expect(reg.status).toBe('CONFIRMED');
    });
  });
```

- [ ] **Step 5: Add error and permission tests**

```ts
  describe('Payment validation', () => {
    it('should return 403 when submitting for someone elses registration', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/registrations/${registrationId}/payments`)
        .set('Authorization', `Bearer ${otherUserAccessToken}`)
        .send({
          method: 'GCASH',
          amount: 50000,
          currency: 'PHP',
          proofImage: 'https://example.com/proof.jpg',
        });

      expect(res.statusCode).toBe(403);
    });

    it('should return 409 when payment already active', async () => {
      // Create a new registration and payment first, then try again
      // This test depends on having a PENDING registration with a SUBMITTED payment
      // Adapt setup as needed
    });

    it('should return 400 when amount does not match', async () => {
      // Create a new registration for a new race, then submit wrong amount
      // Adapt setup as needed
    });

    it('should return 403 when non-admin tries to review', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/payments/${paymentId}/review`)
        .set('Authorization', `Bearer ${userAccessToken}`)
        .send({ action: 'APPROVE' });

      expect(res.statusCode).toBe(403);
    });

    it('should return 400 when rejecting without reason', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/payments/${paymentId}/review`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ action: 'REJECT' });

      expect(res.statusCode).toBe(400);
    });
  });
```

- [ ] **Step 6: Add retry and auto-cancel tests**

```ts
  describe('Payment retry and auto-cancel', () => {
    // This test requires a fresh registration
    // Register a new user for a new race, then:
    // 1. Submit payment → reject (attempt 1)
    // 2. Submit payment → reject (attempt 2)
    // 3. Submit payment → reject (attempt 3) → registration auto-cancelled

    it('should allow retry after rejection', async () => {
      // Submit → reject → submit again should work
    });

    it('should auto-cancel registration after 3 rejections', async () => {
      // After 3rd rejection, check registration status = CANCELLED
    });
  });
```

- [ ] **Step 7: Add admin payment queue test**

```ts
  describe('Admin payment queue', () => {
    it('should list payments for an event', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/events/${eventId}/payments`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(res.body.meta).toBeDefined();
    });

    it('should filter payments by status', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/events/${eventId}/payments?status=SUBMITTED`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(res.statusCode).toBe(200);
      res.body.data.forEach((p: any) => {
        expect(p.status).toBe('SUBMITTED');
      });
    });

    it('should return 403 for non-admin', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/events/${eventId}/payments`)
        .set('Authorization', `Bearer ${userAccessToken}`);

      expect(res.statusCode).toBe(403);
    });
  });
```

- [ ] **Step 8: Run the e2e tests**

Run:

```bash
npm run test:e2e -- payment.e2e-spec.ts
```

Expected: all payment e2e tests pass.

- [ ] **Step 9: Commit**

```bash
git add test/e2e/payment.e2e-spec.ts
git commit -m "test: add Phase 3 payment e2e coverage"
```

---

## Task 10: Full Verification And Integration Check

**Files:**
- Modify: any files touched during cleanup

- [ ] **Step 1: Run unit tests**

Run:

```bash
npm test
```

Expected: all existing and new unit tests pass.

- [ ] **Step 2: Run e2e tests**

Run:

```bash
npm run test:e2e
```

Expected: the full API suite passes, including the new payment scenarios.

- [ ] **Step 3: Run lint and build**

Run:

```bash
npm run lint
npm run build
```

Expected: no lint or TypeScript errors remain.

- [ ] **Step 4: Review the final API surface**

Sanity check these new endpoints work alongside the existing Phase 1 and Phase 2 endpoints:

- `POST /registrations/:id/payments`
- `GET /registrations/:id/payments`
- `GET /payments/:id`
- `GET /events/:eventId/payments`
- `PATCH /payments/:id/review`

Make sure routes use the same validation, response wrapper, and auth patterns as the rest of the API.

- [ ] **Step 5: Commit**

```bash
git add prisma src test
git commit -m "feat: complete Phase 3 payments"
```

---

## Self-Review Checklist

- [ ] The plan stays aligned with the approved Phase 3 design spec
- [ ] Payment entity matches the spec: `SUBMITTED`, `UNDER_REVIEW`, `APPROVED`, `REJECTED`
- [ ] Review endpoint transitions atomically through `UNDER_REVIEW`
- [ ] Approved payment auto-confirms registration via domain event
- [ ] 3rd rejected payment auto-cancels registration via domain event
- [ ] Free races (price = 0) auto-confirm at registration time
- [ ] Max 3 payment attempts enforced at service layer
- [ ] Cannot submit while active payment exists (`SUBMITTED` or `UNDER_REVIEW`)
- [ ] Amount validation checks against race price
- [ ] Admin review requires org ADMIN role via `OrgMembershipService.verifyRole()`
- [ ] Rejection requires a reason
- [ ] Cursor pagination on list endpoints
- [ ] No speculative features slipped in (no refunds, no gateway integration, no invoices)
- [ ] Implementation order follows the spec dependency chain

---

## Phase Roadmap Reminder

This plan only covers Phase 3.

| Phase | Focus |
|-------|-------|
| **Phase 1** | Core platform and follow system |
| **Phase 2** | Social layer |
| **Phase 3** | Payments |
| **Phase 4** | Scale, queues, caching, deployment maturity |

Finish this phase before expanding into queues or caching.
