import type { Room } from '../../types';
import styles from './admin.module.css';

type Props = {
  rooms: Room[];
  selectedRoomId: string;
  loading: boolean;
  userRole: 'admin' | 'superadmin';
  collapsed: boolean;
  onToggleCollapse: () => void;
  onSelect: (roomId: string) => void;
  onCreateNew: () => void;
};

export function AdminSidebar({
  rooms,
  selectedRoomId,
  loading,
  userRole,
  collapsed,
  onToggleCollapse,
  onSelect,
  onCreateNew,
}: Props) {
  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.sidebarCollapsed : ''}`}>
      <div className={styles.sidebarTop}>
        <button className={styles.sidebarToggle} type="button" onClick={onToggleCollapse}>
          {collapsed ? 'Open' : 'Close'}
        </button>
        {!collapsed ? (
          <div className={styles.sidebarBrand}>
            <p className={styles.eyebrow}>Admin panel</p>
            <h2>Control</h2>
          </div>
        ) : null}
      </div>

      <button className={styles.primaryButton} type="button" onClick={onCreateNew}>
        {collapsed ? '+' : 'New room'}
      </button>

      {!collapsed ? (
        <div className={styles.sidebarSection}>
          <p className={styles.sectionLabel}>Navigation</p>
          <div className={styles.sidebarMenu}>
            <div className={styles.sidebarNavItem}>Dashboard home</div>
            <div className={styles.sidebarNavItem}>Room editor</div>
            {userRole === 'superadmin' ? <div className={styles.sidebarNavItem}>Admin approvals</div> : null}
          </div>
        </div>
      ) : null}

      <div className={styles.sidebarHeader}>
        <div>
          {!collapsed ? <p className={styles.eyebrow}>Inventory</p> : null}
          <h2>{loading ? '...' : `${rooms.length}`}</h2>
          {!collapsed ? <span className={styles.sidebarHeaderText}>live listings</span> : null}
        </div>
      </div>

      <div className={styles.roomList}>
        {rooms.map((room) => (
          <button
            key={room._id}
            type="button"
            className={`${styles.roomRow} ${selectedRoomId === room._id ? styles.roomRowActive : ''} ${collapsed ? styles.roomRowCompact : ''}`}
            onClick={() => onSelect(room._id)}
            title={`${room.title} - ${room.locality}, ${room.city}`}
          >
            <div className={styles.roomRowCopy}>
              <strong>{collapsed ? room.title.slice(0, 1).toUpperCase() : room.title}</strong>
              {!collapsed ? (
                <>
                  <span>
                    {room.locality}, {room.city}
                  </span>
                  <small>
                    {room.roomType} | {room.occupancy} | {room.seatsLeft} seats left
                  </small>
                  {userRole === 'superadmin' ? <small>Owner: {room.ownerName}</small> : null}
                </>
              ) : null}
            </div>
            {!collapsed ? (
              <div className={styles.roomRowMeta}>
                {room.featured ? <em className={styles.featuredMark}>Featured</em> : null}
                <small>Rs. {room.price}</small>
              </div>
            ) : null}
          </button>
        ))}
      </div>
    </aside>
  );
}
