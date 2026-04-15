import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Create Supabase client with service role for admin operations
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// Create Supabase client with anon key for auth operations
const supabaseAuth = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_ANON_KEY') ?? ''
);

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-9f27b78a/health", (c) => {
  return c.json({ status: "ok" });
});

// Helper endpoint to create admin user (for initial setup)
app.post("/make-server-9f27b78a/create-admin", async (c) => {
  try {
    const { name, email, phone, password, secretKey } = await c.req.json();

    // Simple secret key check - change this to your own secret
    if (secretKey !== "bookcircle-admin-2026") {
      return c.json({ error: "Invalid secret key" }, 403);
    }

    if (!name || !email || !phone || !password) {
      return c.json({ error: "All fields are required" }, 400);
    }

    // Create admin user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, phone }
    });

    if (authError) {
      console.log('Admin creation auth error:', authError);
      return c.json({ error: authError.message }, 400);
    }

    // Store admin user info in KV store
    await kv.set(`user:${authData.user.id}`, {
      id: authData.user.id,
      name,
      email,
      phone,
      isAdmin: true, // Mark as admin
      createdAt: new Date().toISOString()
    });

    return c.json({ 
      message: "Admin user created successfully",
      user: {
        id: authData.user.id,
        name,
        email,
        phone,
        isAdmin: true
      }
    });
  } catch (error) {
    console.log('Create admin error:', error);
    return c.json({ error: "Failed to create admin user" }, 500);
  }
});

// ============ AUTHENTICATION ROUTES ============

// Register new user
app.post("/make-server-9f27b78a/auth/register", async (c) => {
  try {
    const { name, email, phone, password } = await c.req.json();

    if (!name || !email || !phone || !password) {
      return c.json({ error: "All fields are required" }, 400);
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm since email server isn't configured
      user_metadata: { name, phone }
    });

    if (authError) {
      console.log('Registration auth error:', authError);
      return c.json({ error: authError.message }, 400);
    }

    // Store additional user info in KV store
    await kv.set(`user:${authData.user.id}`, {
      id: authData.user.id,
      name,
      email,
      phone,
      isAdmin: false,
      createdAt: new Date().toISOString()
    });

    return c.json({ 
      message: "Registration successful",
      user: {
        id: authData.user.id,
        name,
        email,
        phone
      }
    });
  } catch (error) {
    console.log('Registration error:', error);
    return c.json({ error: "Registration failed" }, 500);
  }
});

// Login
app.post("/make-server-9f27b78a/auth/login", async (c) => {
  try {
    const { email, password } = await c.req.json();

    if (!email || !password) {
      return c.json({ error: "Email and password are required" }, 400);
    }

    const { data, error } = await supabaseAuth.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.log('Login error:', error);
      return c.json({ error: "Invalid credentials" }, 401);
    }

    // Get user details from KV store
    const userDetails = await kv.get(`user:${data.user.id}`);

    return c.json({
      access_token: data.session.access_token,
      user: userDetails || {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.name || '',
        phone: data.user.user_metadata?.phone || '',
        isAdmin: false
      }
    });
  } catch (error) {
    console.log('Login error:', error);
    return c.json({ error: "Login failed" }, 500);
  }
});

// ============ BOOK ROUTES ============

// Add a new book
app.post("/make-server-9f27b78a/books/add", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { title, author, category, bookType, price, description } = await c.req.json();

    if (!title || !author || !category || !bookType || !price) {
      return c.json({ error: "All required fields must be filled" }, 400);
    }

    const bookId = crypto.randomUUID();
    const book = {
      id: bookId,
      title,
      author,
      category,
      bookType, // 'rent' or 'sell'
      price: parseFloat(price),
      description: description || '',
      ownerId: user.id,
      status: 'available', // available, requested, unavailable
      createdAt: new Date().toISOString()
    };

    await kv.set(`book:${bookId}`, book);

    // Add to owner's books list
    const ownerBooks = await kv.get(`userbooks:${user.id}`) || [];
    ownerBooks.push(bookId);
    await kv.set(`userbooks:${user.id}`, ownerBooks);

    return c.json({ message: "Book added successfully", book });
  } catch (error) {
    console.log('Add book error:', error);
    return c.json({ error: "Failed to add book" }, 500);
  }
});

// Get all books with optional filters
app.get("/make-server-9f27b78a/books", async (c) => {
  try {
    const bookType = c.req.query('type'); // 'rent' or 'sell'
    const category = c.req.query('category');

    // Get all books from KV store
    const allBooks = await kv.getByPrefix('book:');
    
    let books = allBooks.map(item => item.value);

    // Apply filters
    if (bookType) {
      books = books.filter(book => book.bookType === bookType);
    }
    if (category) {
      books = books.filter(book => book.category === category);
    }

    // Get owner details for each book
    const booksWithOwners = await Promise.all(
      books.map(async (book) => {
        const owner = await kv.get(`user:${book.ownerId}`);
        return {
          ...book,
          ownerName: owner?.name || 'Unknown',
          ownerPhone: owner?.phone || ''
        };
      })
    );

    return c.json({ books: booksWithOwners });
  } catch (error) {
    console.log('Get books error:', error);
    return c.json({ error: "Failed to fetch books" }, 500);
  }
});

