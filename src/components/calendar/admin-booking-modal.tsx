
"use client";

import { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { UserProfile } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';
import UserAvatar from '@/components/ui/user-avatar';

interface AdminBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedUser: UserProfile) => void;
}

export default function AdminBookingModal({ isOpen, onClose, onConfirm }: AdminBookingModalProps) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (!isOpen) {
        // Reset state when modal is closed
        setSearchTerm('');
        setSelectedUser(null);
        return;
    };

    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        const usersRef = collection(db, "users");
        const q = query(usersRef);
        const querySnapshot = await getDocs(q);
        const fetchedUsers = querySnapshot.docs.map(doc => doc.data() as UserProfile);
        setUsers(fetchedUsers);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUsers();
  }, [isOpen]);

  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users;
    return users.filter(user => {
      if (!user || !user.name || !user.email) return false;
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      return (
        user.name.toLowerCase().includes(lowerCaseSearchTerm) ||
        user.email.toLowerCase().includes(lowerCaseSearchTerm)
      );
    });
  }, [searchTerm, users]);

  const handleConfirm = () => {
    if (selectedUser) {
      onConfirm(selectedUser);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Reservar para un Cliente</DialogTitle>
          <DialogDescription>
            Busca y selecciona un cliente para crear una reserva en su nombre.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Input 
            placeholder="Buscar por nombre o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <ScrollArea className="h-72 w-full rounded-md border">
            <div className="p-4">
              {isLoading ? (
                <div className="flex justify-center items-center h-full">
                    <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <div className="space-y-2">
                    {filteredUsers.map(user => (
                        <button
                            key={user.uid}
                            onClick={() => setSelectedUser(user)}
                            className={`w-full text-left p-2 rounded-md flex items-center gap-3 transition-colors ${selectedUser?.uid === user.uid ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}
                        >
                            <UserAvatar user={user} className="h-9 w-9" />
                            <div>
                                <p className="font-semibold">{user.name}</p>
                                <p className={`text-sm ${selectedUser?.uid === user.uid ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>{user.email}</p>
                            </div>
                        </button>
                    ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={!selectedUser}>
            Confirmar Reserva
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
