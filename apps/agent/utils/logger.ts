export const logger = {
    info: (msg: string) => console.log(msg),
    warn: (msg: string) => console.warn(`::warning::${msg}`),
    error: (msg: string, stack?: string) => {
        console.error(`::error::${msg}`); 
        if (stack) console.error(stack);
    },
    group: (name: string) => console.log(`::group::${name}`),
    groupEnd: () => console.log('::endgroup::')
};
