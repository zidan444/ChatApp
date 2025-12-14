import React from "react";
import ChatList from "./ChatList";
import Avatar from "../ui/Avatar";

const Sidebar = ({
  user,
  chats,
  selectedChat,
  handleSelectChat,
  searchTerm,
  handleSearchChange,
  searchMode,
  searchResults,
  userSearchLoading,
  onlineUsers,
  accessChat,
  onLogout,
  onOpenGroupModal
}) => {
  return (
    <div className="flex flex-col w-full h-full bg-[#0f172a] text-[#94a3b8] relative">
      {/* App Header */}
      <div className="px-6 pt-6 pb-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 cursor-pointer group hover:text-white transition-colors">
            <h1 className="text-xl font-bold text-white tracking-wide">
            CONVO
            </h1>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 text-[#3b82f6] group-hover:rotate-180 transition-transform duration-300">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
        </div>
        
        <button onClick={onOpenGroupModal} className="p-2 -mr-2 text-[#94a3b8] hover:text-white hover:bg-[#1e293b] rounded-full transition-all">
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
            </svg>
        </button>
      </div>

      {/* Search */}
      <div className="px-6 pb-4 shrink-0">
        <div className="relative group">
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full bg-[#1e293b] text-[#f1f5f9] border border-transparent focus:border-[#3b82f6] rounded-xl py-2.5 pl-10 pr-4 text-sm placeholder:text-[#64748b] transition-all outline-none shadow-sm group-hover:bg-[#334155]"
          />
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-4 h-4 absolute left-3.5 top-3 text-[#64748b] group-focus-within:text-[#3b82f6] transition-colors"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto px-4 custom-scrollbar">
         {/* Categories / Navigation could go here */}
         
         <div className="mb-2 px-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[#475569]">
            <span>Messages</span>
            <span className="bg-[#1e293b] text-[#94a3b8] py-0.5 px-2 rounded-md">{chats.length}</span>
         </div>

        <ChatList
          chats={chats}
          searchResults={searchResults}
          searchMode={searchMode}
          userSearchLoading={userSearchLoading}
          selectedChat={selectedChat}
          handleSelectChat={handleSelectChat}
          currentUserId={user?._id || user?.id}
          onlineUsers={onlineUsers}
          accessChat={accessChat}
        />
      </div>
       
       {/* Footer Profile */}
       <div className="p-4 border-t border-[#1e293b] bg-[#0f172a] shrink-0">
           <div className="flex items-center justify-between p-2 rounded-xl hover:bg-[#1e293b] transition-colors cursor-pointer group">
               <div className="flex items-center gap-3">
                   <div className="relative">
                       <Avatar src={user?.avatar} fallback={user?.name?.charAt(0)} size={36} />
                       <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#0f172a] rounded-full"></span>
                   </div>
                   <div className="flex flex-col">
                       <span className="text-sm font-semibold text-[#f1f5f9] group-hover:text-white">{user?.name}</span>
                       <span className="text-xs text-[#64748b]">My Account</span>
                   </div>
               </div>
               <button onClick={onLogout} className="text-[#64748b] hover:text-red-400 p-2 transition-colors">
                   <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                       <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                   </svg>
               </button>
           </div>
       </div>
    </div>
  );
};

export default Sidebar;
