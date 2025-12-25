// src/pages/RegisterPage.jsx 
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // FIXED: Handles lowercase logic specifically for email
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData({
      ...formData,
      // If the field name is 'email', convert to lowercase. Otherwise use value as is.
      [name]: name === 'email' ? value.toLowerCase() : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Basic Validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    const success = await register(formData.fullName, formData.email, formData.password);

    if (success) {
      navigate('/dashboard');
    } else {
      setError("Registration failed. Email might already be in use.");
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <h2 className="mb-6 text-center text-2xl font-bold text-gray-800">Create Account</h2>
        
        {error && (
          <div className="mb-4 rounded bg-red-100 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Full Name</label>
            <input
              type="text"
              name="fullName"
              required
              className="mt-1 block w-full rounded border border-gray-300 p-2 focus:border-blue-500 focus:outline-none"
              value={formData.fullName}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Email Address</label>
            <input
              type="email"
              name="email"
              required
              className="mt-1 block w-full rounded border border-gray-300 p-2 focus:border-blue-500 focus:outline-none"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              name="password"
              required
              className="mt-1 block w-full rounded border border-gray-300 p-2 focus:border-blue-500 focus:outline-none"
              value={formData.password}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              required
              className="mt-1 block w-full rounded border border-gray-300 p-2 focus:border-blue-500 focus:outline-none"
              value={formData.confirmPassword}
              onChange={handleChange}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full rounded bg-blue-600 px-4 py-2 font-bold text-white transition hover:bg-blue-700 ${
              loading ? 'cursor-not-allowed opacity-70' : ''
            }`}
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-blue-600 hover:underline">
                Log in
            </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;