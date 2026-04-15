import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './components/AuthContext';
import { LoginPage } from './components/LoginPage';
import { RegisterPage } from './components/RegisterPage';
import { Navbar } from './components/Navbar';
import { HomePage } from './components/HomePage';
import { BookDetailsPage } from './components/BookDetailsPage';
import { AddBookPage } from './components/AddBookPage';
import { MyRequestsPage } from './components/MyRequestsPage';
import { NotificationsPage } from './components/NotificationsPage';
import { ProfilePage } from './components/ProfilePage';
import { Book } from './components/BookCard';
import { Toaster } from './components/ui/sonner';
import { apiFetch } from './api';
import { FeedbackDialog } from './components/FeedbackDialog';
import { MessageSquare } from 'lucide-react';

type Page = 'home' | 'book-details' | 'add-book' | 'my-requests' | 'notifications' | 'profile';
type AuthView = 'login' | 'register';

const AppContent: React.FC = () => {
  const { user, isLoading, accessToken } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [notificationCount, setNotificationCount] = useState(0);
  const [authView, setAuthView] = useState<AuthView>('login');
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchNotificationCount();
      const interval = setInterval(fetchNotificationCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user, accessToken]);

  const fetchNotificationCount = async () => {
    if (!accessToken) return;
    try {
      const response = await apiFetch('/notifications/index.php', {}, accessToken);
      const data = await response.json();
      if (response.ok) {
        const unread = (data.notifications || []).filter((n: any) => !n.read).length;
        setNotificationCount(unread);
      }
    } catch { }
  };

  const handleNavigate = (page: string) => {
    setCurrentPage(page as Page);
    if (page !== 'book-details') setSelectedBook(null);
  };

  const handleViewBookDetails = (book: Book) => {
    setSelectedBook(book);
    setCurrentPage('book-details');
  };

  const handleBookAdded = () => setCurrentPage('home');

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    if (authView === 'register') {
      return <RegisterPage onSwitchToLogin={() => setAuthView('login')} />;
    }
    return (
      <LoginPage
        onSwitchToRegister={() => setAuthView('register')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar
        currentPage={currentPage}
        onNavigate={handleNavigate}
        notificationCount={notificationCount}
      />

      <main>
        {currentPage === 'home' && (
          <HomePage onViewBookDetails={handleViewBookDetails} />
        )}
        {currentPage === 'book-details' && selectedBook && (
          <BookDetailsPage book={selectedBook} onBack={() => setCurrentPage('home')} />
        )}
        {currentPage === 'add-book' && (
          <AddBookPage onBookAdded={handleBookAdded} />
        )}
        {currentPage === 'my-requests' && <MyRequestsPage />}
        {currentPage === 'notifications' && <NotificationsPage />}
        {currentPage === 'profile' && (
          <ProfilePage onViewBookDetails={handleViewBookDetails} />
        )}
      </main>

      {/* Floating Feedback Button */}
      {user && (
        <button
          onClick={() => setIsFeedbackOpen(true)}
          className="fixed bottom-6 right-6 z-40 bg-indigo-600 text-white p-4 rounded-2xl shadow-2xl shadow-indigo-200 hover:bg-slate-900 hover:scale-110 active:scale-95 transition-all group lg:bottom-10 lg:right-10"
        >
          <div className="flex items-center gap-2">
            <MessageSquare size={24} />
            <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 font-bold text-xs uppercase tracking-widest whitespace-nowrap">
              Feedback
            </span>
          </div>
        </button>
      )}

      <FeedbackDialog 
        isOpen={isFeedbackOpen} 
        onClose={() => setIsFeedbackOpen(false)} 
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
      <Toaster />
    </AuthProvider>
  );
}