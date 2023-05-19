import QueueExecutor from "../helper/queue";
import { Type } from "../mapping";
declare const executor: QueueExecutor<{
    id: string;
    type: Type;
}>;
export default executor;
