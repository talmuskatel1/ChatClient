import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';

interface MakePrivateDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const MakePrivateDialog: React.FC<MakePrivateDialogProps> = ({ open, onClose, onConfirm }) => {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Make Group Private?</DialogTitle>
      <DialogContent>
        <Typography>
          Are you sure you want to make this group private? Once private, no new members will be able to join the group.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleConfirm} color="primary">
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MakePrivateDialog;