import React from 'react';
import { 
  AppBar, Toolbar, Typography, IconButton, Dialog, DialogTitle, 
  DialogContent, DialogActions, Snackbar, Alert, Avatar, TextField, Button, 
  Menu, MenuItem, ListItemIcon,
  Box,
  Switch
} from '@mui/material';
import { 
  Settings as SettingsIcon, 
  UploadFile as UploadFileIcon
} from '@mui/icons-material';
import GroupList from './GroupList';
import ChatRoom from './ChatRoom';
import MemberList from './MemberList';
import { useChatLogic } from '../hooks/useChatLogic';
import './Chat.css';
import { makeGroupPrivate } from '../services/chatUtils';

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
    profilePicture,
    errors,
    setErrors,
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
    handleFileUpload,
    isGroupPrivate,
    toggleGroupPrivacy,
    confirmMakePrivate
    } = useChatLogic();


  return (
    <div className="chat-container">
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" className="chat-app-bar">
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
          <Avatar 
  src={profilePicture || undefined} 
  className="settings-icon"
  sx={{ bgcolor: profilePicture ? undefined : 'primary.main' }}
>
  {!profilePicture && (
    (typeof userNames[userId] === 'string' 
      ? userNames[userId] 
      : userNames[userId]?.username
    )?.charAt(0).toUpperCase() || 'U'
  )}
</Avatar>
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
            <Box flexGrow={1} display="flex" flexDirection="column" overflow="hidden">
              <ChatRoom
                messages={messages}
                userId={userId}
                userNames={userNames}
                inputMessage={inputMessage}
                onInputChange={(e) => setInputMessage(e.target.value)}
                onSendMessage={sendMessage}
                messageListRef={messageListRef}
              />
            </Box>
            <Box width={240} borderLeft={1} borderColor="divider" p={2} overflow="auto">
              <MemberList
                members={roomMembers}
                userNames={userNames}
                onUpdateGroupPicture={() => setIsGroupPictureDialogOpen(true)}
                onLeaveGroup={handleLeaveGroup}
                onToggleGroupPrivacy={toggleGroupPrivacy}
                isGroupPrivate={isGroupPrivate}
                confirmMakePrivate={confirmMakePrivate}
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
    <input
      accept="image/*"
      style={{ display: 'none' }}
      id="profile-picture-upload"
      type="file"
      onChange={(e) => handleFileUpload(e, 'profile')}
    />
    <label htmlFor="profile-picture-upload">
      <Button variant="contained" component="span">
        Choose File
      </Button>
    </label>
    {profilePicture && (
      <Box mt={2}>
        <Typography variant="body2">Current Profile Picture:</Typography>
        <Avatar src={profilePicture} sx={{ width: 100, height: 100, mt: 1 }} />
      </Box>
    )}
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setIsProfilePictureDialogOpen(false)}>Close</Button>
    <Button onClick={handleUpdateProfilePicture}>Update</Button>
  </DialogActions>
</Dialog>

<Dialog open={isGroupPictureDialogOpen} onClose={() => setIsGroupPictureDialogOpen(false)}>
  <DialogTitle>Update Group Picture</DialogTitle>
  <DialogContent>
    <input
      accept="image/*"
      style={{ display: 'none' }}
      id="group-picture-upload"
      type="file"
      onChange={(e) => handleFileUpload(e, 'group')}
    />
    <label htmlFor="group-picture-upload">
      <Button variant="contained" component="span">
        Choose File
      </Button>
    </label>
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setIsGroupPictureDialogOpen(false)}>Cancel</Button>
    <Button onClick={handleUpdateGroupPicture}>Update</Button>
  </DialogActions>
