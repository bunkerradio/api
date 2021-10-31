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
                if (result.startsWIth("\n")) {
                    result.slice(2);
                }
                resolve(result);
            })
            .catch(async (e) => {
                let res = await axios.get(`https://search.azlyrics.com/search.php?q=${artist} ${track}`);
                let search = cheerio.load(res.data);
                let url = search("tr a").attr("href");

                if (url) {
                    let lyric = await axios.get(url)
                    let $ = cheerio.load(lyric.data);

                    let result:any = $($(".col-xs-12.col-lg-8 div")[5]).html();
                    result = result.replace(/(<!--.*?-->)|(<!--[\S\s]+?-->)|(<!--[\S\s]*?$)/g, "");
                    result = result.trim();
                    result = result.replace(/<br>/g, "");
                    resolve(result);
                } else {
                    resolve(false);
                }
            });
        })
    }
}

module.exports = Lyrics;