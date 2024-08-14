import React, { useEffect, useLayoutEffect, useRef } from 'react';
import { Typography, Grid, TextField, Button } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { Message } from '../types/types';
import './ChatRoom.css';

interface ChatRoomProps {
  messages: Message[];
  userId: string;
  userNames: { [key: string]: string | { username: string; profilePicture?: string } };
  inputMessage: string;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSendMessage: () => void;
  messageListRef: React.RefObject<HTMLUListElement>;
}

const ChatRoom: React.FC<ChatRoomProps> = ({ 
  messages, 
  userId, 
  userNames, 
  inputMessage, 
  onInputChange, 
  onSendMessage,
  messageListRef
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  const getUserName = (senderId: string) => {
    const userNameData = userNames[senderId];
    if (typeof userNameData === 'string') {
      return userNameData;
    } else if (userNameData && 'username' in userNameData) {
      return userNameData.username;
    }
    return `Unknown User (${senderId})`;
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  useLayoutEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    if (messageListRef.current) {
      const observer = new MutationObserver(() => {
        if (bottomRef.current) {
          bottomRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      });
      observer.observe(messageListRef.current, { childList: true, subtree: true });
      return () => observer.disconnect();
    }
  }, []);

  return (
    <div className="chat-room">
      <div className="message-list-container">
        <ul className="message-list" ref={messageListRef}>
          {messages.map((message) => (
            <li key={message._id} className={`message-container ${message.senderId === userId ? 'sent' : 'received'}`}>
              <div className="message-bubble">
                <Typography variant="body2" className="sender-name">
                  {getUserName(message.senderId)}
                </Typography>
                <Typography variant="body1" className="message-content">
                  {message.content}
                </Typography>
                <Typography variant="caption" className="message-time">
                  {formatTime(message.createdAt)}
                </Typography>
              </div>
            </li>
          ))}
          <div ref={bottomRef} />
        </ul>
      </div>
      <div className="input-area">
        <Grid container spacing={2} alignItems="center">
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
            >
              Send
            </Button>
          </Grid>
        </Grid>
      </div>
    </div>
  );
};

export default ChatRoom;