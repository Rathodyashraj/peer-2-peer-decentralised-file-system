const DB_NAME = "PeerShareDB";
const STORE_NAME = "identityStore";

const openDB = () => {

    return new Promise((resolve, reject) => {

        const request = indexedDB.open(DB_NAME, 1);

        request.onupgradeneeded = () => {

            const db = request.result;

            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }

        };

        request.onsuccess = () => resolve(request.result);

        request.onerror = () => reject(request.error);

    });

}



export const saveIdentity = async (deviceId,privateKey) => {

    const db = await openDB();

    return new Promise((resolve, reject) => {

        const transaction = db.transaction(
            STORE_NAME,
            "readwrite"
        );

        const store = transaction.objectStore(
            STORE_NAME
        );

        store.put(
            {
                deviceId,
                privateKey
            },
            "identity"
        );

        transaction.oncomplete = () => resolve();

        transaction.onerror = () =>
            reject(transaction.error);

    });

}



export const getIdentity = async () => {

    const db = await openDB();

    return new Promise((resolve, reject) => {

        const transaction = db.transaction(
            STORE_NAME,
            "readonly"
        );

        const store = transaction.objectStore(
            STORE_NAME
        );

        const request = store.get("identity");

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onerror = () => {
            reject(request.error);
        };

    });

}