import type { NearbyPlace, Room } from '../../types';
import { NearbyPlacesEditor } from './NearbyPlacesEditor';
import styles from './admin.module.css';

export type RoomForm = {
  title: string;
  city: string;
  locality: string;
  address: string;
  price: string;
  deposit: string;
  rating: string;
  reviewCount: string;
  occupancy: Room['occupancy'];
  roomType: Room['roomType'];
  gender: Room['gender'];
  availableFrom: string;
  seatsLeft: string;
  description: string;
  heroTag: string;
  image: string;
  amenities: string;
  rules: string;
  transit: string;
  featured: boolean;
  nearbyPlaces: NearbyPlace[];
};

type Props = {
  selectedRoom: Room | null;
  form: RoomForm;
  saving: boolean;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onDelete: () => void;
  onChange: <K extends keyof RoomForm>(key: K, value: RoomForm[K]) => void;
  onAddPlace: () => void;
  onRemovePlace: (index: number) => void;
  onPlaceChange: (index: number, key: keyof NearbyPlace, value: string) => void;
};

export function RoomEditor({
  selectedRoom,
  form,
  saving,
  onSubmit,
  onDelete,
  onChange,
  onAddPlace,
  onRemovePlace,
  onPlaceChange,
}: Props) {
  return (
    <section className={styles.editorPanel}>
      <div className={styles.editorTop}>
        <div>
          <p className={styles.eyebrow}>{selectedRoom ? 'Editing room' : 'Create room'}</p>
          <h2>{selectedRoom?.title ?? 'Add a new live listing'}</h2>
          <p className={styles.editorLead}>
            Shape the public-facing card, detail view, and nearby place highlights from one form.
          </p>
        </div>

        {selectedRoom ? (
          <button className={styles.dangerButton} type="button" onClick={onDelete} disabled={saving}>
            Delete room
          </button>
        ) : null}
      </div>

      <form className={styles.editorForm} onSubmit={onSubmit}>
        <div className={styles.formSection}>
          <div className={styles.formSectionHeader}>
            <p className={styles.sectionLabel}>Core identity</p>
            <strong>Headline, tag, and location</strong>
          </div>

          <div className={styles.formGridTwo}>
            <label>
              <span>Title</span>
              <input value={form.title} onChange={(event) => onChange('title', event.target.value)} />
            </label>
            <label>
              <span>Hero tag</span>
              <input value={form.heroTag} onChange={(event) => onChange('heroTag', event.target.value)} />
            </label>
          </div>

          <div className={styles.formGridThree}>
            <label>
              <span>City</span>
              <input value={form.city} onChange={(event) => onChange('city', event.target.value)} />
            </label>
            <label>
              <span>Locality</span>
              <input value={form.locality} onChange={(event) => onChange('locality', event.target.value)} />
            </label>
            <label>
              <span>Available from</span>
              <input
                type="date"
                value={form.availableFrom}
                onChange={(event) => onChange('availableFrom', event.target.value)}
              />
            </label>
          </div>

          <label>
            <span>Address</span>
            <input value={form.address} onChange={(event) => onChange('address', event.target.value)} />
          </label>
        </div>

        <div className={styles.formSection}>
          <div className={styles.formSectionHeader}>
            <p className={styles.sectionLabel}>Pricing and fit</p>
            <strong>Commercial details for the listing</strong>
          </div>

          <div className={styles.formGridFour}>
            <label>
              <span>Monthly rent</span>
              <input type="number" value={form.price} onChange={(event) => onChange('price', event.target.value)} />
            </label>
            <label>
              <span>Deposit</span>
              <input type="number" value={form.deposit} onChange={(event) => onChange('deposit', event.target.value)} />
            </label>
            <label>
              <span>Seats left</span>
              <input type="number" value={form.seatsLeft} onChange={(event) => onChange('seatsLeft', event.target.value)} />
            </label>
            <label>
              <span>Rating</span>
              <input type="number" min="1" max="5" step="0.1" value={form.rating} onChange={(event) => onChange('rating', event.target.value)} />
            </label>
          </div>

          <div className={styles.formGridFour}>
            <label>
              <span>Room type</span>
              <select value={form.roomType} onChange={(event) => onChange('roomType', event.target.value as Room['roomType'])}>
                <option>Private Room</option>
                <option>Studio</option>
                <option>PG</option>
                <option>Coliving</option>
              </select>
            </label>
            <label>
              <span>Occupancy</span>
              <select value={form.occupancy} onChange={(event) => onChange('occupancy', event.target.value as Room['occupancy'])}>
                <option>Single</option>
                <option>Double</option>
                <option>Shared</option>
              </select>
            </label>
            <label>
              <span>Gender</span>
              <select value={form.gender} onChange={(event) => onChange('gender', event.target.value as Room['gender'])}>
                <option>Any</option>
                <option>Boys</option>
                <option>Girls</option>
              </select>
            </label>
            <label>
              <span>Reviews</span>
              <input type="number" value={form.reviewCount} onChange={(event) => onChange('reviewCount', event.target.value)} />
            </label>
          </div>
        </div>

        <div className={styles.formSection}>
          <div className={styles.formSectionHeader}>
            <p className={styles.sectionLabel}>Storytelling</p>
            <strong>Description, imagery, and lifestyle notes</strong>
          </div>

          <label>
            <span>Image URL</span>
            <input value={form.image} onChange={(event) => onChange('image', event.target.value)} />
          </label>

          <label>
            <span>Description</span>
            <textarea rows={4} value={form.description} onChange={(event) => onChange('description', event.target.value)} />
          </label>

          <div className={styles.formGridThree}>
            <label>
              <span>Amenities</span>
              <textarea rows={3} value={form.amenities} onChange={(event) => onChange('amenities', event.target.value)} />
            </label>
            <label>
              <span>Transit notes</span>
              <textarea rows={3} value={form.transit} onChange={(event) => onChange('transit', event.target.value)} />
            </label>
            <label>
              <span>Rules</span>
              <textarea rows={3} value={form.rules} onChange={(event) => onChange('rules', event.target.value)} />
            </label>
          </div>
        </div>

        <label className={styles.checkboxRow}>
          <input
            type="checkbox"
            checked={form.featured}
            onChange={(event) => onChange('featured', event.target.checked)}
          />
          <span>Feature this room in the public frontend</span>
        </label>

        <NearbyPlacesEditor
          places={form.nearbyPlaces}
          onAdd={onAddPlace}
          onRemove={onRemovePlace}
          onChange={onPlaceChange}
        />

        <div className={styles.formActions}>
          <button className={styles.primaryButton} type="submit" disabled={saving}>
            {saving ? 'Saving...' : selectedRoom ? 'Save changes' : 'Create room'}
          </button>
        </div>
      </form>
    </section>
  );
}
