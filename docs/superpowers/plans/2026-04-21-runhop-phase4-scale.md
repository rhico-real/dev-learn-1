# RunHop Phase 4 — Production Maturity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make RunHop production-ready by adding BullMQ queues, Redis caching, Firebase push notifications, and Docker/Kubernetes deployment.

**Architecture:** Swap NestJS's in-process EventEmitter for BullMQ queues so side effects (notifications, registration confirmation) are async and retryable. Add a CacheService layer over the existing RedisService for cache-aside reads. Extend the notification queue worker to send FCM pushes after writing DB records. Package the app in a multi-stage Docker image and define Kubernetes manifests.

**Tech Stack:** `@nestjs/bullmq`, `bullmq`, `firebase-admin`, `ioredis` (already installed), Docker, Kubernetes

> **Note:** The `/health` endpoint already exists at `src/health/health.controller.ts` and returns DB + Redis status. No changes needed there.

---

## File Map

### New files

| File | Purpose |
|------|---------|
| `src/infrastructure/queue/queue.module.ts` | Registers BullMQ with Redis connection and exports queues |
| `src/infrastructure/queue/queue.constants.ts` | Queue name enums and job name constants |
| `src/infrastructure/queue/processors/notification.processor.ts` | Consumes notification jobs, writes DB record, sends FCM |
| `src/infrastructure/queue/processors/registration.processor.ts` | Stub for Phase 3 payment-approved → registration confirm |
| `src/infrastructure/cache/cache.module.ts` | Registers CacheService as a global provider |
| `src/infrastructure/cache/cache.service.ts` | get/set/del wrappers with JSON handling and key prefixes |
| `src/infrastructure/cache/cache.constants.ts` | TTL values and key prefix constants |
| `src/domain/social/notification/fcm.service.ts` | Wraps firebase-admin to send push notifications |
| `src/domain/identity/user/dto/register-device-token.dto.ts` | DTO for POST /users/me/device-token |
| `Dockerfile` | Multi-stage Docker build |
| `docker-compose.yml` | Dev stack: Postgres + Redis + app |
| `k8s/deployment.yaml` | Kubernetes Deployment |
| `k8s/service.yaml` | Kubernetes Service (ClusterIP) |
| `k8s/configmap.yaml` | Non-secret env vars |
| `k8s/secret.yaml` | Sensitive env vars |
| `.env.example` | Documents every required env variable |

### Modified files

| File | Change |
|------|--------|
| `prisma/schema.prisma` | Add `Platform` enum, `DeviceToken` model, `PAYMENT_APPROVED` to `NotificationType`, `FOLLOW` to `NotificationType` |
| `src/infrastructure/config/env.validation.ts` | Add `FCM_PROJECT_ID`, `FCM_CLIENT_EMAIL`, `FCM_PRIVATE_KEY` |
| `src/app.module.ts` | Add `QueueModule`, `CacheModule`; remove `EventEmitterModule` |
| `src/domain/social/reaction/reaction.service.ts` | Swap `eventEmitter.emit()` for `notificationQueue.add()` |
| `src/domain/social/notification/notification.service.ts` | Remove `@OnEvent` handlers; keep list/mark-read methods |
| `src/domain/social/notification/notification-events.ts` | Add `FOLLOW` and `PAYMENT_APPROVED` event type keys |
| `src/domain/social/feed/feed.service.ts` | Add cache-aside in `listFeed()` |
| `src/domain/social/post/post.service.ts` | Bust feed cache on create/delete |
| `src/domain/event/event/event.service.ts` | Bust event list cache on create/update/delete |
| `src/domain/event/race/race.service.ts` | Bust race list cache on create/update/delete |
| `src/domain/identity/user/user.service.ts` | Add `registerDeviceToken()` and `removeDeviceToken()` |
| `src/domain/identity/user/user.controller.ts` | Add `POST /users/me/device-token` and `DELETE /users/me/device-token` |
| `src/domain/identity/user/user.module.ts` | Export `UserService` so QueueModule can use it |
| `src/domain/social/social-context.module.ts` | Import `QueueModule` and `CacheModule` |
| `src/domain/event/event-context.module.ts` | Import `CacheModule` |

---

## Task 1: Install BullMQ and wire QueueModule

**Files:**
- Create: `src/infrastructure/queue/queue.constants.ts`
- Create: `src/infrastructure/queue/queue.module.ts`
- Modify: `src/app.module.ts`

- [ ] **Step 1: Install BullMQ packages**

```bash
npm install @nestjs/bullmq bullmq
```

Expected: packages added to `node_modules`, `package.json` updated.

- [ ] **Step 2: Create queue constants**

Create `src/infrastructure/queue/queue.constants.ts`:

```typescript
export const QUEUE_NAMES = {
  NOTIFICATION: 'notification-queue',
  REGISTRATION: 'registration-queue',
} as const;

export const NOTIFICATION_JOBS = {
  CREATE: 'notification.create',
} as const;

export const REGISTRATION_JOBS = {
  CONFIRM: 'registration.confirm',
} as const;
```

- [ ] **Step 3: Create QueueModule**

Create `src/infrastructure/queue/queue.module.ts`:

```typescript
import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { QUEUE_NAMES } from './queue.constants';

@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>('REDIS_HOST'),
          port: config.get<number>('REDIS_PORT'),
        },
      }),
    }),
    BullModule.registerQueue(
      { name: QUEUE_NAMES.NOTIFICATION },
      { name: QUEUE_NAMES.REGISTRATION },
    ),
  ],
  exports: [BullModule],
})
export class QueueModule {}
```

- [ ] **Step 4: Add QueueModule to AppModule**

Open `src/app.module.ts`. Add the import and remove `EventEmitterModule`:

```typescript
import { Module } from '@nestjs/common';
import { AppConfigModule } from './infrastructure/config/config.module';
import { DatabaseModule } from './infrastructure/database/database.module';
import { RedisModule } from './infrastructure/redis/redis.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { SharedModule } from './shared/shared.module';
import { IdentityContextModule } from './domain/identity/identity-context.module';
import { OrganizationContextModule } from './domain/organization/organization-context.module';
import { CommonModule } from './common/common.module';
import { EventContextModule } from './domain/event/event-context.module';
import { SocialContextModule } from './domain/social/social-context.module';
import { HealthModule } from './health/health.module';
import { QueueModule } from './infrastructure/queue/queue.module';

@Module({
  imports: [
    AppConfigModule,
    DatabaseModule,
    RedisModule,
    QueueModule,
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    SharedModule,
    IdentityContextModule,
    OrganizationContextModule,
    CommonModule,
    EventContextModule,
    SocialContextModule,
    HealthModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
```

