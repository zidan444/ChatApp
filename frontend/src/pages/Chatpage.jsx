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
  deleteGroup,
  addGroupAdmin,
  renameGroup,
} from "../store/chatSlice";
import { searchUsers, clearUserSearch } from "../store/userSlice";

// Components
import Avatar from "../components/ui/Avatar";
import InlineAlert from "../components/ui/InlineAlert";
import ChatHeader from "../components/chat/ChatHeader";
import ChatList from "../components/chat/ChatList";
import MessageList from "../components/chat/MessageList";
import ChatInput from "../components/chat/ChatInput";

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
  const [showEditGroupModal, setShowEditGroupModal] = useState(false); // Rename group
  const [editGroupName, setEditGroupName] = useState("");

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
    // Provide a dummy event for mobile view toggle if needed in future
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

    // --- Component Group Methods can be extracted to hooks if refactoring further ---
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
    
    // Additional handlers for group management...
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
    const showSidebar = !selectedChat || !isMobile;
    const showChat = selectedChat || !isMobile;

  return (
    <div className="h-screen w-full bg-[#020617] text-gray-200 overflow-hidden flex items-center justify-center p-0 md:p-6 lg:p-8 bg-gradient-to-br from-slate-950 via-slate-900 to-black relative">
       
        {/* Abstract Background Blobs - Fixed Position */}
        <div className="fixed top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-900/20 blur-[120px] pointer-events-none" />
        <div className="fixed bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-900/20 blur-[120px] pointer-events-none" />
        
        <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            style={{ display: "none" }}
            onChange={handleGroupAvatarChange}
        />

      <div className="w-full max-w-7xl h-full md:h-[90vh] bg-slate-900/40 backdrop-blur-xl rounded-none md:rounded-3xl border-0 md:border border-white/10 shadow-2xl flex overflow-hidden ring-1 ring-white/5 relative z-10 transition-all duration-300">
        
        {/* LEFT PANEL / SIDEBAR */}
        <div className={`${selectedChat ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-[320px] lg:w-[360px] border-r border-white/5 bg-slate-900/30`}>
          
          {/* Header */}
          <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/5">
            <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => navigate("/profile")}>
                <Avatar src={user?.avatar} fallback={user?.name?.charAt(0)} size={40} />
                <div>
                    <h3 className="font-semibold text-sm text-slate-100">{user?.name}</h3>
                    <p className="text-xs text-slate-400">My Account</p>
                </div>
            </div>
            
             <button
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                title="Logout"
             >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                </svg>
             </button>
          </div>

          <div className="p-3">
             <div className="relative">
                 <input 
                    type="text" 
                    placeholder="Search chats or users..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-blue-500/50 focus:bg-slate-800 transition-all placeholder:text-slate-500"
                 />
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                 </svg>
             </div>
             
             {searchMode && (
                <div className="mt-2 flex justify-between items-center px-1">
                   <p className="text-xs text-slate-400">Search Results</p>
                   <button onClick={() => { setSearchTerm(""); setSearchMode(false); dispatch(clearUserSearch()); }} className="text-xs text-blue-400 hover:underline">Clear</button>
                </div>
             )}
          </div>
            
          <div className="flex-1 overflow-y-auto custom-scrollbar">
              <ChatList 
                chats={chats} 
                searchResults={searchResults} 
                searchMode={searchMode} 
                userSearchLoading={userSearchLoading}
                selectedChat={selectedChat}
                handleSelectChat={handleSelectChat}
                currentUserId={currentUserId}
                onlineUsers={onlineUsers}
                accessChat={(id) => {
                     // Reuse logic from old ChatPage
                     (async () => {
                        const res = await dispatch(accessChat(id));
                        if(accessChat.fulfilled.match(res)) {
                            const chat = res.payload;
                            dispatch(setSelectedChat(chat));
                            dispatch(fetchMessages(chat._id));
                            if(socket) socket.emit("joinChat", chat._id);
                            setSearchMode(false);
                            setSearchTerm("");
                            dispatch(clearUserSearch());
                        }
                     })()
                }}
              />
          </div>
          
           <div className="p-3 border-t border-white/5">
                <button 
                  onClick={() => { setShowGroupModal(true); setSelectedGroupUsers([]); setGroupName(""); }}
                  className="w-full py-2.5 rounded-xl bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 text-sm font-medium border border-blue-600/20 transition-all flex items-center justify-center gap-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    Create Group
                </button>
           </div>
        </div>

        {/* RIGHT PANEL / CHAT AREA */}
        <div className={`${selectedChat ? 'flex' : 'hidden md:flex'} flex-1 flex-col bg-slate-900/20 relative z-10`}>
             {selectedChat ? (
                 <>
                   <ChatHeader 
                      chat={selectedChat} 
                      currentUserId={currentUserId} 
                      onlineUsers={onlineUsers} 
                      onGroupInfoClick={() => setShowGroupInfo(true)}
                      onBack={() => dispatch(setSelectedChat(null))}
                   />
                   
                   <MessageList 
                      messages={messages} 
                      currentUserId={currentUserId} 
                      loading={loadingMessages}
                   />
                   
                   {/* Typing Indicator */}
                   {isTyping && typingChatId === selectedChat._id && (
                       <div className="px-6 py-2 text-xs text-slate-500 italic animate-pulse">
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
                <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-8 text-center">
                    <div className="w-24 h-24 bg-slate-800/50 rounded-full flex items-center justify-center mb-6 ring-4 ring-slate-800/30">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-12 h-12 opacity-50">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-semibold text-slate-300 mb-2">Welcome to ChatApp</h2>
                    <p className="max-w-md text-sm">Select a chat from the sidebar or start a new conversation to create connections.</p>
                </div>
             )}
        </div>

        {/* MODALS */}
        {/* Create Group Modal */}
        <AnimatePresence>
            {showGroupModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="w-full max-w-md bg-[#0f172a] border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden"
                    >
                         <div className="p-4 border-b border-slate-700/50 flex justify-between items-center">
                             <h3 className="font-semibold text-slate-100">Create New Group</h3>
                             <button onClick={() => setShowGroupModal(false)} className="text-slate-400 hover:text-white">✕</button>
                         </div>
                         <div className="p-4 space-y-4">
                             <input 
                                type="text"
                                placeholder="Group Name"
                                value={groupName}
                                onChange={(e) => setGroupName(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
                             />
                             
                             <div className="space-y-2"> 
                                <label className="text-xs text-slate-400 ml-1">Add Members</label>
                                <input 
                                    type="text"
                                    placeholder="Search users..."
                                    value={searchTerm}
                                    onChange={handleSearchChange}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
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

                             <div className="max-h-48 overflow-y-auto border border-slate-800 rounded-xl">
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
                                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-lg shadow-blue-900/20 transition-all font-sans"
                             >
                                 Create Group
                             </button>
                         </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>

        {/* Group Update Modal - Simplified for now, just toggling visibility */}
        {showUpdateGroupModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <motion.div className="w-full max-w-md bg-[#0f172a] border border-slate-700/50 rounded-2xl shadow-2xl p-6">
                    <h3 className="font-semibold text-slate-100 mb-4">Manage Group Members</h3>
                    <div className="space-y-4">
                         <input 
                            type="text"
                            placeholder="Search users to add..."
                            value={searchTerm}
                            onChange={handleSearchChange}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
                         />
                         
                         <div className="max-h-60 overflow-y-auto border border-slate-800 rounded-xl">
                             {searchMode ? (
                                 <ChatList 
                                    chats={[]}
                                    searchMode={true}
                                    searchResults={searchResults}
                                    userSearchLoading={userSearchLoading}
                                    currentGroupMembers={currentGroupMembers}
                                    toggleUserInUpdateGroup={toggleUserInUpdateGroup}
                                    isUpdateGroupModalOpen={true}
                                 />
                             ) : (
                                <div className="p-2">
                                    {currentGroupMembers.map(u => (
                                        <div key={getEntityId(u)} className="flex items-center justify-between p-2 hover:bg-white/5 rounded-lg">
                                            <div className="flex items-center gap-2">
                                                <Avatar src={u.avatar} fallback={u.name[0]} size={32} />
                                                <span className="text-sm">{u.name}</span>
                                            </div>
                                            {getEntityId(u) !== currentUserId && (
                                                <button onClick={() => toggleUserInUpdateGroup(u)} className="text-red-400 hover:text-red-300 text-xs">Remove</button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                             )}
                         </div>

                         {updateGroupError && <p className="text-red-400 text-xs">{updateGroupError}</p>}
                         
                         <div className="flex justify-end gap-3 mt-4">
                             <button onClick={() => { setShowUpdateGroupModal(false); setSearchMode(false); }} className="px-4 py-2 text-sm text-slate-400 hover:text-white">Cancel</button>
                             <button onClick={handleUpdateGroup} className="px-4 py-2 bg-blue-600 rounded-lg text-white text-sm">Save Changes</button>
                         </div>
                    </div>
                </motion.div>
            </div>
        )}

        {/* Info Modal Placeholder - Expand if needed, for now logic is kept minimal */}
        {showGroupInfo && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowGroupInfo(false)}>
                 <div className="bg-slate-900 p-8 rounded-2xl border border-slate-700 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
                     <div className="flex flex-col items-center mb-6">
                        <Avatar src={selectedChat?.avatar} fallback={selectedChat?.name[0]} size={80} className="mb-4" />
                        <h3 className="text-xl font-semibold">{selectedChat?.name}</h3>
                        <p className="text-slate-400 text-sm">{selectedChat?.participants?.length} members</p>
                     </div>
                     
                     <div className="space-y-3">
                        <button onClick={() => { setShowGroupInfo(false); handleOpenUpdateGroupModal(); }} className="w-full py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm transition-colors">Manage Members</button> 
                        <button onClick={() => { setShowGroupInfo(false); fileInputRef.current?.click(); }} className="w-full py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm transition-colors">Change Icon</button>
                        <button onClick={() => { setShowGroupInfo(false); if(window.confirm('Leave group?')) dispatch(leaveGroup(selectedChat._id)); }} className="w-full py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg text-sm transition-colors">Leave Group</button>
                     </div>

                     <button className="mt-6 w-full py-2 text-slate-500 text-sm hover:text-slate-300" onClick={() => setShowGroupInfo(false)}>Close</button>
                 </div>
            </div>
        )}

      </div>
    </div>
  );
};

export default ChatPage;
