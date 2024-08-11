import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Message, Group } from '../types/types';
import * as chatUtils from '../services/chatUtils';
import * as socketHandler from '../utils/socketHandler';
import { getSessionUserId, setSessionItem, clearSessionData } from '../utils/sessionUtils';

export const useChatLogic = () => {
  const [userId, setUserId] = useState('');
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [groups, setGroups] = useState<Group[]>([]);
  const [isProfilePictureDialogOpen, setIsProfilePictureDialogOpen] = useState(false);
  const [isGroupPictureDialogOpen, setIsGroupPictureDialogOpen] = useState(false);
  const [newProfilePictureUrl, setNewProfilePictureUrl] = useState('');
  const [newGroupPictureUrl, setNewGroupPictureUrl] = useState('');
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [socketError, setSocketError] = useState<string | null>(null);
  const [roomMembers, setRoomMembers] = useState<string[]>([]);
  const [userNames, setUserNames] = useState<{[key: string]: string}>({});
  const [currentUserName, setCurrentUserName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const messageListRef = useRef<HTMLUListElement>(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    socketHandler.onMemberLeft((data) => {
      if (data.groupId === selectedRoom) {
        setRoomMembers(prevMembers => prevMembers.filter(memberId => memberId !== data.userId));
      }
      setGroups(prevGroups => prevGroups.map(group => 
        group._id === data.groupId 
          ? { ...group, members: group.members.filter(memberId => memberId !== data.userId) } 
          : group
      ));
    });
  
    return () => {
      socketHandler.removeListeners(['memberLeft']);
    };
  }, [selectedRoom]);
  useEffect(() => {
    const handleNewMessage = (newMessage: Message) => {
      console.log('New message received:', newMessage);
      if (newMessage.groupId === selectedRoom) {
        setMessages(prevMessages => [...prevMessages, newMessage]);
      }
    };
  
    socketHandler.onMessage(handleNewMessage);
  
    return () => {
      socketHandler.removeListeners(['message']);
    };
  }, [selectedRoom]);
  
  useEffect(() => {
    socketHandler.onLeftGroup((data) => {
      if (data.userId === userId) {
        setGroups(prevGroups => prevGroups.filter(group => group._id !== data.groupId));
        if (selectedRoom === data.groupId) {
          setSelectedRoom(null);
          setMessages([]);
          setRoomMembers([]);
        }
      } else {
        setRoomMembers(prevMembers => prevMembers.filter(memberId => memberId !== data.userId));
      }
    });
  
    socketHandler.onGroupDeleted((data) => {
      setGroups(prevGroups => prevGroups.filter(group => group._id !== data.groupId));
      if (selectedRoom === data.groupId) {
        setSelectedRoom(null);
        setMessages([]);
        setRoomMembers([]);
      }
    });
  
    return () => {
      socketHandler.removeListeners(['leftGroup', 'groupDeleted']);
    };
  }, [userId, selectedRoom]);

  useEffect(() => {
    const initializeChat = async () => {
      setIsLoading(true);
      const sessionUserId = getSessionUserId();
      if (!sessionUserId) {
        navigate('/login');
        return;
      }
      setUserId(sessionUserId);

      try {
        await fetchProfilePicture(sessionUserId);
        await fetchUserData(sessionUserId);
        
        socketHandler.initializeSocket(
          sessionUserId,
          () => console.log('Connected to server'),
          (error) => {
            console.error('Socket connection error:', error);
            setSocketError('Failed to connect to the server');
          }
        );
      } catch (error) {
        console.error('Error initializing chat:', error);
        setError('Failed to initialize chat. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    initializeChat();

    return () => {
      socketHandler.disconnectSocket();
    };
  }, [navigate]);
  
  useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [messages]);
  
  useEffect(() => {
    const fetchMissingUserNames = async () => {
      const missingUserIds = messages
        .map(message => message.senderId)
        .filter(senderId => senderId && senderId !== userId && !userNames[senderId]);
  
      const uniqueMissingUserIds = [...new Set(missingUserIds)];
  
      for (const senderId of uniqueMissingUserIds) {
        await handleDifferentUserRender(senderId);
      }
    };
  
    fetchMissingUserNames();
  }, [messages, userId, userNames]);
  
  useEffect(() => {
    const fetchMemberNames = async () => {
      for (const memberId of roomMembers) {
        if (memberId !== userId && !userNames[memberId]) {
          await handleDifferentUserRender(memberId);
        }
      }
    };
  
    fetchMemberNames();
  }, [roomMembers, userId, userNames]);

  const fetchProfilePicture = async (sessionUserId: string) => {
    try {
      const sessionId = sessionStorage.getItem('sessionId');
      if (sessionId) {
        const cachedProfilePicture = localStorage.getItem(`session_${sessionId}_profilePicture`);
        if (cachedProfilePicture && cachedProfilePicture !== 'null' && cachedProfilePicture !== 'undefined') {
          setProfilePicture(cachedProfilePicture);
        } else {
          const profilePic = await chatUtils.fetchUserProfilePicture(sessionUserId);
          console.log('Fetched profile picture:', profilePic);
          if (profilePic) {
            setProfilePicture(profilePic);
            localStorage.setItem(`session_${sessionId}_profilePicture`, profilePic);
          } else {
            console.log('No profile picture found for user');
            setProfilePicture(null);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching profile picture:', error);
      setProfilePicture(null);
    }
  };
  const fetchUserData = async (sessionUserId: string) => {
    try {
      const [groups, username] = await Promise.all([
        chatUtils.fetchUserGroups(sessionUserId),
        chatUtils.fetchUserName(sessionUserId)
      ]);

      setGroups(groups);
      setSessionItem('userGroups', JSON.stringify(groups));
      setCurrentUserName(username);
      setUserNames(prev => ({...prev, [sessionUserId]: username}));
      setSessionItem('username', username);
    } catch (error) {
      console.error('Error fetching user data:', error);
      setError('Failed to fetch user data. Please try again.');
    }
  };
  const handleSettingsClick = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  }, []);

  const handleSettingsClose = useCallback(() => {
    setAnchorEl(null);
  }, []);


  const handleDisconnect = useCallback(() => {
    handleSettingsClose();
    socketHandler.disconnectSocket();
    clearSessionData();
    navigate('/login');
  }, [handleSettingsClose, navigate]);

  const handleDeleteAccount = useCallback(async () => {
    handleSettingsClose();
    try {
      await chatUtils.deleteAccount(userId);
      handleDisconnect();
    } catch (error) {
      setError('Failed to delete account');
    }
  }, [userId, handleSettingsClose, handleDisconnect]);

  const handleSocketErrorClose = useCallback((event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setSocketError(null);
  }, []);

  const handleUpdateProfilePicture = useCallback(async () => {
    try {
      const newProfilePicture = await chatUtils.updateProfilePicture(userId, newProfilePictureUrl);
      setProfilePicture(newProfilePicture);
      
      const sessionId = sessionStorage.getItem('sessionId');
      if (sessionId) {
        localStorage.setItem(`session_${sessionId}_profilePicture`, newProfilePicture);
      }
      
      setUserNames(prev => ({...prev, [userId]: newProfilePicture}));
      setIsProfilePictureDialogOpen(false);
      setNewProfilePictureUrl(''); 
    } catch (error) {
      console.error('Failed to update profile picture:', error);
      setError('Failed to update profile picture. Please try again.');
    }
  }, [userId, newProfilePictureUrl]);


  const handleUpdateGroupPicture = useCallback(async () => {
    if (!selectedRoom) return;
    try {
      const newGroupPicture = await chatUtils.updateGroupPicture(selectedRoom, newGroupPictureUrl);
      setGroups(prevGroups => prevGroups.map(group => 
        group._id === selectedRoom ? { ...group, groupPicture: newGroupPicture } : group
      ));
      setIsGroupPictureDialogOpen(false);
    } catch (error) {
      setError('Failed to update group picture');
    }
  }, [selectedRoom, newGroupPictureUrl]);

  const handleLeaveGroup = useCallback(async () => {
    if (!selectedRoom) return;
    try {
      await socketHandler.leaveGroup(userId, selectedRoom);
      setGroups(prevGroups => prevGroups.filter(group => group._id !== selectedRoom));
      setSelectedRoom(null);
      setMessages([]);
      setRoomMembers([]);
    } catch (error) {
      console.error('Failed to leave group:', error);
      setError('Failed to leave group. Please try again.');
    }
  }, [userId, selectedRoom]);

  const joinRoom = useCallback(async (groupId: string) => {
    if (!groupId) {
      setError('Invalid group selected');
      return;
    }
    try {
      socketHandler.joinRoom(userId, groupId);
      socketHandler.onJoinSuccess(async ({ room, members }) => {
        const messages = await chatUtils.fetchRoomMessages(room);
        setMessages(messages);
        setSelectedRoom(room);
        setRoomMembers(members);

        for (const memberId of members) {
          if (memberId !== userId && !userNames[memberId]) {
            const userName = await chatUtils.fetchUserName(memberId);
            setUserNames(prev => ({...prev, [memberId]: userName}));
          }
        }
      });
    } catch (error) {
      console.log(error, 'Failed to join room');
    }
  }, [userId, userNames]);
  const sendMessage = useCallback(() => {
    if (inputMessage.trim() === '' || !selectedRoom) return;
    
    const messageData = {
      userId: userId,
      room: selectedRoom,
      content: inputMessage
    };
    
    socketHandler.sendMessage(messageData);
    setInputMessage('');
  }, [userId, selectedRoom, inputMessage]);

  const handleDifferentUserRender = async (senderId: string) => {
    if (!senderId) {
      console.log("Sender ID is undefined");
      return "Unknown User";
    }
    
    if (userNames[senderId]) {
      return userNames[senderId];
    }
    
    try {
      const userName = await chatUtils.fetchUserName(senderId);
      setUserNames(prev => {
        const newUserNames = {...prev, [senderId]: userName};
        console.log("Updated userNames:", newUserNames);
        return newUserNames;
      });
      return userName;
    } catch (error) {
      console.error("Error in handleDifferentUserRender", error);
      return "Unknown User";
    }
  };


  return {
    userId,
    selectedRoom,
    messages,
    inputMessage,
    setInputMessage,
    groups,
    setGroups,
    isProfilePictureDialogOpen,
    setIsProfilePictureDialogOpen,
    isGroupPictureDialogOpen,
    setIsGroupPictureDialogOpen,
    newProfilePictureUrl,
    setNewProfilePictureUrl,
    newGroupPictureUrl,
    setNewGroupPictureUrl,
    profilePicture,
    error,
    setError,
    socketError,
    roomMembers,
    userNames,
    currentUserName,
    messageListRef,
    handleSettingsClick,
    handleSettingsClose,
    handleDisconnect,
    handleDeleteAccount,
    handleSocketErrorClose,
    handleUpdateProfilePicture,
    handleUpdateGroupPicture,
    handleLeaveGroup,
    joinRoom,
    sendMessage,
    handleDifferentUserRender,
    anchorEl,
    setAnchorEl,
    isLoading
  };
};