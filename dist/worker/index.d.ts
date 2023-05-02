declare const _default: {
    mappingQueue: import("../helper/queue").default<{
        id: string;
        type: import("../mapping").Type;
    }>;
    seasonQueue: import("../helper/queue").default<{
        type: import("../mapping").Type;
        formats: import("../mapping").Format[];
    }>;
    createEntry: import("../helper/queue").default<{
        toInsert: import("../mapping").Anime | import("../mapping").Manga;
        type: import("../mapping").Type;
    }>;
    searchQueue: import("../helper/queue").default<{
        query: string;
        type: import("../mapping").Type;
        formats: import("../mapping").Format[];
    }>;
};
export default _default;
