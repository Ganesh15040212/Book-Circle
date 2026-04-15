import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Shield, Users, BookOpen, Trash2, Ban, CheckCircle, ClipboardList, Clock, TrendingUp } from 'lucide-react';
import { apiFetch } from '../api';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';

interface User {
  id: string; name: string; email: string; phone: string;
  isAdmin: boolean; blocked: boolean; createdAt: string;
}

interface Book {
  id: string; title: string; author: string; category: string;
  bookType: string; price: number; status: string;
  ownerId: string; ownerName: string; createdAt: string;
}

interface Request {
  id: string; status: string; createdAt: string;
  bookTitle: string; bookAuthor: string;
  requesterName: string; requesterEmail: string;
  ownerName: string; ownerEmail: string;
}

interface Stats {
  totalUsers: number; totalBooks: number;
  totalRequests: number; pending: number;
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

export const AdminPage: React.FC = () => {
  const { user, accessToken } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [stats, setStats] = useState<Stats>({ totalUsers: 0, totalBooks: 0, totalRequests: 0, pending: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [deleteBookId, setDeleteBookId] = useState<string | null>(null);

  useEffect(() => {
    if (user?.isAdmin) {
      fetchAdminData(true); // Initial load with spinner
      const interval = setInterval(() => fetchAdminData(false), 20000); // Admin polls every 20s
      return () => clearInterval(interval);
    }
  }, [user, accessToken]);

  const fetchAdminData = async (showLoading = false) => {
    if (showLoading) setIsLoading(true);
    try {
      const [uRes, bRes, rRes] = await Promise.all([
        apiFetch('/admin/users.php', {}, accessToken),
        apiFetch('/admin/books.php', {}, accessToken),
        apiFetch('/admin/requests.php', {}, accessToken),
      ]);

      const [uData, bData, rData] = await Promise.all([uRes.json(), bRes.json(), rRes.json()]);

      if (uRes.ok) {
        setUsers(uData.users || []);
        if (uData.stats) setStats(uData.stats);
      }
      if (bRes.ok) setBooks(bData.books || []);
      if (rRes.ok) setRequests(rData.requests || []);
    } catch (error: any) {
      console.error('Fetch admin data error:', error);
      if (showLoading) toast.error('Failed to load admin data');
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  const handleDeleteBook = async (bookId: string) => {
    try {
      const res = await apiFetch(`/admin/delete_book.php?id=${bookId}`, { method: 'DELETE' }, accessToken);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete book');
      toast.success('Book deleted successfully');
      setDeleteBookId(null);
      fetchAdminData();
    } catch (err: any) { toast.error(err.message || 'Failed to delete book'); }
  };

  const handleBlockUser = async (userId: string, blocked: boolean) => {
    try {
      const res = await apiFetch(`/admin/block_user.php?id=${userId}`, {
        method: 'PUT',
        body: JSON.stringify({ blocked }),
      }, accessToken);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update user');
      toast.success(`User ${blocked ? 'blocked' : 'unblocked'} successfully`);
      fetchAdminData();
    } catch (err: any) { toast.error(err.message || 'Failed to update user'); }
  };

  if (!user?.isAdmin) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <Shield className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600">You don't have permission to access this page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
          <p className="mt-4 text-gray-600">Loading admin data…</p>
        </div>
      </div>
    );
  }

  const regularUsers = users.filter(u => !u.isAdmin);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-indigo-600 p-2 rounded-lg">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-sm text-gray-500">Manage all BookCircle users, books and requests</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-lg"><Users className="w-5 h-5 text-blue-600" /></div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
                <p className="text-xs text-gray-500">Total Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-2 rounded-lg"><BookOpen className="w-5 h-5 text-green-600" /></div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalBooks}</p>
                <p className="text-xs text-gray-500">Total Books</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 p-2 rounded-lg"><TrendingUp className="w-5 h-5 text-purple-600" /></div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalRequests}</p>
                <p className="text-xs text-gray-500">Total Requests</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-yellow-100 p-2 rounded-lg"><Clock className="w-5 h-5 text-yellow-600" /></div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
                <p className="text-xs text-gray-500">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full max-w-lg grid-cols-3">
          <TabsTrigger value="users"><Users className="w-4 h-4 mr-1 inline" />Users ({regularUsers.length})</TabsTrigger>
          <TabsTrigger value="books"><BookOpen className="w-4 h-4 mr-1 inline" />Books ({books.length})</TabsTrigger>
          <TabsTrigger value="requests"><ClipboardList className="w-4 h-4 mr-1 inline" />Requests ({requests.length})</TabsTrigger>
        </TabsList>

        {/* ── USERS TAB ─────────────────────────────── */}
        <TabsContent value="users" className="mt-6">
          {regularUsers.length === 0 ? (
            <Card><CardContent className="py-10 text-center text-gray-500">No users registered yet.</CardContent></Card>
          ) : (
            <div className="space-y-3">
              {regularUsers.map((u) => (
                <Card key={u.id}>
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900">{u.name}</h3>
                          {u.blocked && (
                            <Badge className="bg-red-100 text-red-800 text-xs">
                              <Ban className="w-3 h-3 mr-0.5" />Blocked
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{u.email}</p>
                        <p className="text-sm text-gray-600">{u.phone}</p>
                        <p className="text-xs text-gray-400 mt-1">Joined: {new Date(u.createdAt).toLocaleDateString('en-IN')}</p>
                      </div>
                      <Button
                        variant={u.blocked ? 'outline' : 'destructive'}
                        size="sm"
                        onClick={() => handleBlockUser(u.id, !u.blocked)}
                      >
                        {u.blocked ? (
                          <><CheckCircle className="w-4 h-4 mr-1" />Unblock</>
                        ) : (
                          <><Ban className="w-4 h-4 mr-1" />Block</>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── BOOKS TAB ─────────────────────────────── */}
        <TabsContent value="books" className="mt-6">
          {books.length === 0 ? (
            <Card><CardContent className="py-10 text-center text-gray-500">No books listed yet.</CardContent></Card>
          ) : (
            <div className="space-y-3">
              {books.map((book) => (
                <Card key={book.id}>
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-semibold text-gray-900">{book.title}</h3>
                          <Badge variant={book.bookType === 'rent' ? 'default' : 'secondary'} className="text-xs">
                            {book.bookType === 'rent' ? 'Rent' : 'Sell'}
                          </Badge>
                          <Badge className={`text-xs ${book.status === 'available' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {book.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">by {book.author} · {book.category}</p>
                        <p className="text-sm text-gray-600">Owner: <span className="font-medium">{book.ownerName}</span></p>
                        <p className="text-sm font-semibold text-gray-900">₹{book.price.toFixed(2)}</p>
                        <p className="text-xs text-gray-400 mt-1">Listed: {new Date(book.createdAt).toLocaleDateString('en-IN')}</p>
                      </div>
                      <Button variant="destructive" size="sm" onClick={() => setDeleteBookId(book.id)}>
                        <Trash2 className="w-4 h-4 mr-1" />Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── REQUESTS TAB ─────────────────────────── */}
        <TabsContent value="requests" className="mt-6">
          {requests.length === 0 ? (
            <Card><CardContent className="py-10 text-center text-gray-500">No requests yet.</CardContent></Card>
          ) : (
            <div className="space-y-3">
              {requests.map((req) => (
                <Card key={req.id}>
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900">{req.bookTitle}</h3>
                          <Badge className={`text-xs ${STATUS_COLORS[req.status] || 'bg-gray-100 text-gray-800'}`}>
                            {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Requester:</span> {req.requesterName} ({req.requesterEmail})
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Book Owner:</span> {req.ownerName} ({req.ownerEmail})
                        </p>
                        <p className="text-xs text-gray-400 mt-1">Requested: {new Date(req.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Delete Book Dialog */}
      <AlertDialog open={deleteBookId !== null} onOpenChange={() => setDeleteBookId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Book</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete this book? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteBookId && handleDeleteBook(deleteBookId)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
