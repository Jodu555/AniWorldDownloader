const seasons = 2, episodes = [26, 13];

const start = 'https://aniworld.to/anime/stream/the-irregular-at-magic-high-school/';

const urls = [];

(async () => {

    for (let i = 0; i < seasons; i++) {
        const season = i + 1;
        const episode = episodes[i];
        for (let j = 1; j < episode + 1; j++) {
            urls.push(start + `staffel-${season}/episode-${j}`)
        }
    }

    console.log(urls);

})();