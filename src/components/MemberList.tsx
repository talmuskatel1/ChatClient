import React from 'react';
import { Box, Typography, List, ListItem, ListItemText, Button } from '@mui/material';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import UploadFileIcon from '@mui/icons-material/UploadFile';
interface MemberListProps {
  members: string[];
  userNames: {[key: string]: string};
  onUpdateGroupPicture: () => void;
  onLeaveGroup: () => void;
}

const MemberList: React.FC<MemberListProps> = ({ members, userNames, onUpdateGroupPicture, onLeaveGroup }) => {
  return (
    <Box>
      <Typography >Room Members</Typography>
      <List>
        {members.map((memberId) => (
          <ListItem key={memberId}>
            <ListItemText primary={userNames[memberId] || `Loading... (${memberId})`} />
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
      <Button
        fullWidth
        variant="outlined"
        color="secondary"
        startIcon={<ExitToAppIcon />}
        onClick={onLeaveGroup}
        sx={{ mt: 2 }}
      >
        Leave Group
      </Button>
    </Box>
  );
};

export default MemberList;