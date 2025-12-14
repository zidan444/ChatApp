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
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div style={{ marginBottom: "20px" }}>
          <h3 className="modal-title">Edit Group Members</h3>
          <p className="modal-subtitle">
            Add or remove members from this group
          </p>
        </div>

        <div className="form-group">
          <label className="form-label">Current Members ({selectedMembers.length})</label>
          <div className="chip-list" style={{ minHeight: "40px", padding: "8px", background: "rgba(15, 23, 42, 0.3)", borderRadius: "10px", border: "1px solid rgba(148, 163, 184, 0.15)" }}>
            {selectedMembers.length === 0 ? (
              <span style={{ color: "#9ca3af", fontSize: "13px" }}>No members selected</span>
            ) : (
              selectedMembers.map((u) => (
                <span key={u._id} className="chip">
                  <span className="chip-avatar">
                    {u.name?.charAt(0)?.toUpperCase() || "?"}
                  </span>
                  <span className="chip-label">
                    {u.name}
                    {chat.groupAdmin?._id === u._id && (
                      <span style={{ marginLeft: "4px", color: "#60a5fa", fontSize: "10px" }}>Admin</span>
                    )}
                  </span>
                  <button
                    type="button"
                    className="chip-remove"
                    onClick={() => handleRemoveUser(u._id)}
                    style={{ 
                      marginLeft: "4px",
                      padding: "0 4px",
                      fontSize: "16px",
                      lineHeight: "1",
                      transition: "color 0.2s"
                    }}
                    onMouseEnter={(e) => e.target.style.color = "#ef4444"}
                    onMouseLeave={(e) => e.target.style.color = "#9ca3af"}
                  >
                    ×
                  </button>
                </span>
              ))
            )}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Search Users to Add</label>
          <input
            type="text"
            className="group-name-input"
            placeholder="Type to search users..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            style={{ marginTop: "0" }}
          />
        </div>

        {search && (
          <div className="search-results" style={{
            maxHeight: "200px",
            overflowY: "auto",
            marginBottom: "16px",
            borderRadius: "10px",
            border: "1px solid rgba(148, 163, 184, 0.15)",
            background: "rgba(15, 23, 42, 0.3)"
          }}>
            {loading ? (
              <div style={{ padding: "16px", textAlign: "center", color: "#9ca3af", fontSize: "13px" }}>
                Searching...
              </div>
            ) : searchResult.length === 0 ? (
              <div style={{ padding: "16px", textAlign: "center", color: "#9ca3af", fontSize: "13px" }}>
                No users found
              </div>
            ) : (
              searchResult.slice(0, 5).map((user) => {
                const isAlreadyAdded = selectedMembers.find((u) => u._id === user._id);
                return (
                  <div
                    key={user._id}
                    className="user-search-item"
                    onClick={() => !isAlreadyAdded && handleAddUser(user)}
                    style={{
                      padding: "12px 14px",
                      cursor: isAlreadyAdded ? "not-allowed" : "pointer",
                      borderBottom: "1px solid rgba(148, 163, 184, 0.1)",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      transition: "background 0.2s",
                      opacity: isAlreadyAdded ? 0.5 : 1,
                      background: isAlreadyAdded ? "transparent" : "transparent"
                    }}
                    onMouseEnter={(e) => {
                      if (!isAlreadyAdded) {
                        e.currentTarget.style.background = "rgba(37, 99, 235, 0.1)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <div className="chip-avatar" style={{ width: "32px", height: "32px", fontSize: "13px" }}>
                      {user.name?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "14px", color: "#e5e7eb", fontWeight: "500" }}>
                        {user.name}
                      </div>
                      <div style={{ fontSize: "12px", color: "#9ca3af", marginTop: "2px" }}>
                        {user.email}
                      </div>
                    </div>
                    {isAlreadyAdded && (
                      <span style={{ fontSize: "11px", color: "#9ca3af", padding: "2px 8px", borderRadius: "999px", background: "rgba(148, 163, 184, 0.1)" }}>
                        Added
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        <div className="modal-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button 
            type="button" 
            className="btn-primary" 
            onClick={handleSave} 
            disabled={saving || selectedMembers.length < 2}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditGroupMembersModal;
