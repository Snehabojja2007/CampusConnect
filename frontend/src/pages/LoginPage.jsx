import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AlertBanner from '../components/AlertBanner';
import { extractErrorMessage } from '../utils/formatters';

const HERO_IMAGE = '/src/assets/images/campus_courtyard_hero_1795011197991.jpg';

export default function LoginPage() {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';
  const registeredSuccess = location.state?.registeredMessage || '';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [errorMessage, setErrorMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const validate = () => {
    const errors = {};
    if (!email.trim()) {
      errors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'Enter a valid email address.';
    }
    if (!password) {
      errors.password = 'Password is required.';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    if (!validate()) return;

    try {
      setSubmitting(true);
      await login(email.trim(), password);
      navigate(from, { replace: true });
    } catch (error) {
      setErrorMessage(extractErrorMessage(error, 'Sign in failed. Check your credentials.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <section className="auth-showcase" aria-label="Platform overview">
        {!imgFailed && (
          <img
            src={HERO_IMAGE}
            alt="CampusConnect university courtyard"
            className="auth-showcase-media"
            referrerPolicy="no-referrer"
            onError={() => setImgFailed(true)}
          />
        )}
        <div className="auth-showcase-scrim" aria-hidden="true" />

        <div className="auth-showcase-content">
          <div className="auth-showcase-brand">CampusConnect</div>
        </div>

        <div className="auth-showcase-content">
          <h1 className="auth-showcase-headline">Campus Lost &amp; Found, Organized.</h1>
          <p className="auth-showcase-copy">
            Report misplaced belongings, discover verified matches across campus buildings, and
            complete secure security-desk handovers in one unified workflow.
          </p>
          <ul className="auth-showcase-list">
            <li>01. Moderated Lost &amp; Found item registries</li>
            <li>02. Automated title, location, and date matching</li>
            <li>03. Role-based Claim verification and Handover tracking</li>
          </ul>
        </div>
      </section>

      <section className="auth-form-pane">
        <div className="auth-card">
          <div>
            <h2 className="auth-card-title">Sign in to CampusConnect</h2>
            <p className="auth-card-subtitle">
              Use your campus email and password to access your workspace.
            </p>
          </div>

          {registeredSuccess && <AlertBanner type="success" message={registeredSuccess} />}
          <AlertBanner
            type="error"
            message={errorMessage}
            onClose={() => setErrorMessage('')}
          />

          <form className="form-grid" onSubmit={handleSubmit} noValidate>
            <div className="field">
              <label className="field-label" htmlFor="login-email">
                Email Address <span className="field-required">*</span>
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                className={`input ${fieldErrors.email ? 'input-error' : ''}`}
                placeholder="student@campus.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {fieldErrors.email && <span className="field-error">{fieldErrors.email}</span>}
            </div>

            <div className="field">
              <label className="field-label" htmlFor="login-password">
                Password <span className="field-required">*</span>
              </label>
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                className={`input ${fieldErrors.password ? 'input-error' : ''}`}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {fieldErrors.password && <span className="field-error">{fieldErrors.password}</span>}
            </div>

            <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
              {submitting ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <p className="auth-footer-link">
            New to CampusConnect? <Link to="/register">Create an account</Link>
          </p>
        </div>
      </section>
    </div>
  );
}
