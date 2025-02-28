import { API } from './api';
import { Group, Message } from '../types/types';

export const fetchUserGroups = async (userId: string): Promise<Group[]> => {
  try {
    const response = await API.get(`/users/${userId}/groups`);
    
    const groupPromises = response.data.map((groupId: string) => API.get(`/groups/${groupId}`));
    const groupResponses = await Promise.all(groupPromises);
    
    const groups = groupResponses.map(response => response.data);
    
    return groups.map((group: any): Group => ({
      _id: group._id,
      name: group.name,
      members: group.members,
      groupPicture: group.groupPicture || null,
      isPrivate: group.isPrivate
    }));
  } catch (error) {
    console.error('Failed to fetch user groups:', error);
    throw error;
  }
};

export const fetchUserProfilePicture = async (userId: string): Promise<string | null> => {
  try {
    const response = await API.get(`users/${userId}/profile-picture`);
    console.log('Profile picture response:', response.data);
    return response.data.profilePicture || null;
  } catch (error) {
    console.error("Error in fetchUserProfilePicture", error);
    return null;
  }
};

export const updateProfilePicture = async (userId: string, formData: FormData): Promise<{ profilePicture: string }> => {
  const response = await API.put(`/users/${userId}/profile-picture`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  if (response.data && response.data.profilePicture) {
    return { profilePicture: response.data.profilePicture };
  }
  throw new Error('Failed to update profile picture');
};

export const updateGroupPicture = async (groupId: string, formData: FormData): Promise<{ groupPicture: string }> => {
  const response = await API.put(`/groups/${groupId}/group-picture`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  if (response.data && response.data.groupPicture) {
    return { groupPicture: response.data.groupPicture };
  }
  throw new Error('Failed to update group picture');
};

export const deleteAccount = async (userId: string): Promise<void> => {
  await API.delete(`/users/${userId}`);
};

export const fetchUserName = async (userId: string): Promise<string> => {
  try {
    const response = await API.get(`/users/${userId}`);
    return response.data.username;
  } catch (error) {
    console.error("Error fetching user's name:", error);
    return "Unknown User";
  }
};

export const fetchRoomMessages = async (roomId: string): Promise<Message[]> => {
  const response = await API.get(`/messages/room/${roomId}`);
  return response.data;
};

export const createGroup = async (userId: string, groupName: string): Promise<Group> => {
  const response = await API.post('/groups/create', { name: groupName, creatorId: userId });
  return response.data;
};

export const joinGroupByName = async (userId: string, groupName: string): Promise<Group> => {
  const response = await API.post('/groups/join', { userId, groupName });
  return response.data;
};


export const makeGroupPrivate = async (groupId: string): Promise<Group> => {
  try {
    const response = await API.put(`/groups/${groupId}/make-private`);
    return response.data;
  } catch (error) {
    console.error('Failed to make group private:', error);
    throw error;
  }
};

export const makeGroupPublic = async (groupId: string): Promise<Group> => {
  try {
    const response = await API.put(`/groups/${groupId}/make-public`);
    return response.data;
  } catch (error) {
    console.error('Failed to make group public:', error);
    throw error;
  }
};