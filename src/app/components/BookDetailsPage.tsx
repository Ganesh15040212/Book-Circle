import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { Book } from './BookCard';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';
import {
  ArrowLeft, BookOpen, User, Phone, IndianRupee, Tag,
  Calendar, Send, AlertCircle, Globe, FileText, Layers,
  ChevronLeft, ChevronRight, Maximize2
} from 'lucide-react';
import { apiFetch } from '../api';
import { toast } from 'sonner';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';

interface BookDetailsPageProps {
  book: Book;
  onBack: () => void;
}

export const BookDetailsPage: React.FC<BookDetailsPageProps> = ({ book: initialBook, onBack }) => {
  const { user, accessToken } = useAuth();
  const [book, setBook] = useState<Book>(initialBook);
  const [isRequesting, setIsRequesting] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [phoneRevealed, setPhoneRevealed] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [totalPrice, setTotalPrice] = useState<number>(0);

  const calculateTotalPrice = useCallback((start: string, end: string) => {
    if (!start || !end) return 0;
    const s = new Date(start);
    const e = new Date(end);
    const diffTime = e.getTime() - s.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // Include both days
    return diffDays > 0 ? diffDays * book.price : 0;
  }, [book.price]);

  useEffect(() => {
    if (book.bookType === 'rent') {
      setTotalPrice(calculateTotalPrice(startDate, endDate));
    }
  }, [startDate, endDate, book.bookType, calculateTotalPrice]);

  useEffect(() => {
    fetchBookDetails();
  }, [initialBook.id]);

  const fetchBookDetails = async () => {
    setIsLoadingDetails(true);
    try {
      const response = await apiFetch(`/books/detail.php?id=${initialBook.id}`, {}, accessToken);
      const data = await response.json();
      if (response.ok && data.book) {
        setBook(data.book);
      }
    } catch (error) {
      console.error('Failed to fetch book details:', error);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    duration: 30,
  }, [
    Autoplay({ delay: 5000, stopOnInteraction: false, stopOnMouseEnter: true })
  ]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
  }, [emblaApi, onSelect]);

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);
  const scrollTo = useCallback((index: number) => emblaApi && emblaApi.scrollTo(index), [emblaApi]);

  const images = book.images && book.images.length > 0 ? book.images : (book.image ? [book.image] : []);

  const handleSendRequest = async () => {
    if (!accessToken) {
      toast.error('Please login to send a request');
      return;
    }
    setIsRequesting(true);
    try {
      const response = await apiFetch('/requests/index.php', {
        method: 'POST',
        body: JSON.stringify({
          bookId: book.id,
          startDate: book.bookType === 'rent' ? startDate : undefined,
          endDate: book.bookType === 'rent' ? endDate : undefined,
          totalPrice: book.bookType === 'rent' ? totalPrice : book.price,
        }),
      }, accessToken);

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to send request');

      toast.success('Request sent successfully!');
      onBack();
    } catch (error: any) {
      toast.error(error.message || 'Failed to send request');
    } finally {
      setIsRequesting(false);
    }
  };

  const isOwnBook = user?.id === book.ownerId;
  const canRequest = !isOwnBook && book.status === 'available';

  const statusColor =
    book.status === 'available' ? 'bg-green-50 text-green-700 border-green-200' :
      book.status === 'requested' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
        'bg-red-50 text-red-700 border-red-200';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <Button variant="ghost" onClick={onBack} className="mb-4 hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Library
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Image Slider */}
        <div className="lg:col-span-5 space-y-4">
          <div className="relative group rounded-2xl overflow-hidden bg-gray-100 shadow-xl aspect-[3/4] border border-gray-200">
            {images.length > 0 ? (
              <>
                <div className="overflow-hidden h-full" ref={emblaRef}>
                  <div className="flex h-full">
                    {images.map((img, index) => (
                      <div className="flex-[0_0_100%] min-w-0 h-full relative" key={index}>
                        <img
                          src={img}
                          alt={`${book.title} - ${index + 1}`}
                          className="w-full h-full object-cover select-none"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                      </div>
                    ))}
                  </div>
                </div>

                {images.length > 1 && (
                  <>
                    <button
                      onClick={scrollPrev}
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all border border-gray-100 z-10 hover:scale-110 active:scale-95"
                    >
                      <ChevronLeft className="w-6 h-6 text-indigo-600" />
                    </button>
                    <button
                      onClick={scrollNext}
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all border border-gray-100 z-10 hover:scale-110 active:scale-95"
                    >
                      <ChevronRight className="w-6 h-6 text-indigo-600" />
                    </button>

                    {/* Dots */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-black/30 backdrop-blur-md px-3 py-2 rounded-full z-10">
                      {images.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => scrollTo(i)}
                          className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${i === selectedIndex
                            ? 'bg-white scale-125 shadow-[0_0_8px_rgba(255,255,255,0.8)]'
                            : 'bg-white/40 scale-100 hover:bg-white/60'
                            }`}
                        />
                      ))}
                    </div>
                  </>
                )}

                {/* Image Counter Badge */}
                <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-semibold z-10 border border-white/10 shadow-lg">
                  {selectedIndex + 1} / {images.length}
                </div>
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-indigo-50 border-2 border-dashed border-indigo-200">
                <BookOpen className="w-20 h-20 text-indigo-200 mb-2" />
                <p className="text-indigo-400 font-medium tracking-tight">No preview available</p>
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto py-2 no-scrollbar px-1 scroll-smooth">
              {images.map((img, index) => (
                <button
                  key={index}
                  onClick={() => scrollTo(index)}
                  className={`relative w-20 h-24 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all duration-300 group ${index === selectedIndex
                    ? 'border-indigo-600 ring-4 ring-indigo-50 scale-105 z-10 shadow-md'
                    : 'border-transparent opacity-70 hover:opacity-100 hover:border-gray-300 hover:scale-105'
                    }`}
                >
                  <img src={img} alt={`Thumb ${index + 1}`} className="w-full h-full object-cover" />
                  {index === selectedIndex && (
                    <div className="absolute inset-0 bg-indigo-600/10" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Details */}
        <div className="lg:col-span-7 space-y-6">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2 items-center">
              <Badge variant={book.bookType === 'rent' ? 'default' : 'secondary'} className="px-3 py-1 text-sm font-semibold uppercase tracking-wider">
                {book.bookType === 'rent' ? 'For Rent' : 'For Sale'}
              </Badge>
              <Badge variant="outline" className={`${statusColor} px-3 py-1 text-sm font-semibold border capitalize`}>
                {book.status}
              </Badge>
            </div>

            <h1 className="text-4xl font-extrabold text-gray-900 leading-tight">{book.title}</h1>
            {book.subtitle && <p className="text-xl text-gray-500 italic font-medium">"{book.subtitle}"</p>}
            <p className="text-2xl text-indigo-600 font-bold border-b-2 border-indigo-100 pb-2 inline-block">
              by <span className="text-gray-900">{book.author}</span>
            </p>

            <div className="flex items-center gap-3 pt-2">
              <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-200">
                <IndianRupee className="w-8 h-8 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                  {book.bookType === 'rent' ? 'Price per Day' : 'Pricing'}
                </span>
                <span className="text-4xl font-black text-gray-900">
                  ₹{book.price.toFixed(2)}{book.bookType === 'rent' ? ' / day' : ''}
                </span>
              </div>
            </div>

            {book.bookType === 'rent' && (
              <div className="bg-indigo-50 p-6 rounded-2xl border-2 border-indigo-100 space-y-4">
                <h3 className="text-indigo-900 font-bold flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Select Rental Dates
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-indigo-400 uppercase">Start Date</label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 rounded-lg border border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={startDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-indigo-400 uppercase">End Date</label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 rounded-lg border border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={endDate}
                      min={startDate || new Date().toISOString().split('T')[0]}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>
                {totalPrice > 0 && (
                  <div className="pt-2 border-t border-indigo-100 flex justify-between items-center">
                    <span className="text-indigo-900 font-medium">Total Rent Amount:</span>
                    <span className="text-2xl font-black text-indigo-600">₹{totalPrice.toFixed(2)}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <Card className="border-none bg-gray-50 shadow-sm rounded-2xl overflow-hidden">
            <CardContent className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 uppercase tracking-widest text-xs flex items-center gap-2">
                <div className="w-1.5 h-6 bg-indigo-600 rounded-full" />
                Book Specifications
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-gray-400 uppercase">Category</p>
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-indigo-500" />
                    <p className="font-bold text-gray-800">{book.category}</p>
                  </div>
                </div>
                {book.language && (
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-gray-400 uppercase">Language</p>
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-indigo-500" />
                      <p className="font-bold text-gray-800">{book.language}</p>
                    </div>
                  </div>
                )}
                {book.pages && (
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-gray-400 uppercase">Pages</p>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-indigo-500" />
                      <p className="font-bold text-gray-800">{book.pages}</p>
                    </div>
                  </div>
                )}
                {book.edition && (
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-gray-400 uppercase">Edition</p>
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-indigo-500" />
                      <p className="font-bold text-gray-800">{book.edition}</p>
                    </div>
                  </div>
                )}
                {book.damage && (
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-gray-400 uppercase">Condition</p>
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-indigo-500" />
                      <p className="font-bold text-gray-800">{book.damage}</p>
                    </div>
                  </div>
                )}
                <div className="space-y-1">
                  <p className="text-xs font-bold text-gray-400 uppercase">Listed On</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-indigo-500" />
                    <p className="font-bold text-gray-800">{new Date(book.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          {book.description && (
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-3">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 uppercase tracking-widest text-xs">
                <div className="w-1.5 h-6 bg-purple-600 rounded-full" />
                From the Seller
              </h3>
              <p className="text-gray-600 leading-relaxed italic text-lg whitespace-pre-line">
                "{book.description}"
              </p>
            </div>
          )}

          {/* Action Button */}
          {canRequest ? (
            <Button
              onClick={handleSendRequest}
              disabled={isRequesting || (book.bookType === 'rent' && (!startDate || !endDate || totalPrice <= 0))}
              className="w-full h-16 text-lg font-black uppercase tracking-widest shadow-xl shadow-indigo-100 bg-indigo-600 hover:bg-indigo-700 transition-all active:scale-95 rounded-2xl group"
              size="lg"
            >
              <Send className="w-6 h-6 mr-3 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              {isRequesting ? 'Processing Transaction...' : book.bookType === 'rent' ? 'Request to Rent' : 'Request to Buy'}
            </Button>
          ) : isOwnBook ? (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-full"><User className="w-5 h-5 text-blue-600" /></div>
              <p className="text-blue-800 font-semibold text-sm tracking-tight">Managing your own listing. You'll receive requests from buyers here.</p>
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 flex items-center gap-3 grayscale">
              <div className="bg-gray-100 p-2 rounded-full"><AlertCircle className="w-5 h-5 text-gray-400" /></div>
              <p className="text-gray-500 font-semibold text-sm tracking-tight">This listing is currently {book.status} and unavailable.</p>
            </div>
          )}

          {/* Owner Info Box (Sticking to bottom logic) */}
          {!isOwnBook && (book.ownerName || book.ownerPhone) && (
            <Card className="border-2 border-indigo-50 bg-gradient-to-br from-white to-indigo-50 rounded-2xl shadow-sm overflow-hidden transform hover:-translate-y-1 transition-transform duration-300">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start text-center sm:text-left">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 p-1 shadow-lg ring-4 ring-white flex-shrink-0">
                    <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                      <span className="text-indigo-600 text-3xl font-black">{book.ownerName ? book.ownerName.charAt(0).toUpperCase() : '?'}</span>
                    </div>
                  </div>

                  <div className="flex-1 space-y-4">
                    <div>
                      <p className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-1 leading-none">Verified Owner</p>
                      <h4 className="text-2xl font-black text-gray-900">{book.ownerName || 'Private User'}</h4>
                    </div>

                    {book.ownerPhone && (
                      <div className="flex flex-col items-center sm:items-start gap-3">
                        {phoneRevealed ? (
                          <a href={`tel:${book.ownerPhone}`} className="flex items-center gap-3 bg-white border-2 border-green-500 rounded-2xl px-6 py-3 shadow-sm group hover:bg-green-50 transition-colors">
                            <div className="bg-green-500 p-2 rounded-xl group-hover:scale-110 transition-transform">
                              <Phone className="w-5 h-5 text-white" />
                            </div>
                            <span className="font-black text-green-700 text-xl tracking-tighter">{book.ownerPhone}</span>
                          </a>
                        ) : (
                          <Button
                            onClick={() => setPhoneRevealed(true)}
                            variant="outline"
                            className="bg-white hover:bg-indigo-600 hover:text-white border-2 border-indigo-600 text-indigo-600 px-6 py-4 rounded-2xl h-auto flex flex-col items-center transition-all group shadow-md"
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <Phone className="w-5 h-5" />
                              <span className="font-black text-lg">Click to Reveal Contact</span>
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Secured for Listing Privacy</span>
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
