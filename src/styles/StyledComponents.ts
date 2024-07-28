import { styled } from '@mui/material/styles';
import { Box, List, Paper } from '@mui/material';

export const ChatContainer = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  height: '100vh',
  width: '100vw',
  overflow: 'hidden',
});
export const MessageList = styled(List)({ flexGrow: 1, overflow: 'auto', padding: '16px' });

export const MessageContainer = styled(Box, { shouldForwardProp: (prop) => prop !== 'isCurrentUser' })<{ isCurrentUser: boolean }>(
  ({ isCurrentUser, theme }) => ({
    display: 'flex',
    justifyContent: isCurrentUser ? 'flex-end' : 'flex-start',
    marginBottom: theme.spacing(1),
  })
);

export const MessageBubble = styled(Paper, { shouldForwardProp: (prop) => prop !== 'isCurrentUser' })<{ isCurrentUser: boolean }>(
  ({ isCurrentUser, theme }) => ({
    padding: theme.spacing(1),
    maxWidth: '70%',
    wordBreak: 'break-word',
    backgroundColor: isCurrentUser ? theme.palette.primary.main : theme.palette.background.paper,
    color: isCurrentUser ? theme.palette.primary.contrastText : theme.palette.text.primary,
  })
);

export const InputArea = styled(Box)(({ theme }) => ({ padding: theme.spacing(2), backgroundColor: theme.palette.grey[100] }));