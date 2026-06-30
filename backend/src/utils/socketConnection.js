import { activeConnections } from "../sockets/activeConnections.js";

export const getActiveConnectionBySocket = (socketId) => {

    for (const connection of activeConnections.values()) {

        if (
            connection.requester.socketId === socketId ||
            connection.acceptor.socketId === socketId
        ) {
            return connection;
        }

    }

    return null;
};