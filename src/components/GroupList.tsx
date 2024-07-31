import React, { useState } from 'react';
import { List, ListItem, ListItemButton, ListItemIcon, ListItemText, Avatar, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button } from '@mui/material';
import GroupIcon from '@mui/icons-material/Group';
import { Group } from '../types/types';
import AddIcon from '@mui/icons-material/Add';
import { API } from '../services/api';

interface GroupListProps {
  groups: Group[];
  userId: string;
  onJoinRoom: (groupId: string) => void;
  onGroupsUpdate: (groups: Group[]) => void;
}

const GroupList: React.FC<GroupListProps> = ({ groups, userId, onJoinRoom, onGroupsUpdate }) => {
  const [isNewGroupDialogOpen, setIsNewGroupDialogOpen] = useState(false);
  const [isJoinGroupDialogOpen, setIsJoinGroupDialogOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [joinGroupName, setJoinGroupName] = useState('');

  const handleCreateGroup = async () => {
    if (newGroupName.trim() === '') return;
    try {
      const response = await API.post('/groups/create', { name: newGroupName, creatorId: userId });
      onGroupsUpdate([...groups, response.data]);
      setNewGroupName('');
      setIsNewGroupDialogOpen(false);
    } catch (error) {
      console.error('Failed to create group:', error);
    }
  };

  const handleJoinGroup = async () => {
    if (joinGroupName.trim() === '') return;
    try {
      const response = await API.post('/groups/join', { userId, groupName: joinGroupName });
      onGroupsUpdate([...groups, response.data]);
      setJoinGroupName('');
      setIsJoinGroupDialogOpen(false);
    } catch (error) {
      console.error('Failed to join group:', error);
    }
  };

  return (
    <>
      <List>
        <ListItem disablePadding>
          <ListItemButton onClick={() => setIsNewGroupDialogOpen(true)}>
            <ListItemIcon><AddIcon /></ListItemIcon>
            <ListItemText primary="Create New Group" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton onClick={() => setIsJoinGroupDialogOpen(true)}>
            <ListItemIcon><GroupIcon /></ListItemIcon>
            <ListItemText primary="Join Group" />
          </ListItemButton>
        </ListItem>
        {groups.map((group) => (
          <ListItem key={`group-${group._id}`} disablePadding>
            <ListItemButton onClick={() => group._id && onJoinRoom(group._id)}>
              <ListItemIcon>
                <Avatar src={group.groupPicture} />
              </ListItemIcon>
              <ListItemText primary={group.name || `Unnamed Group (ID: ${group._id})`} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

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
    </>
  );
};

export default GroupList;