import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import type { FriendProfile, FriendCounts } from "@regen/types";

interface UseFriendsReturn {
  friends: FriendProfile[];
  followers: FriendProfile[];
  counts: FriendCounts;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  follow: (userId: string) => Promise<void>;
  unfollow: (userId: string) => Promise<void>;
  search: (query: string) => Promise<FriendProfile[]>;
}

export function useFriends(): UseFriendsReturn {
  const { api } = useAuth();
  const [friends, setFriends] = useState<FriendProfile[]>([]);
  const [followers, setFollowers] = useState<FriendProfile[]>([]);
  const [counts, setCounts] = useState<FriendCounts>({ following: 0, followers: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFriends = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const [friendsData, followersData] = await Promise.all([
        api.get<{ friends: FriendProfile[]; counts: FriendCounts }>("/client/friends?type=following"),
        api.get<FriendProfile[]>("/client/friends?type=followers"),
      ]);
      
      setFriends(friendsData.friends);
      setCounts(friendsData.counts);
      setFollowers(followersData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar amigos");
    } finally {
      setIsLoading(false);
    }
  }, [api]);

  useEffect(() => {
    const t = setTimeout(() => {
      void fetchFriends();
    }, 0);
    return () => clearTimeout(t);
  }, [fetchFriends]);

  const follow = useCallback(async (userId: string) => {
    await api.post("/client/friends", { userId });
    await fetchFriends();
  }, [api, fetchFriends]);

  const unfollow = useCallback(async (userId: string) => {
    await api.del(`/client/friends?userId=${userId}`);
    await fetchFriends();
  }, [api, fetchFriends]);

  const search = useCallback(async (query: string) => {
    if (!query.trim()) return [];
    return api.get<FriendProfile[]>(`/client/friends?search=${encodeURIComponent(query)}`);
  }, [api]);

  return {
    friends,
    followers,
    counts,
    isLoading,
    error,
    refresh: fetchFriends,
    follow,
    unfollow,
    search,
  };
}
