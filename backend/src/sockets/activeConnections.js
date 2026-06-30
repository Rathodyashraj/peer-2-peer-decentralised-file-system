export const activeConnections = new Map();

export const isUserBusy = (userId) => {

    for (const connection of activeConnections.values()) {

        if (
            connection.requester.userId === userId ||
            connection.acceptor.userId === userId
        ) {
            return true;
        }

    }

    return false;

};