import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { ShieldCheck, Upload, X } from 'lucide-react';
import { apiFetch } from '../api';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';

interface LibraryVerificationProps {
  onVerificationSubmitted: () => void;
}

export const LibraryVerification: React.FC<LibraryVerificationProps> = ({ onVerificationSubmitted }) => {
  const { accessToken, updateLibraryStatus } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);

  const [formData, setFormData] = useState({
    libraryName: '',
    libraryAddress: '',
    details: '',
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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

    if (!formData.libraryName || !formData.libraryAddress) {
      toast.error('Please provide the library name and address.');
      return;
    }

    if (imageFiles.length === 0) {
      toast.error('Please upload at least one photo of your library or book collection.');
      return;
    }

    setIsLoading(true);
    try {
      const fd = new FormData();
      fd.append('libraryName', formData.libraryName);
      fd.append('libraryAddress', formData.libraryAddress);
      fd.append('details', formData.details);

      imageFiles.forEach((file) => {
        fd.append('images[]', file);
      });

      // User will implement this PHP endpoint later
      const response = await apiFetch('/user/verify-library.php', {
        method: 'POST',
        body: fd,
      }, accessToken);

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success('Verification submitted successfully! An admin will review it.');
        // Update local context
        if (updateLibraryStatus) {
            updateLibraryStatus('pending');
        }
        onVerificationSubmitted();
      } else {
        throw new Error(data.error || 'Failed to submit verification request.');
      }
    } catch (error: any) {
      console.error('Verification submit error:', error);
      toast.error(error.message || 'Failed to submit verification. Please confirm the database migration is complete.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Card className="border-indigo-100 shadow-lg">
        <CardHeader className="bg-indigo-50/50 pb-6">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2.5 rounded-xl shadow-sm">
              <ShieldCheck className="w-7 h-7 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl text-indigo-900">Verify Your Profile</CardTitle>
              <CardDescription className="text-base text-indigo-700/80 mt-1">
                To keep our community safe and avoid fake listings, please verify you own a library or book collection before adding books.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="libraryName" className="text-gray-700 font-medium">Library or Store Name *</Label>
              <Input 
                id="libraryName" 
                placeholder="e.g. City Central Library or My Personal Collection"
                value={formData.libraryName} 
                onChange={e => handleChange('libraryName', e.target.value)} 
                required 
                className="bg-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="libraryAddress" className="text-gray-700 font-medium">Location / Address *</Label>
              <Textarea 
                id="libraryAddress" 
                placeholder="Where is your library located?"
                value={formData.libraryAddress} 
                onChange={e => handleChange('libraryAddress', e.target.value)} 
                required 
                rows={2}
                className="bg-white resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700 font-medium">Photos of your Library / Collection *</Label>
              <p className="text-sm text-gray-500 mb-3">Please upload clear photos showing your collection of books or library storefront.</p>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <label htmlFor="images"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-indigo-200 rounded-xl cursor-pointer hover:bg-indigo-50/50 hover:border-indigo-400 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4">
                        <Upload className="w-8 h-8 text-indigo-500 mb-2 flex-shrink-0" />
                        <p className="text-sm text-indigo-600 font-medium text-center">Click to upload photos</p>
                        <p className="text-xs text-gray-500 mt-1 text-center">PNG, JPG or JPEG (Max 5MB)</p>
                    </div>
                  </label>
                  <input id="images" type="file" accept="image/*" className="hidden" multiple onChange={handleImageChange} />
                </div>

                {imagePreviews.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-4">
                    {imagePreviews.map((preview, idx) => (
                      <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden shadow-sm border border-gray-200">
                        <img src={preview} alt={`Preview ${idx}`}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute top-2 right-2 bg-red-500/90 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="details" className="text-gray-700 font-medium">Additional Details (Optional)</Label>
              <Textarea 
                id="details" 
                placeholder="Any links to your store, social media, or extra information..."
                value={formData.details} 
                onChange={e => handleChange('details', e.target.value)} 
                rows={3} 
                className="bg-white resize-none"
              />
            </div>

            <div className="pt-2">
              <Button type="submit" disabled={isLoading} className="w-full h-11 text-base font-medium shadow-md">
                {isLoading ? 'Submitting...' : 'Submit for Verification'}
              </Button>
              <p className="text-center text-xs text-gray-500 mt-4">
                By submitting, you agree to our terms of service and confirm the provided information is accurate.
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
