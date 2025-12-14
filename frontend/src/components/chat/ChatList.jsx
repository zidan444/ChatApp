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
      if(userSearchLoading) return <p className="text-[#64748b] text-center mt-10 text-sm">Searching users...</p>;
      if(searchResults.length === 0) return <p className="text-[#64748b] text-center mt-10 text-sm">No users found</p>;

      return (
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="flex flex-col gap-1 overflow-y-auto">
          {searchResults.map((u) => {
               const candidateId = getEntityId(u);
               const isSelected = isUpdateGroupModalOpen
                 ? currentGroupMembers.some((x) => getEntityId(x) === candidateId)
                 : isGroupModalOpen 
                 ? selectedGroupUsers.some((x) => getEntityId(x) === candidateId)
                 : false; 
            
               let onClickHandler;
               if (isGroupModalOpen) onClickHandler = () => toggleUserInGroup(u);
               else if (isUpdateGroupModalOpen) onClickHandler = () => toggleUserInUpdateGroup(u);
               else onClickHandler = () => accessChat(u._id);


               return (
                  <motion.div
                    key={candidateId}
                    variants={itemVariants}
                    onClick={onClickHandler}
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border border-transparent ${isSelected ? 'bg-[#3b82f6]/10 border-[#3b82f6]/30' : 'hover:bg-[#1e293b]'}`}
                  >
                    <Avatar src={u.avatar} fallback={u.name?.charAt(0).toUpperCase()} size={40} />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-[#f1f5f9] text-sm truncate">{u.name}</div>
                      <div className="text-xs text-[#64748b] truncate">{u.email}</div>
                    </div>
                     {isSelected && <span className="text-[#3b82f6] text-xs font-bold">Selected</span>}
                  </motion.div>
               )
          })}
        </motion.div>
      )
  }

  if (chats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 opacity-50 text-[#64748b]">
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
      className="flex flex-col gap-1 overflow-y-auto pb-20"
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
                ? "bg-[#1e293b] border-[#1e293b] shadow-sm" 
                : "border-transparent hover:bg-[#1e293b]/50"
            }`}
          >
            <div className="relative shrink-0">
                <Avatar 
                    src={chat.isGroup ? chat.avatar : primaryOther?.avatar} 
                    fallback={displayTitle.charAt(0).toUpperCase()} 
                    size={42} 
                />
                {isOnline && <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#22c55e] border-2 border-[#0f172a] rounded-full"></span>}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-baseline mb-0.5">
                <span className={`text-sm font-medium truncate ${isActive ? 'text-[#f1f5f9]' : 'text-[#e2e8f0]'}`}>
                    {displayTitle}
                </span>
                {chat.latestMessage && (
                  <span className={`text-[10px] shrink-0 ${isActive ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>
                    {formatMessageTime(chat.latestMessage.createdAt)}
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-1.5">
                 <span className={`text-xs truncate ${isActive ? 'text-[#cbd5e1]' : 'text-[#64748b]'}`}>
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
