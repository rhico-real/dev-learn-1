# RunHop Phase 2 Social Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build RunHop Phase 2 Social — posts, reactions, feed, and notifications — on top of the completed Phase 1 platform.

**Architecture:** Keep all new work inside the Social bounded context. `post` owns canonical content, `reaction` owns likes and comments, `feed` is a read model built from follows plus posts, and `notification` is an in-app side-effect module triggered by social events. Cross-context access goes through exported services only.

**Tech Stack:** NestJS 11, TypeScript (strict), Prisma, PostgreSQL 16, Jest, Supertest, class-validator, existing shared cursor pagination DTO, optional `@nestjs/event-emitter` for in-process domain events

**Spec:** `docs/superpowers/specs/2026-04-14-runhop-phase2-social-design.md`

**Audience:** Flutter/Dart developer who already finished Phase 1 and now understands the basic NestJS module-controller-service flow.

**Learning approach:** Still explicit and guided like Phase 1, but slightly harder. This phase pushes you on query design, pagination, invariants, and side effects. You should need to think harder, but you should not have to guess the next move.

---

## What Gets Harder In Phase 2

Phase 1 was mostly about establishing clean write flows:

- create org
- create event
- create race
- register
- follow

Phase 2 adds more read-heavy behavior:

- assembling a feed
- returning viewer-specific flags
- generating notifications from actions
- enforcing uniqueness and ownership rules across multiple social entities

This means you need to think in two layers:

1. **Write model**: what data gets created or changed
2. **Read model**: what the API needs to return efficiently

That distinction is one of the main learning goals of this phase.

---

## File Map

### Prisma

- Modify: `prisma/schema.prisma` — add social enums and models for posts, likes, comments, notifications

### Shared Types

- Modify: `src/shared/types/enums.ts` — add notification and post-related enums if the project mirrors Prisma enums in shared types
- Modify: `src/shared/types/interfaces.ts` — add feed and notification response shapes only if shared interfaces are already used for API contracts

### Social Context

- Modify: `src/domain/social/social-context.module.ts`

### Post Module

- Create: `src/domain/social/post/post.module.ts`
- Create: `src/domain/social/post/post.controller.ts`
- Create: `src/domain/social/post/post.service.ts`
- Create: `src/domain/social/post/post.service.spec.ts`
- Create: `src/domain/social/post/dto/create-post.dto.ts`
- Create: `src/domain/social/post/dto/update-post.dto.ts`

### Reaction Module

- Create: `src/domain/social/reaction/reaction.module.ts`
- Create: `src/domain/social/reaction/reaction.controller.ts`
- Create: `src/domain/social/reaction/reaction.service.ts`
- Create: `src/domain/social/reaction/reaction.service.spec.ts`
- Create: `src/domain/social/reaction/dto/create-comment.dto.ts`
- Create: `src/domain/social/reaction/dto/update-comment.dto.ts`

### Feed Module

- Create: `src/domain/social/feed/feed.module.ts`
- Create: `src/domain/social/feed/feed.controller.ts`
- Create: `src/domain/social/feed/feed.service.ts`
- Create: `src/domain/social/feed/feed.service.spec.ts`

### Notification Module

- Create: `src/domain/social/notification/notification.module.ts`
- Create: `src/domain/social/notification/notification.controller.ts`
- Create: `src/domain/social/notification/notification.service.ts`
- Create: `src/domain/social/notification/notification.service.spec.ts`

### App Wiring

- Modify: `src/app.module.ts` — only if event-emitter or new global social wiring must be added
- Modify: `package.json` — only if `@nestjs/event-emitter` needs to be added

### End-to-End Tests

- Create: `test/e2e/post.e2e-spec.ts`
- Create: `test/e2e/reaction.e2e-spec.ts`
- Create: `test/e2e/feed.e2e-spec.ts`
- Create: `test/e2e/notification.e2e-spec.ts`

---

## Task 1: Extend The Prisma Schema For Social Entities

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add the new enums**

Add social enums near the existing Prisma enums:

```prisma
enum NotificationType {
  POST_LIKED
  POST_COMMENTED
}
```

- [ ] **Step 2: Add the `Post` model**

Use a user-owned write model first:

