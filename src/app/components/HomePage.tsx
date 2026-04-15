import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { BookCard, Book } from './BookCard';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Search } from 'lucide-react';
import { apiFetch } from '../api';
import { toast } from 'sonner';

interface HomePageProps {
  onViewBookDetails: (book: Book) => void;
}

const CATEGORIES = [
  'Fiction', 'Non-Fiction', 'Science', 'Technology', 'Biography',
  'History', 'Philosophy', 'Self-Help', 'Mystery', 'Romance', 'Fantasy',
  'Story', 'Comic', 'Art', 'Poetry', 'Textbook', 'Other'
];

export const HomePage: React.FC<HomePageProps> = ({ onViewBookDetails }) => {
  const { accessToken, user } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'rent' | 'sell'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  useEffect(() => {
    fetchBooks(true); // Initial load with spinner
    const interval = setInterval(() => fetchBooks(false), 15000); // Poll every 15s in background
    return () => clearInterval(interval);
  }, [accessToken]);

  useEffect(() => { applyFilters(); }, [books, searchQuery, typeFilter, categoryFilter]);

  const fetchBooks = async (showLoading = false) => {
    if (showLoading) setIsLoading(true);
    try {
      const response = await apiFetch('/books/list.php', {}, accessToken);
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Failed to fetch books');
      setBooks(data.books || []);
    } catch (error: any) {
      console.error('Fetch books error:', error);
      if (showLoading) toast.error('Failed to load books. Make sure the PHP server is running.');
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...books];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(b =>
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        b.category.toLowerCase().includes(q)
      );
    }
    if (typeFilter !== 'all') filtered = filtered.filter(b => b.bookType === typeFilter);
    if (categoryFilter !== 'all') filtered = filtered.filter(b => b.category === categoryFilter);
    setFilteredBooks(filtered);
  };

  const clearFilters = () => {
    setTypeFilter('all');
    setCategoryFilter('all');
    setSearchQuery('');
  };

  const hasActiveFilters = typeFilter !== 'all' || categoryFilter !== 'all' || !!searchQuery;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Browse Books</h1>
        <p className="text-gray-600">Discover books available for rent or purchase</p>
      </div>

      {/* Filters */}
      <div className="mb-8 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Search by title, author, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Type Filter */}
          <div className="w-full sm:w-48">
            <Select value={typeFilter} onValueChange={(v: any) => setTypeFilter(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="rent">Rent</SelectItem>
                <SelectItem value="sell">Sell</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Category Filter */}
          <div className="w-full sm:w-48">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {CATEGORIES.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing {filteredBooks.length} of {books.length} books
          </p>
          {hasActiveFilters && (
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      {/* Books Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
          <p className="mt-4 text-gray-600">Loading books...</p>
        </div>
      ) : filteredBooks.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600">No books found</p>
          {hasActiveFilters && (
            <Button variant="outline" className="mt-4" onClick={clearFilters}>
              Clear Filters
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredBooks.map(book => (
            <BookCard
              key={book.id}
              book={book}
              onViewDetails={onViewBookDetails}
              currentUserId={user?.id}
            />
          ))}
        </div>
      )}
    </div>
  );
};
