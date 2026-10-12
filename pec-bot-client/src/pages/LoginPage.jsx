import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ShieldAlert, LogIn, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';

  const googleButtonRef = useRef(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) {
      navigate(redirect, { replace: true });
    }
  }, [user, navigate, redirect]);

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '525912195711-gspvd24nog749cf3lg7hti2s0pc14p12.apps.googleusercontent.com';

    const initGoogle = () => {
      if (window.google?.accounts?.id && googleButtonRef.current) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse,
          hosted_domain: 'pec.edu.in',
        });
        window.google.accounts.id.renderButton(googleButtonRef.current, {
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          width: 320,
          shape: 'rectangular',
        });
      }
    };

    if (window.google?.accounts?.id) {
      initGoogle();
    } else {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.onload = initGoogle;
      document.head.appendChild(script);
    }
  }, []);

  const handleCredentialResponse = async (response) => {
    try {
      setBusy(true);
      setError(null);
      await login(response.credential);
      navigate(redirect, { replace: true });
    } catch (err) {
      setError(err?.error || err?.message || 'Authentication failed. Please sign in with your official @pec.edu.in ID.');
    } finally {
      setBusy(false);
    }
  };

  const handleDevLogin = async () => {
    try {
      setBusy(true);
      setError(null);
      const res = await fetch('/api/auth/dev-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Dev login failed');
      window.location.href = redirect;
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: '#F6F6F7',
      color: '#0F172A',
      fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
    }}>
      {/* ─── Top Navbar (matches roboticspec.com navbar structure) ─── */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        width: '100%',
        borderBottom: '1px solid #E2E8F0',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(8px)',
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '0 24px',
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          {/* Logo & Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
              <img
                src="/pec-logo.png"
                alt="PEC Logo"
                style={{ height: '36px', width: 'auto', objectFit: 'contain' }}
              />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A', letterSpacing: '-0.01em', lineHeight: 1.2 }}>
                  Punjab Engineering College
                </span>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Student AI Assistant
                </span>
              </div>
            </a>
          </div>

          {/* Nav links */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <span style={{
              fontSize: '12px',
              fontWeight: 600,
              color: '#059669',
              background: '#ECFDF5',
              padding: '4px 10px',
              borderRadius: '999px',
              border: '1px solid #A7F3D0'
            }}>
              PEC Verified Domain
            </span>
          </nav>
        </div>
      </header>

      {/* ─── Main Section (Login Box aligned with roboticspec.com) ─── */}
      <main style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 16px',
      }}>
        <div style={{
          width: '100%',
          maxWidth: '440px',
          background: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
          overflow: 'hidden',
        }}>
          {/* Header of the Card */}
          <div style={{
            padding: '36px 32px 28px',
            textAlign: 'center',
            borderBottom: '1px solid #F1F5F9',
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: '#FEF2F2',
              color: '#991B1B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <LogIn size={24} />
            </div>
            <h2 style={{ margin: '0 0 8px', fontSize: '22px', fontWeight: 700, color: '#0F172A' }}>
              Sign in to your account
            </h2>
            <p style={{ margin: 0, fontSize: '13.5px', color: '#64748B', lineHeight: 1.5 }}>
              Use your official Punjab Engineering College email ID to proceed.
            </p>
          </div>

          {/* Form / Google Action Container */}
          <div style={{
            padding: '32px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}>
            {error && (
              <div style={{
                width: '100%',
                marginBottom: '20px',
                padding: '14px 16px',
                background: '#FFF1F2',
                border: '1px solid #FECDD3',
                borderRadius: '8px',
                color: '#E11D48',
                fontSize: '13px',
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start',
              }}>
                <ShieldAlert size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{error}</span>
              </div>
            )}

            {/* Google Identity Services Button */}
            <div
              ref={googleButtonRef}
              style={{
                width: '100%',
                maxWidth: '320px',
                minHeight: '44px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              {busy ? (
                <span style={{ fontSize: '13px', color: '#64748B' }}>Signing you in...</span>
              ) : null}
            </div>

            {/* Test Login fallback */}
            <button
              onClick={handleDevLogin}
              disabled={busy}
              style={{
                marginTop: '16px',
                width: '100%',
                maxWidth: '320px',
                padding: '9px 16px',
                borderRadius: '6px',
                border: '1px solid #E2E8F0',
                background: '#F8FAFC',
                color: '#334155',
                fontSize: '12.5px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 150ms ease',
              }}
              onMouseOver={(e) => { e.currentTarget.style.background = '#F1F5F9'; }}
              onMouseOut={(e) => { e.currentTarget.style.background = '#F8FAFC'; }}
            >
              <span>Continue as test student (Dev Mode)</span>
              <ArrowRight size={14} />
            </button>

            <p style={{
              marginTop: '28px',
              fontSize: '12px',
              color: '#94A3B8',
              textAlign: 'center',
              lineHeight: 1.5,
              maxWidth: '320px',
            }}>
              By signing in, you agree to PEC Information Security Guidelines. Only <strong>@pec.edu.in</strong> accounts are authorized.
            </p>
          </div>
        </div>
      </main>

      {/* ─── Footer matching roboticspec.com footer structure ─── */}
      <footer style={{
        borderTop: '1px solid #E2E8F0',
        backgroundColor: '#FFFFFF',
        padding: '24px 16px',
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          fontSize: '12.5px',
          color: '#64748B',
        }}>
          <div>
            &copy; {new Date().getFullYear()} Punjab Engineering College (Deemed to be University), Sector 12, Chandigarh.
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <span style={{ color: '#94A3B8' }}>AI Chatbot Portal</span>
            <span>&bull;</span>
            <span style={{ color: '#94A3B8' }}>Syncloop Connected</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
