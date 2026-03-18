import { useEffect, useMemo, useState } from 'react';
import { apiRequest } from './lib/api';
import { ADMIN_AUTH_STORAGE_KEY } from './lib/auth-storage';
import type { AdminSummary, AuthUser, NearbyPlace, Room } from './types';
import { AdminAuthCard } from './components/admin/AdminAuthCard';
import { AdminSidebar } from './components/admin/AdminSidebar';
import { RoomEditor, type RoomForm } from './components/admin/RoomEditor';
import styles from './components/admin/admin.module.css';

type RoomsResponse = {
  rooms: Room[];
};

type SummaryResponse = {
  summary: AdminSummary;
  latestRooms: Room[];
};

function emptyForm(): RoomForm {
  return {
    title: '',
    city: '',
    locality: '',
    address: '',
    price: '10000',
    deposit: '20000',
    rating: '4.5',
    reviewCount: '0',
    occupancy: 'Single',
    roomType: 'Private Room',
    gender: 'Any',
    availableFrom: new Date().toISOString().slice(0, 10),
    seatsLeft: '1',
    description: '',
    heroTag: 'Fresh listing',
    image:
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
    amenities: 'Wi-Fi, Power backup',
    rules: 'ID verification mandatory',
    transit: 'Nearby bus stop within 5 minutes',
    featured: false,
    nearbyPlaces: [
      {
        id: `draft_${Date.now()}`,
        name: '',
        category: 'Famous Shop',
        distanceKm: 0.4,
        walkMinutes: 5,
        highlight: '',
      },
    ],
  };
}

function formFromRoom(room: Room): RoomForm {
  return {
    title: room.title,
    city: room.city,
    locality: room.locality,
    address: room.address,
    price: String(room.price),
    deposit: String(room.deposit),
    rating: String(room.rating),
    reviewCount: String(room.reviewCount),
    occupancy: room.occupancy,
    roomType: room.roomType,
    gender: room.gender,
    availableFrom: room.availableFrom,
    seatsLeft: String(room.seatsLeft),
    description: room.description,
    heroTag: room.heroTag,
    image: room.image,
    amenities: room.amenities.join(', '),
    rules: room.rules.join(', '),
    transit: room.transit.join(', '),
    featured: room.featured,
    nearbyPlaces: room.nearbyPlaces.map((place) => ({ ...place })),
  };
}

