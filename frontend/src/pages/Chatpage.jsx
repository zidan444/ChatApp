// src/pages/ChatPage.jsx
import React, { useEffect, useState, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import io from "socket.io-client";
import { SOCKET_URL } from "../config";
import { useNavigate } from "react-router-dom";
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
  createGroupChat,
  updateGroupMembers,
  updateGroupAvatar,
  leaveGroup,
  deleteGroup,
  addGroupAdmin,
  renameGroup,
} from "../store/chatSlice";

import { searchUsers, clearUserSearch } from "../store/userSlice";
import { motion } from "framer-motion";


let socket;

const Avatar = ({ src, fallback, size = 36 }) => {
  if (src) {
    return (
      <img
        src={src}
        alt={fallback}
        style={{
          width: size,
          height: size,
          borderRadius: "999px",
          objectFit: "cover",
          border: "1px solid var(--border)",
          background: "var(--glass-1)",
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "999px",
        background: "var(--glass-1)",
        border: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 600,
        fontSize: 14,
      }}
    >
      {fallback}
    </div>
  );
};

const InlineAlert = ({ type = "error", message, onClose }) => {
  if (!message) return null;

  const palette =
    type === "success"
      ? { bg: "rgba(34,197,94,0.15)", border: "rgba(34,197,94,0.4)" }
      : { bg: "rgba(248,113,113,0.12)", border: "rgba(239,68,68,0.4)" };

  return (
    <div
      className="inline-alert"
      style={{
        background: palette.bg,
        border: `1px solid ${palette.border}`,
        color: type === "success" ? "#bbf7d0" : "#fecaca",
        padding: "10px 14px",
        borderRadius: 10,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
        marginTop: 12,
      }}
    >
      <span style={{ fontSize: 13 }}>{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          style={{
            background: "transparent",
            border: "none",
            color: "inherit",
            cursor: "pointer",
            fontSize: 16,
          }}
          aria-label="Dismiss message"
        >
          ✕
        </button>
      )}
    </div>
  );
};

const modalSearchListStyle = {
  marginTop: 8,
  border: "1px solid rgba(148, 163, 184, 0.25)",
  borderRadius: 12,
  background: "rgba(15, 23, 42, 0.7)",
  maxHeight: 180,
  overflowY: "auto",
};

const modalSearchRowStyle = {
  width: "100%",
  textAlign: "left",
  padding: "8px 12px",
  background: "transparent",
  border: "none",
  borderBottom: "1px solid rgba(71, 85, 105, 0.4)",
  color: "#e2e8f0",
  cursor: "pointer",
  display: "flex",
  flexDirection: "column",
  gap: 2,
  fontSize: 13,
};

const getEntityId = (entity) => {
  if (!entity) return null;
  if (typeof entity === "string") return entity;
  if (typeof entity === "object") {
    const value = entity._id || entity.id;
    return value ? value.toString() : null;
  }
  return null;
};

const ChatPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { user, token } = useSelector((state) => state.auth);
  const currentUserId = user?._id?.toString() || null;
  console.log("AUTH USER >>>", user);

  const { chats, selectedChat, messages, loadingMessages } = useSelector(
    (state) => state.chat
  );
  const { searchResults, loading: userSearchLoading } = useSelector(
    (state) => state.users
  );

  const [messageText, setMessageText] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchMode, setSearchMode] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [typingChatId, setTypingChatId] = useState(null);
  const [globalError, setGlobalError] = useState(null);
  
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('chatAppTheme');
    return savedTheme === 'dark';
  });

  // group create states
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selectedGroupUsers, setSelectedGroupUsers] = useState([]);
  const [createGroupError, setCreateGroupError] = useState(null);

  // group update states
  const [showUpdateGroupModal, setShowUpdateGroupModal] = useState(false);
  const [currentGroupMembers, setCurrentGroupMembers] = useState([]);
  const [groupUpdateLoading, setGroupUpdateLoading] = useState(false);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [updateGroupError, setUpdateGroupError] = useState(null);
  const [showEditGroupModal, setShowEditGroupModal] = useState(false);
  const [editGroupName, setEditGroupName] = useState("");

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);

  // auto scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // log selected chat for debugging
  useEffect(() => {
    if (selectedChat) {
      console.log("SELECTED CHAT >>>", JSON.stringify(selectedChat, null, 2));
    }
  }, [selectedChat]);

  useEffect(() => {
    if (!showGroupModal) {
      setCreateGroupError(null);
    }
  }, [showGroupModal]);

  useEffect(() => {
    if (!showUpdateGroupModal) {
      setUpdateGroupError(null);
    }
  }, [showUpdateGroupModal]);

  useEffect(() => {
    if (showGroupInfo && selectedChat && selectedChat._id) {
      (async () => {
        const res = await dispatch(fetchChats());
        if (fetchChats.fulfilled.match(res)) {
          const updated = (res.payload || []).find(
            (c) => c._id === selectedChat._id
          );
          if (updated) {
            dispatch(setSelectedChat(updated));
          }
        }
      })();
    }
  }, [showGroupInfo]);

  // log group chats to confirm shapes
  useEffect(() => {
    const groupChats = chats.filter((c) => c.isGroup);
    console.log("GROUP CHATS >>>", groupChats);
  }, [chats]);

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

    socket.emit("setup", currentUserId);

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
      const senderId =
        message?.sender?._id || message?.sender || message?.senderId;

      if (senderId && senderId === currentUserId) return;

      dispatch(addIncomingMessage(message));
    });

    return () => {
      if (socket) socket.disconnect();
    };
  }, [token, user, currentUserId, dispatch]);

  const handleSelectChat = (chat) => {
    dispatch(setSelectedChat(chat));
    dispatch(fetchMessages(chat._id));
    if (socket) {
      socket.emit("joinChat", chat._id);
    }
  };

  const toggleUserInGroup = (u) => {
    const id = getEntityId(u);
    if (!id) return;
    const normalized = { ...u, _id: id };
    setSelectedGroupUsers((prev) => {
      const exists = prev.find((x) => getEntityId(x) === id);
      if (exists) {
        return prev.filter((x) => getEntityId(x) !== id);
      }
      setCreateGroupError(null);
      return [...prev, normalized];
    });
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

    if (sendMessage.fulfilled.match(res)) {
      const newMessage = res.payload;
      setMessageText("");
      if (globalError) setGlobalError(null);

      if (socket && newMessage) {
        socket.emit("newMessage", newMessage);
      }
    } else {
      setGlobalError(res?.payload || "Failed to send message. Please try again.");
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

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.setItem('chatAppTheme', newTheme ? 'dark' : 'light');
    // Apply theme class to root element
    if (newTheme) {
      document.documentElement.classList.add('dark-theme');
      document.documentElement.classList.remove('light-theme');
    } else {
      document.documentElement.classList.add('light-theme');
      document.documentElement.classList.remove('dark-theme');
    }
  };

  // Apply theme on mount
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark-theme');
      document.documentElement.classList.remove('light-theme');
    } else {
      document.documentElement.classList.add('light-theme');
      document.documentElement.classList.remove('dark-theme');
    }
  }, [isDarkMode]);

  const handleOpenGroupAvatarPicker = () => {
    if (!selectedChat || !selectedChat.isGroup) return;
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleGroupAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !selectedChat) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result;
      const res = await dispatch(
        updateGroupAvatar({ chatId: selectedChat._id, avatar: base64 })
      );
      if (!updateGroupAvatar.fulfilled.match(res)) {
        setGlobalError(res.payload || "Failed to update group avatar.");
      } else {
        setGlobalError(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleLeaveGroup = async () => {
    if (!selectedChat || !selectedChat.isGroup) return;
    const res = await dispatch(leaveGroup(selectedChat._id));
    if (!leaveGroup.fulfilled.match(res)) {
      setGlobalError(res.payload || "Failed to leave group.");
    } else {
      setShowGroupInfo(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!selectedChat || !selectedChat.isGroup) return;
    const confirmed = window.confirm("Delete this group for all members?");
    if (!confirmed) return;
    const res = await dispatch(deleteGroup(selectedChat._id));
    if (!deleteGroup.fulfilled.match(res)) {
      setGlobalError(res.payload || "Failed to delete group.");
    } else {
      setShowGroupInfo(false);
    }
  };

  const handleMakeAdmin = async (userId) => {
    if (!selectedChat || !selectedChat.isGroup) return;
    const res = await dispatch(
      addGroupAdmin({ chatId: selectedChat._id, userId })
    );
    if (!addGroupAdmin.fulfilled.match(res)) {
      setGlobalError(res.payload || "Failed to add admin.");
    } else {
      setGlobalError(null);
    }
  };

  // Normalized chat title helper
  const getChatTitleAndUser = (chat) => {
    if (chat.isGroup) {
      return { title: chat.name || "Group", primaryOther: null };
    }
    const others = (chat.participants || []).filter(
      (p) => getEntityId(p) !== currentUserId
    );
    const title = others.map((p) => p.name).join(", ");
    const primaryOther = others[0] || null;
    return { title, primaryOther };
  };

  const getGroupAdminId = (chat) => getEntityId(chat?.groupAdmin);
  const isCoAdmin = (chat, userId) => {
    const ids = (chat?.admins || []).map((a) => getEntityId(a));
    return ids.includes(userId);
  };

  // Open group edit modal
  const handleOpenUpdateGroupModal = () => {
    if (!selectedChat || !selectedChat.isGroup) return;

    setCurrentGroupMembers(selectedChat.participants || []);
    setSearchTerm("");
    dispatch(clearUserSearch());
    setSearchMode(true);
    setShowUpdateGroupModal(true);
    setUpdateGroupError(null);
  };

  const handleOpenEditGroupModal = () => {
    if (!selectedChat || !selectedChat.isGroup) return;
    setEditGroupName(selectedChat.name || "");
    setShowEditGroupModal(true);
  };

  const handleSaveEditGroup = async (e) => {
    e.preventDefault();
    if (!selectedChat || !selectedChat.isGroup) return;
    const name = editGroupName.trim();
    if (!name) return;
    const res = await dispatch(
      renameGroup({ chatId: selectedChat._id, name })
    );
    if (renameGroup.fulfilled.match(res)) {
      setShowEditGroupModal(false);
    } else {
      setGlobalError(res.payload || "Failed to rename group.");
    }
  };

  // toggle members in group update modal
  const toggleUserInUpdateGroup = (u) => {
    const userId = getEntityId(u);
    if (!userId) {
      setUpdateGroupError("Unable to identify selected user.");
      return;
    }
    const isCurrentUser = userId === currentUserId;
    const normalized = { ...u, _id: userId };

    setCurrentGroupMembers((prev) => {
      const exists = prev.find((x) => getEntityId(x) === userId);

      if (exists) {
        if (isCurrentUser) {
          setUpdateGroupError(
            "You cannot remove yourself here. Implement 'Leave group' separately."
          );
          return prev;
        }
        return prev.filter((x) => getEntityId(x) !== userId);
      }
      setUpdateGroupError(null);
      return [...prev, normalized];
    });
  };

  const handleUpdateGroup = async (e) => {
    e.preventDefault();

    if (!selectedChat || !selectedChat.isGroup) return;

    if (currentGroupMembers.length < 2) {
      setUpdateGroupError("A group must have at least 2 members.");
      return;
    }

    setGroupUpdateLoading(true);
    const userIds = Array.from(
      new Set(
        currentGroupMembers
          .map((u) => getEntityId(u))
          .filter((val) => typeof val === "string" && val.length > 0)
      )
    );
    const result = await dispatch(
      updateGroupMembers({ chatId: selectedChat._id, users: userIds })
    );
    setGroupUpdateLoading(false);

    if (updateGroupMembers.fulfilled.match(result)) {
      setUpdateGroupError(null);
      setCurrentGroupMembers([]);
      setShowUpdateGroupModal(false);
      setSearchMode(false);
      dispatch(clearUserSearch());
      setSearchTerm("");
    } else {
      setUpdateGroupError(
        result.payload || "Failed to update group members."
      );
    }
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

  const handleCreateGroup = async (e) => {
    e.preventDefault();

    if (!groupName.trim() || selectedGroupUsers.length < 2) {
      setCreateGroupError("Group name and at least 2 users are required.");
      return;
    }

    const userIds = Array.from(
      new Set(
        selectedGroupUsers
          .map((u) => getEntityId(u))
          .filter((val) => typeof val === "string" && val.length > 0)
      )
    );
    const result = await dispatch(
      createGroupChat({ name: groupName.trim(), users: userIds })
    );

    if (createGroupChat.fulfilled.match(result)) {
      setCreateGroupError(null);
      const chat = result.payload;
      dispatch(setSelectedChat(chat));
      dispatch(fetchMessages(chat._id));

      if (socket) {
        socket.emit("joinChat", chat._id);
      }

      setGroupName("");
      setSelectedGroupUsers([]);
      setShowGroupModal(false);
      setSearchMode(false);
      dispatch(clearUserSearch());
      setSearchTerm("");
    } else {
      setCreateGroupError(result.payload || "Failed to create group.");
    }
  };

  return (
    <div className={`chat-page-root ${isDarkMode ? 'dark-theme' : 'light-theme'}`}>
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        style={{ display: "none" }}
        onChange={handleGroupAvatarChange}
      />
      <div className="chat-window">
        {/* LEFT PANEL */}
        <aside className="chat-left-panel">
          <header className="chat-left-header">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
              <div
                className="left-user-info"
                onClick={() => navigate("/profile")}
                style={{ cursor: "pointer", flex: 1 }}
              >
                <div className="left-avatar">
                  <Avatar
                    src={user?.avatar}
                    fallback={user?.name?.charAt(0).toUpperCase()}
                    size={50}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <div className="left-user-name">{user?.name}</div>
                  <div className="left-user-phone">{user?.phone || user?.email}</div>
                </div>
              </div>
              <button 
                className="notification-bell theme-toggle-btn" 
                onClick={toggleTheme}
                title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
              >
                {isDarkMode ? "☀️" : "🌙"}
              </button>
            </div>
            <div className="left-action-icons">
              <button className="left-action-icon" title="Profile">👤</button>
              <button className="left-action-icon" title="Microphone">🎤</button>
              <button className="left-action-icon" title="Files">📁</button>
            </div>
            <div className="left-header-actions">
              <button
                style={{
                  fontSize: 12,
                  padding: "6px 12px",
                  borderRadius: 20,
                  border: "none",
                  cursor: "pointer",
                  background: "var(--teal)",
                  color: "#ffffff",
                  fontWeight: 500,
                }}
                onClick={() => {
                  setShowGroupModal(true);
                  setSearchMode(true);
                  dispatch(clearUserSearch());
                  setSearchTerm("");
                  setCreateGroupError(null);
                }}
              >
                + New Group
              </button>
              <button
                className="logout-btn"
                style={{
                  fontSize: 12,
                  padding: "6px 12px",
                  borderRadius: 20,
                  border: "none",
                  cursor: "pointer",
                  background: "#f0f0f0",
                  color: "#333",
                  fontWeight: 500,
                }}
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          </header>

          <div className="chat-tabs">
            <button className="chat-tab active">contacts</button>
            <button className="chat-tab">groups</button>
          </div>

          <div className="sidebar-search-wrapper">
            <span className="sidebar-search-icon">🔍</span>
            <input
              type="text"
              placeholder="Type name to find contact"
              className="sidebar-search"
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>

          {/* LIST AREA: search results OR chat list */}
          <div className="chat-list">
            {searchMode ? (
              userSearchLoading ? (
                <p className="sidebar-empty">Searching…</p>
              ) : searchResults.length === 0 ? (
                <p className="sidebar-empty">No users found</p>
              ) : (
                searchResults.map((u, idx) => {
                  const candidateId = getEntityId(u);
                  const isSelected = showUpdateGroupModal
                    ? currentGroupMembers.some(
                        (x) => getEntityId(x) === candidateId
                      )
                    : selectedGroupUsers.some(
                        (x) => getEntityId(x) === candidateId
                      );

                  const clickHandler = showGroupModal
                    ? () => toggleUserInGroup(u)
                    : showUpdateGroupModal
                    ? () => toggleUserInUpdateGroup(u)
                    : async () => {
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
                      };

                  return (
                    <motion.div
                      key={candidateId || u.email || `user-${idx}`}
                      className={`chat-list-item-2 ${
                        isSelected ? "selected" : ""
                      }`}
                      onClick={clickHandler}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                      whileHover={{ scale: 1.01 }}
                    >
                      <div className="chat-list-avatar">
                        <Avatar
                          src={u.avatar}
                          fallback={u.name?.charAt(0).toUpperCase()}
                          size={36}
                        />
                      </div>
                      <div className="chat-list-body">
                        <div className="chat-list-top">
                          <span className="chat-list-name">{u.name}</span>
                        </div>
                        <div className="chat-list-bottom">
                          <span className="chat-list-preview">{u.email}</span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )
            ) : (
              <>
                {chats.length === 0 ? (
                  <p className="sidebar-empty">No chats yet</p>
                ) : (
                  chats.map((chat, index) => {
                    const isGroup = chat.isGroup;
                    const { title, primaryOther } = getChatTitleAndUser(chat);
                    const displayTitle = isGroup ? chat.name || title : title;
                    const isOnline =
                      !isGroup &&
                      primaryOther &&
                      onlineUsers.includes(getEntityId(primaryOther));

                    return (
                      <motion.div
                        key={`${chat._id}-${index}`}
                        className={`chat-list-item-2 ${
                          selectedChat && selectedChat._id === chat._id
                            ? "active"
                            : ""
                        }`}
                        onClick={() => handleSelectChat(chat)}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        whileHover={{ scale: 1.01 }}
                      >
                        <div className="chat-list-avatar">
                          <Avatar
                            src={isGroup ? chat.avatar || null : primaryOther?.avatar}
                            fallback={displayTitle.charAt(0).toUpperCase()}
                            size={36}
                          />
                        </div>
                        <div className="chat-list-body">
                          <div className="chat-list-top">
                            <span className="chat-list-name">
                              {displayTitle}
                            </span>
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
                              {isTyping && typingChatId === chat._id
                                ? "typing..."
                                : chat.latestMessage
                                ? chat.latestMessage.content
                                : "Start conversation"}
                            </span>
                            {selectedChat && selectedChat._id === chat._id && (
                              <span className="chat-list-item-menu">⋮</span>
                            )}
                            {chat.unreadCount > 0 && (
                              <span className="chat-list-unread">
                                {chat.unreadCount}
                              </span>
                            )}
                          </div>
                        </div>
                      </motion.div>
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
                  const isGroup = selectedChat.isGroup;
                  const isOnline =
                    !isGroup &&
                    primaryOther &&
                    onlineUsers.includes(getEntityId(primaryOther));

                  if (isGroup) {
                    const headerTitle = selectedChat.name || title;
                    const memberCount = selectedChat.participants?.length || 0;
                    
                    return (
                      <>
                        <div
                          className="right-header-left group-header-clickable"
                          onClick={() => setShowGroupInfo(true)}
                          style={{ cursor: "pointer" }}
                        >
                          <div className="right-avatar">
                            <Avatar
                              src={selectedChat.avatar || null}
                              fallback={headerTitle.charAt(0).toUpperCase()}
                              size={48}
                            />
                          </div>
                          <div>
                            <div className="right-name-row">
                              <span className="right-name">{headerTitle}</span>
                            </div>
                            <span className="right-phone">
                              {memberCount} member{memberCount === 1 ? "" : "s"}
                            </span>
                          </div>
                        </div>
                        <div className="right-header-actions">
                          <button className="right-header-btn" title="Video call">📹</button>
                          <button className="right-header-btn" title="Voice call">🎤</button>
                          <button className="right-header-btn" title="Media">🖼️</button>
                        </div>
                      </>
                    );
                  }

                  return (
                    <>
                      <div className="right-header-left">
                        <div className="right-avatar">
                          <Avatar
                            src={primaryOther?.avatar}
                            fallback={title.charAt(0).toUpperCase()}
                            size={48}
                          />
                        </div>
                        <div>
                          <div className="right-name-row">
                            <span className="right-name">{title}</span>
                          </div>
                          <span className="right-phone">
                            {primaryOther?.phone || primaryOther?.email || ""}
                          </span>
                        </div>
                      </div>
                      <div className="right-header-actions">
                        <button className="right-header-btn" title="Video call">📹</button>
                        <button className="right-header-btn" title="Voice call">🎤</button>
                        <button className="right-header-btn" title="Media">🖼️</button>
                      </div>
                    </>
                  );
                })()}
              </header>

              {/* MESSAGES */}
              <section className="chat-right-body">
                <InlineAlert
                  message={globalError}
                  onClose={() => setGlobalError(null)}
                />
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
                    {messages.map((msg, index) => {
                      const isOwn =
                        getEntityId(msg.sender) === currentUserId;
                      const { primaryOther } = getChatTitleAndUser(selectedChat);

                      return (
                        <div
                          key={`${msg._id}-${index}`}
                          className={`message-row ${isOwn ? "own" : "other"}`}
                          style={!isOwn ? { alignItems: "flex-start", gap: "8px" } : {}}
                        >
                          {!isOwn && (
                            <Avatar
                              src={msg.sender?.avatar || primaryOther?.avatar || null}
                              fallback={msg.sender?.name?.charAt(0)?.toUpperCase() || "?"}
                              size={32}
                            />
                          )}
                          <div className="message-bubble">
                            <div className="message-text">{msg.content}</div>
                            <div className="message-meta">
                              <span>{formatMessageTime(msg.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {isTyping && typingChatId === selectedChat._id && (
                      <div className="message-row other" style={{ alignItems: "flex-start", gap: "8px" }}>
                        {(() => {
                          const { primaryOther } = getChatTitleAndUser(selectedChat);
                          return (
                            <Avatar
                              src={primaryOther?.avatar || null}
                              fallback={primaryOther?.name?.charAt(0)?.toUpperCase() || "?"}
                              size={32}
                            />
                          );
                        })()}
                        <div className="message-bubble">
                          <div className="typing-indicator">Typing...</div>
                        </div>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>
                )}
              </section>

              {/* INPUT */}
              <form className="chat-bottom-input" onSubmit={handleSendMessage}>
                <button type="button" className="emoji-btn" title="Emoji">
                  😊
                </button>
                <input
                  type="text"
                  placeholder="Write a message..."
                  value={messageText}
                  onChange={handleTyping}
                />
                <button 
                  type="submit" 
                  disabled={!messageText.trim()} 
                  className="send-btn"
                  title="Send"
                >
                  ➤
                </button>
              </form>
            </>
          ) : (
            <div className="chat-right-empty">
              <div className="chat-empty-icon">💬</div>
              <h2>Welcome to ChatVerse</h2>
              <p className="muted-text">
                Select a chat on the left or search for a user to start a new
                one.
              </p>
            </div>
          )}
        </main>
      </div>

     {/* GROUP MODAL (Create) */}
{showGroupModal && (
  <div className="modal-backdrop">
    <div className="modal-card modal-card-wide">
      <h3 className="modal-title">Create new group</h3>
      <p className="modal-subtitle">
        Choose a group name and add at least 2 members.
      </p>
      <InlineAlert
        message={createGroupError}
        onClose={() => setCreateGroupError(null)}
      />

      <form onSubmit={handleCreateGroup}>
        <div className="form-group">
          <label className="form-label">Group name</label>
          <input
            type="text"
            placeholder="E.g. College Friends"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            className="group-name-input"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Add members</label>
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="group-name-input"
          />
          {searchMode && (
            <div className="search-results-list" style={modalSearchListStyle}>
              {userSearchLoading ? (
                <p className="muted-text small">Searching…</p>
              ) : searchResults.length === 0 ? (
                <p className="muted-text small">No users found</p>
              ) : (
                searchResults.slice(0, 6).map((u) => {
                  const userId = getEntityId(u);
                  const alreadySelected = selectedGroupUsers.some(
                    (x) => getEntityId(x) === userId
                  );

                  return (
                    <button
                      type="button"
                      key={userId || u.email}
                      className={`search-result-row ${
                        alreadySelected ? "disabled" : ""
                      }`}
                      style={{
                        ...modalSearchRowStyle,
                        opacity: alreadySelected ? 0.5 : 1,
                      }}
                      onClick={() => toggleUserInGroup(u)}
                      disabled={alreadySelected}
                    >
                      <span>{u.name}</span>
                      <span className="muted-text small">{u.email}</span>
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">Selected members</label>
          {selectedGroupUsers.length === 0 ? (
            <p className="muted-text small">
              Use the search box above to add members.
            </p>
          ) : (
            <div className="chip-list">
              {selectedGroupUsers.map((u) => {
                const userId = getEntityId(u);
                return (
                  <div key={userId || u.email} className="chip">
                  <span className="chip-avatar">
                    {u.name?.charAt(0).toUpperCase()}
                  </span>
                  <span className="chip-label">{u.name}</span>
                    <button
                      type="button"
                      className="chip-remove"
                      onClick={() =>
                        setSelectedGroupUsers((prev) => {
                          const next = prev.filter(
                            (x) => getEntityId(x) !== userId
                          );
                          if (
                            createGroupError &&
                            next.length >= 2 &&
                            groupName.trim()
                          ) {
                            setCreateGroupError(null);
                          }
                          return next;
                        })
                      }
                    >
                    ✕
                  </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="modal-actions spaced">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              setShowGroupModal(false);
              setSelectedGroupUsers([]);
              setGroupName("");
              setSearchMode(false);
              dispatch(clearUserSearch());
              setSearchTerm("");
              setCreateGroupError(null);
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={
              !groupName.trim() || selectedGroupUsers.length < 2
            }
          >
            Create group
          </button>
        </div>
      </form>
    </div>
  </div>
)}


   {/* GROUP UPDATE MODAL (Edit Members) */}
{showUpdateGroupModal && selectedChat && selectedChat.isGroup && (
  <div className="modal-backdrop">
    <div className="modal-card modal-card-wide">
      <h3 className="modal-title">
        Manage group members
      </h3>
      <p className="modal-subtitle">
        {selectedChat.name || "Group"} •{" "}
        {currentGroupMembers.length} member
        {currentGroupMembers.length === 1 ? "" : "s"}
      </p>
      <InlineAlert
        message={updateGroupError}
        onClose={() => setUpdateGroupError(null)}
      />

      <div className="form-group">
        <label className="form-label">Add members</label>
        <input
          type="text"
          placeholder="Search users..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="group-name-input"
        />
        {searchMode && (
          <div className="search-results-list" style={modalSearchListStyle}>
            {userSearchLoading ? (
              <p className="muted-text small">Searching…</p>
            ) : searchResults.length === 0 ? (
              <p className="muted-text small">No users found</p>
            ) : (
              searchResults.slice(0, 6).map((u) => {
                const userId = getEntityId(u);
                const alreadySelected = currentGroupMembers.some(
                  (x) => getEntityId(x) === userId
                );

                return (
                  <button
                    type="button"
                    key={userId || u.email}
                    className={`search-result-row ${
                      alreadySelected ? "disabled" : ""
                    }`}
                      style={{
                        ...modalSearchRowStyle,
                        opacity: alreadySelected ? 0.5 : 1,
                      }}
                    onClick={() => toggleUserInUpdateGroup(u)}
                    disabled={alreadySelected}
                  >
                    <span>{u.name}</span>
                    <span className="muted-text small">{u.email}</span>
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>

      <div className="form-group">
        <label className="form-label">Members</label>
        {currentGroupMembers.length === 0 ? (
          <p className="muted-text small">
            No members? That should not happen.
          </p>
        ) : (
          <div className="member-list">
            {currentGroupMembers.map((u) => {
              const adminId = getGroupAdminId(selectedChat);
              const userId = getEntityId(u);
              const isYou = userId === currentUserId;
              const isAdmin = adminId && adminId === userId;
              const coAdmin = isCoAdmin(selectedChat, userId);

              return (
                <div
                  key={userId || u.email}
                  className="member-row"
                  onClick={() => {
                    if (isYou) return; // cannot remove yourself here
                    toggleUserInUpdateGroup(u);
                  }}
                  style={{
                    cursor: isYou ? "default" : "pointer",
                  }}
                >
                  <div className="member-main">
                    <div className="member-avatar">
                      {u.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="member-text">
                      <div className="member-name">
                        {u.name}
                        {isYou && <span className="tag you-tag">You</span>}
                        {(isAdmin || coAdmin) && (
                          <span className="tag admin-tag">Admin</span>
                        )}
                      </div>
                      <div className="member-email">{u.email}</div>
                    </div>
                  </div>

                  {!isYou && (
                    <button
                      type="button"
                      className="member-remove-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleUserInUpdateGroup(u);
                      }}
                    >
                      Remove
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
        <p className="muted-text small" style={{ marginTop: 6 }}>
          Use the search box above to add users. Click a member (except you) to
          mark them for removal.
        </p>
      </div>

      <div className="modal-actions spaced">
        <button
          type="button"
          className="btn-secondary"
          onClick={() => {
            setShowUpdateGroupModal(false);
            setCurrentGroupMembers([]);
            setSearchMode(false);
            dispatch(clearUserSearch());
            setSearchTerm("");
              setUpdateGroupError(null);
          }}
        >
          Cancel
        </button>
        <button
          type="button"
          className="btn-danger-outline"
          onClick={handleLeaveGroup}
        >
          Leave group
        </button>
        <button
          type="submit"
          className="btn-primary"
          onClick={handleUpdateGroup}
          disabled={
            groupUpdateLoading || currentGroupMembers.length < 2
          }
        >
          {groupUpdateLoading ? "Updating..." : "Save changes"}
        </button>
      </div>
    </div>
  </div>
)}

{/* EDIT GROUP MODAL (Name & Avatar) */}
{showEditGroupModal && selectedChat && selectedChat.isGroup && (
  <div className="modal-backdrop">
    <div className="modal-card">
      <h3 className="modal-title">Edit group</h3>
      <p className="modal-subtitle">{selectedChat.name || "Group"}</p>

      <div className="form-group" style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Avatar
          src={selectedChat.avatar || null}
          fallback={(selectedChat.name || "G").charAt(0).toUpperCase()}
          size={44}
        />
        <button
          type="button"
          className="btn-secondary"
          onClick={handleOpenGroupAvatarPicker}
        >
          Change avatar
        </button>
      </div>

      <div className="form-group">
        <label className="form-label">Group name</label>
        <input
          type="text"
          placeholder="Enter group name"
          value={editGroupName}
          onChange={(e) => setEditGroupName(e.target.value)}
          className="group-name-input"
        />
      </div>

      <div className="modal-actions spaced">
        <button
          type="button"
          className="btn-secondary"
          onClick={() => setShowEditGroupModal(false)}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn-primary"
          onClick={handleSaveEditGroup}
          disabled={!editGroupName.trim()}
        >
          Save changes
        </button>
      </div>
    </div>
  </div>
)}

{/* GROUP INFO SIDE PANEL */}
{showGroupInfo && selectedChat && selectedChat.isGroup && (
  <div className="side-panel-backdrop" onClick={() => setShowGroupInfo(false)}>
    <motion.div
      className="side-panel"
      onClick={(e) => e.stopPropagation()}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
    >
      <div className="side-panel-header">
        <div className="side-panel-avatar">
          <Avatar
            src={selectedChat.avatar || null}
            fallback={(selectedChat.name || "G")
              .charAt(0)
              .toUpperCase()}
            size={44}
          />
        </div>
        <div className="side-panel-title-block">
          <h3 className="side-panel-title">
            {selectedChat.name || "Group"}
          </h3>
          <p className="side-panel-subtitle">
            {selectedChat.participants?.length || 0} members
          </p>
        </div>
        <button
          className="side-panel-close"
          onClick={() => setShowGroupInfo(false)}
        >
          ✕
        </button>
      </div>

      <div className="side-panel-section">
        <h4 className="side-panel-section-title">Members</h4>
        <div className="member-list compact">
          {(selectedChat.participants || []).map((u) => {
            const adminId = getGroupAdminId(selectedChat);
            const userId = getEntityId(u);
            const isYou = userId === currentUserId;
            const isAdmin = adminId && adminId === userId;
            const coAdmin = isCoAdmin(selectedChat, userId);
            const requesterIsAdmin =
              getGroupAdminId(selectedChat) === currentUserId ||
              isCoAdmin(selectedChat, currentUserId);
            const isMember = (selectedChat.participants || []).some(
              (p) => getEntityId(p) === userId
            );

            return (
              <div
                key={getEntityId(u) || u.email}
                className="member-row compact"
              >
                <div className="member-main">
                  <div className="member-avatar small">
                    {u.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="member-text">
                    <div className="member-name">
                      {u.name}
                      {isYou && <span className="tag you-tag">You</span>}
                      {(isAdmin || coAdmin) && (
                        <span className="tag admin-tag">Admin</span>
                      )}
                    </div>
                    <div className="member-email">{u.email}</div>
                  </div>
                </div>
                {requesterIsAdmin && userId && isMember && !isYou && !(isAdmin || coAdmin) && (
                  <button
                    type="button"
                    className="member-remove-btn"
                    onClick={() => handleMakeAdmin(userId)}
                  >
                    Make admin
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="side-panel-footer">
        {((getGroupAdminId(selectedChat) === currentUserId) || isCoAdmin(selectedChat, currentUserId)) ? (
          <>
            <button
              className="btn-primary full-width"
              onClick={() => {
                setShowGroupInfo(false);
                handleOpenUpdateGroupModal();
              }}
            >
              Edit members
            </button>
            <button
              className="btn-secondary full-width"
              onClick={() => {
                setShowGroupInfo(false);
                handleOpenEditGroupModal();
              }}
            >
              Edit group
            </button>
            <button
              className="btn-danger full-width"
              onClick={handleDeleteGroup}
            >
              Delete group
            </button>
          </>
        ) : (
          <button
            className="btn-danger full-width"
            onClick={handleLeaveGroup}
          >
            Leave group
          </button>
        )}
      </div>
    </motion.div>
  </div>
)}


    </div>
  );
};

export default ChatPage;
