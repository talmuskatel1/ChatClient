import React, { useState } from 'react';
import { List, ListItem, ListItemButton, ListItemIcon, ListItemText, Avatar, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button } from '@mui/material';
import GroupIcon from '@mui/icons-material/Group';
import AddIcon from '@mui/icons-material/Add';
import { Group } from '../types/types';
import { useChatLogic } from '../hooks/useChatLogic';
import { API_URL } from '../variables/Variables';
import { setSessionItem } from '../utils/sessionUtils';

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

  const { createGroup, joinGroupByName } = useChatLogic();

  const handleCreateGroup = async () => {
    if (newGroupName.trim() === '') return;
    try {
      const newGroup = await createGroup(newGroupName);
      if (newGroup.groupPicture) {
        const fullGroupPictureUrl = `${API_URL}/${newGroup.groupPicture}`;
        setSessionItem(`group_${newGroup._id}_picture`, fullGroupPictureUrl);
        newGroup.groupPicture = fullGroupPictureUrl;
      }
      onGroupsUpdate([...groups, newGroup]);
      setNewGroupName('');
      setIsNewGroupDialogOpen(false);
    } catch (error) {
      console.error('Failed to create group:', error);
    }
  };

  const handleJoinGroup = async () => {
    if (joinGroupName.trim() === '') return;
    try {
      const joinedGroup = await joinGroupByName(joinGroupName);
      if (joinedGroup.groupPicture) {
        const fullGroupPictureUrl = `${API_URL}/${joinedGroup.groupPicture}`;
        setSessionItem(`group_${joinedGroup._id}_picture`, fullGroupPictureUrl);
        joinedGroup.groupPicture = fullGroupPictureUrl;
      }
      onGroupsUpdate([...groups, joinedGroup]);
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
            <ListItemIcon>
              <AddIcon />
            </ListItemIcon>
            <ListItemText primary="Create New Group" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton onClick={() => setIsJoinGroupDialogOpen(true)}>
            <ListItemIcon>
              <GroupIcon />
            </ListItemIcon>
            <ListItemText primary="Join Group" />
          </ListItemButton>
        </ListItem>
        {groups.map((group) => {
          const fullGroupPictureUrl = group.groupPicture && !group.groupPicture.startsWith('http')
            ? `${API_URL}/${group.groupPicture.replace(/\\/g, '/')}`
            : group.groupPicture;
          return (
            <ListItem key={group._id} disablePadding>
              <ListItemButton onClick={() => group._id && onJoinRoom(group._id)}>
                <ListItemIcon>
                  {fullGroupPictureUrl ? (
                    <Avatar src={fullGroupPictureUrl} />
                  ) : (
                    <GroupIcon />
                  )}
                </ListItemIcon>
                <ListItemText primary={group.name || `Unnamed Group (ID: ${group._id})`} />
              </ListItemButton>
            </ListItem>
          );
        })}
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