function App() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [summary, setSummary] = useState<AdminSummary | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState('new');
  const [form, setForm] = useState<RoomForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const raw = window.localStorage.getItem(ADMIN_AUTH_STORAGE_KEY);
    if (!raw) {
      setLoading(false);
      return;
    }

    try {
      const parsed = JSON.parse(raw) as { token: string };
      setToken(parsed.token);
    } catch (_error) {
      window.localStorage.removeItem(ADMIN_AUTH_STORAGE_KEY);
      setLoading(false);
    }
  }, []);

  async function hydrateAdmin(nextToken: string) {
    const authResponse = await apiRequest<{ user: AuthUser }>('/api/auth/me', { token: nextToken });

    if (authResponse.user.role !== 'admin') {
      throw new Error('This account is not an admin.');
    }

    setUser(authResponse.user);
    setToken(nextToken);
    window.localStorage.setItem(ADMIN_AUTH_STORAGE_KEY, JSON.stringify({ token: nextToken }));
  }

  async function loadDashboard(activeToken = token) {
    if (!activeToken) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const [roomsResponse, summaryResponse] = await Promise.all([
        apiRequest<RoomsResponse>('/api/rooms', { token: activeToken }),
        apiRequest<SummaryResponse>('/api/admin/summary', { token: activeToken }),
      ]);

      setRooms(roomsResponse.rooms);
      setSummary(summaryResponse.summary);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load admin data.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!token) {
      return;
    }

    hydrateAdmin(token)
      .then(() => loadDashboard(token))
      .catch((requestError) => {
        setError(requestError instanceof Error ? requestError.message : 'Unable to authenticate.');
        setToken(null);
        setUser(null);
        window.localStorage.removeItem(ADMIN_AUTH_STORAGE_KEY);
        setLoading(false);
      });
  }, [token]);

  useEffect(() => {
    if (selectedRoomId === 'new') {
      setForm(emptyForm());
      return;
    }

    const room = rooms.find((item) => item._id === selectedRoomId);
    if (room) {
      setForm(formFromRoom(room));
    }
  }, [rooms, selectedRoomId]);

  const selectedRoom = useMemo(
    () => rooms.find((room) => room._id === selectedRoomId) ?? null,
    [rooms, selectedRoomId],
  );

  async function login(payload: { email: string; password: string }) {
    const response = await apiRequest<{ token: string; user: AuthUser }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    await hydrateAdmin(response.token);
    await loadDashboard(response.token);
  }

  async function signup(payload: { name: string; email: string; password: string; inviteCode: string }) {
    const response = await apiRequest<{ token: string; user: AuthUser }>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        ...payload,
        role: 'admin',
      }),
    });

    await hydrateAdmin(response.token);
    await loadDashboard(response.token);
  }

  function logout() {
    setToken(null);
    setUser(null);
    setRooms([]);
    setSummary(null);
    setSelectedRoomId('new');
    setForm(emptyForm());
    window.localStorage.removeItem(ADMIN_AUTH_STORAGE_KEY);
  }

  function updatePlace(index: number, key: keyof NearbyPlace, value: string) {
    setForm((current) => ({
      ...current,
      nearbyPlaces: current.nearbyPlaces.map((place, placeIndex) =>
        placeIndex === index
          ? {
              ...place,
              [key]:
                key === 'distanceKm' || key === 'walkMinutes'
                  ? Number(value)
                  : value,
            }
          : place,
      ),
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;

    setSaving(true);
    setStatus('');
    setError('');

    const payload = {
      ...form,
      price: Number(form.price),
      deposit: Number(form.deposit),
      rating: Number(form.rating),
      reviewCount: Number(form.reviewCount),
      seatsLeft: Number(form.seatsLeft),
    };

    try {
      await apiRequest(selectedRoom ? `/api/rooms/${selectedRoom._id}` : '/api/rooms', {
        method: selectedRoom ? 'PUT' : 'POST',
        token,
        body: JSON.stringify(payload),
      });

      await loadDashboard(token);
      setStatus(selectedRoom ? 'Room updated successfully.' : 'Room created successfully.');
      if (!selectedRoom) {
        setSelectedRoomId('new');
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to save room.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!selectedRoom || !token) {
      return;
    }

    const confirmed = window.confirm(`Delete "${selectedRoom.title}"?`);
    if (!confirmed) {
      return;
    }

    setSaving(true);
    setStatus('');
    setError('');

    try {
      await apiRequest(`/api/rooms/${selectedRoom._id}`, {
        method: 'DELETE',
        token,
      });

      await loadDashboard(token);
      setSelectedRoomId('new');
      setStatus('Room deleted successfully.');
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Unable to delete room.');
    } finally {
      setSaving(false);
    }
  }

  if (!user) {
    return <AdminAuthCard onLogin={login} onSignup={signup} />;
  }

  return (
    <main className={styles.adminShell}>
      <section className={styles.adminHero}>
        <div>
          <p className={styles.eyebrow}>Admin console</p>
          <h1>Manage room listings, nearby famous places, and live availability.</h1>
          <p className={styles.heroCopy}>
            Logged in as {user.name}. This dashboard updates the same MongoDB-backed backend used by
            the public room finder.
          </p>
          <button className={styles.ghostButton} type="button" onClick={logout}>
            Logout
          </button>
        </div>

        <div className={styles.statsGrid}>
          <article>
            <span>Total rooms</span>
            <strong>{summary?.totalRooms ?? 0}</strong>
          </article>
          <article>
            <span>Featured</span>
            <strong>{summary?.featuredRooms ?? 0}</strong>
          </article>
          <article>
            <span>Total users</span>
            <strong>{summary?.totalUsers ?? 0}</strong>
          </article>
          <article>
            <span>Admins</span>
            <strong>{summary?.admins ?? 0}</strong>
          </article>
        </div>
      </section>

      {error ? <p className={`${styles.notice} ${styles.error}`}>{error}</p> : null}
      {status ? <p className={`${styles.notice} ${styles.success}`}>{status}</p> : null}

      <section className={styles.adminLayout}>
        <AdminSidebar
          rooms={rooms}
          selectedRoomId={selectedRoomId}
          loading={loading}
          onSelect={setSelectedRoomId}
          onCreateNew={() => setSelectedRoomId('new')}
        />

        <RoomEditor
          selectedRoom={selectedRoom}
          form={form}
          saving={saving}
          onSubmit={handleSubmit}
          onDelete={handleDelete}
          onChange={(key, value) => setForm((current) => ({ ...current, [key]: value }))}
          onAddPlace={() =>
            setForm((current) => ({
              ...current,
              nearbyPlaces: [
                ...current.nearbyPlaces,
                {
                  id: `draft_${Date.now()}_${current.nearbyPlaces.length}`,
                  name: '',
                  category: 'Cafe',
                  distanceKm: 0.5,
                  walkMinutes: 6,
                  highlight: '',
                },
              ],
            }))
          }
          onRemovePlace={(index) =>
            setForm((current) => ({
              ...current,
              nearbyPlaces: current.nearbyPlaces.filter((_, placeIndex) => placeIndex !== index),
            }))
          }
          onPlaceChange={updatePlace}
        />
      </section>
    </main>
  );
}

export default App;
