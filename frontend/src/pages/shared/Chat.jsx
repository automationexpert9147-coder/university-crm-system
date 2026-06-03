import { useState, useEffect, useRef } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { toast } from 'react-toastify';
import { FaPaperPlane, FaCircle } from 'react-icons/fa';

const Chat = () => {
  const { user } = useAuth();
  const { socket, onlineUsers } = useSocket();

  const [contacts, setContacts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [roomId, setRoomId] = useState('');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const bottomRef = useRef(null);
  const typingTimer = useRef(null);

  const fetchContacts = async () => {
    try {
      setLoadingContacts(true);
      const { data } = await api.get('/chat/contacts');
      setContacts(data.contacts || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load contacts');
    } finally {
      setLoadingContacts(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const selectContact = async (contact) => {
    const contactId = getUserId(contact);

    if (!contactId) return;

    try {
      setSelected(contact);
      setLoadingMessages(true);

      const { data: room } = await api.get(`/chat/room/${contactId}`);
      const newRoomId = room.roomId;

      setRoomId(newRoomId);

      const { data } = await api.get(`/chat/messages/${newRoomId}`);
      setMessages(data.messages || []);

      socket?.emit('join_room', newRoomId);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to open chat');
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (!socket || !roomId) return;

    socket.emit('join_room', roomId);
  }, [socket, roomId]);

  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = (message) => {
      const incomingRoomId = message.room_id || message.roomId;

      if (incomingRoomId && roomId && incomingRoomId !== roomId) return;

      setMessages((previousMessages) => {
        const messageId = getMessageId(message);

        if (
          messageId &&
          previousMessages.some((oldMessage) => getMessageId(oldMessage) === messageId)
        ) {
          return previousMessages;
        }

        return [...previousMessages, message];
      });
    };

    const handleTypingEvent = (data) => {
      if (!data || data.sender === user?.id) return;
      if (data.roomId && roomId && data.roomId !== roomId) return;

      setTyping(true);

      clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => {
        setTyping(false);
      }, 2000);
    };

    socket.on('receive_message', handleReceiveMessage);
    socket.on('user_typing', handleTypingEvent);

    return () => {
      socket.off('receive_message', handleReceiveMessage);
      socket.off('user_typing', handleTypingEvent);
      clearTimeout(typingTimer.current);
    };
  }, [socket, roomId, user?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    const content = input.trim();

    if (!content || !roomId || !user?.id) return;

    try {
      setInput('');

      const { data } = await api.post('/chat/messages', {
        roomId,
        content,
        type: 'text',
      });

      const savedMessage = data.message;

      setMessages((previousMessages) => [...previousMessages, savedMessage]);

      socket?.emit('send_message', {
        ...savedMessage,
        roomId,
        room_id: roomId,
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send message');
      setInput(content);
    }
  };

  const handleTyping = () => {
    if (!roomId || !user?.id) return;

    socket?.emit('typing', {
      roomId,
      sender: user.id,
    });
  };

  const isOnline = (id) => {
    if (!id) return false;

    return onlineUsers.map((onlineId) => String(onlineId)).includes(String(id));
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      <div className="w-72 card overflow-y-auto flex-shrink-0 p-0">
        <div className="p-4 border-b">
          <h2 className="font-semibold text-gray-900">Messages</h2>
        </div>

        <div className="divide-y divide-gray-100">
          {loadingContacts ? (
            <p className="p-4 text-center text-gray-400 text-sm">Loading contacts...</p>
          ) : contacts.length === 0 ? (
            <p className="p-4 text-center text-gray-400 text-sm">No contacts</p>
          ) : (
            contacts.map((contact) => {
              const contactId = getUserId(contact);
              const selectedId = selected ? getUserId(selected) : null;

              return (
                <button
                  key={contactId}
                  onClick={() => selectContact(contact)}
                  className={`w-full flex items-center gap-3 p-4 hover:bg-gray-50 text-left ${
                    selectedId === contactId ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="relative">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-700 font-bold">
                        {contact.name?.[0]?.toUpperCase() || 'U'}
                      </span>
                    </div>

                    {isOnline(contactId) && (
                      <FaCircle
                        className="absolute bottom-0 right-0 text-green-500"
                        size={10}
                      />
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="font-medium text-sm text-gray-900 truncate">
                      {contact.name || 'Unknown User'}
                    </p>
                    <p className="text-xs text-gray-400 capitalize">
                      {contact.role || 'user'}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      <div className="flex-1 card flex flex-col p-0 overflow-hidden">
        {selected ? (
          <>
            <div className="p-4 border-b flex items-center gap-3">
              <div className="relative">
                <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-700 font-bold text-sm">
                    {selected.name?.[0]?.toUpperCase() || 'U'}
                  </span>
                </div>

                {isOnline(getUserId(selected)) && (
                  <FaCircle
                    className="absolute bottom-0 right-0 text-green-500"
                    size={10}
                  />
                )}
              </div>

              <div>
                <p className="font-semibold text-gray-900 text-sm">
                  {selected.name || 'Unknown User'}
                </p>
                <p className="text-xs text-gray-400 capitalize">
                  {isOnline(getUserId(selected)) ? 'Online' : 'Offline'} •{' '}
                  {selected.role || 'user'}
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loadingMessages ? (
                <p className="text-center text-gray-400 text-sm">Loading messages...</p>
              ) : messages.length === 0 ? (
                <p className="text-center text-gray-400 text-sm">No messages yet</p>
              ) : (
                messages.map((message, index) => {
                  const senderId = getSenderId(message);
                  const isMe = senderId === user?.id;
                  const createdAt = getCreatedAt(message);

                  return (
                    <div
                      key={getMessageId(message) || index}
                      className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                          isMe
                            ? 'bg-blue-600 text-white rounded-br-sm'
                            : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>

                        <p
                          className={`text-xs mt-1 ${
                            isMe ? 'text-blue-200' : 'text-gray-400'
                          }`}
                        >
                          {createdAt
                            ? new Date(createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : ''}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}

              {typing && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 px-4 py-2 rounded-2xl text-sm text-gray-500 italic">
                    typing...
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            <div className="p-4 border-t flex items-center gap-3">
              <input
                className="input flex-1"
                placeholder="Type a message..."
                value={input}
                onChange={(event) => {
                  setInput(event.target.value);
                  handleTyping();
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    sendMessage();
                  }
                }}
              />

              <button
                onClick={sendMessage}
                disabled={!input.trim()}
                className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FaPaperPlane size={14} />
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <FaPaperPlane size={48} className="mx-auto mb-3 opacity-30" />
              <p>Select a contact to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const getUserId = (user) => user?.id || user?._id;

const getMessageId = (message) => message?.id || message?._id;

const getSenderId = (message) => {
  return message?.sender?.id || message?.sender?._id || message?.sender_id || message?.senderId;
};

const getCreatedAt = (message) => {
  return message?.created_at || message?.createdAt;
};

export default Chat;