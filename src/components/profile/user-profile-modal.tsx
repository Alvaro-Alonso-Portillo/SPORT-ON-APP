
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { generateColorFromUID, getInitials } from "@/lib/utils";
import type { Attendee } from "@/types";

interface UserProfileModalProps {
  attendee: Attendee | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function UserProfileModal({ attendee, isOpen, onClose }: UserProfileModalProps) {
  if (!attendee) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold">{attendee.name}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center p-4">
          <Avatar className="h-48 w-48">
            <AvatarImage src={attendee.photoURL} alt={attendee.name} className="object-cover" />
            <AvatarFallback
              className="text-white font-bold text-6xl"
              style={{ backgroundColor: generateColorFromUID(attendee.uid) }}
            >
              {getInitials(attendee.name)}
            </AvatarFallback>
          </Avatar>
        </div>
      </DialogContent>
    </Dialog>
  );
}
