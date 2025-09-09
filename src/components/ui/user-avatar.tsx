
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { generateColorFromUID, getInitials } from "@/lib/utils";
import type { UserProfile } from "@/types";

interface UserAvatarProps {
  user: Partial<UserProfile> | { name: string; uid: string; photoURL?: string | null };
  className?: string;
}

export default function UserAvatar({ user, className }: UserAvatarProps) {
  if (!user || !user.name || !user.uid) {
    return null;
  }
  
  const userName = user.name;
  const userPhoto = user.photoURL;
  const userUID = user.uid;

  return (
    <Avatar className={className}>
      {userPhoto && <AvatarImage src={userPhoto} alt={userName} />}
      <AvatarFallback
        className="text-white font-bold"
        style={{ backgroundColor: generateColorFromUID(userUID) }}
      >
        {getInitials(userName)}
      </AvatarFallback>
    </Avatar>
  );
}
