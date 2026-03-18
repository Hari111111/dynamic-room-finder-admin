import { useState } from 'react';
import styles from './admin.module.css';

type Props = {
  onLogin: (payload: { email: string; password: string }) => Promise<void>;
  onSignup: (payload: {
    name: string;
    email: string;
    mobileNumber: string;
    password: string;
  }) => Promise<{ message?: string; requiresApproval?: boolean } | void>;
};

export function AdminAuthCard({ onLogin, onSignup }: Props) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');

    try {
      if (mode === 'signup') {
        const result = await onSignup({ name, email, mobileNumber, password });

        if (result?.requiresApproval) {
          setNotice(result.message ?? 'Registration submitted for superadmin approval.');
          setMode('login');
          setPassword('');
          setMobileNumber('');
          return;
        }
      } else {
        await onLogin({ email, password });
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to continue.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className={styles.authShell}>
      <div className={styles.authPanel}>
        <div>
          <p className={styles.eyebrow}>Admin access</p>
          <div className={styles.heroBadgeRow}>
            <span>Secure access</span>
            <span>Editor workspace</span>
            <span>Frontend sync</span>
          </div>
          <h3>Login or create an admin account to manage live room listings.</h3>
          <p className={styles.heroCopy}>
            New admin registrations are reviewed by a superadmin before room access is enabled.
          </p>
        </div>

        <div className={styles.authTabs}>
          <button
            type="button"
            className={mode === 'login' ? styles.authTabActive : styles.authTab}
            onClick={() => setMode('login')}
          >
            Login
          </button>
          <button
            type="button"
            className={mode === 'signup' ? styles.authTabActive : styles.authTab}
            onClick={() => setMode('signup')}
          >
            Signup
          </button>
        </div>

        <form className={styles.authForm} onSubmit={handleSubmit}>
          {mode === 'signup' ? (
            <label>
              <span>Name</span>
              <input value={name} onChange={(event) => setName(event.target.value)} />
            </label>
          ) : null}
          {mode === 'signup' ? (
            <label>
              <span>Mobile number</span>
              <input
                type="tel"
                value={mobileNumber}
                onChange={(event) => setMobileNumber(event.target.value)}
                placeholder="9876543210"
              />
            </label>
          ) : null}
          <label>
            <span>Email</span>
            <input value={email} onChange={(event) => setEmail(event.target.value)} />
          </label>
          <label>
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          {notice ? <p className={`${styles.notice} ${styles.success}`}>{notice}</p> : null}
          {error ? <p className={`${styles.notice} ${styles.error}`}>{error}</p> : null}
          <button className={styles.primaryButton} type="submit" disabled={saving}>
            {saving ? 'Please wait...' : mode === 'login' ? 'Login' : 'Create admin account'}
          </button>
        </form>
      </div>
    </section>
  );
}
