import { Module } from '@nestjs/common';
import { ReactionService } from './reaction.service';
import { ReactionController } from './reaction.controller';
import { IdentityContextModule } from '../../identity/identity-context.module';
import { PostModule } from '../post/post.module';

@Module({
    imports: [IdentityContextModule, PostModule],
    controllers: [ReactionController],
    providers: [ReactionService],
    exports: [ReactionService],
})
export class ReactionModule {}
