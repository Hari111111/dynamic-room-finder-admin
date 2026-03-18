import type { NearbyPlace } from '../../types';
import styles from './admin.module.css';

type Props = {
  places: NearbyPlace[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  onChange: (index: number, key: keyof NearbyPlace, value: string) => void;
};

export function NearbyPlacesEditor({ places, onAdd, onRemove, onChange }: Props) {
  return (
    <div className={styles.placesSection}>
      <div className={styles.placesHeader}>
        <div>
          <p className={styles.eyebrow}>Nearby places</p>
          <h3>Famous shops, commute points, and lifestyle spots</h3>
        </div>
        <button className={styles.ghostButton} type="button" onClick={onAdd}>
          Add place
        </button>
      </div>

      <div className={styles.placesList}>
        {places.map((place, index) => (
          <article key={place._id ?? place.id ?? `${place.name}-${index}`} className={styles.placeEditor}>
            <div className={styles.formGridFour}>
              <label>
                <span>Name</span>
                <input value={place.name} onChange={(event) => onChange(index, 'name', event.target.value)} />
              </label>
              <label>
                <span>Category</span>
                <input
                  value={place.category}
                  onChange={(event) => onChange(index, 'category', event.target.value)}
                />
              </label>
              <label>
                <span>Distance km</span>
                <input
                  type="number"
                  step="0.1"
                  value={place.distanceKm}
                  onChange={(event) => onChange(index, 'distanceKm', event.target.value)}
                />
              </label>
              <label>
                <span>Walk minutes</span>
                <input
                  type="number"
                  value={place.walkMinutes}
                  onChange={(event) => onChange(index, 'walkMinutes', event.target.value)}
                />
              </label>
            </div>

            <label>
              <span>Highlight</span>
              <input
                value={place.highlight}
                onChange={(event) => onChange(index, 'highlight', event.target.value)}
              />
            </label>

            <button className={styles.textButton} type="button" onClick={() => onRemove(index)}>
              Remove place
            </button>
          </article>
        ))}
      </div>
    </div>
  );
}
