import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { BookPlus, Upload, X, Clock, ShieldAlert } from 'lucide-react';
import { apiFetch } from '../api';
import { toast } from 'sonner';
import { LibraryVerification } from './LibraryVerification';

const CATEGORIES = [
  'Fiction', 'Non-Fiction', 'Science', 'Technology', 'Biography',
  'History', 'Philosophy', 'Self-Help', 'Mystery', 'Romance', 'Fantasy',
  'Story', 'Comic', 'Art', 'Poetry', 'Textbook', 'Other'
];

const LANGUAGES = [
  'English', 'Tamil', 'Hindi', 'Telugu', 'Malayalam', 'Kannada',
  'Bengali', 'Marathi', 'Gujarati', 'Punjabi', 'Urdu', 'French', 'German', 'Other'
];

const DAMAGE_OPTIONS = [
  'No damage', 'Minor wear', 'Moderate damage', 'Heavy damage',
  'Torn pages', 'Missing pages', 'Binding loose', 'Water damage'
];

interface AddBookPageProps {
  onBookAdded: () => void;
}

export const AddBookPage: React.FC<AddBookPageProps> = ({ onBookAdded }) => {
  const { accessToken, user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);

  const [formData, setFormData] = useState({
    title: '',
    author: '',
    category: '',
    subtitle: '',
    language: 'English', // Keep for backwards compatibility if needed, but we'll use languages
    languages: ['English'] as string[],
    pages: '',
    edition: '',
    bookType: 'rent' as 'rent' | 'sell',
    price: '',
    damage: 'No damage',
    description: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleLanguage = (lang: string) => {
    setFormData(prev => {
      const languages = prev.languages.includes(lang)
        ? prev.languages.filter(l => l !== lang)
        : [...prev.languages, lang];
      return { ...prev, languages };
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setImageFiles(prev => [...prev, ...files]);

      files.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreviews(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.author || !formData.category || !formData.price || formData.languages.length === 0) {
      toast.error('Please fill in all required fields and select at least one language');
      return;
    }
    if (parseFloat(formData.price) <= 0) {
      toast.error('Price must be greater than 0');
      return;
    }

    setIsLoading(true);
    try {
      // Use FormData to support file upload
      const fd = new FormData();
      fd.append('title', formData.title);
      fd.append('author', formData.author);
      fd.append('category', formData.category);
      fd.append('subtitle', formData.subtitle);
      fd.append('language', formData.languages.join(', '));
      fd.append('pages', formData.pages);
      fd.append('edition', formData.edition);
      fd.append('bookType', formData.bookType);
      fd.append('price', formData.price);
      fd.append('damage', formData.damage);
      fd.append('description', formData.description);

      // Append multiple images
      imageFiles.forEach((file) => {
        fd.append('images[]', file);
      });

      const response = await apiFetch('/books/add.php', {
        method: 'POST',
        body: fd,
      }, accessToken);

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Failed to add book');

      toast.success('Book added successfully!');

      // Reset form
      setFormData({
        title: '', author: '', category: '', subtitle: '',
        language: 'English', languages: ['English'], pages: '', edition: '',
        bookType: 'rent', price: '', damage: 'No damage', description: '',
      });
      setImageFiles([]);
      setImagePreviews([]);
      onBookAdded();
    } catch (error: any) {
      console.error('Add book error:', error);
      toast.error(error.message || 'Failed to add book');
    } finally {
      setIsLoading(false);
    }
  };

  // Condition 1: User is completely unverified or undefined
  if (!user?.libraryStatus || user.libraryStatus === 'unverified') {
    return <LibraryVerification onVerificationSubmitted={() => {}} />;
  }

  // Condition 2: Verification is pending
  if (user.libraryStatus === 'pending') {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <Card className="border-amber-200 shadow-md bg-amber-50/30">
          <CardContent className="pt-10 pb-10 flex flex-col items-center">
            <div className="bg-amber-100 p-4 rounded-full mb-4">
              <Clock className="w-10 h-10 text-amber-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Verification Pending</h2>
            <p className="text-gray-600 max-w-md mx-auto mb-6">
              Your library details and photos have been submitted and are currently under review by our administrators.
              You will be able to add books once your profile is approved to ensure a safe community.
            </p>
            <div className="bg-white px-4 py-3 rounded-xl border border-amber-200 shadow-sm flex flex-col sm:flex-row items-center justify-center gap-3 text-sm text-gray-700 font-medium text-center sm:text-left max-w-full">
              <ShieldAlert className="w-5 h-5 text-amber-500 flex-shrink-0" />
              <span>This usually takes 1-2 business days.</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Condition 3: User is verified, render the form
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <BookPlus className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl">Add a New Book</CardTitle>
              <CardDescription>List your book for rent or sale. Your profile is verified.</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Book Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Book Title *</Label>
              <Input id="title" placeholder="Enter book title"
                value={formData.title} onChange={e => handleChange('title', e.target.value)} required />
            </div>

            {/* Author */}
            <div className="space-y-2">
              <Label htmlFor="author">Author *</Label>
              <Input id="author" placeholder="Enter author name"
                value={formData.author} onChange={e => handleChange('author', e.target.value)} required />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label>Category *</Label>
              <Select value={formData.category} onValueChange={v => handleChange('category', v)}>
                <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Subtitle */}
            <div className="space-y-2">
              <Label htmlFor="subtitle">Book Subtitle</Label>
              <Input id="subtitle" placeholder="Enter book subtitle (optional)"
                value={formData.subtitle} onChange={e => handleChange('subtitle', e.target.value)} />
            </div>

            {/* Book Type */}
            <div className="space-y-2">
              <Label>Purchase Option *</Label>
              <RadioGroup
                value={formData.bookType}
                onValueChange={v => handleChange('bookType', v)}
                className="grid grid-cols-2 gap-3"
              >
                <label
                  htmlFor="rent"
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 cursor-pointer transition-all ${formData.bookType === 'rent'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                >
                  <RadioGroupItem value="rent" id="rent" />
                  <span className="font-medium text-sm">For Rent</span>
                </label>
                <label
                  htmlFor="sell"
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 cursor-pointer transition-all ${formData.bookType === 'sell'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                >
                  <RadioGroupItem value="sell" id="sell" />
                  <span className="font-medium text-sm">For Sale</span>
                </label>
              </RadioGroup>
            </div>

            {/* Languages */}
            <div className="space-y-3">
              <Label>Languages * <span className="text-sm text-gray-500 font-normal">(Select all that apply)</span></Label>
              <div className="flex flex-wrap gap-2">
                {LANGUAGES.map(lang => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => toggleLanguage(lang)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${formData.languages.includes(lang)
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-md scale-105'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-300 hover:bg-indigo-50'
                      }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
              {formData.languages.length === 0 && (
                <p className="text-xs text-red-500 font-medium italic">Please select at least one language</p>
              )}
            </div>

            {/* Price */}
            <div className="space-y-2">
              <Label htmlFor="price">
                {formData.bookType === 'rent' ? 'Price per Day *' : 'Price *'}
                <span className="text-sm text-gray-500 font-normal"> (in ₹ Rupees)</span>
              </Label>
              <Input id="price" type="number" step="0.01" min="0" placeholder="0.00"
                value={formData.price} onChange={e => handleChange('price', e.target.value)} required />
            </div>

            {/* Number of Pages */}
            <div className="space-y-2">
              <Label htmlFor="pages">Number of Pages</Label>
              <Input id="pages" type="number" min="1" placeholder="e.g. 250"
                value={formData.pages} onChange={e => handleChange('pages', e.target.value)} />
            </div>

            {/* Edition */}
            <div className="space-y-2">
              <Label htmlFor="edition">Edition</Label>
              <Input id="edition" placeholder="e.g. 2nd Edition"
                value={formData.edition} onChange={e => handleChange('edition', e.target.value)} />
            </div>

            {/* Book Images */}
            <div className="space-y-2">
              <Label htmlFor="images">Book Images ({imageFiles.length})</Label>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <label htmlFor="images"
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 text-sm text-gray-700">
                    <Upload className="w-4 h-4" />
                    Add Images
                  </label>
                  <input id="images" type="file" accept="image/*" className="hidden" multiple onChange={handleImageChange} />
                  <span className="text-xs text-gray-400 italic">Select one or more clear photos</span>
                </div>

                {imagePreviews.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {imagePreviews.map((preview, idx) => (
                      <div key={idx} className="relative group aspect-[3/4]">
                        <img src={preview} alt={`Preview ${idx}`}
                          className="w-full h-full object-cover rounded-lg border border-gray-200" />
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Book Damage */}
            <div className="space-y-2">
              <Label>Book Condition</Label>
              <Select value={formData.damage} onValueChange={v => handleChange('damage', v)}>
                <SelectTrigger><SelectValue placeholder="Select damage status" /></SelectTrigger>
                <SelectContent>
                  {DAMAGE_OPTIONS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" placeholder="Enter a description of the book (optional)"
                value={formData.description} onChange={e => handleChange('description', e.target.value)} rows={4} />
            </div>

            {/* Submit */}
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? 'Adding Book...' : 'Add Book'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
