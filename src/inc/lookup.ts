const SpotifyWebApi = require('spotify-web-api-node');
const vibrant = require('node-vibrant')
const path = require('path');
const config = require(path.join(__dirname, '../../config.json'));
const Lyrics = require(path.join(__dirname, './lyrics'));
const lyrics = new Lyrics();
import axios from 'axios';
import fs from 'fs';
class Lookup {
    constructor(options: any) {
        this.spotify = new SpotifyWebApi({
            clientId: options.clientId,
            clientSecret: options.clientSecret,
            redirectUri: options.redirectUri
        });

        const spotifyData = require(path.join(__dirname, '../../spotify.json'));
        if (spotifyData.refresh) {
            this.spotify.setRefreshToken(spotifyData.refresh);
            this.refreshToken();
        } else {
            let self = this;
            this.spotify.authorizationCodeGrant(spotifyData.code).then(
                function(data:any) {
                    let config:any = {};
                    config.refresh = data.body['refresh_token'];
                    config.token = data.body['access_token'];
                    fs.writeFileSync(path.join(__dirname, '../../spotify.json'), JSON.stringify(config));
        
                    console.log("Token generated");
                    
                    // Set the access token on the API object to use it in later calls
                    self.spotify.setAccessToken(data.body['access_token']);
                    self.spotify.setRefreshToken(data.body['refresh_token']);
                },
                function(err:any) {
                      console.log('Something went wrong!', err);
                }
            );
        }

        setInterval(this.refreshToken, .95 * 1000 * 3600);
    }

    async search(search:string = "") {
        let spotifyTracks = await this.spotify.searchTracks(search, {limit: 1});
	    let spotifyTrack = spotifyTracks.body.tracks.items[0];
        return spotifyTrack;
    }

    refreshToken() {
        let self = this;
        this.spotify.refreshAccessToken().then(
            function(data: any) {
              console.log('Token refreshed');
          
              // Save the access token so that it's used in future calls
              self.spotify.setAccessToken(data.body['access_token']);
            },
            function(err: any) {
              console.log('Could not refresh access token', err);
            }
        );
    }

    getTrack(spotifyTrack:any) {
        if (fs.existsSync(`./cache/data/${spotifyTrack.external_ids.isrc}.json`)) {
            return JSON.parse(fs.readFileSync(`./cache/data/${spotifyTrack.external_ids.isrc}.json`, 'utf-8'));
        } else {
            return this.cacheTrack(spotifyTrack);
        }
    }

    getColor(url: string, isrc: string) {
        return new Promise(async (resolve) => {
            let image = await axios({url: url, responseType: "stream"});
	        let writer = fs.createWriteStream(path.join(__dirname, `../../cache/art/${isrc}.png`));
	        await image.data.pipe(writer);

            writer.on("finish", () => {
                vibrant.from(path.join(__dirname, `../../cache/art/${isrc}.png`)).getPalette((err:any, palette:any) => {
                    if (err) {
                        resolve([0,0,0])
                    } else {
                        resolve(palette.Vibrant._rgb);
                    }
                })
            })
        })
    }

    combineArtists(artistList: any) {
        let artists = "";
	    artistList.forEach((item: any) => {
	    	artists += `${item.name}, `;
	    })
	    artists = artists.substring(0, artists.length - 2);
        return artists;
    }

    async cacheTrack(spotifyTrack:any) {
        //combine artist names
        let artists = this.combineArtists(spotifyTrack.artists);

        //get deezer since no cache
        let deezerTrack:any = await axios.get(`https://api.deezer.com/2.0/track/isrc:${spotifyTrack.external_ids.isrc}&limit=1`);
        deezerTrack = deezerTrack.data;

        if (deezerTrack.error) {
            let search = `artist:"${artists}" track:"${spotifyTrack.name}"`;
            deezerTrack = await axios.get(`https://api.deezer.com/search?q=${encodeURIComponent(search)}&limit=1`);
            deezerTrack = deezerTrack.data.data[0];
        }

        let color = await this.getColor(deezerTrack.album.cover_medium, spotifyTrack.external_ids.isrc)
        //check for problems
        let problems:any = [];
        if (deezerTrack.explicit_lyrics || spotifyTrack.explicit) {
            problems.push({
                code: "explicit_lyrics",
                description: "This track has explicit lyrics."
            })
        }

        if (deezerTrack.explicit_content_cover == 1) {
            problems.push({
                code: "explicit_cover",
                description: "This track has an explicit cover."
            })
        }

        //get lyrics
        let songLyrics = await lyrics.search(spotifyTrack.name, artists);

        //make response
        var response = {
            title: spotifyTrack.name,
            artist: {
                names: artists,
                spotify_id: spotifyTrack.artists[0].id,
                deezer_id: deezerTrack.artist.id,
                picture: {
                    xl: deezerTrack.artist.picture_xl,
                    large: deezerTrack.artist.picture_big,
                    medium: deezerTrack.artist.picture_medium,
                    small: deezerTrack.artist.picture_small,
                }
            },
            album: {
                title: spotifyTrack.album.name,
                spotify_id: spotifyTrack.album.id,
                deezer_id: deezerTrack.album.id
            },
            color: color,
            covers: {
                xl: deezerTrack.album.cover_xl,
                large: deezerTrack.album.cover_big,
                medium: deezerTrack.album.cover_medium,
                small: deezerTrack.album.cover_small,
            },
            spotify_id: spotifyTrack.id,
            deezer_id: deezerTrack.id,
            popularity: spotifyTrack.popularity,
            rank: deezerTrack.rank,
            isrc: spotifyTrack.external_ids.isrc,
            duration: spotifyTrack.duration_ms,
            bpm: deezerTrack.bpm,
            gain: deezerTrack.gain,
            preview: spotifyTrack.preview_url || deezerTrack.preview,
            lyrics: songLyrics,
            release_date: new Date(spotifyTrack.album.release_date).getTime() / 1000,
            problems,
            powered_by: {
                website: "https://bunker.dance",
                copyright: "Copyright 2021-Present Bunker | Source: https://github.com/bunkerradio/api",
            },
            version: config.version,
            cache: new Date().getTime()
        }

        //save and serve response
        fs.writeFileSync(path.join(__dirname, `../../cache/data/${spotifyTrack.external_ids.isrc}.json`), JSON.stringify(response));
        return response; 
    };

    similarity(s1:string, s2:string) {
        var longer = s1;
        var shorter = s2;
        if (s1.length < s2.length) {
          longer = s2;
          shorter = s1;
        }
        var longerLength = longer.length;
        if (longerLength == 0) {
          return 1.0;
        }
        let result = (longerLength - this.editDistance(longer, shorter)) / parseFloat(longerLength.toString());
        return Math.floor(result * 100);
    }

    editDistance(s1:string, s2:string) {
        var costs = new Array();
        for (var i = 0; i <= s1.length; i++) {
          var lastValue = i;
          for (var j = 0; j <= s2.length; j++) {
            if (i == 0)
              costs[j] = j;
            else {
              if (j > 0) {
                var newValue = costs[j - 1];
                if (s1.charAt(i - 1) != s2.charAt(j - 1))
                  newValue = Math.min(Math.min(newValue, lastValue),
                    costs[j]) + 1;
                costs[j - 1] = lastValue;
                lastValue = newValue;
              }
            }
          }
          if (i > 0)
            costs[s2.length] = lastValue;
        }
        return costs[s2.length];
    }
}

interface Lookup {
    spotify: any;
}

module.exports = Lookup;
