import { useEffect, useMemo, useState } from 'react';
import { apiRequest } from './lib/api';
import { ADMIN_AUTH_STORAGE_KEY } from './lib/auth-storage';
import type { AdminMember, AdminSummary, AuthUser, NearbyPlace, Room } from './types';
import { AdminAuthCard } from './components/admin/AdminAuthCard';
import { AdminSidebar } from './components/admin/AdminSidebar';
import { RoomEditor, type RoomForm } from './components/admin/RoomEditor';
import styles from './components/admin/admin.module.css';

type DashboardResponse = {
  summary: AdminSummary;
  rooms: Room[];
  members: AdminMember[];
};

type LoginResponse = {
  token: string;
  user: AuthUser;
};

type SignupResponse = {
  token?: string;
  user?: AuthUser;
  message?: string;
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
  const [members, setMembers] = useState<AdminMember[]>([]);
  const [summary, setSummary] = useState<AdminSummary | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState('new');
  const [form, setForm] = useState<RoomForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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

    if (!['admin', 'superadmin'].includes(authResponse.user.role)) {
      throw new Error('This account does not have admin console access.');
    }

    setUser(authResponse.user);
    setToken(nextToken);
    window.localStorage.setItem(ADMIN_AUTH_STORAGE_KEY, JSON.stringify({ token: nextToken }));
    return authResponse.user;
  }

  async function loadDashboard(activeToken = token) {
    if (!activeToken) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await apiRequest<DashboardResponse>('/api/admin/dashboard', { token: activeToken });
      setRooms(response.rooms);
      setMembers(response.members);
      setSummary(response.summary);
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
      .then((nextUser) => {
        if (nextUser.approvalStatus === 'approved') {
          return loadDashboard(token);
        }

        setLoading(false);
        return undefined;
      })
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

  const pendingMembers = useMemo(
    () => members.filter((member) => member.role === 'admin' && member.approvalStatus === 'pending'),
    [members],
  );

  const featuredRooms = useMemo(() => rooms.filter((room) => room.featured).slice(0, 3), [rooms]);

  const latestUpdatedRoom = useMemo(() => {
    return [...rooms].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0] ?? null;
  }, [rooms]);

  async function login(payload: { email: string; password: string }) {
    const response = await apiRequest<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const nextUser = await hydrateAdmin(response.token);
    if (nextUser.approvalStatus === 'approved') {
      await loadDashboard(response.token);
    } else {
      setLoading(false);
    }
  }

  async function signup(payload: { name: string; email: string; mobileNumber: string; password: string }) {
    const response = await apiRequest<SignupResponse>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        ...payload,
        role: 'admin',
      }),
    });

    if (!response.token || !response.user) {
      return {
        message: response.message ?? 'Registration submitted for superadmin approval.',
        requiresApproval: true,
      };
    }

    const nextUser = await hydrateAdmin(response.token);
    if (nextUser.approvalStatus === 'approved') {
      await loadDashboard(response.token);
    }

    return {
      requiresApproval: false,
    };
  }

  function logout() {
    setToken(null);
    setUser(null);
    setRooms([]);
    setMembers([]);
    setSummary(null);
    setSelectedRoomId('new');
    setForm(emptyForm());
    setError('');
    setStatus('');
    setLoading(false);
    window.localStorage.removeItem(ADMIN_AUTH_STORAGE_KEY);
  }

  function updatePlace(index: number, key: keyof NearbyPlace, value: string) {
    setForm((current) => ({
      ...current,
      nearbyPlaces: current.nearbyPlaces.map((place, placeIndex) =>
        placeIndex === index
          ? {
              ...place,
              [key]: key === 'distanceKm' || key === 'walkMinutes' ? Number(value) : value,
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

  async function handleApproval(memberId: string, approvalStatus: 'approved' | 'rejected') {
    if (!token) {
      return;
    }

    setSaving(true);
    setStatus('');
    setError('');

    try {
      await apiRequest<{ message: string }>(`/api/admin/users/${memberId}/approval`, {
        method: 'PATCH',
        token,
        body: JSON.stringify({ status: approvalStatus }),
      });

      await loadDashboard(token);
      setStatus(
        approvalStatus === 'approved'
          ? 'Admin access approved successfully.'
          : 'Admin registration rejected successfully.',
      );
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to update approval status.');
    } finally {
      setSaving(false);
    }
  }

  if (!user) {
    return <AdminAuthCard onLogin={login} onSignup={signup} />;
  }

  if (user.approvalStatus !== 'approved') {
    return (
      <section className={styles.authShell}>
        <div className={styles.authPanel}>
          <div>
            <p className={styles.eyebrow}>Access status</p>
            <h1>
              {user.approvalStatus === 'rejected'
                ? 'Your admin registration was rejected.'
                : 'Your registration is waiting for superadmin approval.'}
            </h1>
            <p className={styles.heroCopy}>
              Signed in as {user.name}. Once approved, you will be able to create and manage only the rooms you own.
            </p>
          </div>
          <div className={styles.statusCardGrid}>
            <article>
              <span>Account role</span>
              <strong>{user.role}</strong>
            </article>
            <article>
              <span>Approval status</span>
              <strong>{user.approvalStatus}</strong>
            </article>
          </div>
          <button className={styles.ghostButton} type="button" onClick={logout}>
            Logout
          </button>
        </div>
      </section>
    );
  }

  const consoleRole: 'admin' | 'superadmin' = user.role === 'superadmin' ? 'superadmin' : 'admin';

  return (
    <main className={styles.adminShell}>
      <div className={styles.dashboardFrame}>
        <AdminSidebar
          rooms={rooms}
          selectedRoomId={selectedRoomId}
          loading={loading}
          userRole={consoleRole}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((current) => !current)}
          onSelect={setSelectedRoomId}
          onCreateNew={() => setSelectedRoomId('new')}
        />

        <div className={styles.dashboardBody}>
          <header className={styles.appHeader}>
            <div>
              <p className={styles.eyebrow}>{consoleRole === 'superadmin' ? 'Superadmin dashboard' : 'Admin dashboard'}</p>
              <h1 className={styles.appTitle}>Room Finder Control Center</h1>
              <p className={styles.headerCopy}>
                Track room inventory, manage listing quality, and keep operations moving from one clean workspace.
              </p>
            </div>

            <div className={styles.headerActions}>
              <div className={styles.profileCard}>
                <span className={styles.profileLabel}>Signed in</span>
                <strong>{user.name}</strong>
                <small>{user.email}</small>
              </div>
              <button className={styles.ghostButton} type="button" onClick={logout}>
                Logout
              </button>
            </div>
          </header>

          {error ? <p className={`${styles.notice} ${styles.error}`}>{error}</p> : null}
          {status ? <p className={`${styles.notice} ${styles.success}`}>{status}</p> : null}

          <section className={styles.dashboardMain}>
            <div className={styles.mainColumn}>
              <section className={styles.heroPanel}>
                <div className={styles.heroPanelContent}>
                  <p className={styles.eyebrow}>Operations overview</p>
                  <h2>
                    {consoleRole === 'superadmin'
                      ? 'Approve admins, monitor room supply, and keep every listing sharp.'
                      : 'Manage your inventory with a faster, cleaner dashboard flow.'}
                  </h2>
                  <p className={styles.heroCopy}>
                    {consoleRole === 'superadmin'
                      ? 'You have full visibility across admins and inventory. Use the dashboard to approve access and maintain listing quality.'
                      : 'You can create, edit, and publish only the listings owned by your account, with your work centered in the editor.'}
                  </p>
                  <div className={styles.heroBadgeRow}>
                    <span>{consoleRole === 'superadmin' ? 'Global control' : 'Owner workspace'}</span>
                    <span>{featuredRooms.length} featured live</span>
                    <span>{summary?.cities.length ?? 0} active cities</span>
                  </div>
                </div>
                <div className={styles.heroSpotlight}>
                  <span className={styles.spotlightLabel}>Latest update</span>
                  <strong>{latestUpdatedRoom?.title ?? 'No live rooms yet'}</strong>
                  <p>
                    {latestUpdatedRoom
                      ? `${latestUpdatedRoom.locality}, ${latestUpdatedRoom.city}`
                      : 'Create your first room listing to populate the dashboard.'}
                  </p>
                  <small>
                    {latestUpdatedRoom
                      ? `Updated ${new Date(latestUpdatedRoom.updatedAt).toLocaleDateString()}`
                      : 'Draft space ready'}
                  </small>
                </div>
              </section>

              <section className={styles.metricGrid}>
                <article className={styles.metricCard}>
                  <span>Total rooms</span>
                  <strong>{summary?.totalRooms ?? 0}</strong>
                  <small>{consoleRole === 'superadmin' ? 'Across all admins' : 'Rooms under your account'}</small>
                </article>
                <article className={styles.metricCard}>
                  <span>Featured rooms</span>
                  <strong>{summary?.featuredRooms ?? 0}</strong>
                  <small>Listings highlighted on the frontend</small>
                </article>
                <article className={styles.metricCard}>
                  <span>Average rent</span>
                  <strong>Rs. {summary?.avgPrice ?? 0}</strong>
                  <small>Blended across active inventory</small>
                </article>
                <article className={styles.metricCard}>
                  <span>{consoleRole === 'superadmin' ? 'Pending approvals' : 'Account status'}</span>
                  <strong>{consoleRole === 'superadmin' ? summary?.pendingApprovals ?? 0 : user.approvalStatus}</strong>
                  <small>
                    {consoleRole === 'superadmin' ? 'Admin signups waiting review' : 'Current access approval state'}
                  </small>
                </article>
              </section>

              <section className={styles.workspaceBar}>
                <div>
                  <p className={styles.sectionLabel}>Workspace</p>
                  <strong>{selectedRoom ? `Editing ${selectedRoom.title}` : 'Preparing a new room draft'}</strong>
                </div>
                <div>
                  <p className={styles.sectionLabel}>Permissions</p>
                  <strong>{consoleRole === 'superadmin' ? 'Can manage all rooms and users' : 'Can manage only owned rooms'}</strong>
                </div>
                <div>
                  <p className={styles.sectionLabel}>Visibility</p>
                  <strong>{selectedRoom?.featured ? 'Featured on frontend' : 'Standard listing'}</strong>
                </div>
              </section>

              {consoleRole === 'superadmin' ? (
                <section className={styles.approvalPanel}>
                  <div className={styles.approvalPanelHeader}>
                    <div>
                      <p className={styles.eyebrow}>Access approvals</p>
                      <h2>{pendingMembers.length} pending admin request{pendingMembers.length === 1 ? '' : 's'}</h2>
                    </div>
                    <p className={styles.heroCopy}>Approve trusted admins so they can manage only their own room inventory.</p>
                  </div>

                  <div className={styles.memberList}>
                    {pendingMembers.length === 0 ? (
                      <div className={styles.emptyApprovalState}>No pending admin approvals right now.</div>
                    ) : (
                      pendingMembers.map((member) => (
                        <article key={member.id} className={styles.memberCard}>
                          <div className={styles.memberIdentity}>
                            <div className={styles.memberAvatar}>
                              {member.name
                                .split(' ')
                                .map((part) => part[0])
                                .join('')
                                .slice(0, 2)
                                .toUpperCase()}
                            </div>
                            <div>
                              <strong>{member.name}</strong>
                              <span>Admin access request</span>
                            </div>
                          </div>
                          <div className={styles.memberLookupGrid}>
                            <div className={styles.lookupItem}>
                              <p>Email</p>
                              <strong>{member.email}</strong>
                            </div>
                            <div className={styles.lookupItem}>
                              <p>Mobile</p>
                              <strong>{member.mobileNumber || 'Not provided'}</strong>
                            </div>
                            <div className={styles.lookupItem}>
                              <p>Status</p>
                              <strong>{member.approvalStatus}</strong>
                            </div>
                            <div className={styles.lookupItem}>
                              <p>Requested on</p>
                              <strong>{new Date(member.createdAt).toLocaleDateString()}</strong>
                            </div>
                          </div>
                          <div className={styles.memberActions}>
                            <button
                              className={styles.primaryButton}
                              type="button"
                              onClick={() => handleApproval(member.id, 'approved')}
                              disabled={saving}
                            >
                              Approve
                            </button>
                            <button
                              className={styles.dangerButton}
                              type="button"
                              onClick={() => handleApproval(member.id, 'rejected')}
                              disabled={saving}
                            >
                              Reject
                            </button>
                          </div>
                        </article>
                      ))
                    )}
                  </div>
                </section>
              ) : null}

              <RoomEditor
                selectedRoom={selectedRoom}
                form={form}
                saving={saving}
                currentUserRole={consoleRole}
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
            </div>

            <aside className={styles.rightRail}>
              <section className={styles.railCard}>
                <div className={styles.railCardHeader}>
                  <div>
                    <p className={styles.sectionLabel}>Quick summary</p>
                    <strong>{consoleRole === 'superadmin' ? 'Team and inventory' : 'Publishing snapshot'}</strong>
                  </div>
                </div>
                <div className={styles.railStack}>
                  <div className={styles.railStat}>
                    <span>Cities covered</span>
                    <strong>{summary?.cities.length ?? 0}</strong>
                  </div>
                  <div className={styles.railStat}>
                    <span>{consoleRole === 'superadmin' ? 'Team members' : 'Draft mode'}</span>
                    <strong>{consoleRole === 'superadmin' ? summary?.totalMembers ?? 0 : selectedRoom ? 'Live edit' : 'New room'}</strong>
                  </div>
                  <div className={styles.railStat}>
                    <span>Selected room</span>
                    <strong>{selectedRoom?.title ?? 'Untitled draft'}</strong>
                  </div>
                </div>
              </section>

              <section className={styles.railCard}>
                <div className={styles.railCardHeader}>
                  <div>
                    <p className={styles.sectionLabel}>Featured now</p>
                    <strong>Best performing picks</strong>
                  </div>
                </div>
                <div className={styles.featureList}>
                  {featuredRooms.length === 0 ? (
                    <p className={styles.emptyApprovalState}>No featured rooms yet. Mark a listing as featured to highlight it here.</p>
                  ) : (
                    featuredRooms.map((room) => (
                      <button
                        key={room._id}
                        type="button"
                        className={styles.featureItem}
                        onClick={() => setSelectedRoomId(room._id)}
                      >
                        <strong>{room.title}</strong>
                        <span>{room.locality}, {room.city}</span>
                        <small>Rs. {room.price} per month</small>
                      </button>
                    ))
                  )}
                </div>
              </section>
            </aside>
          </section>

          <footer className={styles.appFooter}>
            <span>Room Finder Admin Dashboard</span>
            <span>{consoleRole === 'superadmin' ? 'Full access control enabled' : 'Owner-managed workspace enabled'}</span>
          </footer>
        </div>
      </div>
    </main>
  );
}

export default App;
