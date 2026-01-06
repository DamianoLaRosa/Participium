// Socket.IO instance holder - used to avoid circular dependencies
let io = null;

export const setIO = (ioInstance) => {
  io = ioInstance;
};

export const getIO = () => io;

