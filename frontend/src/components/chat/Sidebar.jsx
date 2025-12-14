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
    <div className="flex flex-col w-full md:w-[320px] lg:w-[360px] border-r border-[#ffffff10] bg-[#1a1d21]/50 backdrop-blur-xl h-full">
      {/* App Header */}
      <div className="p-5 pb-2">
        <h1 className="text-2xl font-bold text-white tracking-tight mb-4 flex items-center gap-2">
          CONVO 
          <span className="text-[10px] align-top text-blue-400">TM</span>
        </h1>

        {/* Search */}
        <div className="relative group">
          <input
            type="text"
            placeholder="Search user or chat"
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full bg-[#25282e] border border-transparent focus:border-slate-600 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-300 placeholder:text-slate-500 transition-all outline-none"
          />
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500 group-focus-within:text-blue-400 transition-colors"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-3">
        {/* New / Chats Header */}
        <div className="flex justify-between items-center px-2 py-2 mt-2 mb-1">
          <div className="flex items-center gap-2">
             <span className="text-sm font-medium text-slate-400 hover:text-white cursor-pointer transition-colors">New</span>
             <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
          </div>
          <span className="text-xs bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-md font-medium">{chats.length}</span>
        </div>

        {/* Chat List */}
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

        {/* "People you may know" - Placeholder or Reuse Search Results if empty? 
            For now, I'll add a static section if no search is active to match the design vibe 
            or just leave it to ChatList to handle dynamic content
        */}
        {!searchMode && (
             <div className="mt-6 px-2">
                <h4 className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">People you may know</h4>
                {/* Dummy items for visual match if real data isn't available, 
                    In real app this would map from a 'startups' or 'suggestions' prop 
                */}
                <div className="space-y-3 opacity-60 hover:opacity-100 transition-opacity duration-300">
                    {/* Placeholder content to mimic design */}
                     <div className="flex items-center justify-between group cursor-pointer">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs">W</div>
                            <span className="text-sm text-slate-400 group-hover:text-slate-200">warren@convo.com</span>
                        </div>
                        <button className="text-blue-400 text-lg hover:text-white transition-colors">+</button>
                     </div>
                     <div className="flex items-center justify-between group cursor-pointer">
                        <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center text-xs">K</div>
                            <span className="text-sm text-slate-400 group-hover:text-slate-200">krin@convo.com</span>
                        </div>
                        <button className="text-blue-400 text-lg hover:text-white transition-colors">+</button>
                     </div>
                </div>
             </div>
        )}
      </div>

       {/* Floating Action Button for Create Group (replacing the bottom bar in old design to be cleaner) */}
       <div className="absolute bottom-6 right-6 md:hidden">
            <button 
                onClick={onOpenGroupModal}
                className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-600/30 text-white"
            >
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                 <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
               </svg>
            </button>
       </div>
       
       {/* Desktop Create Group Button (Bottom of Sidebar) */}
       <div className="p-4 border-t border-[#ffffff10] hidden md:block">
           <button 
             onClick={onOpenGroupModal}
             className="w-full py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-medium shadow-lg shadow-blue-900/20 transition-all flex items-center justify-center gap-2"
           >
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                   <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
               </svg>
               Create New Group
           </button>
           
           {/* Current User Small Profile at bottom */}
           <div className="mt-4 flex items-center justify-between px-1">
               <div className="flex items-center gap-2">
                   <Avatar src={user?.avatar} fallback={user?.name?.charAt(0)} size={32} />
                   <div className="flex flex-col">
                       <span className="text-xs font-semibold text-slate-200">{user?.name}</span>
                       <span className="text-[10px] text-slate-500">Online</span>
                   </div>
               </div>
               <button onClick={onLogout} className="text-slate-500 hover:text-red-400 transition-colors">
                   <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                       <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                   </svg>
               </button>
           </div>
       </div>
    </div>
  );
};

export default Sidebar;