- [ ] **Step 5: Verify the app starts**

```bash
npm run start:dev
```

Expected: app starts on configured port, no errors. You will see BullMQ connecting to Redis in the logs. Stop with Ctrl+C.

- [ ] **Step 6: Commit**

```bash
git add src/infrastructure/queue/ src/app.module.ts package.json package-lock.json
git commit -m "feat: add BullMQ QueueModule with notification and registration queues"
```

---

## Task 2: Create the NotificationProcessor

This processor replaces the `@OnEvent` handlers in `NotificationService`. It reads a job from the queue and writes the `Notification` record to the database.

**Files:**
- Create: `src/infrastructure/queue/processors/notification.processor.ts`

- [ ] **Step 1: Write the failing test**

Create `src/infrastructure/queue/processors/notification.processor.spec.ts`:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { NotificationProcessor } from './notification.processor';
import { PrismaService } from '../../database/prisma.service';
import { NOTIFICATION_JOBS } from '../queue.constants';
import { Job } from 'bullmq';

describe('NotificationProcessor', () => {
  let processor: NotificationProcessor;
  let prisma: { post: { findUnique: jest.Mock }; notification: { create: jest.Mock } };

  beforeEach(async () => {
    prisma = {
      post: { findUnique: jest.fn() },
      notification: { create: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationProcessor,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    processor = module.get<NotificationProcessor>(NotificationProcessor);
  });

  it('creates a POST_LIKED notification when actor is not the post author', async () => {
    prisma.post.findUnique.mockResolvedValue({ authorId: 'user-2' });
    prisma.notification.create.mockResolvedValue({ id: 'notif-1' });

    const job = {
      data: { type: 'POST_LIKE', actorId: 'user-1', postId: 'post-1' },
    } as Job;

    await processor.handleNotification(job);

    expect(prisma.notification.create).toHaveBeenCalledWith({
      data: {
        recipientId: 'user-2',
        actorId: 'user-1',
        postId: 'post-1',
        commentId: undefined,
        type: 'POST_LIKED',
      },
    });
  });

  it('skips notification when actor is the post author', async () => {
    prisma.post.findUnique.mockResolvedValue({ authorId: 'user-1' });

    const job = {
      data: { type: 'POST_LIKE', actorId: 'user-1', postId: 'post-1' },
    } as Job;

    await processor.handleNotification(job);

    expect(prisma.notification.create).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx jest notification.processor.spec --no-coverage
```

Expected: FAIL — `NotificationProcessor` does not exist yet.

- [ ] **Step 3: Create the processor**

Create `src/infrastructure/queue/processors/notification.processor.ts`:

```typescript
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { NotificationType } from '@prisma/client';
import { QUEUE_NAMES, NOTIFICATION_JOBS } from '../queue.constants';

type NotificationJobData = {
  type: 'POST_LIKE' | 'POST_COMMENT' | 'FOLLOW' | 'PAYMENT_APPROVED';
  actorId: string;
  postId?: string;
  commentId?: string;
  recipientId?: string;
};

const TYPE_MAP: Record<NotificationJobData['type'], NotificationType> = {
  POST_LIKE: NotificationType.POST_LIKED,
  POST_COMMENT: NotificationType.POST_COMMENTED,
  FOLLOW: NotificationType.FOLLOW,
  PAYMENT_APPROVED: NotificationType.PAYMENT_APPROVED,
};

@Injectable()
@Processor(QUEUE_NAMES.NOTIFICATION)
export class NotificationProcessor extends WorkerHost {
  constructor(private prisma: PrismaService) {
    super();
  }

  async process(job: Job<NotificationJobData>): Promise<void> {
    await this.handleNotification(job);
  }

  async handleNotification(job: Job<NotificationJobData>): Promise<void> {
    const { type, actorId, postId, commentId, recipientId } = job.data;

    if (type === 'POST_LIKE' || type === 'POST_COMMENT') {
      const post = await this.prisma.post.findUnique({
        where: { id: postId },
        select: { authorId: true },
      });

      if (!post || post.authorId === actorId) return;

      await this.prisma.notification.create({
        data: {
          recipientId: post.authorId,
          actorId,
          postId,
          commentId,
          type: TYPE_MAP[type],
        },
      });

      return;
    }

    if ((type === 'FOLLOW' || type === 'PAYMENT_APPROVED') && recipientId) {
      await this.prisma.notification.create({
        data: {
          recipientId,
          actorId,
          postId,
          commentId,
          type: TYPE_MAP[type],
        },
      });
    }
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npx jest notification.processor.spec --no-coverage
```

Expected: PASS — both tests green.

- [ ] **Step 5: Commit**

```bash
git add src/infrastructure/queue/processors/notification.processor.ts src/infrastructure/queue/processors/notification.processor.spec.ts
git commit -m "feat: add NotificationProcessor for async notification creation"
```

---

## Task 3: Update Prisma schema for new notification types

Before wiring the queue, add the missing notification types and the `DeviceToken` model to the schema. Do this now so the Prisma client is up to date when you write the processor logic.

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add `FOLLOW` and `PAYMENT_APPROVED` to NotificationType enum**

Find this block in `prisma/schema.prisma`:

```prisma
enum NotificationType {
  POST_LIKED
  POST_COMMENTED
}
```

Replace with:

```prisma
enum NotificationType {
  POST_LIKED
  POST_COMMENTED
  FOLLOW
  PAYMENT_APPROVED
}
```

- [ ] **Step 2: Add `Platform` enum and `DeviceToken` model**

At the end of `prisma/schema.prisma`, add:

```prisma
enum Platform {
  IOS
  ANDROID
}

model DeviceToken {
  id        String   @id @default(uuid())
  userId    String
  token     String
  platform  Platform
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, token])
  @@index([userId])
}
```

- [ ] **Step 3: Add `deviceTokens` relation to User model**

Find the `model User` block and add `deviceTokens` to its relations list (alongside the other has-many relations):

```prisma
  deviceTokens DeviceToken[]
```

- [ ] **Step 4: Generate and run migration**

```bash
npx prisma migrate dev --name phase4_notifications_device_tokens
```

Expected: migration file created and applied, no errors.

- [ ] **Step 5: Verify Prisma client updated**

```bash
npx prisma generate
```

Expected: `NotificationType.FOLLOW`, `NotificationType.PAYMENT_APPROVED`, and `DeviceToken` are now available in the generated client.

- [ ] **Step 6: Commit**

```bash
git add prisma/
git commit -m "feat: add FOLLOW and PAYMENT_APPROVED notification types, add DeviceToken model"
```

---

## Task 4: Wire ReactionService to use the notification queue

Replace `EventEmitter2` with a BullMQ queue in `ReactionService`. Remove the `@OnEvent` handlers from `NotificationService` — the processor owns that logic now.

**Files:**
- Modify: `src/domain/social/reaction/reaction.service.ts`
- Modify: `src/domain/social/notification/notification.service.ts`
- Modify: `src/domain/social/notification/notification-events.ts`

- [ ] **Step 1: Update notification-events.ts**

Replace the contents of `src/domain/social/notification/notification-events.ts`:

```typescript
export const NotificationJobTypes = {
  POST_LIKE: 'POST_LIKE',
  POST_COMMENT: 'POST_COMMENT',
  FOLLOW: 'FOLLOW',
  PAYMENT_APPROVED: 'PAYMENT_APPROVED',
} as const;

export type NotificationJobType = typeof NotificationJobTypes[keyof typeof NotificationJobTypes];
```

- [ ] **Step 2: Update ReactionService to inject the notification queue**

Replace the full contents of `src/domain/social/reaction/reaction.service.ts`. Key changes: inject `Queue` instead of `EventEmitter2`, call `queue.add()` instead of `eventEmitter.emit()`.

```typescript
import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { PostService } from '../post/post.service';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { Prisma } from '@prisma/client';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QUEUE_NAMES, NOTIFICATION_JOBS } from '../../../infrastructure/queue/queue.constants';
import { NotificationJobTypes } from '../notification/notification-events';

@Injectable()
export class ReactionService {
  constructor(
    private prisma: PrismaService,
    private postService: PostService,
    @InjectQueue(QUEUE_NAMES.NOTIFICATION) private notificationQueue: Queue,
  ) {}

  async ownershipLikeCheck(likeId: string, userId: string) {
    const likeRecord = await this.prisma.postLike.findUnique({
      where: { id: likeId },
    });

    if (!likeRecord) throw new NotFoundException('Like record not found');

    if (likeRecord.userId !== userId)
      throw new ForbiddenException('User does not own like record');

    return likeRecord;
  }

  async ownershipCommentCheck(commentId: string, userId: string) {
    const commentRecord = await this.prisma.postComment.findUnique({
      where: { id: commentId },
    });

    if (!commentRecord) throw new NotFoundException('Comment not found');

    if (commentRecord.authorId !== userId)
      throw new ForbiddenException('User does not own comment');

    return commentRecord;
  }

  async like(postId: string, userId: string) {
    const post = await this.postService.findById(postId);

    if (!post) throw new NotFoundException('Post not found');

    try {
      const like = await this.prisma.postLike.create({
        data: { postId, userId },
      });

      await this.notificationQueue.add(NOTIFICATION_JOBS.CREATE, {
        type: NotificationJobTypes.POST_LIKE,
        actorId: userId,
        postId,
      });

      return like;
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Already liked this post');
      }
      throw error;
    }
  }

  async unlike(likeId: string) {
    try {
      return await this.prisma.postLike.delete({
        where: { id: likeId },
      });
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Like record does not exist');
      }
      throw error;
    }
  }

  async createComment(postId: string, userId: string, dto: CreateCommentDto) {
    const post = await this.postService.exists(postId);

    if (!post) throw new NotFoundException('Post not found');

    const comment = await this.prisma.postComment.create({
      data: {
        postId,
        authorId: userId,
        content: dto.content,
      },
    });

    await this.notificationQueue.add(NOTIFICATION_JOBS.CREATE, {
      type: NotificationJobTypes.POST_COMMENT,
      actorId: userId,
      postId,
      commentId: comment.id,
    });

    return comment;
  }

  async updateComment(
    commentId: string,
    userId: string,
    dto: UpdateCommentDto,
  ) {
    try {
      return await this.prisma.postComment.update({
        where: { id: commentId, authorId: userId },
        data: { content: dto.content },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Comment not found');
      }
    }
  }

  async removeComment(commentId: string, userId: string) {
    try {
      return await this.prisma.postComment.update({
        where: { id: commentId, authorId: userId },
        data: { deletedAt: new Date() },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Comment not found');
      }
    }
  }

  async listComments(postId: string, cursor?: string, take: number = 20) {
    const args: Prisma.PostCommentFindManyArgs = {
      take,
      where: { postId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    };

    if (cursor) {
      args.skip = 1;
      args.cursor = { id: cursor };
    }

    const comments = await this.prisma.postComment.findMany(args);
    return {
      data: comments,
      meta: { cursor: comments.at(-1)?.id },
    };
  }
}
```

- [ ] **Step 3: Remove @OnEvent handlers from NotificationService**

The `@OnEvent` handlers in `NotificationService` are now handled by `NotificationProcessor`. Remove them. Keep all other methods (`listForUser`, `markAsRead`, `markAllAsRead`, `getUnreadCount`, `ownershipCheck`).

Remove these imports that are no longer needed:
```typescript
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationEventTypes } from './notification-events';
import { CreateNotificationDto } from './dto/create-notification.dto';
```

Remove these two entire methods:
```typescript
@OnEvent(NotificationEventTypes.POST_LIKE)
async createLikeNotification(dto: CreateNotificationDto) { ... }

@OnEvent(NotificationEventTypes.POST_COMMENT)
async createCommentNotification(dto: CreateNotificationDto) { ... }
```

- [ ] **Step 4: Register NotificationProcessor in NotificationModule**

Open `src/domain/social/notification/notification.module.ts`. Import and add `NotificationProcessor` to `providers`:

```typescript
import { NotificationProcessor } from '../../../infrastructure/queue/processors/notification.processor';
```

Add `NotificationProcessor` to the `providers` array of `NotificationModule`.

- [ ] **Step 5: Verify the app starts and a like creates a notification via queue**

```bash
npm run start:dev
```

Use an API client (Postman, curl) to like a post. Verify that a `Notification` record is created in the database within a few seconds. The queue worker processes it asynchronously.

```bash
# Check for notification records
npx prisma studio
```

- [ ] **Step 6: Run existing tests to catch regressions**

```bash
npx jest --no-coverage
```

Expected: all tests pass. If reaction service tests fail due to the constructor change, update the mock to use `@InjectQueue` instead of `EventEmitter2`.

- [ ] **Step 7: Commit**

```bash
git add src/domain/social/reaction/ src/domain/social/notification/
git commit -m "feat: replace EventEmitter with BullMQ queue in ReactionService"
```

---

## Task 5: Create the RegistrationProcessor (Phase 3 stub)

This processor will be fully wired when Phase 3 (payments) is complete. For now, create the file and register it so the queue is ready.

**Files:**
- Create: `src/infrastructure/queue/processors/registration.processor.ts`

- [ ] **Step 1: Create the processor stub**

Create `src/infrastructure/queue/processors/registration.processor.ts`:

```typescript
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { QUEUE_NAMES, REGISTRATION_JOBS } from '../queue.constants';

type RegistrationJobData = {
  registrationId: string;
  userId: string;
};

@Injectable()
@Processor(QUEUE_NAMES.REGISTRATION)
export class RegistrationProcessor extends WorkerHost {
  private readonly logger = new Logger(RegistrationProcessor.name);

  constructor(private prisma: PrismaService) {
    super();
  }

  async process(job: Job<RegistrationJobData>): Promise<void> {
    const { registrationId } = job.data;

    this.logger.log(`Confirming registration ${registrationId}`);

    await this.prisma.registration.update({
      where: { id: registrationId },
      data: { status: 'CONFIRMED' },
    });
  }
}
```

- [ ] **Step 2: Register RegistrationProcessor in RegistrationModule**

Open `src/domain/event/registration/registration.module.ts`. Import and add `RegistrationProcessor` to `providers`:

```typescript
import { RegistrationProcessor } from '../../../infrastructure/queue/processors/registration.processor';
```

Add `RegistrationProcessor` to the `providers` array of `RegistrationModule`.

- [ ] **Step 3: Verify app still starts**

```bash
npm run start:dev
```

Expected: starts cleanly. Stop with Ctrl+C.

- [ ] **Step 4: Commit**

```bash
git add src/infrastructure/queue/processors/registration.processor.ts src/domain/event/registration/registration.module.ts
git commit -m "feat: add RegistrationProcessor stub for Phase 3 payment confirmation"
```

---

## Task 6: Create CacheModule and CacheService

Add a `CacheService` that wraps the existing `RedisService` with JSON handling, TTL constants, and key prefix helpers.

**Files:**
- Create: `src/infrastructure/cache/cache.constants.ts`
- Create: `src/infrastructure/cache/cache.service.ts`
- Create: `src/infrastructure/cache/cache.module.ts`

- [ ] **Step 1: Write the failing test**

Create `src/infrastructure/cache/cache.service.spec.ts`:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { CacheService } from './cache.service';
import { RedisService } from '../redis/redis.service';
import { CACHE_TTL, CACHE_KEYS } from './cache.constants';

describe('CacheService', () => {
  let service: CacheService;
  let redis: { get: jest.Mock; setex: jest.Mock; del: jest.Mock; delByPattern: jest.Mock };

  beforeEach(async () => {
    redis = {
      get: jest.fn(),
      setex: jest.fn(),
      del: jest.fn(),
      delByPattern: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheService,
        { provide: RedisService, useValue: redis },
      ],
    }).compile();

    service = module.get<CacheService>(CacheService);
  });

  it('returns null on cache miss', async () => {
    redis.get.mockResolvedValue(null);
    const result = await service.get('some-key');
    expect(result).toBeNull();
  });

  it('returns parsed JSON on cache hit', async () => {
    redis.get.mockResolvedValue(JSON.stringify({ id: '1', name: 'test' }));
    const result = await service.get<{ id: string; name: string }>('some-key');
    expect(result).toEqual({ id: '1', name: 'test' });
  });

  it('serializes value as JSON when setting', async () => {
    await service.set('some-key', { id: '1' }, 30);
    expect(redis.setex).toHaveBeenCalledWith('some-key', 30, JSON.stringify({ id: '1' }));
  });

  it('deletes a key', async () => {
    await service.del('some-key');
    expect(redis.del).toHaveBeenCalledWith('some-key');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx jest cache.service.spec --no-coverage
```

Expected: FAIL — `CacheService`, `CACHE_TTL`, `CACHE_KEYS` do not exist yet.

- [ ] **Step 3: Create cache constants**

Create `src/infrastructure/cache/cache.constants.ts`:

```typescript
export const CACHE_TTL = {
  FEED: 30,
  EVENT_LIST: 300,
  RACE_LIST: 600,
} as const;

export const CACHE_KEYS = {
  feed: (userId: string) => `runhop:feed:${userId}`,
  eventList: () => `runhop:events:list`,
  raceList: (eventId: string) => `runhop:events:${eventId}:races`,
} as const;
```

- [ ] **Step 4: Create CacheService**

Create `src/infrastructure/cache/cache.service.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class CacheService {
  constructor(private redis: RedisService) {}

  async get<T>(key: string): Promise<T | null> {
    const raw = await this.redis.get(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    await this.redis.setex(key, ttlSeconds, JSON.stringify(value));
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async delByPattern(pattern: string): Promise<void> {
    await this.redis.delByPattern(pattern);
  }
}
```

- [ ] **Step 5: Create CacheModule**

Create `src/infrastructure/cache/cache.module.ts`:

```typescript
import { Global, Module } from '@nestjs/common';
import { CacheService } from './cache.service';

@Global()
@Module({
  providers: [CacheService],
  exports: [CacheService],
})
export class CacheModule {}
```

- [ ] **Step 6: Add CacheModule to AppModule**

Open `src/app.module.ts`. Import and add `CacheModule`:

```typescript
import { CacheModule } from './infrastructure/cache/cache.module';
```

Add `CacheModule` to the `imports` array.

- [ ] **Step 7: Run the test to verify it passes**

```bash
npx jest cache.service.spec --no-coverage
```

Expected: PASS — all four tests green.

- [ ] **Step 8: Commit**

```bash
git add src/infrastructure/cache/ src/app.module.ts
git commit -m "feat: add CacheModule and CacheService with JSON handling"
```

---

## Task 7: Add cache-aside to FeedService

Cache the feed response for 30 seconds. Bust the cache when a post is created or deleted.

**Files:**
- Modify: `src/domain/social/feed/feed.service.ts`
- Modify: `src/domain/social/post/post.service.ts`

- [ ] **Step 1: Write the failing test for cache behavior**

Open `src/domain/social/feed/feed.service.spec.ts` and add these two tests:

```typescript
// Add to existing describe block, after the existing test setup
it('returns cached feed on hit', async () => {
  const cached = [{ id: 'post-1' }];
  cacheService.get.mockResolvedValue(cached);

  const result = await service.listFeed('user-1');

  expect(cacheService.get).toHaveBeenCalledWith('runhop:feed:user-1');
  expect(result).toEqual(cached);
  expect(prisma.follow.findMany).not.toHaveBeenCalled();
});

it('writes to cache on miss', async () => {
  cacheService.get.mockResolvedValue(null);
  prisma.follow.findMany.mockResolvedValue([]);

  await service.listFeed('user-1');

  expect(cacheService.set).toHaveBeenCalledWith(
    'runhop:feed:user-1',
    expect.any(Object),
    30,
  );
});
```

> You will need to add `cacheService` mock to the test setup in the same file:
> ```typescript
> let cacheService: { get: jest.Mock; set: jest.Mock; del: jest.Mock };
> cacheService = { get: jest.fn(), set: jest.fn(), del: jest.fn() };
> // add to providers: { provide: CacheService, useValue: cacheService }
> ```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
npx jest feed.service.spec --no-coverage
```

Expected: FAIL — `CacheService` is not injected in `FeedService` yet.

- [ ] **Step 3: Update FeedService to use cache-aside**

Replace the `listFeed` method in `src/domain/social/feed/feed.service.ts`. Also inject `CacheService`:

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { CacheService } from '../../../infrastructure/cache/cache.service';
import { CACHE_TTL, CACHE_KEYS } from '../../../infrastructure/cache/cache.constants';
import { Prisma, TargetType } from '@prisma/client';

@Injectable()
export class FeedService {
  constructor(
    private prisma: PrismaService,
    private cache: CacheService,
  ) {}

  private async reactionExists(postId: string, userId: string) {
    const res = await this.prisma.postLike.findUnique({
      where: { postId_userId: { postId, userId } },
    });
    return !!res;
  }

  async listFeed(userId: string, cursor?: string, take: number = 20) {
    const cacheKey = CACHE_KEYS.feed(userId);

    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const following = await this.prisma.follow.findMany({
      where: { followerId: userId, targetType: TargetType.USER },
      select: { targetId: true },
    });

    const args = ({
      targetId,
      take,
      cursor,
    }: {
      targetId: string;
      take: number;
      cursor?: string;
    }) => ({
      take,
      where: { authorId: targetId, deletedAt: null },
      include: {
        author: {
          select: { id: true, displayName: true, avatar: true },
        },
        _count: { select: { likes: true, comments: true } },
      },
      orderBy: [
        { createdAt: Prisma.SortOrder.desc },
        { id: Prisma.SortOrder.asc },
      ],
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    });

    const res = (
      await Promise.all(
        following.map(async (element) => {
          return this.prisma.post.findMany(
            args({ targetId: element.targetId, take, cursor }),
          );
        }),
      )
    ).flat();

    const newPosts = await Promise.all(
      res.map(async (element) => {
        const { _count, ...rest } = element;
        return {
          ...rest,
          counts: { likes: _count.likes, comments: _count.comments },
          likedByMe: await this.reactionExists(element.id, userId),
        };
      }),
    );

    const result = {
      data: newPosts,
      meta: { cursor: newPosts.at(-1)?.id },
    };

    await this.cache.set(cacheKey, result, CACHE_TTL.FEED);

    return result;
  }
}
```

- [ ] **Step 4: Bust feed cache in PostService on create and delete**

Open `src/domain/social/post/post.service.ts`. Inject `CacheService` and bust the user's feed cache after a post is created or deleted.

Find the `create` method and add bust logic after the DB write:

```typescript
// after await this.prisma.post.create(...)
await this.cache.delByPattern(`runhop:feed:*`);
```

Find the `delete` (or soft-delete) method and add:

```typescript
// after await this.prisma.post.update(...) or delete
await this.cache.delByPattern(`runhop:feed:*`);
```

> Busting `runhop:feed:*` clears all users' feeds because a new post could appear in any follower's feed.

- [ ] **Step 5: Run tests**

```bash
npx jest feed.service.spec --no-coverage
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/domain/social/feed/ src/domain/social/post/post.service.ts
git commit -m "feat: add cache-aside to FeedService with 30s TTL"
```

---

## Task 8: Add cache-aside to EventService and RaceService

Cache event listings and race listings. Bust on mutations.

**Files:**
- Modify: `src/domain/event/event/event.service.ts`
- Modify: `src/domain/event/race/race.service.ts`

- [ ] **Step 1: Update EventService**

Inject `CacheService` into `EventService`. Wrap the `findAll` (or equivalent list method) with cache-aside:

```typescript
// At the top of the list method
const cacheKey = CACHE_KEYS.eventList();
const cached = await this.cache.get(cacheKey);
if (cached) return cached;

// After DB query:
await this.cache.set(cacheKey, result, CACHE_TTL.EVENT_LIST);
return result;
```

Add cache busting in `create`, `update`, and `delete`/status-change methods:

```typescript
await this.cache.del(CACHE_KEYS.eventList());
```

- [ ] **Step 2: Update RaceService**

Inject `CacheService` into `RaceService`. Wrap the race list method with cache-aside:

```typescript
// At top of list method:
const cacheKey = CACHE_KEYS.raceList(eventId);
const cached = await this.cache.get(cacheKey);
if (cached) return cached;

// After DB query:
await this.cache.set(cacheKey, result, CACHE_TTL.RACE_LIST);
return result;
```

Add cache busting in `create`, `update`, and `delete` methods:

```typescript
await this.cache.del(CACHE_KEYS.raceList(race.eventId));
```

- [ ] **Step 3: Verify app starts and caching works**

```bash
npm run start:dev
```

Call `GET /events` twice. Check Redis to confirm the key was set:

```bash
redis-cli get "runhop:events:list"
```

Expected: JSON string is returned on the second check.

- [ ] **Step 4: Run all tests**

```bash
npx jest --no-coverage
```

Expected: all green. Fix any spec files where `CacheService` injection is missing from the mock setup.

- [ ] **Step 5: Commit**

```bash
git add src/domain/event/
git commit -m "feat: add cache-aside to EventService and RaceService"
```

---

## Task 9: Add device token endpoints

Allow the Flutter app to register and remove FCM device tokens.

**Files:**
- Create: `src/domain/identity/user/dto/register-device-token.dto.ts`
- Modify: `src/domain/identity/user/user.service.ts`
- Modify: `src/domain/identity/user/user.controller.ts`

- [ ] **Step 1: Write the failing test**

Add to `src/domain/identity/user/user.service.spec.ts`:

```typescript
describe('registerDeviceToken', () => {
  it('creates a device token record', async () => {
    prisma.deviceToken = {
      upsert: jest.fn().mockResolvedValue({ id: 'dt-1', token: 'fcm-token-abc' }),
    };

    const result = await service.registerDeviceToken('user-1', {
      token: 'fcm-token-abc',
      platform: 'ANDROID',
    });

    expect(prisma.deviceToken.upsert).toHaveBeenCalledWith({
      where: { userId_token: { userId: 'user-1', token: 'fcm-token-abc' } },
      create: { userId: 'user-1', token: 'fcm-token-abc', platform: 'ANDROID' },
      update: {},
    });

    expect(result).toEqual({ id: 'dt-1', token: 'fcm-token-abc' });
  });
});

describe('removeDeviceToken', () => {
  it('deletes the device token', async () => {
    prisma.deviceToken = {
      deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
    };

    await service.removeDeviceToken('user-1', 'fcm-token-abc');

    expect(prisma.deviceToken.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'user-1', token: 'fcm-token-abc' },
    });
  });
});
```

- [ ] **Step 2: Run to verify they fail**

```bash
npx jest user.service.spec --no-coverage
```

Expected: FAIL — methods don't exist yet.

- [ ] **Step 3: Create the DTO**

Create `src/domain/identity/user/dto/register-device-token.dto.ts`:

```typescript
import { IsEnum, IsString } from 'class-validator';
import { Platform } from '@prisma/client';

export class RegisterDeviceTokenDto {
  @IsString()
  token!: string;

  @IsEnum(Platform)
  platform!: Platform;
}
```

- [ ] **Step 4: Add methods to UserService**

Add to `src/domain/identity/user/user.service.ts`:

```typescript
import { RegisterDeviceTokenDto } from './dto/register-device-token.dto';

async registerDeviceToken(userId: string, dto: RegisterDeviceTokenDto) {
  return this.prisma.deviceToken.upsert({
    where: { userId_token: { userId, token: dto.token } },
    create: { userId, token: dto.token, platform: dto.platform },
    update: {},
  });
}

async removeDeviceToken(userId: string, token: string) {
  return this.prisma.deviceToken.deleteMany({
    where: { userId, token },
  });
}
```

- [ ] **Step 5: Add endpoints to UserController**

Add to `src/domain/identity/user/user.controller.ts`:

```typescript
import { RegisterDeviceTokenDto } from './dto/register-device-token.dto';
import { Body, Delete, Query } from '@nestjs/common';

@Post('me/device-token')
registerDeviceToken(
  @CurrentUser() userId: string,
  @Body() dto: RegisterDeviceTokenDto,
) {
  return this.userService.registerDeviceToken(userId, dto);
}

@Delete('me/device-token')
removeDeviceToken(
  @CurrentUser() userId: string,
  @Query('token') token: string,
) {
  return this.userService.removeDeviceToken(userId, token);
}
```

- [ ] **Step 6: Run tests**

```bash
npx jest user.service.spec --no-coverage
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/domain/identity/user/
git commit -m "feat: add device token register/remove endpoints for FCM"
```

---

## Task 10: Add FCM push notification delivery

Install `firebase-admin`, create `FcmService`, and extend `NotificationProcessor` to send a push after writing the DB record.

**Files:**
- Create: `src/domain/social/notification/fcm.service.ts`
- Modify: `src/infrastructure/queue/processors/notification.processor.ts`
- Modify: `src/infrastructure/config/env.validation.ts`

- [ ] **Step 1: Install firebase-admin**

```bash
npm install firebase-admin
```

- [ ] **Step 2: Add FCM env vars to validation**

Open `src/infrastructure/config/env.validation.ts` and add:

```typescript
@IsString()
FCM_PROJECT_ID!: string;

@IsString()
FCM_CLIENT_EMAIL!: string;

@IsString()
FCM_PRIVATE_KEY!: string;
```

Add these to your `.env` file (get values from Firebase Console → Project Settings → Service Accounts → Generate New Private Key):

```
FCM_PROJECT_ID=your-project-id
FCM_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project-id.iam.gserviceaccount.com
FCM_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

- [ ] **Step 3: Write a failing test for FcmService**

Create `src/domain/social/notification/fcm.service.spec.ts`:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { FcmService } from './fcm.service';
import { ConfigService } from '@nestjs/config';

describe('FcmService', () => {
  let service: FcmService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FcmService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const map: Record<string, string> = {
                FCM_PROJECT_ID: 'test-project',
                FCM_CLIENT_EMAIL: 'test@test.iam.gserviceaccount.com',
                FCM_PRIVATE_KEY: 'test-private-key',
              };
              return map[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<FcmService>(FcmService);
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });
});
```

- [ ] **Step 4: Run to verify it fails**

```bash
npx jest fcm.service.spec --no-coverage
```

Expected: FAIL — `FcmService` does not exist.

- [ ] **Step 5: Create FcmService**

Create `src/domain/social/notification/fcm.service.ts`:

```typescript
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

@Injectable()
export class FcmService implements OnModuleInit {
  private readonly logger = new Logger(FcmService.name);

  constructor(private config: ConfigService) {}

  onModuleInit() {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: this.config.get<string>('FCM_PROJECT_ID'),
          clientEmail: this.config.get<string>('FCM_CLIENT_EMAIL'),
          privateKey: this.config
            .get<string>('FCM_PRIVATE_KEY')!
            .replace(/\\n/g, '\n'),
        }),
      });
    }
  }

  async sendToToken(
    token: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<void> {
    try {
      await admin.messaging().send({
        token,
        notification: { title, body },
        data,
      });
    } catch (error) {
      this.logger.warn(`FCM delivery failed for token ${token}: ${error}`);
    }
  }
}
```

- [ ] **Step 6: Run test to verify it passes**

```bash
npx jest fcm.service.spec --no-coverage
```

Expected: PASS.

- [ ] **Step 7: Extend NotificationProcessor to send FCM push**

Open `src/infrastructure/queue/processors/notification.processor.ts`. Inject `FcmService` and `PrismaService`. After writing the DB notification record, fetch the user's device tokens and send the push:

```typescript
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { FcmService } from '../../../domain/social/notification/fcm.service';
import { NotificationType } from '@prisma/client';
import { QUEUE_NAMES } from '../queue.constants';

type NotificationJobData = {
  type: 'POST_LIKE' | 'POST_COMMENT' | 'FOLLOW' | 'PAYMENT_APPROVED';
  actorId: string;
  postId?: string;
  commentId?: string;
  recipientId?: string;
};

const TYPE_MAP: Record<NotificationJobData['type'], NotificationType> = {
  POST_LIKE: NotificationType.POST_LIKED,
  POST_COMMENT: NotificationType.POST_COMMENTED,
  FOLLOW: NotificationType.FOLLOW,
  PAYMENT_APPROVED: NotificationType.PAYMENT_APPROVED,
};

const PUSH_MESSAGES: Record<NotificationJobData['type'], { title: string; body: string }> = {
  POST_LIKE: { title: 'RunHop', body: 'Someone liked your post' },
  POST_COMMENT: { title: 'RunHop', body: 'Someone commented on your post' },
  FOLLOW: { title: 'RunHop', body: 'Someone followed you' },
  PAYMENT_APPROVED: { title: 'RunHop', body: 'Your payment has been approved' },
};

@Injectable()
@Processor(QUEUE_NAMES.NOTIFICATION)
export class NotificationProcessor extends WorkerHost {
  constructor(
    private prisma: PrismaService,
    private fcm: FcmService,
  ) {
    super();
  }

  async process(job: Job<NotificationJobData>): Promise<void> {
    await this.handleNotification(job);
  }

  async handleNotification(job: Job<NotificationJobData>): Promise<void> {
    const { type, actorId, postId, commentId, recipientId } = job.data;
    let resolvedRecipientId: string | null = null;

    if (type === 'POST_LIKE' || type === 'POST_COMMENT') {
      const post = await this.prisma.post.findUnique({
        where: { id: postId },
        select: { authorId: true },
      });

      if (!post || post.authorId === actorId) return;

      await this.prisma.notification.create({
        data: {
          recipientId: post.authorId,
          actorId,
          postId,
          commentId,
          type: TYPE_MAP[type],
        },
      });

      resolvedRecipientId = post.authorId;
    } else if ((type === 'FOLLOW' || type === 'PAYMENT_APPROVED') && recipientId) {
      await this.prisma.notification.create({
        data: { recipientId, actorId, postId, commentId, type: TYPE_MAP[type] },
      });

      resolvedRecipientId = recipientId;
    }

    if (!resolvedRecipientId) return;

    const tokens = await this.prisma.deviceToken.findMany({
      where: { userId: resolvedRecipientId },
      select: { token: true },
    });

    const { title, body } = PUSH_MESSAGES[type];

    await Promise.all(
      tokens.map((dt) =>
        this.fcm.sendToToken(dt.token, title, body, {
          type,
          ...(postId ? { postId } : {}),
        }),
      ),
    );
  }
}
```

- [ ] **Step 8: Register FcmService in the social context module**

Open `src/domain/social/social-context.module.ts`. Import and add `FcmService` to `providers`:

```typescript
import { FcmService } from './notification/fcm.service';
```

Add `FcmService` to `providers`.

- [ ] **Step 9: Run all tests**

```bash
npx jest --no-coverage
```

Expected: all pass. Update processor spec to mock `FcmService` if tests fail there.

- [ ] **Step 10: Commit**

```bash
git add src/domain/social/notification/fcm.service.ts src/domain/social/notification/fcm.service.spec.ts src/infrastructure/queue/processors/notification.processor.ts src/domain/social/social-context.module.ts src/infrastructure/config/env.validation.ts
git commit -m "feat: extend NotificationProcessor to send FCM push after DB write"
```

---

## Task 11: Create Dockerfile with multi-stage build

**Files:**
- Create: `Dockerfile`

- [ ] **Step 1: Create the Dockerfile**

Create `Dockerfile` at the project root:

```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Run
FROM node:20-alpine AS runner

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

RUN npx prisma generate

EXPOSE 3000

CMD ["node", "dist/main.js"]
```

- [ ] **Step 2: Build the image locally to verify**

```bash
docker build -t runhop:local .
```

Expected: build completes, image is created. The builder stage will take a while on first run.

```bash
docker images | grep runhop
```

Expected: `runhop   local   <image-id>   ...`

- [ ] **Step 3: Commit**

```bash
git add Dockerfile
git commit -m "feat: add multi-stage Dockerfile for production build"
```

---

## Task 12: Create docker-compose.yml for local development

Bring up Postgres, Redis, and the NestJS app with one command.

**Files:**
- Create: `docker-compose.yml`

- [ ] **Step 1: Create docker-compose.yml**

Create `docker-compose.yml` at the project root:

```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: runhop
      POSTGRES_USER: runhop
      POSTGRES_PASSWORD: runhop
    ports:
      - '5432:5432'
    volumes:
      - postgres-data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'

  app:
    build: .
    ports:
      - '3000:3000'
    environment:
      DATABASE_URL: postgresql://runhop:runhop@postgres:5432/runhop
      REDIS_HOST: redis
      REDIS_PORT: 6379
      JWT_SECRET: local-dev-secret
      JWT_ACCESS_EXPIRY: 15m
      JWT_REFRESH_EXPIRY: 7d
      PORT: 3000
      NODE_ENV: production
      API_PREFIX: api
      CORS_ORIGIN: http://localhost:3000
      FCM_PROJECT_ID: ${FCM_PROJECT_ID}
      FCM_CLIENT_EMAIL: ${FCM_CLIENT_EMAIL}
      FCM_PRIVATE_KEY: ${FCM_PRIVATE_KEY}
    depends_on:
      - postgres
      - redis

volumes:
  postgres-data:
```

- [ ] **Step 2: Verify it starts**

```bash
docker compose up
```

Expected: Postgres, Redis, and the NestJS app all start. Check `http://localhost:3000/api/health` returns `{ "status": "ok" }`.

Stop with Ctrl+C.

- [ ] **Step 3: Commit**

```bash
git add docker-compose.yml
git commit -m "feat: add docker-compose.yml for full local stack"
```

---

## Task 13: Create Kubernetes manifests

**Files:**
- Create: `k8s/deployment.yaml`
- Create: `k8s/service.yaml`
- Create: `k8s/configmap.yaml`
- Create: `k8s/secret.yaml`

- [ ] **Step 1: Create the ConfigMap**

Create `k8s/configmap.yaml`:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: runhop-config
data:
  PORT: "3000"
  NODE_ENV: "production"
  API_PREFIX: "api"
  CORS_ORIGIN: "https://your-frontend.com"
  REDIS_HOST: "redis-service"
  REDIS_PORT: "6379"
  JWT_ACCESS_EXPIRY: "15m"
  JWT_REFRESH_EXPIRY: "7d"
```

- [ ] **Step 2: Create the Secret template**

Create `k8s/secret.yaml`:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: runhop-secrets
type: Opaque
stringData:
  DATABASE_URL: "postgresql://runhop:CHANGE_ME@postgres-service:5432/runhop"
  JWT_SECRET: "CHANGE_ME"
  FCM_PROJECT_ID: "CHANGE_ME"
  FCM_CLIENT_EMAIL: "CHANGE_ME"
  FCM_PRIVATE_KEY: "CHANGE_ME"
```

> **Important:** Add `k8s/secret.yaml` to `.gitignore` in a real deployment. Never commit real secrets. This file is a template only.

- [ ] **Step 3: Create the Deployment**

Create `k8s/deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: runhop-app
spec:
  replicas: 2
  selector:
    matchLabels:
      app: runhop
  template:
    metadata:
      labels:
        app: runhop
    spec:
      containers:
        - name: runhop
          image: runhop:latest
          ports:
            - containerPort: 3000
          envFrom:
            - configMapRef:
                name: runhop-config
            - secretRef:
                name: runhop-secrets
          readinessProbe:
            httpGet:
              path: /api/health
              port: 3000
            initialDelaySeconds: 10
            periodSeconds: 5
          livenessProbe:
            httpGet:
              path: /api/health
              port: 3000
            initialDelaySeconds: 30
            periodSeconds: 10
          resources:
            requests:
              memory: "256Mi"
              cpu: "100m"
            limits:
              memory: "512Mi"
              cpu: "500m"
```

- [ ] **Step 4: Create the Service**

Create `k8s/service.yaml`:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: runhop-service
spec:
  selector:
    app: runhop
  ports:
    - protocol: TCP
      port: 80
      targetPort: 3000
  type: ClusterIP
```

- [ ] **Step 5: Commit**

```bash
git add k8s/
git commit -m "feat: add Kubernetes deployment, service, configmap, and secret manifests"
```

---

## Task 14: Create .env.example and finalize environment discipline

**Files:**
- Create: `.env.example`
- Modify: `.gitignore`

- [ ] **Step 1: Create .env.example**

Create `.env.example` at the project root:

```bash
# Application
PORT=3000
NODE_ENV=development
API_PREFIX=api
CORS_ORIGIN=http://localhost:3000

# Database
DATABASE_URL=postgresql://runhop:runhop@localhost:5432/runhop

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Auth
JWT_SECRET=your-super-secret-key-change-in-production
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Firebase Cloud Messaging
# Get these from Firebase Console → Project Settings → Service Accounts → Generate New Private Key
FCM_PROJECT_ID=your-project-id
FCM_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project-id.iam.gserviceaccount.com
# Paste the private key with literal \n chars (not real newlines)
FCM_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY_HERE\n-----END PRIVATE KEY-----\n"
```

- [ ] **Step 2: Ensure .env is gitignored**

Open `.gitignore` and confirm `.env` is listed. If not, add it:

```
.env
```

Do NOT add `.env.example` to `.gitignore` — it is meant to be committed.

- [ ] **Step 3: Commit**

```bash
git add .env.example .gitignore
git commit -m "docs: add .env.example with all required environment variables"
```

---

## Task 15: Final verification

- [ ] **Step 1: Run the full test suite**

```bash
npx jest --no-coverage
```

Expected: all tests pass.

- [ ] **Step 2: Start the full Docker stack**

```bash
docker compose up --build
```

Expected: all three services start. No errors in the app logs.

- [ ] **Step 3: Verify health endpoint**

```bash
curl http://localhost:3000/api/health
```

Expected:
```json
{ "status": "ok", "info": { "database": { "status": "up" }, "redis": { "status": "up" } } }
```

- [ ] **Step 4: Smoke test the queue end-to-end**

1. Register a user and log in to get a JWT
2. Register a device token: `POST /api/users/me/device-token` with `{ "token": "test-fcm-token", "platform": "ANDROID" }`
3. Like a post
4. Check the `Notification` table — a record should appear within a few seconds
5. Check your Firebase console → Cloud Messaging → confirm a send attempt was made

- [ ] **Step 5: Final commit**

```bash
git add .
git commit -m "feat: Phase 4 complete — queues, caching, push notifications, and deployment"
```

---

## What you learned in Phase 4

| Concept | Where you used it |
|---------|------------------|
| Producer/consumer pattern | `ReactionService` → `NotificationQueue` → `NotificationProcessor` |
| Job retries with backoff | BullMQ default retry behavior on processor failures |
| Cache-aside | `FeedService`, `EventService`, `RaceService` |
| TTL strategy | 30s for feed (user-specific), 5–10min for shared entity reads |
| Cache invalidation | Bust on every write that affects the cached read |
| FCM token lifecycle | `DeviceToken` model, upsert on login, delete on logout |
| Multi-device push | `findMany` on `DeviceToken`, send to all tokens in parallel |
| Multi-stage Docker build | Separate `builder` and `runner` stages to minimize image size |
| Kubernetes primitives | Pod, Deployment, Service, ConfigMap, Secret |
| Readiness vs liveness probes | Readiness = "ready for traffic", liveness = "still alive" |
| Secret management | ConfigMap for non-sensitive config, Secret for credentials |
