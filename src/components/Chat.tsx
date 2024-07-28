import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import {
  AppBar, Toolbar, Typography, TextField, Button, List,
  Grid, Box, IconButton, Drawer, Dialog, DialogTitle,
  DialogContent, DialogActions, Snackbar, Avatar,
  ListItem, ListItemIcon, ListItemButton, ListItemText,
  Menu, MenuItem
} from '@mui/material';
import {
  Send as SendIcon,
  Menu as MenuIcon,
  Add as AddIcon,
  Group as GroupIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { API, API_URL } from '../services/api';
import { Message, Group } from '../types/types';
import {
  ChatContainer, MessageList, MessageContainer, MessageBubble, InputArea
} from '../styles/StyledComponents';

const Chat: React.FC = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [userId, setUserId] = useState('');
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [newGroupName, setNewGroupName] = useState('');
  const [joinGroupName, setJoinGroupName] = useState('');
  const [isNewGroupDialogOpen, setIsNewGroupDialogOpen] = useState(false);
  const [isJoinGroupDialogOpen, setIsJoinGroupDialogOpen] = useState(false);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const messageListRef = useRef<HTMLUListElement>(null);
  const navigate = useNavigate();
  const [socketError, setSocketError] = useState<string | null>(null);
  const [roomMembers, setRoomMembers] = useState<string[]>([]);

  useEffect(() => {
    const newSocket = io('http://localhost:3000', {
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
  
    socket.on('message', handleMessage);
  
    return () => {
      socket.off('message', handleMessage);
    };
  }, [socket]);

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    const storedProfilePicture = localStorage.getItem('profilePicture');
    if (!storedUserId) {
      navigate('/login');
      return;
    }
    setUserId(storedUserId);
    setProfilePicture(storedProfilePicture);
    fetchUserGroups(storedUserId);
  }, [navigate]);

  useEffect(() => { //guess where real time rendering problem for sunday
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchUserGroups = async (userId: string) => {
    try {
      const groupIdsResponse = await API.get(`/users/${userId}/groups`);
      const groupPromises = groupIdsResponse.data.map((groupId: string) => 
        API.get(`/groups/${groupId}`)
      );
      const groupResponses = await Promise.all(groupPromises);
      const fetchedGroups = groupResponses.map(response => response.data);
      setGroups(fetchedGroups);
    } catch (error: any) {
      setError('Failed to fetch user groups');
    }
  };

  const handleCreateGroup = async () => {
    if (newGroupName.trim() === '') return;
    try {
      const response = await API.post('/groups/create', { name: newGroupName, creatorId: userId });
      setGroups(prevGroups => [...prevGroups, response.data]);
      setNewGroupName('');
      setIsNewGroupDialogOpen(false);
    } catch (error: any) {
      setError('Failed to create group');
    }
  };

  const handleJoinGroup = async () => {
    if (joinGroupName.trim() === '') return;
    try {
      const response = await API.post('/groups/join', { userId, groupName: joinGroupName });
      setGroups(prevGroups => [...prevGroups, response.data]);
      setJoinGroupName('');
      setIsJoinGroupDialogOpen(false);
    } catch (error: any) {
      setError('Failed to join group');
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
      socket?.once('joinSuccess', async ({ room }) => {
        const messagesResponse = await API.get(`/messages/room/${room}`);
        setMessages(messagesResponse.data);
        setSelectedRoom(room);
        setDrawerOpen(false);
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

  const MemberList: React.FC<{ members: any[] }> = ({ members }) => (
    <Box>
      <Typography variant="h6">Room Members</Typography>
      <List>
        {members.map((member, index) => (
          <ListItem key={index}>
            <ListItemText primary={typeof member === 'string' ? member : member.username} />
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <ChatContainer>
      <AppBar position="static">
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => setDrawerOpen(true)}>
            <MenuIcon />
          </IconButton>
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
            <MenuItem onClick={handleDisconnect}>Disconnect</MenuItem>
            <MenuItem onClick={handleDeleteAccount}>Delete Account</MenuItem>
          </Menu>
          {profilePicture && (
            <Avatar src={profilePicture} sx={{ marginLeft: 1 }} />
          )}
        </Toolbar>
      </AppBar>

      <Drawer anchor="left" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Box sx={{ width: 250 }} role="presentation">
          <List>
            <ListItem key="create-group" disablePadding>
              <ListItemButton onClick={() => setIsNewGroupDialogOpen(true)}>
                <ListItemIcon><AddIcon /></ListItemIcon>
                <ListItemText primary="Create New Group" />
              </ListItemButton>
            </ListItem>
            <ListItem key="join-group" disablePadding>
              <ListItemButton onClick={() => setIsJoinGroupDialogOpen(true)}>
                <ListItemIcon><GroupIcon /></ListItemIcon>
                <ListItemText primary="Join Group" />
              </ListItemButton>
            </ListItem>
            {groups.map((group) => (
              <ListItem key={group._id} disablePadding>
                <ListItemButton onClick={() => group._id && joinRoom(group._id)}>
                  <ListItemText primary={group.name || `Unnamed Group (ID: ${group._id})`} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>

      <Dialog open={isNewGroupDialogOpen} onClose={() => setIsNewGroupDialogOpen(false)}>
        <DialogTitle>Create New Group</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Group Name"
            fullWidth
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsNewGroupDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateGroup}>Create</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={isJoinGroupDialogOpen} onClose={() => setIsJoinGroupDialogOpen(false)}>
        <DialogTitle>Join Group</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Group Name"
            fullWidth
            value={joinGroupName}
            onChange={(e) => setJoinGroupName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsJoinGroupDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleJoinGroup}>Join</Button>
        </DialogActions>
      </Dialog>

      {selectedRoom ? (
        <Box display="flex" flexGrow={1}>
          <Box flexGrow={1} display="flex" flexDirection="column">
            <MessageList ref={messageListRef}>
              {messages.map((message) => (
                <MessageContainer key={message._id} isCurrentUser={message.senderId === userId}>
                  <MessageBubble isCurrentUser={message.senderId === userId}>
                    <Typography variant="body2" color="textSecondary">
                      {message.senderId === userId ? 'You' : 'Other User'}
                    </Typography>
                    <Typography variant="body1">{message.content}</Typography>
                  </MessageBubble>
                </MessageContainer>
              ))}
            </MessageList>

            <InputArea>
              <Grid container spacing={2}>
                <Grid item xs={10}>
                  <TextField
                    fullWidth
                    variant="outlined"
                    placeholder="Type a message"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  />
                </Grid>
                <Grid item xs={2}>
                  <Button
                    fullWidth
                    variant="contained"
                    color="primary"
                    endIcon={<SendIcon />}
                    onClick={sendMessage}
                    sx={{ height: '100%' }}
                  >
                    Send
                  </Button>
                </Grid>
              </Grid>
            </InputArea>
          </Box>
          <Box width={240} borderLeft={1} borderColor="divider" p={2}>
            <MemberList members={roomMembers} />
          </Box>
        </Box>
      ) : (
        <Box display="flex" justifyContent="center" alignItems="center" flexGrow={1}>
          <Typography variant="h6">Select a chat room to start messaging</Typography>
        </Box>
      )}

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