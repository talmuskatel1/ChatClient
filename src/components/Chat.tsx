import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { 
  AppBar, Toolbar, Typography, Box, IconButton, Dialog, DialogTitle, 
  DialogContent, DialogActions, Snackbar, Avatar, TextField, Button, 
  Menu, MenuItem, ListItemIcon
} from '@mui/material';
import { 
  Menu as MenuIcon, 
  Settings as SettingsIcon, 
  UploadFile as UploadFileIcon
} from '@mui/icons-material';
import { API, API_URL } from '../services/api';
import { Message, Group } from '../types/types';
import { ChatContainer } from '../styles/StyledComponents';
import GroupList from './GroupList';
import ChatRoom from './ChatRoom';
import MemberList from './MemberList';

const Chat: React.FC = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
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
  const [error, setError] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const messageListRef = useRef<HTMLUListElement>(null);
  const navigate = useNavigate();
  const [socketError, setSocketError] = useState<string | null>(null);
  const [roomMembers, setRoomMembers] = useState<string[]>([]);
  const [userNames, setUserNames] = useState<{[key: string]: string}>({});
  const [currentUserName, setCurrentUserName] = useState<string>('');

  useEffect(() => {
    const fetchCurrentUserName = async () => {
      if (userId) {
        try {
          const response = await API.get(`/users/${userId}`);
          setCurrentUserName(response.data.username);
          setUserNames(prev => ({...prev, [userId]: response.data.username}));
        } catch (error) {
          console.error("Error fetching current user's name:", error);
        }
      }
    };
  
    fetchCurrentUserName();
  }, [userId]);

  useEffect(() => {
    const newSocket = io(API_URL, {
      withCredentials: true,
      transports: ['websocket'],
    });
  
    newSocket.on('connect', () => {
      console.log('Connected to server');
      setSocket(newSocket);
    });
  
    newSocket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      setSocketError('Failed to connect to the server');
    });
  
    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!socket) return;
  
    const handleMessage = (message: Message) => {
      console.log('Received message:', message);
      setMessages((prevMessages) => [...prevMessages, message]);
    };
  
    const handleMemberUpdate = (members: string[]) => {
      console.log('Room members updated:', members);
      setRoomMembers(members);
    };
  
    socket.on('message', handleMessage);
    socket.on('memberUpdate', handleMemberUpdate);
  
    return () => {
      socket.off('message', handleMessage);
      socket.off('memberUpdate', handleMemberUpdate);
    };
  }, [socket]);

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    if (!storedUserId) {
      navigate('/login');
      return;
    }
    setUserId(storedUserId);
    fetchUserProfilePicture(storedUserId);
    fetchUserGroups(storedUserId);
  }, [navigate]);

  useEffect(() => { 
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    messages.forEach(message => {
      if (message.senderId && message.senderId !== userId && !userNames[message.senderId]) {
        handleDifferentUserRender(message.senderId);
      }
    });
  }, [messages, userId, userNames]);

  const fetchUserGroups = async (userId: string) => {
    try {
      const groupIdsResponse = await API.get(`/users/${userId}/groups`);
      const groupPromises = groupIdsResponse.data.map((groupId: string) => 
        API.get(`/groups/${groupId}`)
      );
      const groupResponses = await Promise.all(groupPromises);
      const fetchedGroups = groupResponses.map(response => response.data);
      console.log('Fetched groups:', fetchedGroups);
      setGroups(fetchedGroups);
    } catch (error: any) {
      console.error('Failed to fetch user groups:', error);
      setError('Failed to fetch user groups');
    }
  };

  const joinRoom = async (groupId: string) => {
    if (!groupId) {
      console.error('Invalid group ID');
      setError('Invalid group selected');
      return;
    }
    try {
      socket?.emit('join', { userId, room: groupId });
      socket?.once('joinSuccess', async ({ room, members }) => {
        const messagesResponse = await API.get(`/messages/room/${room}`);
        setMessages(messagesResponse.data);
        setSelectedRoom(room);
        setRoomMembers(members);
      });
    } catch (error) {
      console.log(error, 'Failed to join room');
    }
  };

  const sendMessage = () => {
    if (inputMessage.trim() === '' || !selectedRoom || !socket) return;
    
    const messageData = {
      userId: userId,
      room: selectedRoom,
      content: inputMessage
    };
  
    socket.emit('sendMessage', messageData);
    setInputMessage('');
  };

  const handleSettingsClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleSettingsClose = () => {
    setAnchorEl(null);
  };

  const handleDisconnect = () => {
    handleSettingsClose();
    socket?.disconnect();
    localStorage.removeItem('userId');
    localStorage.removeItem('profilePicture');
    navigate('/login');
  };

  const handleDeleteAccount = async () => {
    handleSettingsClose();
    try {
      await API.delete(`/users/${userId}`);
      handleDisconnect();
    } catch (error: any) {
      setError('Failed to delete account');
    }
  };

  const handleSocketErrorClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setSocketError(null);
  };

  const handleDifferentUserRender = async (senderId: string | undefined) => {
    if (!senderId) {
      console.log("Sender ID is undefined");
      return "Unknown User";
    }
    
    if (userNames[senderId]) {
      return userNames[senderId];
    }
    
    try {
      const response = await API.get(`/users/${senderId}`);
      const userName = response.data.username; 
      setUserNames(prev => ({...prev, [senderId]: userName}));
      return userName;
    } catch (error) {
      console.log("Error in handleDifferentUserRender", error);
      return "Unknown User";
    }
  }

  const handleUpdateProfilePicture = async () => {
    try {
      const response = await API.put(`/users/${userId}/profile-picture`, { profilePictureUrl: newProfilePictureUrl });
      console.log('Profile picture update response:', response.data);
      if (response.data && response.data.profilePicture) {
        setProfilePicture(response.data.profilePicture);
        localStorage.setItem('profilePicture', response.data.profilePicture);
      } else {
        console.error('Profile picture URL not found in the response');
      }
      setIsProfilePictureDialogOpen(false);
      fetchUserProfilePicture(userId);
    } catch (error) {
      console.error('Failed to update profile picture:', error);
      setError('Failed to update profile picture');
    }
  };

  const fetchUserProfilePicture = async (userId: string) => {
    try {
      const response = await API.get(`users/${userId}/profile-picture`);
      console.log('Fetched profile picture:', response.data);
      if (response.data && response.data.profilePicture) {
        setProfilePicture(response.data.profilePicture);
        localStorage.setItem('profilePicture', response.data.profilePicture);
      } else {
        console.log('No profile picture found for user');
      }
    } catch (error) {
      console.error("Error in fetchUserProfilePicture", error);
    }
  };

  const handleUpdateGroupPicture = async () => {
    if (!selectedRoom) return;
    try {
      const response = await API.put(`/groups/${selectedRoom}/group-picture`, { groupPictureUrl: newGroupPictureUrl });
      if (response.data && response.data.groupPicture) {
        setGroups(prevGroups => prevGroups.map(group => 
          group._id === selectedRoom ? { ...group, groupPicture: response.data.groupPicture } : group
        ));
        setIsGroupPictureDialogOpen(false);
      } else {
        console.error('Group picture URL not found in the response');
        setError('Failed to update group picture: URL not found in response');
      }
    } catch (error) {
      console.error('Failed to update group picture:', error);
      setError('Failed to update group picture');
    }
  };

  const handleLeaveGroup = async () => {
    if (!selectedRoom) return;
    try {
      await API.post(`/groups/${selectedRoom}/leave`, { userId });
      setGroups(prevGroups => prevGroups.filter(group => group._id !== selectedRoom));
      setSelectedRoom(null);
      setMessages([]);
      setRoomMembers([]);
    } catch (error) {
      setError('Failed to leave group');
    }
  };

  return (
    <ChatContainer>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            {groups.find(g => g._id === selectedRoom)?.name || 'Chat App'}
          </Typography>
          <IconButton color="inherit" onClick={handleSettingsClick}>
            <SettingsIcon />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleSettingsClose}
          >
            <MenuItem onClick={() => setIsProfilePictureDialogOpen(true)}>
              <ListItemIcon>
                <UploadFileIcon fontSize="small" />
              </ListItemIcon>
              Update Profile Picture
            </MenuItem>
            <MenuItem onClick={handleDisconnect}>Disconnect</MenuItem>
            <MenuItem onClick={handleDeleteAccount}>Delete Account</MenuItem>
          </Menu>
          {profilePicture && (
            <Avatar src={profilePicture} sx={{ marginLeft: 1 }} />
          )}
        </Toolbar>
      </AppBar>

      <Box display="flex" flexGrow={1} overflow="hidden">
        <Box width={250} borderRight={1} borderColor="divider" overflow="auto">
          <GroupList
            groups={groups}
            userId={userId}
            onJoinRoom={joinRoom}
            onGroupsUpdate={setGroups}
          />
        </Box>
        
        {selectedRoom ? (
          <>
            <ChatRoom
              messages={messages}
              userId={userId}
              userNames={userNames}
              inputMessage={inputMessage}
              onInputChange={(e) => setInputMessage(e.target.value)}
              onSendMessage={sendMessage}
              messageListRef={messageListRef}
            />
            <Box width={240} borderLeft={1} borderColor="divider" p={2} overflow="auto">
              <MemberList
                members={roomMembers}
                userNames={userNames}
                onUpdateGroupPicture={() => setIsGroupPictureDialogOpen(true)}
                onLeaveGroup={handleLeaveGroup}
              />
            </Box>
          </>
        ) : (
          <Box display="flex" justifyContent="center" alignItems="center" flexGrow={1}>
            <Typography variant="h6">Select a chat room to start messaging</Typography>
          </Box>
        )}
      </Box>

      <Dialog open={isProfilePictureDialogOpen} onClose={() => setIsProfilePictureDialogOpen(false)}>
        <DialogTitle>Update Profile Picture</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Profile Picture URL"
            fullWidth
            value={newProfilePictureUrl}
            onChange={(e) => setNewProfilePictureUrl(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsProfilePictureDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleUpdateProfilePicture}>Update</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={isGroupPictureDialogOpen} onClose={() => setIsGroupPictureDialogOpen(false)}>
        <DialogTitle>Update Group Picture</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Group Picture URL"
            fullWidth
            value={newGroupPictureUrl}
            onChange={(e) => setNewGroupPictureUrl(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsGroupPictureDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleUpdateGroupPicture}>Update</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        message={error}
      />
      <Snackbar
        open={!!socketError}
        autoHideDuration={6000}
        onClose={handleSocketErrorClose}
        message={socketError}
      />
    </ChatContainer>
  );
};

export default Chat;