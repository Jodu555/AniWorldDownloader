const seasons = 2, episodes = [26, 13];
const title = 'The Irregular at Magic High School';
const start = 'https://aniworld.to/anime/stream/the-irregular-at-magic-high-school/';

const urls = [];

(async () => {

    for (let i = 0; i < seasons; i++) {
        const season = i + 1;
        const episode = episodes[i];
        for (let j = 1; j < episode + 1; j++) {
            const obj = {
                file: `${title} St.${season} Flg.${j}`,
                url: start + `staffel-${season}/episode-${j}`
            };
            urls.push(obj);
        }
    }

    console.log(urls);

})();