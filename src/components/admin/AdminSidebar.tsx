import type { Room } from '../../types';
import styles from './admin.module.css';

type Props = {
  rooms: Room[];
  selectedRoomId: string;
  loading: boolean;
  onSelect: (roomId: string) => void;
  onCreateNew: () => void;
};

export function AdminSidebar({ rooms, selectedRoomId, loading, onSelect, onCreateNew }: Props) {
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
            <div>
              <strong>{room.title}</strong>
              <span>
                {room.locality}, {room.city}
              </span>
            </div>
            <small>Rs. {room.price}</small>
          </button>
        ))}
      </div>
    </aside>
  );
}
