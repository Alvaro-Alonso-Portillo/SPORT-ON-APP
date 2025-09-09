
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Attendee } from "@/types";
import UserAvatar from "../ui/user-avatar";

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
          <UserAvatar user={attendee} className="h-48 w-48 text-6xl" />
        </div>
      </DialogContent>
    </Dialog>
  );
}
