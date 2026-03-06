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

  // User State
  public wantToPlay: boolean = false;
  public ignored: boolean = false;

  constructor(
    hydraData: HydraGameEntity,
    enrichedData?: Partial<Omit<EnrichedGameEntity, 'fileSize' | 'title' | 'uploadDate' | 'isEnriched'>>
  ) {
    super(hydraData.fileSize, hydraData.title, hydraData.uploadDate);
    this.isEnriched = !!enrichedData && Object.keys(enrichedData).length > 0;

    if (enrichedData) {
      Object.assign(this, enrichedData);
    }
  }

  public markAsIgnored(): void {
    this.ignored = true;
    this.wantToPlay = false;
  }

  public markAsWantToPlay(): void {
    this.wantToPlay = true;
    this.ignored = false;
  }
}
