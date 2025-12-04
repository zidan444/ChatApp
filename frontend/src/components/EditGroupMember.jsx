// /frontend/src/components/EditGroupMembersModal.jsx (Conceptual Code)

import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { updateGroupMembers } from '../store/chatSlice.js'; // Adjust path
import axios from 'axios';



const EditGroupMembersModal = ({ isOpen, onClose, chat }) => {
    const dispatch = useDispatch();
    
    // State 
    const [selectedMembers, setSelectedMembers] = useState([]); 
    const [search, setSearch] = useState('');
    const [searchResult, setSearchResult] = useState([]);
    const [loading, setLoading] = useState(false);

    // Initialize/Reset selected members when modal opens
    useEffect(() => {
        if (isOpen && chat?.participants) {
            // Deep copy participants to avoid mutation
            setSelectedMembers([...chat.participants]); 
        }
    }, [isOpen, chat]);

    // Handles user search API call
    const handleSearch = async (query) => {
        setSearch(query);
        if (!query) { setSearchResult([]); return; }
        
        setLoading(true);
        try {
            const token = localStorage.getItem('token'); 
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const { data } = await axios.get(`/api/users?search=${query}`, config);
            setSearchResult(data);
        } catch (error) {
            console.error("User search failed:", error);
        } finally {
            setLoading(false);
        }
    };

    // Adds a user from search results to the selected list
    const handleAddUser = (userToAdd) => {
        if (selectedMembers.find(u => u._id === userToAdd._id)) {
            return alert("User is already in the selected list.");
        }
        setSelectedMembers([...selectedMembers, userToAdd]);
        setSearch(''); // Clear search after adding
        setSearchResult([]);
    };

    // Removes a user from the selected list
    const handleRemoveUser = (userId) => {
        setSelectedMembers(selectedMembers.filter(u => u._id !== userId));
    };

    // 🚀 Handles dispatching the Redux Thunk
    const handleSave = async () => {
        if (selectedMembers.length < 2) {
            return alert("Group must have at least 2 members.");
        }

        try {
            const newMemberIds = selectedMembers.map(u => u._id); 
            
            // Dispatch the thunk which makes the PUT request
            await dispatch(updateGroupMembers({
                chatId: chat._id,
                users: newMemberIds,
            }));
            
            onClose(); 
        } catch (error) {
            console.error("Failed to update group:", error);
        }
    };
    
    // NOTE: Replace <Modal> with your actual Modal component
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Edit Group Members">
            <div className="members-selected-chips">
                {/* Display selected members */}
                {selectedMembers.map(u => (
                    // Replace <UserBadge> with your component to show user + remove button
                    <UserBadge 
                        key={u._id} 
                        user={u} 
                        handleFunction={() => handleRemoveUser(u._id)}
                        adminId={chat.groupAdmin._id}
                    />
                ))}
            </div>

            <input
                type="text"
                placeholder="Search users to add..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
            />
            
            {/* Display search results */}
            {loading ? (
                <div>Loading...</div>
            ) : (
                searchResult.slice(0, 4).map(user => (
                    // Replace <UserListItem> with your component to show user + add button
                    <UserListItem 
                        key={user._id} 
                        user={user} 
                        handleFunction={() => handleAddUser(user)}
                    />
                ))
            )}

            <button onClick={handleSave} className="save-button">
                Save Changes
            </button>
        </Modal>
    );
};

export default EditGroupMembersModal;