```prisma
model Post {
  id        String   @id @default(uuid())
  author    User     @relation(fields: [authorId], references: [id], onDelete: Cascade)
  authorId  String
  content   String
  deletedAt DateTime?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  likes    PostLike[]
  comments PostComment[]

  @@index([authorId, createdAt])
  @@index([createdAt])
}
```

- [ ] **Step 3: Add the `PostLike` and `PostComment` models**

```prisma
model PostLike {
  id        String   @id @default(uuid())
  post      Post     @relation(fields: [postId], references: [id], onDelete: Cascade)
  postId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId    String
  createdAt DateTime @default(now())

  @@unique([postId, userId])
  @@index([userId])
  @@index([postId, createdAt])
}

model PostComment {
  id        String   @id @default(uuid())
  post      Post     @relation(fields: [postId], references: [id], onDelete: Cascade)
  postId    String
  author    User     @relation(fields: [authorId], references: [id], onDelete: Cascade)
  authorId  String
  content   String
  deletedAt DateTime?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([postId, createdAt])
  @@index([authorId, createdAt])
}
```

- [ ] **Step 4: Add the `Notification` model**

```prisma
model Notification {
  id          String           @id @default(uuid())
  recipient   User             @relation(fields: [recipientId], references: [id], onDelete: Cascade)
  recipientId String
  actorId     String
  postId      String?
  commentId   String?
  type        NotificationType
  readAt      DateTime?
  createdAt   DateTime         @default(now())

  @@index([recipientId, createdAt])
  @@index([recipientId, readAt])
}
```

- [ ] **Step 5: Add back-relations on `User`**

Extend the existing `User` model:

```prisma
  posts         Post[]
  postLikes     PostLike[]
  postComments  PostComment[]
  notifications Notification[]
```

- [ ] **Step 6: Run Prisma format and generate**

Run:

```bash
npx prisma format
npx prisma generate
```

Expected: schema formats successfully and Prisma Client regenerates without relation errors.

- [ ] **Step 7: Create and apply the migration**

Run:

```bash
npx prisma migrate dev --name add_phase2_social_models
```

Expected: a new migration directory is created and the local database is updated.

- [ ] **Step 8: Regenerate the ERD if the repo still uses it**

Run:

```bash
npx prisma generate
```

Expected: `docs/erd.svg` updates to include the new social tables.

- [ ] **Step 9: Commit**

```bash
git add prisma/schema.prisma prisma/migrations docs/erd.svg
git commit -m "feat: add Phase 2 social prisma models"
```

---

## Task 2: Scaffold The Social Modules And Context Wiring

**Files:**
- Modify: `src/domain/social/social-context.module.ts`
- Create: `src/domain/social/post/post.module.ts`
- Create: `src/domain/social/reaction/reaction.module.ts`
- Create: `src/domain/social/feed/feed.module.ts`
- Create: `src/domain/social/notification/notification.module.ts`
- Modify: `src/app.module.ts`
- Modify: `package.json`

- [ ] **Step 1: Decide whether to add NestJS event emitter**

If `@nestjs/event-emitter` is not already installed, add it:

```bash
npm install @nestjs/event-emitter
```

Expected: `package.json` and `package-lock.json` update.

- [ ] **Step 2: Create the four new module files**

Each module should follow the same pattern as existing domain modules:

```ts
@Module({
  imports: [],
  controllers: [],
  providers: [],
  exports: [],
})
export class PostModule {}
```

Repeat for `ReactionModule`, `FeedModule`, and `NotificationModule`.

- [ ] **Step 3: Export the new modules from the social context**

Update `src/domain/social/social-context.module.ts`:

```ts
@Module({
  imports: [FollowModule, PostModule, ReactionModule, FeedModule, NotificationModule],
  exports: [FollowModule, PostModule, ReactionModule, FeedModule, NotificationModule],
})
export class SocialContextModule {}
```

- [ ] **Step 4: Wire event-emitter into `AppModule` if you chose that path**

Example:

```ts
import { EventEmitterModule } from '@nestjs/event-emitter';

imports: [
  EventEmitterModule.forRoot(),
]
```

- [ ] **Step 5: Verify the app still boots**

Run:

```bash
npm run build
```

