import { API } from '../services/api';
import { Group, Message } from '../types/types';

export const fetchUserGroups = async (userId: string): Promise<Group[]> => {
  try {
    const groupIdsResponse = await API.get(`/users/${userId}/groups`);
    const groupPromises = groupIdsResponse.data.map((groupId: string) => 
      API.get(`/groups/${groupId}`)
    );
    const groupResponses = await Promise.all(groupPromises);
    return groupResponses.map(response => response.data);
  } catch (error) {
    console.error('Failed to fetch user groups:', error);
    throw error;
  }
};

export const fetchUserProfilePicture = async (userId: string): Promise<string | null> => {
  try {
    const response = await API.get(`users/${userId}/profile-picture`);
    if (response.data && response.data.profilePicture) {
      return response.data.profilePicture;
    }
    return null;
  } catch (error) {
    console.error("Error in fetchUserProfilePicture", error);
    return null;
  }
};

export const updateProfilePicture = async (userId: string, newProfilePictureUrl: string): Promise<string> => {
  try {
    const response = await API.put(`/users/${userId}/profile-picture`, { profilePictureUrl: newProfilePictureUrl });
    if (response.data && response.data.profilePicture) {
      return response.data.profilePicture;
    }
    throw new Error('Failed to update profile picture');
  } catch (error) {
    console.error('Failed to update profile picture:', error);
    throw error;
  }
};

export const updateGroupPicture = async (groupId: string, newGroupPictureUrl: string): Promise<string> => {
  try {
    const response = await API.put(`/groups/${groupId}/group-picture`, { groupPictureUrl: newGroupPictureUrl });
    if (response.data && response.data.groupPicture) {
      return response.data.groupPicture;
    }
    throw new Error('Failed to update group picture');
  } catch (error) {
    console.error('Failed to update group picture:', error);
    throw error;
  }
};

export const deleteAccount = async (userId: string): Promise<void> => {
  try {
    await API.delete(`/users/${userId}`);
  } catch (error) {
    console.error('Failed to delete account:', error);
    throw error;
  }
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
  try {
    const response = await API.get(`/messages/room/${roomId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch room messages:', error);
    throw error;
  }
};

