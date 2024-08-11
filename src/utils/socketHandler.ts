import { io, Socket } from 'socket.io-client';
import { API_URL } from '../variables/Variables';
import { Message } from '../types/types';

let socket: Socket | null = null;


export const initializeSocket = (
  userId: string,
  onConnect: () => void,
  onConnectError: (error: Error) => void
): void => {
  socket = io(API_URL, {
    withCredentials: true,
    transports: ['websocket'],
    query: { userId }
  });

  socket.on('connect', onConnect);
  socket.on('connect_error', onConnectError);
};

export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const joinRoom = (userId: string, room: string): void => {
  if (socket) {
    socket.emit('join', { userId, room });
  }
};

export const leaveGroup = (userId: string, groupId: string): void => {
  if (socket) {
    socket.emit('leaveGroup', { userId, groupId });
  }
};

export const sendMessage = (messageData: { userId: string; room: string; content: string }): void => {
  if (socket) {
    socket.emit('sendMessage', messageData);
  }
};

export const onMessage = (callback: (message: Message) => void): void => {
  if (socket) {
    socket.on('message', callback);
  }
};

export const onMemberUpdate = (callback: (members: string[]) => void): void => {
  if (socket) {
    socket.on('memberUpdate', callback);
  }
};

export const onJoinSuccess = (callback: (data: { room: string; members: string[] }) => void): void => {
  if (socket) {
    socket.once('joinSuccess', callback);
  }
};


  
  export const onGroupDeleted = (callback: (data: { groupId: string }) => void): void => {
    if (socket) {
      socket.on('groupDeleted', callback);
    }
  };

export const removeAllListeners = (): void => {
  if (socket) {
    socket.removeAllListeners();
  }
};

export const onLeftGroup = (callback: (data: { userId: string; groupId: string }) => void): void => {
  if (socket) {
    socket.on('leftGroup', callback);
  }
};

export const onMemberLeft = (callback: (data: { userId: string; groupId: string }) => void): void => {
  if (socket) {
    socket.on('memberLeft', callback);
  }
};

export const removeListeners = (events: string[]): void => {
  if (socket) {
    events.forEach(event => socket?.removeAllListeners(event));
  }
};
