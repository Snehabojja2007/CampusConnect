import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AlertBanner from '../components/AlertBanner';
import { extractErrorMessage, extractFieldErrors } from '../utils/formatters';

const HERO_IMAGE = '/src/assets/images/campus_courtyard_hero_1795011197991.jpg';

export default function RegisterPage() {
  const { isAuthenticated, register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'STUDENT',
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [errorMessage, setErrorMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const validate = () => {
    const errors = {};
    if (!form.name.trim()) {
      errors.name = 'Full name is required.';
    }
    if (!form.email.trim()) {
      errors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errors.email = 'Enter a valid email address.';
    }
    if (!form.password) {
      errors.password = 'Password is required.';
    } else if (form.password.length < 6) {
      errors.password = 'Password must be at least 6 characters.';
    }
    if (!form.role) {
      errors.role = 'Account role is required.';
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
      await register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
      });
      navigate('/login', {
        replace: true,
        state: {
          registeredMessage: 'Account created successfully. Please sign in with your credentials.',
        },
      });
    } catch (error) {
      const backendFields = extractFieldErrors(error);
      if (Object.keys(backendFields).length > 0) {
        setFieldErrors(backendFields);
      }
      setErrorMessage(extractErrorMessage(error, 'Registration failed. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <section className="auth-showcase" aria-label="CampusConnect registration details">
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
          <h1 className="auth-showcase-headline">Role-Based Campus Recovery</h1>
          <p className="auth-showcase-copy">
            Register as a Student, Security Officer, or Administrator to collaborate across every
            stage of item recovery and handover verification.
          </p>
          <ul className="auth-showcase-list">
            <li>Student — Report lost/found items, run matches, and submit claims</li>
            <li>Security — Review claims and execute verified item handovers</li>
            <li>Admin — Moderate submissions, oversee claims, and manage accounts</li>
          </ul>
        </div>
      </section>

      <section className="auth-form-pane">
        <div className="auth-card">
          <div>
            <h2 className="auth-card-title">Create your account</h2>
            <p className="auth-card-subtitle">
              Fill in your details below to register on CampusConnect.
            </p>
          </div>

          <AlertBanner
            type="error"
            message={errorMessage}
            onClose={() => setErrorMessage('')}
          />

          <form className="form-grid" onSubmit={handleSubmit} noValidate>
            <div className="field">
              <label className="field-label" htmlFor="reg-name">
                Full Name <span className="field-required">*</span>
              </label>
              <input
                id="reg-name"
                type="text"
                autoComplete="name"
                className={`input ${fieldErrors.name ? 'input-error' : ''}`}
                placeholder="Sneha Bojja"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              />
              {fieldErrors.name && <span className="field-error">{fieldErrors.name}</span>}
            </div>

            <div className="field">
              <label className="field-label" htmlFor="reg-email">
                Email Address <span className="field-required">*</span>
              </label>
              <input
                id="reg-email"
                type="email"
                autoComplete="email"
                className={`input ${fieldErrors.email ? 'input-error' : ''}`}
                placeholder="name@campus.edu"
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              />
              {fieldErrors.email && <span className="field-error">{fieldErrors.email}</span>}
            </div>

            <div className="field">
              <label className="field-label" htmlFor="reg-password">
                Password <span className="field-required">*</span>
              </label>
              <input
                id="reg-password"
                type="password"
                autoComplete="new-password"
                className={`input ${fieldErrors.password ? 'input-error' : ''}`}
                placeholder="Minimum 6 characters"
                value={form.password}
                onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
              />
              {fieldErrors.password && <span className="field-error">{fieldErrors.password}</span>}
            </div>

            <div className="field">
              <label className="field-label" htmlFor="reg-role">
                Role <span className="field-required">*</span>
              </label>
              <select
                id="reg-role"
                className={`select ${fieldErrors.role ? 'input-error' : ''}`}
                value={form.role}
                onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))}
              >
                <option value="STUDENT">Student</option>
                <option value="SECURITY">Security</option>
                <option value="ADMIN">Admin</option>
              </select>
              {fieldErrors.role && <span className="field-error">{fieldErrors.role}</span>}
            </div>

            <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
              {submitting ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <p className="auth-footer-link">
            Already registered? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </section>
    </div>
  );
}
