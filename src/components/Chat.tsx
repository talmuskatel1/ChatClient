import React from 'react';
import { 
  AppBar, Toolbar, Typography, Box, IconButton, Dialog, DialogTitle, 
  DialogContent, DialogActions, Snackbar, Avatar, TextField, Button, 
  Menu, MenuItem, ListItemIcon
} from '@mui/material';
import { 
  Settings as SettingsIcon, 
  UploadFile as UploadFileIcon
} from '@mui/icons-material';
import { ChatContainer } from '../styles/StyledComponents';
import GroupList from './GroupList';
import ChatRoom from './ChatRoom';
import MemberList from './MemberList';
import { useChatLogic } from '../hooks/useChatLogic';
const Chat: React.FC = () => {
  const {
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
    anchorEl,
  } = useChatLogic();

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