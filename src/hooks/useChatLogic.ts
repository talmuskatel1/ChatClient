import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Message, Group } from '../types/types';
import * as chatUtils from '../utils/chatUtils';
import * as socketHandler from '../utils/socketHandler';

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
  const messageListRef = useRef<HTMLUListElement>(null);
  const navigate = useNavigate();
  useEffect(() => {
    socketHandler.initializeSocket(
      () => console.log('Connected to server'),
      (error) => setSocketError('Failed to connect to the server')
    );
  
    return () => {
      socketHandler.disconnectSocket();
    };
  }, []);
  
  useEffect(() => {
    socketHandler.onMessage((message: Message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });
  
    socketHandler.onMemberUpdate((members: string[]) => {
      setRoomMembers(members);
    });
  
    socketHandler.onMemberLeft(({ userId: leftUserId, groupId }: { userId: string; groupId: string }) => {
      setRoomMembers(prevMembers => prevMembers.filter(memberId => memberId !== leftUserId));
      setGroups(prevGroups => prevGroups.map(group => 
        group._id === groupId 
          ? { ...group, members: group.members.filter(id => id !== leftUserId) } 
          : group
      ));
  
      if (leftUserId === userId) {
        setSelectedRoom(null);
        setMessages([]);
      }
    });  
  
    socketHandler.onGroupDeleted(({ groupId }) => {
      setGroups(prevGroups => prevGroups.filter(group => group._id !== groupId));
      if (selectedRoom === groupId) {
        setSelectedRoom(null);
        setMessages([]);
        setRoomMembers([]);
      }
    });
  
    return () => {
      socketHandler.removeAllListeners();
    };
  }, [userId, selectedRoom]);
  
  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    if (!storedUserId) {
      navigate('/login');
      return;
    }
    setUserId(storedUserId);
    chatUtils.fetchUserProfilePicture(storedUserId).then(setProfilePicture);
    chatUtils.fetchUserGroups(storedUserId).then(setGroups).catch(() => setError('Failed to fetch user groups'));
    
    const fetchCurrentUserName = async () => {
      try {
        const username = await chatUtils.fetchUserName(storedUserId);
        setCurrentUserName(username);
        setUserNames(prev => ({...prev, [storedUserId]: username}));
      } catch (error) {
        console.error("Error fetching current user's name:", error);
      }
    };
    
    fetchCurrentUserName();
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
  }, [roomMembers]);

  const handleSettingsClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleSettingsClose = () => {
    setAnchorEl(null);
  };

  const handleDisconnect = () => {
    handleSettingsClose();
    socketHandler.disconnectSocket();
    localStorage.removeItem('userId');
    localStorage.removeItem('profilePicture');
    navigate('/login');
  };

  const handleDeleteAccount = async () => {
    handleSettingsClose();
    try {
      await chatUtils.deleteAccount(userId);
      handleDisconnect();
    } catch (error) {
      setError('Failed to delete account');
    }
  };

  const handleSocketErrorClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setSocketError(null);
  };

  const handleUpdateProfilePicture = async () => {
    try {
      const newProfilePicture = await chatUtils.updateProfilePicture(userId, newProfilePictureUrl);
      setProfilePicture(newProfilePicture);
      localStorage.setItem('profilePicture', newProfilePicture);
      setIsProfilePictureDialogOpen(false);
    } catch (error) {
      setError('Failed to update profile picture');
    }
  };

  const handleUpdateGroupPicture = async () => {
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
  };

  const handleLeaveGroup = () => {
    if (!selectedRoom) return;
    socketHandler.leaveGroup(userId, selectedRoom);
    
    setGroups(prevGroups => prevGroups.filter(group => group._id !== selectedRoom));
    setSelectedRoom(null);
    setMessages([]);
    setRoomMembers([]);
  };

  const joinRoom = async (groupId: string) => {
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
  };

  const sendMessage = () => {
    if (inputMessage.trim() === '' || !selectedRoom) return;
    
    socketHandler.sendMessage({
      userId: userId,
      room: selectedRoom,
      content: inputMessage
    });
    setInputMessage('');
  };

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
    setAnchorEl
  };
};