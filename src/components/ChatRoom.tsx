import React from 'react';
import { Box, Typography, Grid, TextField, Button } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { Message } from '../types/types';
import './ChatComponents.css';

interface ChatRoomProps {
  messages: Message[];
  userId: string;
  userNames: {[key: string]: string};
  inputMessage: string;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSendMessage: () => void;
  messageListRef: React.RefObject<HTMLUListElement>;
}

const ChatRoom: React.FC<ChatRoomProps> = ({ messages, userId, userNames, inputMessage, onInputChange, onSendMessage, messageListRef }) => {
  return (
    <Box flexGrow={1} display="flex" flexDirection="column" overflow="hidden">
      <div className="scrollable-message-area">
        <ul className="message-list" ref={messageListRef}>
          {messages.map((message) => (
            <li key={message._id} className={`message-container ${message.senderId === userId ? 'current-user' : ''}`}>
              <div className={`message-bubble ${message.senderId === userId ? 'current-user' : 'other-user'}`}>
                <Typography variant="body2" color="textSecondary">
                  {message.senderId === userId 
                    ? 'You' 
                    : (message.senderId ? (userNames[message.senderId] || `Unknown User (${message.senderId})`) : 'Unknown User')}
                </Typography>
                <Typography variant="body1">{message.content}</Typography>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div className="input-area">
        <Grid container spacing={2}>
          <Grid item xs={10}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Type a message"
              value={inputMessage}
              onChange={onInputChange}
              onKeyPress={(e) => e.key === 'Enter' && onSendMessage()}
            />
          </Grid>
          <Grid item xs={2}>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              endIcon={<SendIcon />}
              onClick={onSendMessage}
              style={{ height: '100%' }}
            >
              Send
            </Button>
          </Grid>
        </Grid>
      </div>
    </Box>
  );
};

export default ChatRoom;