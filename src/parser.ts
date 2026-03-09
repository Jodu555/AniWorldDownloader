import axios from 'axios';
import jsdom from 'jsdom';
import { AniWorldSeriesInformations, ExtendedEpisodeDownload } from './types';
import Aniworld from './Aniworld';

export async function getExtendedEpisodeDownloadFromAniworld(url: string, title: string, preferLangs: string[], fallbackLang: string): Promise<{ output: AniWorldSeriesInformations, downloadObjects: ExtendedEpisodeDownload[]; }> {

    const serie = new Aniworld(url);
    const output = await serie.parseInformations();

    if (!output) return { output: null as any, downloadObjects: [] };

    const downloadObjects: ExtendedEpisodeDownload[] = [];

    output.seasons.forEach((season, se) => {
        season.forEach((ent, ep) => {
            const add = (lng: string) => {
                downloadObjects.push({
                    finished: false,
                    folder: `Season ${se + 1}`,
                    file: `${title} St.${se + 1} Flg.${ep + 1}_${lng}`,
                    url: url + `staffel-${se + 1}/episode-${ep + 1}`,
                    m3u8: '',
                });
            };

            const languages = ent.langs.filter((e) => preferLangs.find((x) => x.includes(e)));
            if (languages.length == 0) {
                // The preferLangs dont match
                if (ent.langs.filter((e) => e.includes(fallbackLang))) {
                    add(fallbackLang);
                }
            }
            languages.forEach((language) => {
                add(language);
            });
        });
    });

    if (output.hasMovies)
        output.movies.forEach((ent, movie) => {
            const languages = ent.langs.filter((e) => preferLangs.find((x) => x.includes(e)));
            languages.forEach((language) => {
                const v2MovieURL = `${url}staffel-0/episode-${movie + 1}`
                const v1MovieURL = `${url}filme/episode-${movie + 1}`
                downloadObjects.push({
                    finished: false,
                    folder: `Movies`,
                    file: `${ent.mainName}_${language}`,
                    url: serie.isv2 ? v2MovieURL : v1MovieURL,
                    m3u8: '',
                });
            });
        });

    return { output, downloadObjects };
}