Expected: the project builds with empty module scaffolding and no import-path errors.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json src/app.module.ts src/domain/social
git commit -m "feat: scaffold Phase 2 social modules"
```

---

## Task 3: Build The Post Module

**Files:**
- Create: `src/domain/social/post/dto/create-post.dto.ts`
- Create: `src/domain/social/post/dto/update-post.dto.ts`
- Create: `src/domain/social/post/post.controller.ts`
- Create: `src/domain/social/post/post.service.ts`
- Create: `src/domain/social/post/post.service.spec.ts`
- Modify: `src/domain/social/post/post.module.ts`

- [ ] **Step 1: Create the DTOs**

Start simple:

```ts
export class CreatePostDto {
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  content: string;
}
```

Use `PartialType(CreatePostDto)` for `UpdatePostDto`.

- [ ] **Step 2: Write service tests for the core post rules**

Cover:

- create post
- reject empty content
- update own post
- block updating someone else's post
- soft-delete own post
- hide deleted posts from normal reads

- [ ] **Step 3: Implement the service**

Core methods:

```ts
create(authorId: string, dto: CreatePostDto)
findOne(postId: string)
listByUser(userId: string, cursor?: string, limit = 20)
update(postId: string, userId: string, dto: UpdatePostDto)
remove(postId: string, userId: string)
exists(postId: string)
```

Rules:

- do not return soft-deleted posts in normal reads
- enforce ownership in update/delete
- return cursor metadata from list endpoints

- [ ] **Step 4: Implement the controller**

Suggested endpoints:

```ts
POST /posts
GET /posts/:id
GET /users/:userId/posts
PATCH /posts/:id
DELETE /posts/:id
```

- [ ] **Step 5: Wire the module imports**

`PostModule` should import:

- `DatabaseModule` only if your project modules import infrastructure directly
- `IdentityContextModule` if you want explicit author existence validation

Prefer following the established project pattern rather than inventing a cleaner pattern midstream.

- [ ] **Step 6: Run focused tests**

Run:

```bash
npm test -- post.service.spec.ts
```

Expected: post service rules pass.

- [ ] **Step 7: Commit**

```bash
git add src/domain/social/post
git commit -m "feat: add social post module"
```

---

## Task 4: Build Likes In The Reaction Module

**Files:**
- Create: `src/domain/social/reaction/reaction.controller.ts`
- Create: `src/domain/social/reaction/reaction.service.ts`
- Create: `src/domain/social/reaction/reaction.service.spec.ts`
- Modify: `src/domain/social/reaction/reaction.module.ts`

- [ ] **Step 1: Write service tests for like behavior**

Cover:

- like a post
- liking a missing post returns `NotFoundException`
- duplicate likes do not create duplicate rows
- unlike removes the like
- a user can only unlike their own like relation

- [ ] **Step 2: Implement post existence validation**

Inject `PostService` into `ReactionService` through `PostModule` exports:

```ts
constructor(
  private prismaService: PrismaService,
  private postService: PostService,
) {}
```

- [ ] **Step 3: Implement `like()` and `unlike()`**

Recommended method signatures:

```ts
like(postId: string, userId: string)
unlike(postId: string, userId: string)
```

Implementation notes:

- validate post existence first
- catch Prisma `P2002` if you treat duplicate likes as conflict
- or return the existing relation if you want API-level idempotency

Pick one behavior and stay consistent across tests and controller responses.

- [ ] **Step 4: Add endpoints**

Suggested endpoints:

```ts
POST /posts/:id/likes
DELETE /posts/:id/likes
```

- [ ] **Step 5: Emit a domain event after a successful like**

If using event emitter:

```ts
this.eventEmitter.emit('social.post.liked', {
  actorId: userId,
  postId,
});
```

Do not emit on duplicate/no-op behavior unless you explicitly want duplicate notifications.

- [ ] **Step 6: Run focused tests**

Run:

```bash
npm test -- reaction.service.spec.ts
```

Expected: like logic passes and duplicate behavior is explicit.

- [ ] **Step 7: Commit**

```bash
git add src/domain/social/reaction
git commit -m "feat: add post likes"
```

---

## Task 5: Add Comments In The Reaction Module

**Files:**
- Create: `src/domain/social/reaction/dto/create-comment.dto.ts`
- Create: `src/domain/social/reaction/dto/update-comment.dto.ts`
- Modify: `src/domain/social/reaction/reaction.service.ts`
- Modify: `src/domain/social/reaction/reaction.controller.ts`
- Modify: `src/domain/social/reaction/reaction.service.spec.ts`

- [ ] **Step 1: Add the DTOs**

```ts
export class CreateCommentDto {
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  content: string;
}
```

`UpdateCommentDto` should allow partial content updates.

- [ ] **Step 2: Write the comment tests**

Cover:

- create comment on existing post
- reject comment on deleted or missing post
- list comments by post with cursor pagination
- edit own comment
- block editing another user's comment
- soft-delete own comment

- [ ] **Step 3: Implement the comment methods**

Suggested methods:

```ts
createComment(postId: string, userId: string, dto: CreateCommentDto)
listComments(postId: string, cursor?: string, limit = 20)
updateComment(commentId: string, userId: string, dto: UpdateCommentDto)
removeComment(commentId: string, userId: string)
```

- [ ] **Step 4: Add the comment endpoints**

Suggested endpoints:

```ts
GET /posts/:id/comments
POST /posts/:id/comments
PATCH /comments/:id
DELETE /comments/:id
```

- [ ] **Step 5: Emit a comment-created event**

```ts
this.eventEmitter.emit('social.post.commented', {
  actorId: userId,
  postId,
  commentId: comment.id,
});
```

- [ ] **Step 6: Run focused tests**

Run:

```bash
npm test -- reaction.service.spec.ts
```

Expected: both like and comment rules pass in one service suite.

- [ ] **Step 7: Commit**

```bash
git add src/domain/social/reaction
git commit -m "feat: add post comments"
```

---

## Task 6: Build The Feed Read Model

**Files:**
- Create: `src/domain/social/feed/feed.controller.ts`
- Create: `src/domain/social/feed/feed.service.ts`
- Create: `src/domain/social/feed/feed.service.spec.ts`
- Modify: `src/domain/social/feed/feed.module.ts`

- [ ] **Step 1: Decide the initial feed contract**

For Phase 2, keep it chronological and follow-driven:

- feed contains posts authored by users the current user follows
- sort by `createdAt DESC`, then `id DESC`
- use cursor pagination

If you later support organization/event-authored posts, extend this query in a later iteration. Do not introduce polymorphic authorship in the first feed version.

- [ ] **Step 2: Write feed tests**

Cover:

- returns followed users' posts
- excludes unfollowed users' posts
- excludes deleted posts
- returns newest posts first
- returns stable next cursor
- includes viewer-specific `likedByMe`

- [ ] **Step 3: Implement the feed query**

Suggested query shape:

```ts
const followedUsers = await this.prismaService.follow.findMany({
  where: { followerId: userId, targetType: TargetType.USER },
  select: { targetId: true },
});
```

Then fetch posts for those author IDs with:

- author summary
- `_count` for likes/comments
- whether the current user has a like row

- [ ] **Step 4: Return a feed item read model**

Example response shape:

```ts
{
  id,
  content,
  createdAt,
  author: { id, displayName, avatar },
  counts: { likes, comments },
  likedByMe: boolean,
}
```

- [ ] **Step 5: Add the controller**

Suggested endpoint:

```ts
GET /feed
```

Use the existing `PaginationQueryDTO` for `cursor` and `limit`.

- [ ] **Step 6: Run focused tests**

Run:

```bash
npm test -- feed.service.spec.ts
```

Expected: feed ordering, filtering, and pagination behavior are covered.

- [ ] **Step 7: Commit**

```bash
git add src/domain/social/feed
git commit -m "feat: add social feed"
```

---

## Task 7: Build Notifications As Event-Driven Side Effects

**Files:**
- Create: `src/domain/social/notification/notification.controller.ts`
- Create: `src/domain/social/notification/notification.service.ts`
- Create: `src/domain/social/notification/notification.service.spec.ts`
- Modify: `src/domain/social/notification/notification.module.ts`

- [ ] **Step 1: Write notification tests**

Cover:

- create notification from a like event
- create notification from a comment event
- do not notify users about their own actions
- list current user's notifications newest first
- mark one notification as read
- mark all notifications as read
- unread count is correct

- [ ] **Step 2: Implement the service**

Suggested methods:

```ts
createLikeNotification(actorId: string, postId: string)
createCommentNotification(actorId: string, postId: string, commentId: string)
listForUser(userId: string, cursor?: string, limit = 20)
markAsRead(notificationId: string, userId: string)
markAllAsRead(userId: string)
getUnreadCount(userId: string)
```

- [ ] **Step 3: Resolve the recipient safely**

To notify the post owner, load the target post first:

```ts
const post = await this.prismaService.post.findUnique({
  where: { id: postId },
  select: { id: true, authorId: true },
});
```

If `actorId === post.authorId`, skip notification creation.

- [ ] **Step 4: Add event listeners**

If using `@nestjs/event-emitter`, use decorators like:

```ts
@OnEvent('social.post.liked')
handlePostLiked(event: { actorId: string; postId: string }) {}
```

This keeps `ReactionService` from depending directly on `NotificationService`.

- [ ] **Step 5: Add the controller**

Suggested endpoints:

```ts
GET /notifications
GET /notifications/unread-count
PATCH /notifications/:id/read
PATCH /notifications/read-all
```

- [ ] **Step 6: Run focused tests**

Run:

```bash
npm test -- notification.service.spec.ts
```

Expected: notification logic and ownership rules pass.

- [ ] **Step 7: Commit**

```bash
git add src/domain/social/notification
git commit -m "feat: add in-app notifications"
```

---

## Task 8: Add End-To-End Coverage For The Social Flows

**Files:**
- Create: `test/e2e/post.e2e-spec.ts`
- Create: `test/e2e/reaction.e2e-spec.ts`
- Create: `test/e2e/feed.e2e-spec.ts`
- Create: `test/e2e/notification.e2e-spec.ts`

- [ ] **Step 1: Add post e2e coverage**

Cover:

- create post
- view post
- update own post
- block update by another user
- delete own post

- [ ] **Step 2: Add reaction e2e coverage**

Cover:

- like post
- unlike post
- add comment
- list comments
- block comment edit by non-owner

- [ ] **Step 3: Add feed e2e coverage**

Cover:

- user follows another user
- followed user creates posts
- viewer sees followed posts in `/feed`
- unfollowed user's posts do not appear

- [ ] **Step 4: Add notification e2e coverage**

Cover:

- user likes another user's post
- recipient sees notification
- recipient marks one as read
- recipient marks all as read

- [ ] **Step 5: Run the social e2e tests**

Run:

```bash
npm run test:e2e -- post.e2e-spec.ts reaction.e2e-spec.ts feed.e2e-spec.ts notification.e2e-spec.ts
```

Expected: all new Phase 2 e2e tests pass together.

- [ ] **Step 6: Commit**

```bash
git add test/e2e
git commit -m "test: add Phase 2 social e2e coverage"
```

---

## Task 9: Full Verification And Integration Check

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

Expected: the full API suite passes, including the new social scenarios.

- [ ] **Step 3: Run lint and build**

Run:

```bash
npm run lint
npm run build
```

Expected: no lint or TypeScript errors remain.

- [ ] **Step 4: Review the final API surface**

Sanity check:

- `POST /posts`
- `GET /posts/:id`
- `GET /users/:userId/posts`
- `POST /posts/:id/likes`
- `DELETE /posts/:id/likes`
- `GET /posts/:id/comments`
- `POST /posts/:id/comments`
- `GET /feed`
- `GET /notifications`

Make sure routes use the same validation, response wrapper, and auth patterns as Phase 1.

- [ ] **Step 5: Commit**

```bash
git add prisma src test
git commit -m "feat: complete Phase 2 social"
```

---

## Self-Review Checklist

- [ ] The plan stays aligned with the approved Phase 2 design spec
- [ ] The first version keeps posts user-authored only
- [ ] Feed uses cursor pagination, not offset pagination
- [ ] Likes enforce a DB uniqueness invariant
- [ ] Notification creation is decoupled through domain events if event-emitter is adopted
- [ ] No speculative features slipped in, such as reposts, ranking, or push delivery
- [ ] The implementation order is `post` -> `reaction` -> `feed` -> `notification`

---

## Phase Roadmap Reminder

This plan only covers Phase 2.

| Phase | Focus |
|-------|-------|
| **Phase 1** | Core platform and follow system |
| **Phase 2** | Social layer |
| **Phase 3** | Payments |
| **Phase 4** | Scale, queues, caching, deployment maturity |

Finish this phase before expanding into payments or queue-backed notifications.
