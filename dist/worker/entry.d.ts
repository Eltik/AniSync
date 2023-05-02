import QueueExecutor from '@/src/helper/queue';
import { Anime, Manga, Type } from '../mapping';
declare const executor: QueueExecutor<{
    toInsert: Anime | Manga;
    type: Type;
}>;
export default executor;
