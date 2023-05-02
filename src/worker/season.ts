import QueueExecutor from '@/src/helper/queue';
import { loadMapping } from '../lib/mappings';
import { Format, Type } from '../mapping';
import { loadSeasonal } from '../lib/season';
import colors from "colors";

const executor = new QueueExecutor<{ type: Type, formats: Format[]}>("season-executor")
    .executor(async (data) => {
        const media = await loadSeasonal(data as any);
        return media;
    })
    .callback(id => console.debug(colors.green(`Finished fetching seasonal data ${id.type}.`)))
    .error((err, id) => console.error(colors.red(`Error occurred while fetching seasonal data ${id.type}.`), err))
    .interval(1000)
export default executor;