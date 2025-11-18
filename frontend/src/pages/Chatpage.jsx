// src/pages/ChatPage.jsx
import React, { useEffect, useState, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import io from "socket.io-client";

import {
  formatMessageTime,
  formatMessageDate,
  formatLastSeen,
} from "../utils/dateFormat";

import { logout } from "../store/authSlice";
import {
  fetchChats,
  setSelectedChat,
  addIncomingMessage,
  fetchMessages,
  sendMessage,
  accessChat,
} from "../store/chatSlice";

import { searchUsers, clearUserSearch } from "../store/userSlice";

const SOCKET_URL = "http://localhost:5000";

let socket;

const ChatPage = () => {
  const dispatch = useDispatch();

  const { user, token } = useSelector((state) => state.auth);
  const {
    chats,
    selectedChat,
    messages,
    loadingMessages,
  } = useSelector((state) => state.chat);

  const {
    searchResults,
    loading: userSearchLoading,
  } = useSelector((state) => state.users);

  const [messageText, setMessageText] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchMode, setSearchMode] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [typingChatId, setTypingChatId] = useState(null);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // auto scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
  if (selectedChat) {
    console.log("SELECTED CHAT >>>", JSON.stringify(selectedChat, null, 2));
  }
}, [selectedChat]);


  // initial chats load
  useEffect(() => {
    if (token) {
      dispatch(fetchChats());
    }
  }, [token, dispatch]);

  // socket setup
  useEffect(() => {
    if (!token || !user) return;

    socket = io(SOCKET_URL, {
      withCredentials: true,
      auth: { token },
    });

    socket.emit("setup", user._id);

    socket.on("onlineUsers", (users) => {
      setOnlineUsers(users);
    });

    socket.on("typing", ({ chatId, typing }) => {
      if (typing) {
        setTypingChatId(chatId);
        setIsTyping(true);
      } else {
        setIsTyping(false);
        setTypingChatId(null);
      }
    });

    socket.on("messageReceived", (message) => {
      dispatch(addIncomingMessage(message));
    });

    return () => {
      if (socket) socket.disconnect();
    };
  }, [token, user, dispatch]);

  const handleSelectChat = (chat) => {
    dispatch(setSelectedChat(chat));
    dispatch(fetchMessages(chat._id));
    if (socket) {
      socket.emit("joinChat", chat._id);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedChat) return;

    const res = await dispatch(
      sendMessage({
        chatId: selectedChat._id,
        content: messageText.trim(),
      })
    );

    const newMessage = res.payload;
    setMessageText("");

    if (socket && newMessage) {
      socket.emit("newMessage", newMessage);
    }
  };

  const handleTyping = (e) => {
    const value = e.target.value;
    setMessageText(value);

    if (!selectedChat || !socket) return;

    socket.emit("typing", { chatId: selectedChat._id, typing: true });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("typing", { chatId: selectedChat._id, typing: false });
    }, 1500);
  };

  const handleLogout = () => {
    dispatch(logout());
  };

  const getChatTitleAndUser = (chat) => {
    const others = chat.participants.filter((p) => p._id !== user._id);
    const title = others.map((p) => p.name).join(", ");
    const primaryOther = others[0];
    return { title, primaryOther };
  };

  // search input handler
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (!value.trim()) {
      setSearchMode(false);
      dispatch(clearUserSearch());
      return;
    }

    setSearchMode(true);
    dispatch(searchUsers(value.trim()));
  };

  return (
    <div className="chat-page-root">
      <div className="chat-window">
        {/* LEFT PANEL */}
        <aside className="chat-left-panel">
          <header className="chat-left-header">
            <div className="left-user-info">
              <div className="left-avatar">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="left-user-name">{user?.name}</div>
                <div className="left-user-status">
                  {user?.email}
                  <span className="status-dot online" />
                </div>
              </div>
            </div>
            <div className="left-header-actions">
              <button
                className="logout-btn"
                style={{
                  fontSize: 12,
                  padding: "6px 10px",
                  borderRadius: 999,
                  border: "none",
                  cursor: "pointer",
                  background: "linear-gradient(135deg, #22d3ee, #0ea5e9)",
                  color: "#020617",
                }}
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          </header>

          <div className="chat-tabs">
            <button className="chat-tab active">Chats</button>
            <button className="chat-tab">Contacts</button>
          </div>

          <div style={{ padding: "0 12px 8px" }}>
            <input
              type="text"
              placeholder="Search users or chats"
              className="sidebar-search"
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>

          {/* LIST AREA: search results OR chat list */}
          <div className="chat-list">
            {searchMode ? (
              // USER SEARCH MODE
              userSearchLoading ? (
                <p className="sidebar-empty">Searching…</p>
              ) : searchResults.length === 0 ? (
                <p className="sidebar-empty">No users found</p>
              ) : (
                searchResults.map((u) => (
                  <div
                    key={u._id}
                    className="chat-list-item-2"
                    onClick={async () => {
                      const res = await dispatch(accessChat(u._id));
                      if (accessChat.fulfilled.match(res)) {
                        const chat = res.payload;
                        dispatch(setSelectedChat(chat));
                        dispatch(fetchMessages(chat._id));

                        if (socket) {
                          socket.emit("joinChat", chat._id);
                        }

                        setSearchMode(false);
                        setSearchTerm("");
                        dispatch(clearUserSearch());
                      }
                    }}
                  >
                    <div className="chat-list-avatar">
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="chat-list-body">
                      <div className="chat-list-top">
                        <span className="chat-list-name">{u.name}</span>
                      </div>
                      <div className="chat-list-bottom">
                        <span className="chat-list-preview">{u.email}</span>
                      </div>
                    </div>
                  </div>
                ))
              )
            ) : (
              // NORMAL CHAT LIST
              <>
                {chats.length === 0 ? (
                  <p className="sidebar-empty">No chats yet</p>
                ) : (
                  chats.map((chat) => {
                    const { title, primaryOther } =
                      getChatTitleAndUser(chat);
                    const isOnline =
                      primaryOther &&
                      onlineUsers.includes(primaryOther._id);

                    return (
                      <div
                        key={chat._id}
                        className={`chat-list-item-2 ${
                          selectedChat && selectedChat._id === chat._id
                            ? "active"
                            : ""
                        }`}
                        onClick={() => handleSelectChat(chat)}
                      >
                        <div className="chat-list-avatar">
                          {title.charAt(0).toUpperCase()}
                        </div>
                        <div className="chat-list-body">
                          <div className="chat-list-top">
                            <span className="chat-list-name">{title}</span>
                            {chat.latestMessage && (
                              <span className="chat-list-time">
                                {formatMessageTime(
                                  chat.latestMessage.createdAt
                                )}
                              </span>
                            )}
                          </div>
                          <div className="chat-list-bottom">
                            <span className="chat-list-preview">
                              {chat.latestMessage
                                ? chat.latestMessage.content
                                : "Start conversation"}
                            </span>
                            <span
                              className={`status-dot ${
                                isOnline ? "online" : "offline"
                              }`}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </>
            )}
          </div>
        </aside>

        {/* RIGHT PANEL */}
        <main className="chat-right-panel">
          {selectedChat ? (
            <>
              {/* HEADER */}
              <header className="chat-right-header">
                {(() => {
                  const { title, primaryOther } =
                    getChatTitleAndUser(selectedChat);
                  const isOnline =
                    primaryOther &&
                    onlineUsers.includes(primaryOther._id);

                  return (
                    <div className="right-header-left">
                      <div className="right-avatar">
                        {title.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="right-name-row">
                          <span className="right-name">{title}</span>
                          {isOnline && (
                            <span className="online-pill">Online</span>
                          )}
                        </div>
                          {!isOnline && (
      <span className="right-status">
        {primaryOther?.lastSeen
          ? formatLastSeen(primaryOther.lastSeen)
          : "Last seen recently"}
      </span>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </header>

              {/* MESSAGES */}
              <section className="chat-right-body">
                {loadingMessages ? (
                  <p className="muted-text">Loading messages…</p>
                ) : messages.length === 0 ? (
                  <div className="chat-empty-hero">
                    <div className="chat-empty-icon">💬</div>
                    <h2>Start your conversation</h2>
                    <p className="muted-text">
                      This is the beginning of your chat. Send a message to
                      start chatting.
                    </p>
                  </div>
                ) : (
                  <div className="chat-messages">
                    {messages.map((msg) => (
                      <div
                        key={msg._id}
                        className={`message-row ${
                          msg.sender._id === user._id ? "own" : "other"
                        }`}
                      >
                        <div className="message-bubble">
                          <div className="message-text">
                            {msg.content}
                          </div>
                          <div className="message-meta">
                            <span>{formatMessageTime(msg.createdAt)}</span>
                            <span>{formatMessageDate(msg.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    ))}

                    {isTyping && typingChatId === selectedChat._id && (
                      <p className="typing-indicator">Typing…</p>
                    )}

                    <div ref={messagesEndRef} />
                  </div>
                )}
              </section>

              {/* INPUT */}
              <form
                className="chat-bottom-input"
                onSubmit={handleSendMessage}
              >
                <input
                  type="text"
                  placeholder="Type your message..."
                  value={messageText}
                  onChange={handleTyping}
                />
                <button type="submit" disabled={!messageText.trim()}>
                  ➤
                </button>
              </form>
            </>
          ) : (
            <div className="chat-right-empty">
              <div className="chat-empty-icon">💬</div>
              <h2>Welcome to ChatVerse</h2>
              <p className="muted-text">
                Select a chat on the left or search for a user to start a
                new one.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ChatPage;
