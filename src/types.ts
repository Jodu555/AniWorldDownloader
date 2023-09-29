export interface AniWorldSeriesInformations {
	url: string;
	hasMovies: boolean;
	movies?: AniWorldEntity[];
	seasons: AniWorldEntity[][];
}

export interface AniWorldEntity {
	mainName: string;
	secondName: string;
	langs: Langs[];
}

export interface Serie {
	ID: string;
	categorie: string;
	title: string;
	seasons: SerieEntity[][];
	movies: SerieEntity[];
	references: SerieReference;
	infos: SerieInfo;
}

export interface SerieEntity {
	filePath: string;
	primaryName: string;
	secondaryName: string;
	season: number;
	episode: number;
	langs: Langs[];
}

export interface SerieInfo {
	image?: string | boolean;
	infos?: string;
	title?: string;
	startDate?: string;
	endDate?: string;
	description?: string;
}

export type SerieReference = Record<'aniworld' | 'zoro' | 'sto' | string, string | Record<string, string>>;

export type Langs = 'GerDub' | 'GerSub' | 'EngDub' | 'EngSub';

export interface IgnoranceItem {
	ID?: string;
	lang?: Langs;
}

export interface ExtendedEpisodeDownload {
	_animeFolder?: string;
	_seriesFolder?: string;
	finished: boolean;
	folder: string;
	file: string;
	url: string;
	m3u8: string;
}

export abstract class AbstractInterceptor {
	constructor() {
		// Constructor logic here
	}

	abstract launch(): void;
	abstract intercept(m3u8: string, urls?: ExtendedEpisodeDownload[]): Promise<string>;
	abstract shutdown(): void;
}
