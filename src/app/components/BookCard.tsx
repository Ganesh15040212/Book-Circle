import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { BookOpen, User, IndianRupee } from 'lucide-react';

export interface Book {
  id: string;
  title: string;
  author: string;
  category: string;
  subtitle?: string;
  language?: string;
  pages?: number;
  edition?: string;
  bookType: 'rent' | 'sell';
  price: number;
  image?: string;
  images?: string[];
  damage?: string;
  description: string;
  status: 'available' | 'requested' | 'unavailable';
  ownerId: string;
  ownerName?: string;
  ownerPhone?: string;
  createdAt: string;
}

interface BookCardProps {
  book: Book;
  onViewDetails: (book: Book) => void;
  showOwner?: boolean;
  currentUserId?: string;
}

export const BookCard: React.FC<BookCardProps> = ({
  book,
  onViewDetails,
  showOwner = true,
  currentUserId,
}) => {
  const isOwn = currentUserId && book.ownerId === currentUserId;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'requested': return 'bg-yellow-100 text-yellow-800';
      case 'unavailable': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className={`h-full flex flex-col hover:shadow-lg transition-shadow ${isOwn ? 'ring-2 ring-indigo-200' : ''}`}>
      {/* Book Image */}
      {book.image ? (
        <div className="w-full h-40 overflow-hidden rounded-t-lg bg-gray-100 relative">
          <img
            src={book.image}
            alt={book.title}
            className="w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          {isOwn && (
            <span className="absolute top-2 left-2 bg-indigo-600 text-white text-xs px-2 py-0.5 rounded-full font-medium">
              Your Book
            </span>
          )}
        </div>
      ) : (
        <div className="w-full h-40 rounded-t-lg bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center relative">
          <BookOpen className="w-12 h-12 text-indigo-300" />
          {isOwn && (
            <span className="absolute top-2 left-2 bg-indigo-600 text-white text-xs px-2 py-0.5 rounded-full font-medium">
              Your Book
            </span>
          )}
        </div>
      )}

      <CardHeader className="pb-2">
        <div className="flex justify-between items-start gap-2">
          <CardTitle className="text-lg line-clamp-2">{book.title}</CardTitle>
          <Badge variant={book.bookType === 'rent' ? 'default' : 'secondary'}>
            {book.bookType === 'rent' ? 'Rent' : 'Sell'}
          </Badge>
        </div>
        <p className="text-sm text-gray-600">by {book.author}</p>
      </CardHeader>

      <CardContent className="flex-1">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <BookOpen className="w-4 h-4 text-gray-500" />
            <span className="text-gray-700">{book.category}</span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <IndianRupee className="w-4 h-4 text-gray-500" />
            <span className="font-semibold text-gray-900">₹{book.price.toFixed(2)}{book.bookType === 'rent' ? ' / day' : ''}</span>
          </div>

          {showOwner && book.ownerName && !isOwn && (
            <div className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4 text-gray-500" />
              <span className="text-gray-700">{book.ownerName}</span>
            </div>
          )}

          <p className="text-sm text-gray-600 line-clamp-2 mt-2">
            {book.description || 'No description available'}
          </p>
        </div>
      </CardContent>

      <CardFooter className="flex justify-between items-center">
        <Badge className={getStatusColor(book.status)}>
          {book.status.charAt(0).toUpperCase() + book.status.slice(1)}
        </Badge>
        <Button size="sm" onClick={() => onViewDetails(book)}>
          View Details
        </Button>
      </CardFooter>
    </Card>
  );
};