// Get book by ID
app.get("/make-server-9f27b78a/books/:id", async (c) => {
  try {
    const bookId = c.req.param('id');
    const book = await kv.get(`book:${bookId}`);

    if (!book) {
      return c.json({ error: "Book not found" }, 404);
    }

    // Get owner details
    const owner = await kv.get(`user:${book.ownerId}`);

    return c.json({
      book: {
        ...book,
        ownerName: owner?.name || 'Unknown',
        ownerPhone: owner?.phone || ''
      }
    });
  } catch (error) {
    console.log('Get book error:', error);
    return c.json({ error: "Failed to fetch book" }, 500);
  }
});

// Delete book (owner or admin only)
app.delete("/make-server-9f27b78a/books/:id", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const bookId = c.req.param('id');
    const book = await kv.get(`book:${bookId}`);

    if (!book) {
      return c.json({ error: "Book not found" }, 404);
    }

    const userDetails = await kv.get(`user:${user.id}`);
    
    // Check if user is owner or admin
    if (book.ownerId !== user.id && !userDetails?.isAdmin) {
      return c.json({ error: "Forbidden" }, 403);
    }

    // Delete the book
    await kv.del(`book:${bookId}`);

    // Remove from owner's books list
    const ownerBooks = await kv.get(`userbooks:${book.ownerId}`) || [];
    const updatedBooks = ownerBooks.filter(id => id !== bookId);
    await kv.set(`userbooks:${book.ownerId}`, updatedBooks);

    return c.json({ message: "Book deleted successfully" });
  } catch (error) {
    console.log('Delete book error:', error);
    return c.json({ error: "Failed to delete book" }, 500);
  }
});

// ============ REQUEST ROUTES ============

// Send a book request
app.post("/make-server-9f27b78a/requests/send", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { bookId } = await c.req.json();

    if (!bookId) {
      return c.json({ error: "Book ID is required" }, 400);
    }

    const book = await kv.get(`book:${bookId}`);
    
    if (!book) {
      return c.json({ error: "Book not found" }, 404);
    }

    if (book.ownerId === user.id) {
      return c.json({ error: "You cannot request your own book" }, 400);
    }

    if (book.status !== 'available') {
      return c.json({ error: "Book is not available" }, 400);
    }

    // Check if user already requested this book
    const existingRequests = await kv.getByPrefix(`request:${bookId}:`);
    const userRequest = existingRequests.find(req => req.value.requesterId === user.id);
    
    if (userRequest) {
      return c.json({ error: "You have already requested this book" }, 400);
    }

    const requestId = crypto.randomUUID();
    const request = {
      id: requestId,
      bookId,
      requesterId: user.id,
      ownerId: book.ownerId,
      status: 'pending', // pending, approved, rejected
      createdAt: new Date().toISOString()
    };

    await kv.set(`request:${bookId}:${requestId}`, request);

    // Add to requester's requests
    const requesterRequests = await kv.get(`userrequests:${user.id}`) || [];
    requesterRequests.push(requestId);
    await kv.set(`userrequests:${user.id}`, requesterRequests);

    // Create notification for book owner
    const notificationId = crypto.randomUUID();
    const notification = {
      id: notificationId,
      userId: book.ownerId,
      type: 'new_request',
      message: `You have a new request for "${book.title}"`,
      bookId,
      requestId,
      read: false,
      createdAt: new Date().toISOString()
    };
    await kv.set(`notification:${book.ownerId}:${notificationId}`, notification);

    return c.json({ message: "Request sent successfully", request });
  } catch (error) {
    console.log('Send request error:', error);
    return c.json({ error: "Failed to send request" }, 500);
  }
});

// Get requests for a user (both sent and received)
app.get("/make-server-9f27b78a/requests", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const type = c.req.query('type'); // 'sent' or 'received'

    // Get all requests
    const allRequests = await kv.getByPrefix('request:');
    
    let requests = allRequests.map(item => item.value);

    if (type === 'sent') {
      requests = requests.filter(req => req.requesterId === user.id);
    } else if (type === 'received') {
      requests = requests.filter(req => req.ownerId === user.id);
    } else {
      // Get both sent and received
      requests = requests.filter(req => 
        req.requesterId === user.id || req.ownerId === user.id
      );
    }

    // Enrich requests with book and user details
    const enrichedRequests = await Promise.all(
      requests.map(async (request) => {
        const book = await kv.get(`book:${request.bookId}`);
        const requester = await kv.get(`user:${request.requesterId}`);
        const owner = await kv.get(`user:${request.ownerId}`);
        
        return {
          ...request,
          book: book || null,
          requesterName: requester?.name || 'Unknown',
          requesterPhone: requester?.phone || '',
          ownerName: owner?.name || 'Unknown'
        };
      })
    );

    return c.json({ requests: enrichedRequests });
  } catch (error) {
    console.log('Get requests error:', error);
    return c.json({ error: "Failed to fetch requests" }, 500);
  }
});

