let io = null;
export const setIO = (instance) => { io = instance; };
export const getIO = () => io;
/** Emit to one room or an array of rooms (a socket in several rooms receives the event once). */
export const emitTo = (rooms, event, payload) => { if (io) io.to(rooms).emit(event, payload); };
