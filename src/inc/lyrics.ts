import axios from 'axios';
import cheerio from 'cheerio';
class Lyrics {
    async search(track:string, artist:string) {
        return new Promise((resolve) => {
            axios.get(`https://api.lyrics.ovh/v1/${artist}/${track}`)
            .then(async (ovh) => {
                let result = ovh.data.lyrics;
                result = result.trim();
                if (result.includes("Paroles de la")) {
                    result = result.split("\n");
                    delete result[0];
                    result = result.join("\n");
                }
                if (result.startsWith("\n")) {
                    result.slice(2);
                }
                resolve(result);
            })
            .catch(async (e) => {
                //let res = await axios.get(`https://lyrics.upbeat.pw/?title=${track}&artist=${artist}`);
                //let search = cheerio.load(res.data);
                //let lyrics = search("song").html();

                //if (lyrics) {
                //    lyrics = lyrics.replace(/<br>/g, "");
                //    if (lyrics.startsWith("\n")) {
                //        lyrics.slice(2);
                //    }
                //    resolve(lyrics);
                //} else {
                //    resolve(false);
                //}
                resolve(false);
            });
        })
    }
}

module.exports = Lyrics;