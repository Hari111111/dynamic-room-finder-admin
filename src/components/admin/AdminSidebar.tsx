import type { Room } from '../../types';
import styles from './admin.module.css';

type Props = {
  rooms: Room[];
  selectedRoomId: string;
  loading: boolean;
  userRole: 'admin' | 'superadmin';
  onSelect: (roomId: string) => void;
  onCreateNew: () => void;
};

export function AdminSidebar({ rooms, selectedRoomId, loading, userRole, onSelect, onCreateNew }: Props) {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarHeader}>
        <div>
          <p className={styles.eyebrow}>Inventory</p>
          <h2>{loading ? 'Loading...' : `${rooms.length} listings`}</h2>
        </div>
        <button className={styles.ghostButton} type="button" onClick={onCreateNew}>
          New room
        </button>
      </div>

      <div className={styles.roomList}>
        {rooms.map((room) => (
          <button
            key={room._id}
            type="button"
            className={`${styles.roomRow} ${selectedRoomId === room._id ? styles.roomRowActive : ''}`}
            onClick={() => onSelect(room._id)}
          >
            <div className={styles.roomRowCopy}>
              <strong>{room.title}</strong>
              <span>
                {room.locality}, {room.city}
              </span>
              <small>
                {room.roomType} | {room.occupancy} | {room.seatsLeft} seats left
              </small>
              {userRole === 'superadmin' ? <small>Owner: {room.ownerName}</small> : null}
            </div>
            <div className={styles.roomRowMeta}>
              {room.featured ? <em className={styles.featuredMark}>Featured</em> : null}
              <small>Rs. {room.price}</small>
            </div>
          </button>
        ))}
      </div>
    </aside>
  );
}
