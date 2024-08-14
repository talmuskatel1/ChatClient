import React, { useState } from 'react';
import { Box, Typography, List, ListItem, ListItemText, Button, Switch, FormControlLabel } from '@mui/material';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import MakePrivateDialog from './MakePrivateDialog';

interface MemberListProps {
  members: string[];
  userNames: { [key: string]: string | { username: string; profilePicture?: string } };
  onUpdateGroupPicture: () => void;
  onLeaveGroup: () => void;
  onToggleGroupPrivacy: () => void;
  isGroupPrivate: boolean;
  confirmMakePrivate: ()=> void;
}

const MemberList: React.FC<MemberListProps> = ({ 
  members, 
  userNames, 
  onUpdateGroupPicture, 
  onLeaveGroup,
  onToggleGroupPrivacy,
  isGroupPrivate,
  confirmMakePrivate
}) => {
  const [isPrivateDialogOpen, setIsPrivateDialogOpen] = useState(false);

  const handlePrivacyToggle = () => {
    if (!isGroupPrivate) {
      setIsPrivateDialogOpen(true);
    } else {
      onToggleGroupPrivacy();
      setIsPrivateDialogOpen(false);
    }
  };

  return (
    <Box>
      <Typography variant="h6">Room Members</Typography>
      <List>
        {members.map((memberId) => (
          <ListItem key={memberId}>
            <ListItemText primary={typeof userNames[memberId] === 'string' ? userNames[memberId] : userNames[memberId]?.username} />
          </ListItem>
        ))}
      </List>
      <Button
        fullWidth
        variant="outlined"
        color="primary"
        startIcon={<UploadFileIcon />}
        onClick={onUpdateGroupPicture}
        sx={{ mt: 2 }}
      >
        Update Group Picture
      </Button>
      <FormControlLabel
        control={
          <Switch
            checked={isGroupPrivate}
            onChange={handlePrivacyToggle}
            color="primary"
          />
        }
        label={isGroupPrivate ? "Private Group" : "Public Group"}
        sx={{ mt: 2, width: '100%', justifyContent: 'space-between' }}
      />
      <Button
        fullWidth
        variant="outlined"
        color="error"
        startIcon={<ExitToAppIcon />}
        onClick={onLeaveGroup}
        sx={{ mt: 2 }}
      >
        Leave Group
      </Button>
      <MakePrivateDialog 
        open={isPrivateDialogOpen}
        onClose={() => setIsPrivateDialogOpen(false)}
        onConfirm={confirmMakePrivate}
      />
    </Box>
  );
};

export default MemberList;