import { BrowserRouter as Router, Routes, Route, Link, Outlet, useNavigate, useSearchParams, useParams, useLocation } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';
import { postService, categoryService } from './services/api';
import './App.css';
import { authService } from './services/api';

function Layout() {
  const [user, setUser] = useState(() => {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null;
  });
  const navigate = useNavigate();

  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/');
  }, [navigate]);

  useEffect(() => {
    const onStorage = () => {
      const u = localStorage.getItem('user');
      setUser(u ? JSON.parse(u) : null);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  return (
    <>
      <header style={{ background: '#222', color: '#fff', padding: '1rem 2rem', marginBottom: '2rem' }}>
        <nav style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Link to="/" style={{ color: '#fff', textDecoration: 'none', fontWeight: 'bold', fontSize: '1.2rem' }}>MERN Blog</Link>
          <Link to="/" style={{ color: '#fff' }}>Home</Link>
          {user && <Link to="/create" style={{ color: '#fff' }}>Create Post</Link>}
          <span style={{ flex: 1 }} />
          {user ? (
            <>
              <span style={{ color: '#fff' }}>Hello, {user.username}</span>
              <button onClick={handleLogout} style={{ color: '#fff', background: 'none', border: 'none', cursor: 'pointer' }}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" style={{ color: '#fff' }}>Login</Link>
              <Link to="/register" style={{ color: '#fff' }}>Register</Link>
            </>
          )}
        </nav>
      </header>
      <main style={{ maxWidth: 900, margin: '0 auto', padding: '1rem' }}>
        <Outlet />
      </main>
    </>
  );
}

function PostList() {
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    setPage(Number(searchParams.get('page')) || 1);
    setSearch(searchParams.get('q') || '');
    setCategory(searchParams.get('category') || '');
  }, [searchParams]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const data = await postService.getAllPosts(page, 5, category || null, search || null);
        setPosts(data.posts || []);
        setTotalPages(data.totalPages || 1);
      } catch (err) {
        setError('Failed to load posts');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [page, category, search]);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const cats = await categoryService.getAllCategories();
        setCategories(cats);
      } catch {}
    }
    fetchCategories();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchParams({ q: search, category, page: 1 });
  };

  const handleCategory = (e) => {
    setCategory(e.target.value);
    setSearchParams({ q: search, category: e.target.value, page: 1 });
  };

  const handlePage = (newPage) => {
    setSearchParams({ q: search, category, page: newPage });
  };

  return (
    <div>
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '1rem', marginBottom: 16 }}>
        <input
          type="text"
          placeholder="Search posts..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1 }}
        />
        <select value={category} onChange={handleCategory}>
          <option value="">All Categories</option>
          {categories.map(cat => (
            <option key={cat._id} value={cat._id}>{cat.name}</option>
          ))}
        </select>
        <button type="submit">Search</button>
      </form>
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p style={{ color: 'red' }}>{error}</p>
      ) : (
        <>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {posts.map(post => (
              <li key={post._id} style={{ marginBottom: 24, borderBottom: '1px solid #eee', paddingBottom: 12 }}>
                <Link to={`/posts/${post._id}`} style={{ fontSize: 20, fontWeight: 600 }}>{post.title}</Link>
                <div style={{ color: '#888', fontSize: 14 }}>
                  {post.category?.name} | {new Date(post.createdAt).toLocaleDateString()}
                </div>
                <div style={{ marginTop: 8 }}>{post.excerpt || post.content?.slice(0, 120) + '...'}</div>
              </li>
            ))}
          </ul>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16 }}>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i + 1}
                onClick={() => handlePage(i + 1)}
                style={{ fontWeight: page === i + 1 ? 'bold' : 'normal' }}
                disabled={page === i + 1}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function SinglePost() {
  const { id } = window.location.pathname.match(/posts\/(.+)/) || {};
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [commentContent, setCommentContent] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [commentError, setCommentError] = useState(null);

  // Get post id from URL params using useParams
  const postId = window.location.pathname.split('/').pop();

  useEffect(() => {
    async function fetchPost() {
      setLoading(true);
      setError(null);
      try {
        const data = await postService.getPost(postId);
        setPost(data);
      } catch (err) {
        setError('Failed to load post');
      } finally {
        setLoading(false);
      }
    }
    fetchPost();
  }, [postId]);

  useEffect(() => {
    async function fetchComments() {
      try {
        const data = await postService.getPostComments(postId);
        setComments(data);
      } catch {}
    }
    fetchComments();
  }, [postId]);

  const handleAddComment = async (e) => {
    e.preventDefault();
    setCommentLoading(true);
    setCommentError(null);
    try {
      await postService.addComment(postId, { content: commentContent });
      setCommentContent('');
      // Refresh comments
      const data = await postService.getPostComments(postId);
      setComments(data);
    } catch (err) {
      setCommentError('Failed to add comment');
    } finally {
      setCommentLoading(false);
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;
  if (!post) return <p>Post not found</p>;

  return (
    <div>
      {post.featuredImage && (
        <img
          src={post.featuredImage.startsWith('/uploads/') ? post.featuredImage : `/uploads/${post.featuredImage}`}
          alt="Featured"
          style={{ maxWidth: '100%', marginBottom: 16 }}
        />
      )}
      <h2>{post.title}</h2>
      <div style={{ color: '#888', fontSize: 14 }}>
        {post.category?.name} | {new Date(post.createdAt).toLocaleDateString()} | by {post.author?.username || 'Unknown'}
      </div>
      <div style={{ margin: '16px 0' }}>{post.content}</div>
      <h3>Comments</h3>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {comments.length === 0 && <li>No comments yet.</li>}
        {comments.map((c, i) => (
          <li key={i} style={{ borderBottom: '1px solid #eee', marginBottom: 8, paddingBottom: 8 }}>
            <div>{c.content}</div>
            <div style={{ color: '#aaa', fontSize: 12 }}>{c.createdAt ? new Date(c.createdAt).toLocaleString() : ''}</div>
          </li>
        ))}
      </ul>
      <form onSubmit={handleAddComment} style={{ marginTop: 16 }}>
        <textarea
          value={commentContent}
          onChange={e => setCommentContent(e.target.value)}
          placeholder="Add a comment..."
          rows={3}
          style={{ width: '100%', marginBottom: 8 }}
        />
        <br />
        <button type="submit" disabled={commentLoading || !commentContent.trim()}>
          {commentLoading ? 'Adding...' : 'Add Comment'}
        </button>
        {commentError && <div style={{ color: 'red' }}>{commentError}</div>}
      </form>
    </div>
  );
}
function PostForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isEdit = location.pathname.startsWith('/edit');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [featuredImage, setFeaturedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const cats = await categoryService.getAllCategories();
        setCategories(cats);
      } catch {}
    }
    fetchCategories();
  }, []);

  useEffect(() => {
    if (isEdit && id) {
      async function fetchPost() {
        setLoading(true);
        try {
          const data = await postService.getPost(id);
          setTitle(data.title || '');
          setContent(data.content || '');
          setCategory(data.category?._id || '');
          setImagePreview(data.featuredImage?.startsWith('/uploads/') ? data.featuredImage : `/uploads/${data.featuredImage}`);
        } catch (err) {
          setError('Failed to load post');
        } finally {
          setLoading(false);
        }
      }
      fetchPost();
    }
  }, [isEdit, id]);

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    setFeaturedImage(file);
    if (file) {
      const formData = new FormData();
      formData.append('featuredImage', file);
      try {
        setLoading(true);
        const res = await postService.uploadImage(formData);
        setImagePreview(res.filePath);
      } catch {
        setError('Image upload failed');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const postData = {
        title,
        content,
        category,
        featuredImage: imagePreview.replace('/uploads/', ''),
        author: JSON.parse(localStorage.getItem('user'))?._id || 'demo',
      };
      if (isEdit && id) {
        await postService.updatePost(id, postData);
      } else {
        await postService.createPost(postData);
      }
      navigate('/');
    } catch (err) {
      setError('Failed to save post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 600, margin: '0 auto' }}>
      <h2>{isEdit ? 'Edit Post' : 'Create Post'}</h2>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <div style={{ marginBottom: 12 }}>
        <label>Title</label>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
          style={{ width: '100%' }}
        />
      </div>
      <div style={{ marginBottom: 12 }}>
        <label>Content</label>
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          required
          rows={6}
          style={{ width: '100%' }}
        />
      </div>
      <div style={{ marginBottom: 12 }}>
        <label>Category</label>
        <select value={category} onChange={e => setCategory(e.target.value)} required style={{ width: '100%' }}>
          <option value="">Select category</option>
          {categories.map(cat => (
            <option key={cat._id} value={cat._id}>{cat.name}</option>
          ))}
        </select>
      </div>
      <div style={{ marginBottom: 12 }}>
        <label>Featured Image</label>
        <input type="file" accept="image/*" onChange={handleImageChange} />
        {imagePreview && (
          <div style={{ marginTop: 8 }}>
            <img src={imagePreview} alt="Preview" style={{ maxWidth: 200, maxHeight: 120 }} />
          </div>
        )}
      </div>
      <button type="submit" disabled={loading}>{loading ? 'Saving...' : isEdit ? 'Update Post' : 'Create Post'}</button>
    </form>
  );
}

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await authService.login({ email, password });
      setLoading(false);
      navigate('/');
      window.location.reload(); // To update nav user state
    } catch (err) {
      setError('Invalid credentials');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 400, margin: '0 auto' }}>
      <h2>Login</h2>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <div style={{ marginBottom: 12 }}>
        <label>Email</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required style={{ width: '100%' }} />
      </div>
      <div style={{ marginBottom: 12 }}>
        <label>Password</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} required style={{ width: '100%' }} />
      </div>
      <button type="submit" disabled={loading}>{loading ? 'Logging in...' : 'Login'}</button>
    </form>
  );
}

function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await authService.register({ username, email, password });
      setLoading(false);
      navigate('/login');
    } catch (err) {
      setError('Registration failed');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 400, margin: '0 auto' }}>
      <h2>Register</h2>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <div style={{ marginBottom: 12 }}>
        <label>Username</label>
        <input type="text" value={username} onChange={e => setUsername(e.target.value)} required style={{ width: '100%' }} />
      </div>
      <div style={{ marginBottom: 12 }}>
        <label>Email</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required style={{ width: '100%' }} />
      </div>
      <div style={{ marginBottom: 12 }}>
        <label>Password</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} required style={{ width: '100%' }} />
      </div>
      <button type="submit" disabled={loading}>{loading ? 'Registering...' : 'Register'}</button>
    </form>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<PostList />} />
          <Route path="posts/:id" element={<SinglePost />} />
          <Route path="create" element={<PostForm />} />
          <Route path="edit/:id" element={<PostForm />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
