import { useState, useEffect } from "react";
import { User } from "@/types";
import { useTaskData } from "./useTaskData";

export const useUsers = (taskId: string) => {
  const { users, isUsersLoading } = useTaskData(taskId, undefined);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState("");


  // Update filtered users when users data or search query changes
  useEffect(() => {
    if (!users) {
      setFilteredUsers([]);
      return;
    }

    const filtered = users.filter((user: any) => {
      const searchTerms = searchQuery.toLowerCase().trim().split(" ");
      const fullName = user.fullName.toLowerCase();
      const email = user.email.toLowerCase();

      return searchTerms.every(
        (term) => fullName.includes(term) || email.includes(term)
      );
    });

    setFilteredUsers(filtered);
  }, [users, searchQuery]);

  const handleSelectUser = (user: User) => {
    setSelectedUsers((prev) => {
      const isAlreadySelected = prev.some((s) => s.submissionId === user.submissionId);
      if (isAlreadySelected) {
        return prev.filter((s) => s.submissionId !== user.submissionId);
      } else {
        return [...prev, user];
      }
    });
  };

  const handleSelectAll = () => {
    if (
      selectedUsers.length === filteredUsers.length &&
      filteredUsers.length > 0
    ) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers([...filteredUsers]);
    }
  };

  const handleViewUser = (user: User) => {
    setCurrentUser(user);
  };

  return {
    filteredUsers,
    selectedUsers,
    currentUser,
    searchQuery,
    isLoading: isUsersLoading,
    setSearchQuery,
    handleSelectUser,
    handleSelectAll,
    handleViewUser,
  };
};
