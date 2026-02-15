import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, LogIn, UserPlus } from 'lucide-react';

export default function AuthPage() {
    const location = useLocation();
    const [isSignUp, setIsSignUp] = useState(location.state?.isSignUp || false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { signIn, signUp } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isSignUp) {
                await signUp(email, password);
                navigate('/');
            } else {
                await signIn(email, password);
                navigate('/');
            }
        } catch (err) {
            setError(err.message || 'Failed to authenticate');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-header">
                    <div className="auth-logo">🧼</div>
                    <h1 className="auth-title">
                        {isSignUp ? 'Create Account' : 'Welcome Back'}
                    </h1>
                    <p className="auth-subtitle">
                        {isSignUp
                            ? 'Join SoapBuddy to start managing your soap business'
                            : 'Sign in to access your dashboard'}
                    </p>
                </div>

                {error && (
                    <div className="auth-error">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="auth-field">
                        <div className="auth-field-icon">
                            <Mail size={18} />
                        </div>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="auth-input"
                            placeholder="Email address"
                        />
                    </div>

                    <div className="auth-field">
                        <div className="auth-field-icon">
                            <Lock size={18} />
                        </div>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="auth-input"
                            placeholder="Password"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="auth-submit-btn"
                    >
                        {loading ? (
                            <span className="auth-spinner"></span>
                        ) : isSignUp ? (
                            <>
                                <UserPlus size={18} />
                                <span>Sign Up</span>
                            </>
                        ) : (
                            <>
                                <LogIn size={18} />
                                <span>Sign In</span>
                            </>
                        )}
                    </button>
                </form>

                <div className="auth-toggle">
                    <p>
                        {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                        <button
                            onClick={() => setIsSignUp(!isSignUp)}
                            className="auth-toggle-btn"
                        >
                            {isSignUp ? 'Sign In' : 'Sign Up'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}
