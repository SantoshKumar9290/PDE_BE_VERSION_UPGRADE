const NodeCache = require( "node-cache" );
let myCache = null;


const getCache = () => {
    if(!myCache){
        myCache = new NodeCache();
    }
    return myCache;
}

const addDataToCache = (key, value, ttl = 1800) => {
    if(!myCache)
        getCache();

    return myCache.set(key, value, ttl);
}

const getDataFromCache = (key) => {
    if(!myCache)
        return null;
        
    return myCache.get(key);
}

module.exports = { getCache, addDataToCache, getDataFromCache };