import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { BookOpen, Bell, Plus, List, LogOut, Shield, UserCircle, ExternalLink, Menu, X } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

interface NavbarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  notificationCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPage, onNavigate, notificationCount }) => {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Close menu when navigating
  const handleNav = (page: string) => {
    onNavigate(page);
    setIsMenuOpen(false);
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => onNavigate('home')}
          >
            <div className="bg-indigo-600 p-2 rounded-lg">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">BookCircle</span>
          </div>

          {/* Navigation - Desktop */}
          <div className="hidden md:flex items-center gap-2">
            <Button
              variant={currentPage === 'home' ? 'default' : 'ghost'}
              onClick={() => onNavigate('home')}
              className="hidden sm:flex"
            >
              Browse Books
            </Button>

            <Button
              variant={currentPage === 'add-book' ? 'default' : 'ghost'}
              onClick={() => onNavigate('add-book')}
            >
              <Plus className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Add Book</span>
              <span className="sm:hidden">Add</span>
            </Button>

            <Button
              variant={currentPage === 'my-requests' ? 'default' : 'ghost'}
              onClick={() => onNavigate('my-requests')}
            >
              <List className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">My Requests</span>
              <span className="sm:hidden">Requests</span>
            </Button>

            {/* Notifications */}
            <Button
              variant={currentPage === 'notifications' ? 'default' : 'ghost'}
              onClick={() => onNavigate('notifications')}
              className="relative"
            >
              <Bell className="w-4 h-4" />
              {notificationCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                  {notificationCount}
                </Badge>
              )}
            </Button>

            {/* User Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold text-sm">
                    {user?.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:inline">{user?.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onNavigate('profile')}>
                  <UserCircle className="w-4 h-4 mr-2" />
                  My Profile
                </DropdownMenuItem>
                {user?.isAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => window.open('http://localhost:5174', '_blank')}
                    >
                      <Shield className="w-4 h-4 mr-2" />
                      Admin Panel
                      <ExternalLink className="w-3 h-3 ml-auto text-gray-400" />
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-red-600">
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Navigation - Mobile Toggle */}
          <div className="md:hidden flex items-center gap-2">
            <Button
              variant={currentPage === 'notifications' ? 'default' : 'ghost'}
              onClick={() => handleNav('notifications')}
              className="relative px-2"
            >
              <Bell className="w-5 h-5" />
              {notificationCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs text-white bg-red-500">
                  {notificationCount}
                </Badge>
              )}
            </Button>
            <Button variant="ghost" className="px-2" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X className="w-6 h-6 text-gray-700" /> : <Menu className="w-6 h-6 text-gray-700" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 w-full bg-white border-b border-gray-200 shadow-xl z-50 py-4 px-4 flex flex-col gap-2">
            <div className="flex items-center justify-between px-2 mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                        {user?.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <p className="font-bold text-gray-900">{user?.name}</p>
                        <p className="text-xs text-gray-500">{user?.email}</p>
                    </div>
                </div>
            </div>
            <div className="w-full h-px bg-gray-100 mb-2"></div>
            
            <Button variant={currentPage === 'home' ? 'default' : 'ghost'} onClick={() => handleNav('home')} className="justify-start w-full text-left">
              <BookOpen className="w-4 h-4 mr-3" /> Browse Books
            </Button>
            <Button variant={currentPage === 'add-book' ? 'default' : 'ghost'} onClick={() => handleNav('add-book')} className="justify-start w-full text-left">
              <Plus className="w-4 h-4 mr-3" /> Add Book
            </Button>
            <Button variant={currentPage === 'my-requests' ? 'default' : 'ghost'} onClick={() => handleNav('my-requests')} className="justify-start w-full text-left">
              <List className="w-4 h-4 mr-3" /> My Requests
            </Button>
            <Button variant={currentPage === 'profile' ? 'default' : 'ghost'} onClick={() => handleNav('profile')} className="justify-start w-full text-left">
              <UserCircle className="w-4 h-4 mr-3" /> My Profile
            </Button>

            {user?.isAdmin && (
                <Button variant="ghost" onClick={() => window.open('http://localhost:5174', '_blank')} className="justify-start w-full text-left text-indigo-600 bg-indigo-50/50 mt-2">
                    <Shield className="w-4 h-4 mr-3" /> Admin Panel <ExternalLink className="w-3 h-3 ml-auto" />
                </Button>
            )}
            
            <div className="w-full h-px bg-gray-100 my-2"></div>
            <Button variant="ghost" onClick={logout} className="justify-start w-full text-left text-red-600 hover:text-red-700 hover:bg-red-50">
              <LogOut className="w-4 h-4 mr-3" /> Logout
            </Button>
        </div>
      )}
    </nav>
  );
};
