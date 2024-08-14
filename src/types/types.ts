export type Message = {
    _id: string;
    senderId: string;
    groupId: string;
    content: string;
    createdAt: Date;
  };
  
  export type Group = {
    _id: string;
    name: string;
    members: string[];
    groupPicture?: string | null;
    isPrivate: Boolean;
  };
  
  export type User = {
    _id: string;
    username: string;
    profilePictureUrl?: string;
  };
  
  export type ErrorResponse = {
    message: string;
  };