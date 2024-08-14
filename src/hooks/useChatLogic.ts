import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Message, Group } from "../types/types";
import * as chatUtils from "../services/chatUtils";
import * as socketHandler from "../utils/socketHandler";
import {
  getSessionUserId,
  setSessionItem,
  clearSessionData,
  getSessionItem,
  removeSessionItem,
} from "../utils/sessionUtils";
import { API_URL } from "../variables/Variables";
export const useChatLogic = () => {
  const [userId, setUserId] = useState("");
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [groups, setGroups] = useState<Group[]>(() => {
    const storedGroups = getSessionItem('groups');
    return storedGroups || [];
  });  const [isProfilePictureDialogOpen, setIsProfilePictureDialogOpen] =
    useState(false);
  const [isGroupPictureDialogOpen, setIsGroupPictureDialogOpen] =
    useState(false);
  const [newProfilePictureUrl, setNewProfilePictureUrl] = useState("");
  const [newGroupPictureUrl, setNewGroupPictureUrl] = useState("");
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [socketError, setSocketError] = useState<string | null>(null);
  const [roomMembers, setRoomMembers] = useState<string[]>([]);
  const [userNames, setUserNames] = useState<{ [key: string]: string | { username: string; profilePicture?: string } }>({});
  const [currentUserName, setCurrentUserName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const messageListRef = useRef<HTMLUListElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const navigate = useNavigate();

  const [errors, setErrors] = useState<{
    noGroupFound: string | null;
    groupAlreadyExists: string | null;
    joinGroupFailed: string | null;
    leaveGroupFailed: string | null;
    sendMessageFailed: string | null;
    updateProfilePictureFailed: string | null;
    updateGroupPictureFailed: string | null;
    genericError: string | null;
    emptyMessage: string | null;
    groupNameExists: string | null;
    joinNonExistentGroup: string | null;
  }>({
    noGroupFound: null,
    groupAlreadyExists: null,
    joinGroupFailed: null,
    leaveGroupFailed: null,
    sendMessageFailed: null,
    updateProfilePictureFailed: null,
    updateGroupPictureFailed: null,
    genericError: null,
    emptyMessage: null,
    groupNameExists: null,
    joinNonExistentGroup: null,
  });

  useEffect(() => {
    socketHandler.onMemberLeft((data) => {
      if (data.groupId === selectedRoom) {
        setRoomMembers((prevMembers) =>
          prevMembers.filter((memberId) => memberId !== data.userId)
        );
      }
      setGroups((prevGroups) =>
        prevGroups.map((group) =>
          group._id === data.groupId
            ? {
                ...group,
                members: group.members.filter(
                  (memberId) => memberId !== data.userId
                ),
              }
            : group
        )
      );
    });

    return () => {
      socketHandler.removeListeners(["memberLeft"]);
    };
  }, [selectedRoom]);
  useEffect(() => {
    const handleNewMessage = (newMessage: Message) => {
      console.log("New message received:", newMessage);
      if (newMessage.groupId === selectedRoom) {
        setMessages((prevMessages) => [...prevMessages, newMessage]);
      }
    };

    socketHandler.onMessage(handleNewMessage);

    return () => {
      socketHandler.removeListeners(["message"]);
    };
  }, [selectedRoom]);

  useEffect(() => {
    socketHandler.onLeftGroup((data) => {
      if (data.userId === userId) {
        setGroups((prevGroups) =>
          prevGroups.filter((group) => group._id !== data.groupId)
        );
        if (selectedRoom === data.groupId) {
          setSelectedRoom(null);
          setMessages([]);
          setRoomMembers([]);
        }
      } else {
        setRoomMembers((prevMembers) =>
          prevMembers.filter((memberId) => memberId !== data.userId)
        );
      }
    });

    socketHandler.onGroupDeleted((data) => {
      setGroups((prevGroups) =>
        prevGroups.filter((group) => group._id !== data.groupId)
      );
      if (selectedRoom === data.groupId) {
        setSelectedRoom(null);
        setMessages([]);
        setRoomMembers([]);
      }
    });

    return () => {
      socketHandler.removeListeners(["leftGroup", "groupDeleted"]);
    };
  }, [userId, selectedRoom]);

  useEffect(() => {
    const initializeChat = async () => {
      setIsLoading(true);
      const sessionUserId = getSessionUserId();
      if (!sessionUserId) {
        navigate("/login");
        return;
      }
      setUserId(sessionUserId);

      try {
        await fetchProfilePicture(sessionUserId);
        await fetchUserGroups(sessionUserId);
        await fetchUserData(sessionUserId);

        socketHandler.initializeSocket(
          sessionUserId,
          () => console.log("Connected to server"),
          (error) => {
            console.error("Socket connection error:", error);
            setSocketError("Failed to connect to the server");
          }
        );
      } catch (error) {
        console.error("Error initializing chat:", error);
        setError("Failed to initialize chat. Please try again.");
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
        .map((message) => message.senderId)
        .filter(
          (senderId) => senderId && senderId !== userId && !userNames[senderId]
        );

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
      const cachedProfilePicture = getSessionItem('profilePicture');
      if (cachedProfilePicture && cachedProfilePicture.startsWith('http')) {
        setProfilePicture(cachedProfilePicture);
      } else {
        const profilePic = await chatUtils.fetchUserProfilePicture(sessionUserId);
        if (profilePic) {
          const fullProfilePicUrl = `${API_URL}/${profilePic.replace(/\\/g, '/')}`;
          setProfilePicture(fullProfilePicUrl);
          setSessionItem('profilePicture', fullProfilePicUrl);
        } else {
          setProfilePicture(null);
          removeSessionItem('profilePicture');
        }
      }
    } catch (error) {
      setProfilePicture(null);
    }
  };
  const fetchUserData = async (sessionUserId: string) => {
    try {
      const [groups, username] = await Promise.all([
        chatUtils.fetchUserGroups(sessionUserId),
        chatUtils.fetchUserName(sessionUserId),
      ]);

      setGroups(groups);
      setSessionItem("userGroups", JSON.stringify(groups));
      setCurrentUserName(username);
      setUserNames((prev) => ({ ...prev, [sessionUserId]: username }));
      setSessionItem("username", username);
    } catch (error) {
      console.error("Error fetching user data:", error);
      setError("Failed to fetch user data. Please try again.");
    }
  };
  const handleSettingsClick = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      setAnchorEl(event.currentTarget);
    },
    []
  );

  const handleSettingsClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleDisconnect = useCallback(() => {
    handleSettingsClose();
    socketHandler.disconnectSocket();
    clearSessionData();
    navigate("/login");
  }, [handleSettingsClose, navigate]);

  const handleDeleteAccount = useCallback(async () => {
    handleSettingsClose();
    try {
      await chatUtils.deleteAccount(userId);
      handleDisconnect();
    } catch (error) {
      setError("Failed to delete account");
    }
  }, [userId, handleSettingsClose, handleDisconnect]);

  const handleSocketErrorClose = useCallback(
    (event?: React.SyntheticEvent | Event, reason?: string) => {
      if (reason === "clickaway") {
        return;
      }
      setSocketError(null);
    },
    []
  );

  const handleUpdateProfilePicture = useCallback(async () => {
    if (!selectedFile) {
      setErrors(prev => ({ ...prev, updateProfilePictureFailed: 'No file selected' }));
      return;
    }
  
    try {
      const formData = new FormData();
      formData.append('image', selectedFile);
      const response = await chatUtils.updateProfilePicture(userId, formData);
      
      const newProfilePictureUrl = `${API_URL}/${response.profilePicture}`;
      
      setProfilePicture(newProfilePictureUrl);
      setSessionItem('profilePicture', response.profilePicture);
  
      setUserNames(prev => {
        const currentUserData = prev[userId];
        if (typeof currentUserData === 'string') {
          return { ...prev, [userId]: { username: currentUserData, profilePicture: newProfilePictureUrl } };
        } else {
          return { ...prev, [userId]: { ...currentUserData, profilePicture: newProfilePictureUrl } };
        }
      });
  
      setIsProfilePictureDialogOpen(false);
      setSelectedFile(null);
    } catch (error) {
      console.error('Failed to update profile picture:', error);
      setErrors(prev => ({
        ...prev,
        updateProfilePictureFailed: 'Faied to update profile picture. Please try again.',
      }));
    }
  }, [userId, selectedFile, setProfilePicture, setUserNames, setErrors]);
  
  const handleUpdateGroupPicture = useCallback(async () => {
    if (!selectedRoom || !selectedFile) {
      setErrors(prev => ({ ...prev, updateGroupPictureFailed: 'No room selected or no file selected' }));
      return;
    }

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);
      const response = await chatUtils.updateGroupPicture(selectedRoom, formData);
      
      const newGroupPictureUrl = `${API_URL}/${response.groupPicture}`;
      
      const updatedGroups = groups.map(group =>
        group._id === selectedRoom
          ? { ...group, groupPicture: newGroupPictureUrl }
          : group
      );
      setGroups(updatedGroups);
      setSessionItem('groups', updatedGroups);

      setIsGroupPictureDialogOpen(false);
      setSelectedFile(null);
    } catch (error) {
      console.error('Failed to update group picture:', error);
      setErrors(prev => ({
        ...prev,
        updateGroupPictureFailed: 'Failed to update group picture. Please try again.',
      }));
    }
  }, [selectedRoom, selectedFile, groups, setGroups]);
  const handleLeaveGroup = useCallback(async () => {
    if (!selectedRoom) return;
    try {
      await socketHandler.leaveGroup(userId, selectedRoom);
      setGroups((prevGroups) =>
        prevGroups.filter((group) => group._id !== selectedRoom)
      );
      setSelectedRoom(null);
      setMessages([]);
      setRoomMembers([]);
    } catch (error) {
      console.error("Failed to leave group:", error);
      setErrors((prev) => ({
        ...prev,
        leaveGroupFailed: "Failed to leave group. Please try again.",
      }));
    }
  }, [userId, selectedRoom]);

  const joinRoom = useCallback(
    async (groupId: string) => {
      if (!groupId) {
        setErrors((prev) => ({
          ...prev,
          noGroupFound: "Invalid group selected",
        }));
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
              setUserNames((prev) => ({ ...prev, [memberId]: userName }));
            }
          }
        });
      } catch (error) {
        console.log(error, "Failed to join room");
        setErrors((prev) => ({
          ...prev,
          joinGroupFailed: "Failed to join the group. Please try again.",
        }));
      }
    },
    [userId, userNames]
  );

  const sendMessage = useCallback(() => {
    if (inputMessage.trim() === "") {
      setErrors((prev) => ({
        ...prev,
        emptyMessage: "Cannot send an empty message",
      }));
      return;
    }

    if (!selectedRoom) {
      setErrors((prev) => ({ ...prev, sendMessageFailed: "No room selected" }));
      return;
    }

    const messageData = {
      userId: userId,
      room: selectedRoom,
      content: inputMessage,
    };

    try {
      socketHandler.sendMessage(messageData);
      setInputMessage("");
    } catch (error) {
      console.error("Failed to send message:", error);
      setErrors((prev) => ({
        ...prev,
        sendMessageFailed: "Failed to send message. Please try again.",
      }));
    }
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
      setUserNames((prev) => {
        const newUserNames = { ...prev, [senderId]: userName };
        console.log("Updated userNames:", newUserNames);
        return newUserNames;
      });
      return userName;
    } catch (error) {
      console.error("Error in handleDifferentUserRender", error);
      return "Unknown User";
    }
  };

  const createGroup = useCallback(async (groupName: string) => {
    try {
      const newGroup = await chatUtils.createGroup(userId, groupName);
      setErrors(prev => ({ ...prev, groupNameExists: null, genericError: null }));
      setGroups(prevGroups => [...prevGroups, newGroup]);
      return newGroup;
    } catch (error: any) {
      if (error.response && error.response.status === 409) {
        setErrors(prev => ({ ...prev, groupNameExists: 'A group with this name already exists' }));
      } else {
        setErrors(prev => ({ ...prev, genericError: 'Failed to create group. Please try again.' }));
      }
      throw error;
    }
  }, [userId]);

  const joinGroupByName = useCallback(async (groupName: string) => {
    try {
      const joinedGroup = await chatUtils.joinGroupByName(userId, groupName);
      setGroups(prevGroups => [...prevGroups, joinedGroup]);
      setErrors(prev => ({ ...prev, joinNonExistentGroup: null, joinGroupFailed: null }));
      return joinedGroup;
    } catch (error: any) {
      if (error.response && error.response.status === 404) {
        setErrors(prev => ({ ...prev, joinNonExistentGroup: 'The group you are trying to join does not exist' }));
      } else {
        setErrors(prev => ({ ...prev, joinGroupFailed: 'Failed to join the group. Please try again.' }));
      }
      throw error;
    }
  }, [userId]);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'group') => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        setSelectedFile(file);
      } else {
        setErrors(prev => ({ ...prev, genericError: 'Please select an image file.' }));
      }
    }
  }, [setErrors]);

const fetchUserGroups = useCallback(async (userId: string) => {
  try {
    const fetchedGroups = await chatUtils.fetchUserGroups(userId);
    const groupsWithPictures = fetchedGroups.map(group => {
      if (group.groupPicture) {
        const fullGroupPictureUrl = group.groupPicture.startsWith('http') 
          ? group.groupPicture 
          : `${API_URL}/${group.groupPicture.replace(/\\/g, '/')}`;
        group.groupPicture = fullGroupPictureUrl;
      }
      return group;
    });
    setGroups(groupsWithPictures);
    setSessionItem('groups', groupsWithPictures);
  } catch (error) {
    setError("Failed to fetch user groups. Please try again.");
  }
}, [setGroups, setError]);
  return {
    createGroup,
    joinGroupByName,
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
    isLoading,
    errors,
    setErrors,
    handleFileUpload,
  };
};
