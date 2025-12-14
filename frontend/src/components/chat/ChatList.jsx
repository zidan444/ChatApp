import React from "react";
import { motion } from "framer-motion";
import Avatar from "../ui/Avatar";
import { formatMessageTime } from "../../utils/dateFormat";

const ChatList = ({ 
  chats, 
  searchResults, 
  searchMode, 
  userSearchLoading, 
  selectedChat, 
  handleSelectChat, 
  currentUserId,
  onlineUsers,
  isGroupModalOpen,
  isUpdateGroupModalOpen,
  toggleUserInGroup,
  toggleUserInUpdateGroup,
  accessChat,
  selectedGroupUsers,
  currentGroupMembers
}) => {
  
  const getEntityId = (entity) => {
    if (!entity) return null;
    if (typeof entity === "string") return entity;
    if (typeof entity === "object") {
      const value = entity._id || entity.id;
      return value ? value.toString() : null;
    }
    return null;
  };

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

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
  };

  if (searchMode) {
      if(userSearchLoading) return <p className="text-slate-500 text-center mt-10 text-sm">Searching users...</p>;
      if(searchResults.length === 0) return <p className="text-slate-500 text-center mt-10 text-sm">No users found</p>;

      return (
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="flex flex-col p-2 gap-1 overflow-y-auto">
          {searchResults.map((u) => {
               const candidateId = getEntityId(u);
               const isSelected = isUpdateGroupModalOpen
                 ? currentGroupMembers.some((x) => getEntityId(x) === candidateId)
                 : isGroupModalOpen 
                 ? selectedGroupUsers.some((x) => getEntityId(x) === candidateId)
                 : false; // Not applicable for regular selection
            
               // Determine click handler based on context
               let onClickHandler;
               if (isGroupModalOpen) onClickHandler = () => toggleUserInGroup(u);
               else if (isUpdateGroupModalOpen) onClickHandler = () => toggleUserInUpdateGroup(u);
               else onClickHandler = () => accessChat(u._id);


               return (
                  <motion.div
                    key={candidateId}
                    variants={itemVariants}
                    onClick={onClickHandler}
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border border-transparent hover:bg-white/5 ${isSelected ? 'bg-blue-500/10 border-blue-500/30' : ''}`}
                  >
                    <Avatar src={u.avatar} fallback={u.name?.charAt(0).toUpperCase()} size={40} />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-slate-200 text-sm truncate">{u.name}</div>
                      <div className="text-xs text-slate-500 truncate">{u.email}</div>
                    </div>
                     {isSelected && <span className="text-blue-400 text-xs font-bold">Selected</span>}
                  </motion.div>
               )
          })}
        </motion.div>
      )
  }

  if (chats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 opacity-50">
          <p className="text-sm">No chats yet</p>
          <p className="text-xs mt-1">Search to find someone</p>
      </div>
    );
  }

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="flex flex-col p-2 gap-1 overflow-y-auto"
    >
      {chats.map((chat) => {
        const { title, primaryOther } = getChatTitleAndUser(chat);
        const displayTitle = chat.isGroup ? chat.name || title : title;
        const isActive = selectedChat && selectedChat._id === chat._id;
        const isOnline = !chat.isGroup && primaryOther && onlineUsers.includes(getEntityId(primaryOther));

        return (
          <motion.div
            key={chat._id}
            variants={itemVariants}
            onClick={() => handleSelectChat(chat)}
            className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${
              isActive 
                ? "bg-gradient-to-r from-blue-600/20 to-blue-500/10 border-blue-500/30 shadow-md shadow-black/20" 
                : "border-transparent hover:bg-white/5 hover:border-white/5"
            }`}
          >
            <div className="relative">
                <Avatar 
                    src={chat.isGroup ? chat.avatar : primaryOther?.avatar} 
                    fallback={displayTitle.charAt(0).toUpperCase()} 
                    size={42} 
                />
                {isOnline && <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-slate-900 rounded-full"></span>}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-baseline mb-0.5">
                <span className={`text-sm font-medium truncate ${isActive ? 'text-white' : 'text-slate-200'}`}>
                    {displayTitle}
                </span>
                {chat.latestMessage && (
                  <span className={`text-[10px] shrink-0 ${isActive ? 'text-blue-200' : 'text-slate-500'}`}>
                    {formatMessageTime(chat.latestMessage.createdAt)}
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-1.5">
                 {/* {chat.isGroup && <span className="text-[10px] bg-slate-800 text-slate-400 px-1 rounded">Group</span>} */}
                 <span className={`text-xs truncate ${isActive ? 'text-blue-200/80' : 'text-slate-500'}`}>
                    {chat.latestMessage 
                        ? (
                            <>
                                {chat.isGroup && chat.latestMessage.sender && (
                                    <span className="font-semibold mr-1">{chat.latestMessage.sender.name.split(' ')[0]}:</span>
                                )} 
                                {chat.latestMessage.content}
                            </>
                        )
                        : <span className="italic opacity-70">Start conversation</span>}
                 </span>
              </div>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
};

export default ChatList;
