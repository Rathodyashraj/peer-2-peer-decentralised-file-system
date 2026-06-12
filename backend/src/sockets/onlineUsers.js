export const onlineUsers = new Map();

export const getOnlineUsers = (excludeUserId) => {
    const users = []

    for (const [userId,data] of onlineUsers){
        if(userId !== excludeUserId){
            users.push({
                userId,
                username: data.username
            });
        }
    }

    return users;
}


export const broadCastOnlineUsers = (io) => {

    for (const [userId, data] of onlineUsers) {

        const users = getOnlineUsers(userId);

        for (const socketId of data.socketIds) {

            io.to(socketId).emit(
                "online-users-updated",
                users
            );

        }

    }

}