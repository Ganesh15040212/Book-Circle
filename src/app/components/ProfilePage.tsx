import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { Book, BookCard } from './BookCard';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { User, Mail, Phone, BookOpen, Edit3, Check, X } from 'lucide-react';
import { apiFetch } from '../api';
import { toast } from 'sonner';

interface ProfileStats {
    total: number;
    available: number;
    requested: number;
}

interface ProfilePageProps {
    onViewBookDetails: (book: Book) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ onViewBookDetails }) => {
    const { user, accessToken } = useAuth();
    const [myBooks, setMyBooks] = useState<Book[]>([]);
    const [stats, setStats] = useState<ProfileStats>({ total: 0, available: 0, requested: 0 });
    const [isLoading, setIsLoading] = useState(true);

    // Editing state
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(user?.name || '');
    const [editPhone, setEditPhone] = useState(user?.phone || '');
    const [isSaving, setIsSaving] = useState(false);

    const { user: authUser } = useAuth();

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        setIsLoading(true);
        try {
            const response = await apiFetch('/profile/index.php', {}, accessToken);
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to load profile');
            setMyBooks(data.books || []);
            setStats(data.stats || { total: 0, available: 0, requested: 0 });
        } catch (error: any) {
            toast.error('Failed to load profile');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveProfile = async () => {
        if (!editName.trim()) {
            toast.error('Name cannot be empty');
            return;
        }
        setIsSaving(true);
        try {
            const response = await apiFetch('/profile/index.php', {
                method: 'PUT',
                body: JSON.stringify({ name: editName, phone: editPhone }),
            }, accessToken);

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to update profile');

            // Update localStorage user
            const updated = { ...authUser, name: data.user.name, phone: data.user.phone };
            localStorage.setItem('user', JSON.stringify(updated));
            toast.success('Profile updated! Please refresh if name doesn\'t update in navbar.');
            setIsEditing(false);
        } catch (error: any) {
            toast.error(error.message || 'Update failed');
        } finally {
            setIsSaving(false);
        }
    };

    const initials = user?.name
        ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
        : 'U';

    if (isLoading) {
        return (
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
                    <p className="mt-4 text-gray-600">Loading profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">My Profile</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Profile Card */}
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <CardContent className="pt-6">
                            {/* Avatar */}
                            <div className="flex flex-col items-center mb-6">
                                <div className="w-20 h-20 rounded-full bg-indigo-600 flex items-center justify-center text-white text-2xl font-bold mb-3">
                                    {initials}
                                </div>
                                {!isEditing ? (
                                    <>
                                        <h2 className="text-xl font-bold text-gray-900">{user?.name}</h2>
                                        <p className="text-sm text-gray-500">{user?.isAdmin ? 'Administrator' : 'Member'}</p>
                                    </>
                                ) : null}
                            </div>

                            {/* Info / Edit Form */}
                            {isEditing ? (
                                <div className="space-y-4">
                                    <div className="space-y-1">
                                        <Label htmlFor="edit-name">Name</Label>
                                        <Input id="edit-name" value={editName}
                                            onChange={e => setEditName(e.target.value)} />
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="edit-phone">Phone</Label>
                                        <Input id="edit-phone" value={editPhone}
                                            onChange={e => setEditPhone(e.target.value)} />
                                    </div>
                                    <div className="flex gap-2">
                                        <Button size="sm" className="flex-1" onClick={handleSaveProfile} disabled={isSaving}>
                                            <Check className="w-4 h-4 mr-1" />
                                            {isSaving ? 'Saving...' : 'Save'}
                                        </Button>
                                        <Button size="sm" variant="outline" className="flex-1" onClick={() => setIsEditing(false)}>
                                            <X className="w-4 h-4 mr-1" /> Cancel
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 text-sm">
                                        <Mail className="w-4 h-4 text-gray-500 shrink-0" />
                                        <span className="text-gray-700 break-all">{user?.email}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm">
                                        <Phone className="w-4 h-4 text-gray-500 shrink-0" />
                                        <span className="text-gray-700">{user?.phone}</span>
                                    </div>
                                    <Button variant="outline" size="sm" className="w-full mt-2"
                                        onClick={() => { setEditName(user?.name || ''); setEditPhone(user?.phone || ''); setIsEditing(true); }}>
                                        <Edit3 className="w-4 h-4 mr-2" /> Edit Profile
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Stats */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">My Book Stats</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-600 flex items-center gap-2">
                                    <BookOpen className="w-4 h-4" /> Total Listed
                                </span>
                                <Badge variant="secondary">{stats.total}</Badge>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-600">Available</span>
                                <Badge className="bg-green-100 text-green-800">{stats.available}</Badge>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-600">Requested</span>
                                <Badge className="bg-yellow-100 text-yellow-800">{stats.requested}</Badge>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-600">Unavailable</span>
                                <Badge className="bg-red-100 text-red-800">
                                    {stats.total - stats.available - stats.requested}
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* My Books */}
                <div className="lg:col-span-2">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">
                        My Listed Books ({myBooks.length})
                    </h2>

                    {myBooks.length === 0 ? (
                        <Card>
                            <CardContent className="py-12 text-center">
                                <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-600">You haven't listed any books yet.</p>
                                <p className="text-sm text-gray-500 mt-2">
                                    Click "Add Book" in the navbar to list your first book!
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            {myBooks.map(book => (
                                <BookCard key={book.id} book={book} onViewDetails={onViewBookDetails} showOwner={false} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
