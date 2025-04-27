import axios from 'axios';
import jsdom from 'jsdom';
import { AniWorldSeriesInformations, ExtendedEpisodeDownload } from './types';

export async function getExtendedEpisodeDownloadFromAniworld(url: string, title: string, preferLangs: string[], fallbackLang: string): Promise<{ output: AniWorldSeriesInformations, downloadObjects: ExtendedEpisodeDownload[]; }> {
    const output: AniWorldSeriesInformations = await parseInformationsFromURL(url);

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
                downloadObjects.push({
                    finished: false,
                    folder: `Movies`,
                    file: `${ent.mainName}_${language}`,
                    url: url + `filme/film-${movie + 1}`,
                    m3u8: '',
                });
            });
        });

    return { output, downloadObjects };
}

async function parseInformationsFromURL(url: string): Promise<AniWorldSeriesInformations> {
    const response = await axios.get(url);
    const { document } = new jsdom.JSDOM(response.data).window;

    const seasonsUl = [...document.querySelectorAll('span')].find((e) => e.textContent.includes('Staffeln:')).parentElement.parentElement;
    const seasonsTab = [...seasonsUl.querySelectorAll('li')].map((e) => e.querySelector('a')?.title).filter((e) => e != undefined);

    const numberOfSeasons = seasonsTab.filter((e) => e.includes('Staffel')).length;
    const hasMovies = seasonsTab.find((e) => e.includes('Film')) != null;

    const output: AniWorldSeriesInformations = { url, hasMovies, seasons: new Array(numberOfSeasons) };

    console.log('Parsed: ');
    console.log(' ' + url);
    console.log(`   => Seasons: ${numberOfSeasons} - Movies: ${hasMovies}`);

    if (hasMovies) {
        const movResponse = await axios.get(`${url}/filme`);
        output.movies = getListInformations(movResponse.data);
        console.log(`    => Got ${output.movies.length} Movies`);
    }

    output.seasons[0] = getListInformations(response.data);
    console.log(`    => Got Season ${0} with ${output.seasons[0].length} Episodes`);
    for (let i = 1; i < numberOfSeasons; i++) {
        const seaResponse = await axios.get(`${url}/staffel-${i + 1}`);
        output.seasons[i] = getListInformations(seaResponse.data);
        console.log(`    => Got Season ${i} with ${output.seasons[i].length} Episodes`);
    }
    return output;
}

function getListInformations(data: string) {
    const { document } = new jsdom.JSDOM(data).window;
    const episodes = [...document.querySelectorAll('tr[itemprop="episode"]')];
    const out = [];
    episodes.forEach((ep) => {
        let langs = [];
        [...ep.querySelectorAll('.editFunctions img')].forEach((lang) => {
            langs.push(lang.src);
        });

        langs = langs.map((l) => {
            switch (l) {
                case '/public/img/german.svg':
                    return 'GerDub';
                case '/public/img/japanese-german.svg':
                    return 'GerSub';
                case '/public/img/japanese-english.svg':
                    return 'EngSub';
                case '/public/img/english-german.svg':
                    return 'GerSub';
                case '/public/svg/german.svg':
                    return 'GerDub';
                case '/public/svg/japanese-german.svg':
                    return 'GerSub';
                case '/public/svg/japanese-english.svg':
                    return 'EngSub';
                case '/public/svg/english-german.svg':
                    return 'GerSub';
                default:
                    break;
            }
            if (l.includes('german.svg')) {
                return 'GerDub';
            }
            if (l.includes('english.svg')) {
                return 'EngDub';
            }
        });

        const mainName = ep.querySelector('.seasonEpisodeTitle strong')?.textContent;
        const secondName = ep.querySelector('.seasonEpisodeTitle span')?.textContent;

        out.push({ mainName, secondName, langs });
    });
    return out;
}