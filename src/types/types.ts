export type Message = {
    _id: string;
    senderId: string;
    content: string;
    createdAt: Date;
  };
  
  export type Group = {
    _id: string;
    name?: string;
  };
  
  export type User = {
    _id: string;
    username: string;
    profilePictureUrl?: string;
  };
  
  export type ErrorResponse = {
    message: string;
  };