import React from 'react';
import { 
  AppBar, Toolbar, Typography, IconButton, Dialog, DialogTitle, 
  DialogContent, DialogActions, Snackbar, Alert, Avatar, TextField, Button, 
  Menu, MenuItem, ListItemIcon
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
          {profilePicture && (
            <Avatar src={profilePicture} className="settings-icon" />
          )}
        </Toolbar>
      </AppBar>

      <div className="chat-content">
        <div className="group-list">
          <GroupList
            groups={groups}
            userId={userId}
            onJoinRoom={joinRoom}
            onGroupsUpdate={setGroups}
          />
        </div>
        
        {selectedRoom ? (
          <>
            <div className="chat-room">
              <ChatRoom
                messages={messages}
                userId={userId}
                userNames={userNames}
                inputMessage={inputMessage}
                onInputChange={(e) => setInputMessage(e.target.value)}
                onSendMessage={sendMessage}
                messageListRef={messageListRef}
              />
            </div>
            <div className="member-list">
              <MemberList
                members={roomMembers}
                userNames={userNames}
                onUpdateGroupPicture={() => setIsGroupPictureDialogOpen(true)}
                onLeaveGroup={handleLeaveGroup}
              />
            </div>
          </>
        ) : (
          <div className="no-room-selected">
            <Typography variant="h6">Select a chat room to start messaging</Typography>
          </div>
        )}
      </div>

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

      {/* Error Snackbars */}
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