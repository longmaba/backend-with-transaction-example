module.exports = {
  name: 'push-notification',
  description: 'Push notification handlers',
  services: {
    io: {
      require: ['::socket.io', 'appRunner'],
      func: (SocketIo, app) => {
        const io = SocketIo(app.server);
        return io;
      }
    },
    broadcast: {
      require: ['io'],
      func: io => async (eventName, data) => {
        io.emit(eventName, data);
      }
    }
  },
  exports: ['broadcast']
};