// Manage request (approve/reject)
app.put("/make-server-9f27b78a/requests/:id", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const requestId = c.req.param('id');
    const { status } = await c.req.json(); // 'approved' or 'rejected'

    if (!status || (status !== 'approved' && status !== 'rejected')) {
      return c.json({ error: "Invalid status" }, 400);
    }

    // Find the request
    const allRequests = await kv.getByPrefix('request:');
    const requestItem = allRequests.find(item => item.value.id === requestId);

    if (!requestItem) {
      return c.json({ error: "Request not found" }, 404);
    }

    const request = requestItem.value;

    // Check if user is the owner
    if (request.ownerId !== user.id) {
      return c.json({ error: "Forbidden" }, 403);
    }

    // Update request status
    request.status = status;
    await kv.set(requestItem.key, request);

    // Update book status if approved
    if (status === 'approved') {
      const book = await kv.get(`book:${request.bookId}`);
      if (book) {
        book.status = 'requested';
        await kv.set(`book:${request.bookId}`, book);
      }
    }

    // Create notification for requester
    const notificationId = crypto.randomUUID();
    const book = await kv.get(`book:${request.bookId}`);
    const notification = {
      id: notificationId,
      userId: request.requesterId,
      type: status === 'approved' ? 'request_approved' : 'request_rejected',
      message: status === 'approved' 
        ? `Your request for "${book?.title}" has been approved!`
        : `Your request for "${book?.title}" has been rejected.`,
      bookId: request.bookId,
      requestId,
      read: false,
      createdAt: new Date().toISOString()
    };
    await kv.set(`notification:${request.requesterId}:${notificationId}`, notification);

    return c.json({ message: `Request ${status} successfully`, request });
  } catch (error) {
    console.log('Manage request error:', error);
    return c.json({ error: "Failed to update request" }, 500);
  }
});

// ============ NOTIFICATION ROUTES ============

// Get notifications for a user
app.get("/make-server-9f27b78a/notifications", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const notifications = await kv.getByPrefix(`notification:${user.id}:`);
    
    const sortedNotifications = notifications
      .map(item => item.value)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return c.json({ notifications: sortedNotifications });
  } catch (error) {
    console.log('Get notifications error:', error);
    return c.json({ error: "Failed to fetch notifications" }, 500);
  }
});

// Mark notification as read
app.put("/make-server-9f27b78a/notifications/:id/read", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const notificationId = c.req.param('id');
    const notification = await kv.get(`notification:${user.id}:${notificationId}`);

    if (!notification) {
      return c.json({ error: "Notification not found" }, 404);
    }

    notification.read = true;
    await kv.set(`notification:${user.id}:${notificationId}`, notification);

    return c.json({ message: "Notification marked as read" });
  } catch (error) {
    console.log('Mark notification read error:', error);
    return c.json({ error: "Failed to update notification" }, 500);
  }
});

// ============ ADMIN ROUTES ============

// Get all users (admin only)
app.get("/make-server-9f27b78a/admin/users", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const currentUser = await kv.get(`user:${user.id}`);
    
    if (!currentUser?.isAdmin) {
      return c.json({ error: "Forbidden: Admin access required" }, 403);
    }

    const users = await kv.getByPrefix('user:');
    const usersList = users.map(item => item.value);

    return c.json({ users: usersList });
  } catch (error) {
    console.log('Get users error:', error);
    return c.json({ error: "Failed to fetch users" }, 500);
  }
});

// Get all books (admin only)
app.get("/make-server-9f27b78a/admin/books", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const currentUser = await kv.get(`user:${user.id}`);
    
    if (!currentUser?.isAdmin) {
      return c.json({ error: "Forbidden: Admin access required" }, 403);
    }

    const books = await kv.getByPrefix('book:');
    const booksList = await Promise.all(
      books.map(async (item) => {
        const book = item.value;
        const owner = await kv.get(`user:${book.ownerId}`);
        return {
          ...book,
          ownerName: owner?.name || 'Unknown'
        };
      })
    );

    return c.json({ books: booksList });
  } catch (error) {
    console.log('Get admin books error:', error);
    return c.json({ error: "Failed to fetch books" }, 500);
  }
});

// Block/unblock user (admin only)
app.put("/make-server-9f27b78a/admin/users/:id/block", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const currentUser = await kv.get(`user:${user.id}`);
    
    if (!currentUser?.isAdmin) {
      return c.json({ error: "Forbidden: Admin access required" }, 403);
    }

    const targetUserId = c.req.param('id');
    const { blocked } = await c.req.json();

    const targetUser = await kv.get(`user:${targetUserId}`);
    
    if (!targetUser) {
      return c.json({ error: "User not found" }, 404);
    }

    targetUser.blocked = blocked;
    await kv.set(`user:${targetUserId}`, targetUser);

    return c.json({ message: `User ${blocked ? 'blocked' : 'unblocked'} successfully` });
  } catch (error) {
    console.log('Block user error:', error);
    return c.json({ error: "Failed to update user" }, 500);
  }
});

Deno.serve(app.fetch);