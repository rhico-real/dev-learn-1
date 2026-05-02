import { Module } from '@nestjs/common';
import { FollowModule } from './follow/follow.module';
import { PostModule } from './post/post.module';
import { ReactionModule } from './reaction/reaction.module';
import { FeedModule } from './feed/feed.module';
import { NotificationModule } from './notification/notification.module';
import { FCMService } from './notification/fcm.service';

@Module({
    imports: [
        FollowModule,
        PostModule,
        ReactionModule,
        FeedModule,
        NotificationModule,
    ],
    exports: [
        FollowModule,
        PostModule,
        ReactionModule,
        FeedModule,
        NotificationModule,
    ],
    providers: [FCMService],
})
export class SocialContextModule {}
