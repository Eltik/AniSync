import QueueExecutor from '@/src/helper/queue';
import { Type } from '../mapping';
declare const executor: QueueExecutor<{
    id: string;
    type: Type;
}>;
export default executor;
