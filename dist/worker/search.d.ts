import QueueExecutor from "../helper/queue";
import { Format, Type } from "../mapping";
declare const executor: QueueExecutor<{
    query: string;
    type: Type;
    formats: Format[];
}>;
export default executor;
