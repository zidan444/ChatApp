// src/pages/ChatPage.jsx
import React, { useEffect, useState, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import io from "socket.io-client";
import { SOCKET_URL } from "../config";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

// Actions
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
} from "../store/chatSlice";
import { searchUsers, clearUserSearch } from "../store/userSlice";

// Components
import Avatar from "../components/ui/Avatar";
import InlineAlert from "../components/ui/InlineAlert";
import ChatHeader from "../components/chat/ChatHeader";
import ChatList from "../components/chat/ChatList";
import MessageList from "../components/chat/MessageList";
import ChatInput from "../components/chat/ChatInput";
import Sidebar from "../components/chat/Sidebar";
import RightPanel from "../components/chat/RightPanel";

// Utils
import { getEntityId } from "../utils/entity"; 

let socket;

const ChatPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { user, token } = useSelector((state) => state.auth);
  const currentUserId = user?._id?.toString() || null;

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

  // Group Create States
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selectedGroupUsers, setSelectedGroupUsers] = useState([]);
  const [createGroupError, setCreateGroupError] = useState(null);

  // Group Update States
  const [showUpdateGroupModal, setShowUpdateGroupModal] = useState(false);
  const [currentGroupMembers, setCurrentGroupMembers] = useState([]);
  const [groupUpdateLoading, setGroupUpdateLoading] = useState(false);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [updateGroupError, setUpdateGroupError] = useState(null);

  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);

  // Initial Data Load
  useEffect(() => {
    if (token) {
      dispatch(fetchChats());
    }
  }, [token, dispatch]);

  // Socket Setup
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

  // Handlers
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

    if (sendMessage.fulfilled.match(res)) {
      const newMessage = res.payload;
      setMessageText("");
      if (globalError) setGlobalError(null);

      if (socket && newMessage) {
        socket.emit("newMessage", newMessage);
      }
    } else {
      setGlobalError(res?.payload || "Failed to send message.");
    }
  };

  const handleTyping = (e) => {
    const value = e.target.value;
    setMessageText(value);

    if (!selectedChat || !socket) return;
    socket.emit("typing", { chatId: selectedChat._id, typing: true });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("typing", { chatId: selectedChat._id, typing: false });
    }, 1500);
  };

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

    const handleCreateGroup = async () => {
        if (!groupName.trim() || selectedGroupUsers.length < 2) {
            setCreateGroupError("Group name and at least 2 users are required.");
            return;
        }

        const userIds = Array.from(new Set(selectedGroupUsers.map(u => getEntityId(u)).filter(Boolean)));
        
        const result = await dispatch(createGroupChat({ name: groupName.trim(), users: userIds }));

        if (createGroupChat.fulfilled.match(result)) {
            setCreateGroupError(null);
            const chat = result.payload;
            dispatch(setSelectedChat(chat));
            dispatch(fetchMessages(chat._id));
             if (socket) socket.emit("joinChat", chat._id);
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

    const handleLogout = () => dispatch(logout());

    // Mobile Responsive Helpers
    const isMobile = window.innerWidth <= 768; // simple check
    // Logic for toggling views on mobile could be enhanced with a proper hook
    
  return (
    <div className="h-screen w-full flex overflow-hidden bg-white">
        {/* 1. LEFT SIDEBAR (Fixed Width) */}
        <div className={`${selectedChat ? 'hidden md:flex' : 'flex'} w-full md:w-[320px] lg:w-[360px] flex-col bg-[#0f172a] border-r border-[#1e293b]`}>
            <Sidebar 
                user={user}
                chats={chats}
                selectedChat={selectedChat}
                handleSelectChat={handleSelectChat}
                searchTerm={searchTerm}
                handleSearchChange={handleSearchChange}
                searchMode={searchMode}
                searchResults={searchResults}
                userSearchLoading={userSearchLoading}
                onlineUsers={onlineUsers}
                accessChat={(id) => {
                    (async () => {
                    const res = await dispatch(accessChat(id));
                    if(accessChat.fulfilled.match(res)) {
                        handleSelectChat(res.payload);
                        setSearchMode(false);
                        setSearchTerm("");
                        dispatch(clearUserSearch());
                    }
                    })()
                }}
                onLogout={handleLogout}
                onOpenGroupModal={() => { setShowGroupModal(true); setSelectedGroupUsers([]); setGroupName(""); }}
            />
        </div>

        {/* 2. CENTER CHAT AREA (Flex Grow) */}
        <div className={`${selectedChat ? 'flex' : 'hidden md:flex'} flex-1 flex-col bg-[#f8fafc] relative min-w-0`}>
            {selectedChat ? (
                <>
                <ChatHeader 
                    chat={selectedChat} 
                    currentUserId={currentUserId} 
                    onlineUsers={onlineUsers} 
                    onGroupInfoClick={() => setShowGroupInfo(!showGroupInfo)}
                    onBack={() => dispatch(setSelectedChat(null))}
                />
                
                <MessageList 
                    messages={messages} 
                    currentUserId={currentUserId} 
                    loading={loadingMessages}
                />
                
                {/* Typing Indicator */}
                {isTyping && typingChatId === selectedChat._id && (
                    <div className="absolute bottom-20 left-6 text-xs text-blue-500 italic animate-pulse">
                        Someone is typing...
                    </div>
                )}
                
                {globalError && (
                    <div className="px-6 pb-2">
                        <InlineAlert message={globalError} onClose={() => setGlobalError(null)} />
                    </div>
                )}

                <ChatInput 
                        messageText={messageText}
                        setMessageText={setMessageText}
                        handleSendMessage={handleSendMessage}
                        handleTyping={handleTyping}
                        isTyping={isTyping}
                />
                </>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                    <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-slate-300">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-slate-600">No Chat Selected</h3>
                    <p className="max-w-xs text-center mt-2">Select a conversation from the sidebar to start chatting</p>
                </div>
            )}
        </div>

        {/* 3. RIGHT INFO PANEL (Collapsible, Fixed Width) */}
        {selectedChat && showGroupInfo && (
            <div className="w-[300px] border-l border-slate-200 bg-white hidden lg:block overflow-y-auto">
                <RightPanel 
                    chat={selectedChat}
                    currentUserId={currentUserId}
                    onlineUsers={onlineUsers}
                />
            </div>
        )}


        {/* --- MODALS --- */}
        <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            style={{ display: "none" }}
            onChange={handleGroupAvatarChange}
        />

        <AnimatePresence>
            {showGroupModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="w-full max-w-md bg-[#1a1d21] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
                    >
                         <div className="p-4 border-b border-white/5 flex justify-between items-center">
                             <h3 className="font-semibold text-slate-100">Create New Group</h3>
                             <button onClick={() => setShowGroupModal(false)} className="text-slate-400 hover:text-white">✕</button>
                         </div>
                         <div className="p-4 space-y-4">
                             <input 
                                type="text"
                                placeholder="Group Name"
                                value={groupName}
                                onChange={(e) => setGroupName(e.target.value)}
                                className="w-full bg-[#25282e] border border-transparent focus:border-blue-500 rounded-xl px-4 py-3 text-sm text-white focus:outline-none"
                             />
                             
                             <div className="space-y-2"> 
                                <label className="text-xs text-slate-400 ml-1">Add Members</label>
                                <input 
                                    type="text"
                                    placeholder="Search users..."
                                    value={searchTerm}
                                    onChange={handleSearchChange}
                                    className="w-full bg-[#25282e] border border-transparent focus:border-blue-500 rounded-xl px-4 py-3 text-sm text-white focus:outline-none"
                                />
                             </div>
                             
                             <div className="flex flex-wrap gap-2 min-h-[30px]">
                                {selectedGroupUsers.map(u => (
                                    <div key={getEntityId(u)} className="flex items-center gap-1 bg-blue-500/20 text-blue-200 px-2 py-1 rounded-full text-xs border border-blue-500/30">
                                        {u.name}
                                        <button onClick={() => toggleUserInGroup(u)} className="hover:text-white">✕</button>
                                    </div>
                                ))}
                             </div>

                             <div className="max-h-48 overflow-y-auto border border-white/5 rounded-xl bg-[#25282e]/50">
                                 {searchMode && (
                                     <ChatList 
                                        chats={[]}
                                        searchMode={true}
                                        searchResults={searchResults}
                                        userSearchLoading={userSearchLoading}
                                        selectedGroupUsers={selectedGroupUsers}
                                        toggleUserInGroup={toggleUserInGroup}
                                        isGroupModalOpen={true}
                                     />
                                 )}
                             </div>
                             
                             {createGroupError && <p className="text-red-400 text-xs px-2">{createGroupError}</p>}

                             <button 
                                onClick={handleCreateGroup}
                                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-lg shadow-blue-900/20 transition-all"
                             >
                                 Create Group
                             </button>
                         </div>
                    </motion.div>
                </div>
            )}

            {/* Reuse similar structure for other modals if needed or keep using Inline Alerts */}
            {showUpdateGroupModal && (
              // ... (Kept simple for brevity, can be styled similarly to Create Group)
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                   <div className="bg-[#1a1d21] p-6 rounded-2xl border border-white/10 max-w-md w-full">
                       <h3 className="text-white mb-4 font-semibold">Manage Group</h3>
                       <button onClick={() => setShowUpdateGroupModal(false)} className="text-blue-400 text-sm">Close</button>
                   </div>
              </div>
            )}
        </AnimatePresence>
    </div>
  );
};

export default ChatPage;
