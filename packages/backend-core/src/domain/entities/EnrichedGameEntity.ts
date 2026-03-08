import { HydraGameEntity } from './HydraGameEntity';
import { VideoEntity } from './VideoEntity';
import { IgdbLanguageSupport, IgdbExternalGame, RawgRating } from '../data/ExternalGameData';

export class EnrichedGameEntity extends HydraGameEntity {
  public isEnriched: boolean;

  // Identifiers
  public igdbId?: number | null;
  public rawgId?: number | null;

  // Shared Core Data
  public totalRating?: number | null;
  public totalRatingCount?: number | null;
  public genres?: string[] | null;
  public platforms?: string[] | null;
  public screenshots?: string[] | null;

  // IGDB Specific
  public themes?: string[] | null;
  public gameModes?: string[] | null;
  /** Structured language supports — stored as join-table rows (language + supportType) */
  public languageSupports?: IgdbLanguageSupport[] | null;
  public franchises?: string[] | null;
  /** Resolved store links with storeId from the DB-backed lookup table */
  public externalGames?: IgdbExternalGame[] | null;
  public coverUrl?: string | null;
  /** IGDB plain YouTube video URLs */
  public videos?: string[] | null;

  // RAWG Specific
  /** Ratings without score — score lives in the rating_categories seed table */
  public ratings?: RawgRating[] | null;
  public added?: number | null;
  public addedByStatus?: Record<string, number> | null;
  public playtime?: number | null;

  // Content Creators & Extra
  public contentCreatorVideos?: VideoEntity[] | null;

  constructor(
    hydraData: HydraGameEntity,
    enrichedData?: Partial<Omit<EnrichedGameEntity, 'fileSize' | 'title' | 'uploadDate' | 'isEnriched'>>
  ) {
    super(hydraData.fileSize, hydraData.title, hydraData.uploadDate, hydraData.id);
    this.isEnriched = !!enrichedData && Object.keys(enrichedData).length > 0;

    if (enrichedData) {
      Object.assign(this, enrichedData);
    }
  }

  public hasChanges(other: EnrichedGameEntity): boolean {
    if (this.title !== other.title) return true;
    if (this.fileSize !== other.fileSize) return true;
    if (this.uploadDate !== other.uploadDate) return true;
    if (this.igdbId !== other.igdbId) return true;
    if (this.rawgId !== other.rawgId) return true;
    if (this.totalRating !== other.totalRating) return true;
    if (this.totalRatingCount !== other.totalRatingCount) return true;
    if (this.playtime !== other.playtime) return true;
    if (this.coverUrl !== other.coverUrl) return true;

    // Quick string-match for nested value-objects. Assuming deterministic array ordering from APIs.
    const stringify = (val: unknown) => JSON.stringify(val ?? null);

    if (stringify(this.genres) !== stringify(other.genres)) return true;
    if (stringify(this.platforms) !== stringify(other.platforms)) return true;
    if (stringify(this.themes) !== stringify(other.themes)) return true;
    if (stringify(this.gameModes) !== stringify(other.gameModes)) return true;
    if (stringify(this.franchises) !== stringify(other.franchises)) return true;
    if (stringify(this.languageSupports) !== stringify(other.languageSupports)) return true;
    if (stringify(this.externalGames) !== stringify(other.externalGames)) return true;
    if (stringify(this.screenshots) !== stringify(other.screenshots)) return true;
    if (stringify(this.ratings) !== stringify(other.ratings)) return true;
    if (stringify(this.addedByStatus) !== stringify(other.addedByStatus)) return true;
    if (stringify(this.added) !== stringify(other.added)) return true;
    if (stringify(this.videos) !== stringify(other.videos)) return true;
    if (stringify(this.contentCreatorVideos) !== stringify(other.contentCreatorVideos)) return true;

    return false;
  }
}