</Dialog>
      <Snackbar open={!!errors.noGroupFound} autoHideDuration={6000} onClose={() => setErrors(prev => ({ ...prev, noGroupFound: null }))}>
        <Alert onClose={() => setErrors(prev => ({ ...prev, noGroupFound: null }))} severity="error">
          {errors.noGroupFound}
        </Alert>
      </Snackbar>

      <Snackbar open={!!errors.groupAlreadyExists} autoHideDuration={6000} onClose={() => setErrors(prev => ({ ...prev, groupAlreadyExists: null }))}>
        <Alert onClose={() => setErrors(prev => ({ ...prev, groupAlreadyExists: null }))} severity="error">
          {errors.groupAlreadyExists}
        </Alert>
      </Snackbar>

      <Snackbar open={!!errors.joinGroupFailed} autoHideDuration={6000} onClose={() => setErrors(prev => ({ ...prev, joinGroupFailed: null }))}>
        <Alert onClose={() => setErrors(prev => ({ ...prev, joinGroupFailed: null }))} severity="error">
          {errors.joinGroupFailed}
        </Alert>
      </Snackbar>

      <Snackbar open={!!errors.leaveGroupFailed} autoHideDuration={6000} onClose={() => setErrors(prev => ({ ...prev, leaveGroupFailed: null }))}>
        <Alert onClose={() => setErrors(prev => ({ ...prev, leaveGroupFailed: null }))} severity="error">
          {errors.leaveGroupFailed}
        </Alert>
      </Snackbar>

      <Snackbar open={!!errors.sendMessageFailed} autoHideDuration={6000} onClose={() => setErrors(prev => ({ ...prev, sendMessageFailed: null }))}>
        <Alert onClose={() => setErrors(prev => ({ ...prev, sendMessageFailed: null }))} severity="error">
          {errors.sendMessageFailed}
        </Alert>
      </Snackbar>

      <Snackbar open={!!errors.updateProfilePictureFailed} autoHideDuration={6000} onClose={() => setErrors(prev => ({ ...prev, updateProfilePictureFailed: null }))}>
        <Alert onClose={() => setErrors(prev => ({ ...prev, updateProfilePictureFailed: null }))} severity="error">
          {errors.updateProfilePictureFailed}
        </Alert>
      </Snackbar>

      <Snackbar open={!!errors.updateGroupPictureFailed} autoHideDuration={6000} onClose={() => setErrors(prev => ({ ...prev, updateGroupPictureFailed: null }))}>
        <Alert onClose={() => setErrors(prev => ({ ...prev, updateGroupPictureFailed: null }))} severity="error">
          {errors.updateGroupPictureFailed}
        </Alert>
      </Snackbar>

      <Snackbar open={!!errors.genericError} autoHideDuration={6000} onClose={() => setErrors(prev => ({ ...prev, genericError: null }))}>
        <Alert onClose={() => setErrors(prev => ({ ...prev, genericError: null }))} severity="error">
          {errors.genericError}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!socketError}
        autoHideDuration={6000}
        onClose={handleSocketErrorClose}
        message={socketError}
      />
      <Snackbar open={!!errors.emptyMessage} autoHideDuration={6000} onClose={() => setErrors(prev => ({ ...prev, emptyMessage: null }))}>
  <Alert onClose={() => setErrors(prev => ({ ...prev, emptyMessage: null }))} severity="warning">
    {errors.emptyMessage}
  </Alert>
</Snackbar>

<Snackbar open={!!errors.groupNameExists} autoHideDuration={6000} onClose={() => setErrors(prev => ({ ...prev, groupNameExists: null }))}>
  <Alert onClose={() => setErrors(prev => ({ ...prev, groupNameExists: null }))} severity="error">
    {errors.groupNameExists}
  </Alert>
</Snackbar>

<Snackbar open={!!errors.joinNonExistentGroup} autoHideDuration={6000} onClose={() => setErrors(prev => ({ ...prev, joinNonExistentGroup: null }))}>
  <Alert onClose={() => setErrors(prev => ({ ...prev, joinNonExistentGroup: null }))} severity="error">
    {errors.joinNonExistentGroup}
  </Alert>
</Snackbar>
    </div>
  );
};

export default Chat;