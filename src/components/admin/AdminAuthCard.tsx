import { useState } from 'react';
import styles from './admin.module.css';

type Props = {
  onLogin: (payload: { email: string; password: string }) => Promise<void>;
  onSignup: (payload: {
    name: string;
    email: string;
    password: string;
    inviteCode: string;
  }) => Promise<void>;
};

export function AdminAuthCard({ onLogin, onSignup }: Props) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      if (mode === 'signup') {
        await onSignup({ name, email, password, inviteCode });
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
        </div>

        <div className={styles.authTabs}>
          <button
            type="button"
            className={mode === 'login' ? styles.authTabActive : styles.authTab}
            onClick={() => setMode('login')}
          >
            Login
          </button>
          {/* <button
            type="button"
            className={mode === 'signup' ? styles.authTabActive : styles.authTab}
            onClick={() => setMode('signup')}
          >
            Signup
          </button> */}
        </div>

        <form className={styles.authForm} onSubmit={handleSubmit}>
          {/* {mode === 'signup' ? (
            <label>
              <span>Name</span>
              <input value={name} onChange={(event) => setName(event.target.value)} />
            </label>
          ) : null} */}
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
          {mode === 'signup' ? (
            <label>
              <span>Admin invite code</span>
              <input
                type="password"
                value={inviteCode}
                onChange={(event) => setInviteCode(event.target.value)}
              />
            </label>
          ) : null}
          {error ? <p className={`${styles.notice} ${styles.error}`}>{error}</p> : null}
          <button className={styles.primaryButton} type="submit" disabled={saving}>
            {saving ? 'Please wait...' : mode === 'login' ? 'Login' : 'Create admin account'}
          </button>
        </form>
      </div>
    </section>
  );
}
