// src/components/EditGroupMembersModal.jsx
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { updateGroupMembers } from "../store/chatSlice";
import { API_BASE_URL } from "../config";

const EditGroupMembersModal = ({ isOpen, onClose, chat }) => {
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.token);

  const [selectedMembers, setSelectedMembers] = useState([]);
  const [search, setSearch] = useState("");
  const [searchResult, setSearchResult] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && chat?.participants) {
      setSelectedMembers([...chat.participants]);
      setSearch("");
      setSearchResult([]);
    }
  }, [isOpen, chat]);

  if (!isOpen) return null;

  const handleSearch = async (query) => {
    setSearch(query);
    if (!query.trim()) {
      setSearchResult([]);
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.get(
        `${API_BASE_URL}/api/users?q=${encodeURIComponent(query)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setSearchResult(data);
    } catch (error) {
      console.error("User search failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = (userToAdd) => {
    if (selectedMembers.find((u) => u._id === userToAdd._id)) return;
    setSelectedMembers((prev) => [...prev, userToAdd]);
    setSearch("");
    setSearchResult([]);
  };

  const handleRemoveUser = (userId) => {
    // optional: prevent removing yourself here, or let backend handle it
    setSelectedMembers((prev) => prev.filter((u) => u._id !== userId));
  };

  const handleSave = async () => {
    if (selectedMembers.length < 2) {
      alert("Group must have at least 2 members.");
      return;
    }

    setSaving(true);
    try {
      const ids = selectedMembers.map((u) => u._id);
      const result = await dispatch(
        updateGroupMembers({ chatId: chat._id, users: ids })
      );
      if (updateGroupMembers.fulfilled.match(result)) {
        onClose();
      } else {
        alert("Failed to update group members");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <h3>Edit group members</h3>

        <div className="selected-members">
          {selectedMembers.map((u) => (
            <span key={u._id} className="group-chip">
              {u.name}
              {chat.groupAdmin?._id === u._id && " (Admin)"}
              <button
                type="button"
                onClick={() => handleRemoveUser(u._id)}
                style={{ marginLeft: 4 }}
              >
                ×
              </button>
            </span>
          ))}
        </div>

        <input
          type="text"
          placeholder="Search users to add..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
        />

        <div className="search-results">
          {loading ? (
            <p>Searching...</p>
          ) : (
            searchResult.slice(0, 5).map((user) => (
              <div
                key={user._id}
                className="user-search-item"
                onClick={() => handleAddUser(user)}
              >
                {user.name} <span className="muted-text">({user.email})</span>
              </div>
            ))
          )}
        </div>

        <div className="modal-actions">
          <button type="button" onClick={onClose}>
            Cancel
          </button>
          <button type="button" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditGroupMembersModal;
