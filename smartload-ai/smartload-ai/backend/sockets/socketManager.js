const { Server } = require('socket.io');

let io;

exports.initializeSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('join_user_room', (userId) => {
      socket.join(`user_${userId}`);
      console.log(`Socket ${socket.id} joined room user_${userId}`);
    });

    socket.on('start_simulation', (data) => {
      const { vehicleId, userId } = data;
      const interval = setInterval(async () => {
        const baseWeight = Math.floor(Math.random() * 500) + 500;
        const variation = Math.floor(Math.random() * 10) - 5;
        const weight = baseWeight + variation;
        io.to(`user_${userId}`).emit('simulation_weight', {
          vehicleId, weight, timestamp: new Date()
        });
      }, 2500);
      socket.simulationInterval = interval;
    });

    socket.on('stop_simulation', () => {
      if (socket.simulationInterval) {
        clearInterval(socket.simulationInterval);
        delete socket.simulationInterval;
      }
    });

    socket.on('machine_weight', (data) => {
      const { userId, weight, deviceId } = data;
      io.to(`user_${userId}`).emit('machine_weight_update', {
        weight, deviceId, timestamp: new Date()
      });
    });

    socket.on('manual_entry', (data) => {
      const { userId } = data;
      io.to(`user_${userId}`).emit('manual_entry_update', data);
    });

    socket.on('disconnect', () => {
      if (socket.simulationInterval) clearInterval(socket.simulationInterval);
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
};

exports.getIO = () => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};