import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Check, X, Clock, BookOpen, User, IndianRupee, Phone } from 'lucide-react';
import { apiFetch } from '../api';
import { toast } from 'sonner';

interface Request {
  id: string;
  bookId: string;
  requesterId: string;
  ownerId: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  book: {
    title: string;
    author: string;
    category: string;
    price: number;
    bookType: string;
    image?: string;
  };
  requesterName?: string;
  requesterPhone?: string;
  ownerName?: string;
  ownerPhone?: string;
  startDate?: string;
  endDate?: string;
  totalPrice?: number;
  extensionStatus?: 'none' | 'pending' | 'rejected';
  extensionEndDate?: string;
}

export const MyRequestsPage: React.FC = () => {
  const { accessToken } = useAuth();
  const [sentRequests, setSentRequests] = useState<Request[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<Request[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  useEffect(() => { fetchRequests(); }, []);
  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const [sentRes, receivedRes] = await Promise.all([
        apiFetch('/requests/index.php?type=sent', {}, accessToken),
        apiFetch('/requests/index.php?type=received', {}, accessToken),
      ]);
      const sentData = await sentRes.json();
      const receivedData = await receivedRes.json();

      if (sentRes.ok) setSentRequests(sentData.requests || []);
      if (receivedRes.ok) setReceivedRequests(receivedData.requests || []);
    } catch (error: any) {
      toast.error('Failed to load requests');
    } finally {
      setIsLoading(false);
    }
  };

  const [extensionDate, setExtensionDate] = useState<{ [key: string]: string }>({});

  const handleExtendRequest = async (requestId: string) => {
    const extDate = extensionDate[requestId];
    if (!extDate) return;
    setProcessingId(requestId);
    try {
      const response = await apiFetch(`/requests/extend.php`, {
        method: 'POST',
        body: JSON.stringify({ requestId, extensionToDate: extDate }),
      }, accessToken);

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to request extension');

      toast.success('Extension requested successfully!');
      fetchRequests();
    } catch (error: any) {
      toast.error(error.message || 'Operation failed');
    } finally {
      setProcessingId(null);
    }
  };

  async function handleUpdateStatus(requestId: string, status: 'approved' | 'rejected' | 'extension_approved' | 'extension_rejected') {
    setProcessingId(requestId);
    try {
      const response = await apiFetch(`/requests/update.php?id=${requestId}`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      }, accessToken);

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to update request');

      toast.success(status === 'approved' ? 'Request approved!' : 'Request rejected');
      fetchRequests();
    } catch (error: any) {
      toast.error(error.message || 'Operation failed');
    } finally {
      setProcessingId(null);
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-800"><Check className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800"><X className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const RequestCard: React.FC<{ request: Request; type: 'sent' | 'received' }> = ({ request, type }) => (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex gap-3 flex-1">
            {request.book?.image && (
              <img src={request.book.image} alt={request.book.title}
                className="w-12 h-16 object-cover rounded flex-shrink-0" />
            )}
            <div className="flex-1">
              <CardTitle className="text-lg">{request.book?.title || 'Unknown Book'}</CardTitle>
              <p className="text-sm text-gray-600">by {request.book?.author || 'Unknown'}</p>
            </div>
          </div>
          {getStatusBadge(request.status)}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-gray-500" />
            <span className="text-gray-700">{request.book?.category}</span>
          </div>
          <div className="flex items-center gap-2">
            <IndianRupee className="w-4 h-4 text-gray-500" />
            <span className="font-semibold">₹{request.totalPrice?.toFixed(2) || request.book?.price?.toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-gray-500" />
            <span className="text-gray-700">
              {type === 'sent' ? request.ownerName : request.requesterName}
            </span>
          </div>
          {request.startDate && request.endDate ? (
            <div className="flex items-center gap-2 flex-wrap">
              <Clock className="w-4 h-4 text-indigo-500" />
              <span className="text-indigo-700 font-semibold text-[11px] bg-indigo-50 px-2 py-0.5 rounded">
                Rent: {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="text-gray-700">{new Date(request.createdAt).toLocaleDateString()}</span>
            </div>
          )}
        </div>

        {/* Contact info */}
        {type === 'received' && request.requesterPhone && (
          <div className="flex items-center gap-2 text-sm text-indigo-700 bg-indigo-50 px-3 py-2 rounded">
            <Phone className="w-4 h-4" />
            <span>Contact: {request.requesterPhone}</span>
          </div>
        )}
        {type === 'sent' && request.ownerPhone && request.status === 'approved' && (
          <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 px-3 py-2 rounded">
            <Phone className="w-4 h-4" />
            <span>Owner Contact: {request.ownerPhone}</span>
          </div>
        )}

        {/* Approve / Reject (only for received + pending) */}
        {type === 'received' && request.status === 'pending' && (
          <div className="flex gap-2 mt-4">
            <Button size="sm" className="flex-1"
              onClick={() => handleUpdateStatus(request.id, 'approved')}
              disabled={processingId === request.id}>
              <Check className="w-4 h-4 mr-1" /> Approve
            </Button>
            <Button size="sm" variant="outline" className="flex-1"
              onClick={() => handleUpdateStatus(request.id, 'rejected')}
              disabled={processingId === request.id}>
              <X className="w-4 h-4 mr-1" /> Reject
            </Button>
          </div>
        )}

        {/* Approve / Reject extensions (received) */}
        {type === 'received' && request.extensionStatus === 'pending' && (
          <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg mt-4">
            <p className="text-sm text-yellow-800 font-medium mb-2 flex items-center gap-1"><Clock className="w-4 h-4" /> Extension requested to: {new Date(request.extensionEndDate!).toLocaleDateString()}</p>
            <div className="flex gap-2">
              <Button size="sm" className="flex-1"
                onClick={() => handleUpdateStatus(request.id, 'extension_approved')}
                disabled={processingId === request.id}>
                Approve Extension
              </Button>
              <Button size="sm" variant="outline" className="flex-1 bg-white"
                onClick={() => handleUpdateStatus(request.id, 'extension_rejected')}
                disabled={processingId === request.id}>
                Reject
              </Button>
            </div>
          </div>
        )}

        {/* Request Extension (sent) */}
        {type === 'sent' && request.status === 'approved' && request.book?.bookType === 'rent' && (
          <div className="mt-4 border-t border-gray-100 pt-4">
            {request.extensionStatus === 'pending' ? (
              <Badge className="bg-yellow-100 text-yellow-800 py-1.5"><Clock className="w-3 h-3 mr-1" />Extension Pending to {new Date(request.extensionEndDate!).toLocaleDateString()}</Badge>
            ) : (
              <div className="flex flex-col gap-2">
                <p className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Extend Rent Period
                </p>
                <div className="flex gap-2">
                  <input type="date"
                    className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-indigo-100 outline-none"
                    min={request.endDate ? new Date(new Date(request.endDate).getTime() + 86400000).toISOString().split('T')[0] : ''}
                    value={extensionDate[request.id] || ''}
                    onChange={(e) => setExtensionDate({ ...extensionDate, [request.id]: e.target.value })}
                  />
                  <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    onClick={() => handleExtendRequest(request.id)}
                    disabled={processingId === request.id || !extensionDate[request.id]}>
                    Request Ext.
                  </Button>
                </div>
                {request.extensionStatus === 'rejected' && <p className="text-xs font-semibold text-red-500 flex items-center gap-1"><X className="w-3 h-3" /> Previous extension declined.</p>}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
          <p className="mt-4 text-gray-600">Loading requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">My Requests</h1>

      <Tabs defaultValue="received" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="received">Received ({receivedRequests.length})</TabsTrigger>
          <TabsTrigger value="sent">Sent ({sentRequests.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="received" className="mt-6">
          {receivedRequests.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No received requests yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {receivedRequests.map(r => <RequestCard key={r.id} request={r} type="received" />)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="sent" className="mt-6">
          {sentRequests.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No sent requests yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sentRequests.map(r => <RequestCard key={r.id} request={r} type="sent" />)}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
