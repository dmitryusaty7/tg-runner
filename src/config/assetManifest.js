import assetRegistry from './assetRegistry.json';

export const ASSET_LIST = assetRegistry;

export const ASSET_BY_ID = Object.freeze(
    ASSET_LIST.reduce((acc, entry) => {
        acc[entry.id] = entry;
        return acc;
    }, {})
);
