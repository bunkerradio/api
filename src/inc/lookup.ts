const SpotifyWebApi = require('spotify-web-api-node');
const ColorThief = require('color-thief');
const colorThief = new ColorThief();
import axios from 'axios';
import fs from 'fs';
class Lookup {
    constructor(options: any) {
        this.spotify = new SpotifyWebApi({
            clientId: options.clientId,
            clientSecret: options.clientSecret,
            redirectUri: options.redirectUri
        });

        const spotifyData = require('../../spotify.json');
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
                    fs.writeFileSync("../../spotify.json", JSON.stringify(config));
        
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

    getCachedTrack(isrc: string) {
        if (fs.existsSync(`./cache/data/${isrc}.json`)) {
            return JSON.parse(fs.readFileSync(`./cache/data/${isrc}.json`, 'utf-8'));
        } else {
            return false;
        }
    }

    getColor(url: string, isrc: string) {
        return new Promise(async (resolve) => {
            let image = await axios({url: url, responseType: "stream"});
	        let writer = fs.createWriteStream(`./cache/art/${isrc}.png`);
	        await image.data.pipe(writer);

            writer.on("finish", () => {
                let color = colorThief.getColor(`./cache/art/${isrc}.png`, 1);
                resolve(color);
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
        //get deezer since no cache
        let deezerTracks = await axios.get(`https://api.deezer.com/2.0/track/isrc:${spotifyTrack.external_ids.isrc}&limit=1`);
        let deezerTrack = deezerTracks.data;

        let color = await this.getColor(deezerTrack.album.cover_medium, spotifyTrack.external_ids.isrc);

        //check for problems
        let problems:any = [];
        if (deezerTrack.explicit_lyrics && spotifyTrack.explicit) {
            problems.push({
                code: "explicit_lyrics",
                description: "This track has explicit lyrics."
            })
        }

        if (deezerTrack.explicit_content_cover == 2) {
            problems.push({
                code: "explicit_cover",
                description: "This track has an explicit cover."
            })
        }

        if (!deezerTrack) {
            problems.push({
                code: "deezer_not_found",
                description: "The API was not able to find a result from Deezer."
            })
        }

        if (!spotifyTrack) {
            problems.push({
                code: "spotify_not_found",
                description: "The API was not able to find a result from Spotify."
            })
        }

        //combine artist names
        let artists = this.combineArtists(spotifyTrack.artists);

        //make response
        var response = {
            title: spotifyTrack.name,
            artist: artists,
            album: {
                title: spotifyTrack.album.name,
                spotify_id: spotifyTrack.album.id,
                deezer_id: deezerTrack.album.id
            },
            color: color,
            covers: {
                extra: deezerTrack.album.cover_xl,
                large: deezerTrack.album.cover_big,
                medium: deezerTrack.album.cover_medium,
                small: deezerTrack.album.cover_small,
            },
            duration: spotifyTrack.duration_ms,
            explicit: spotifyTrack.explicit,
            preview: spotifyTrack.preview_url || deezerTrack.preview,
            spotify_id: spotifyTrack.id,
            deezer_id: deezerTrack.id,
            isrc: spotifyTrack.external_ids.isrc,
            release_date: spotifyTrack.album.release_date,
            problems,
            powered_by: {
                website: "https://bunker.dance",
                copyright: "Copyright 2021-Present Bunker | Source: https://github.com/bunkerradio/api",
            },
            version: "1.0.0",
            cache: new Date().getTime()
        }

        //save and serve response
        fs.writeFileSync(`./cache/data/${spotifyTrack.external_ids.isrc}.json`, JSON.stringify(response));
        return response;
    }

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