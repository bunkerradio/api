import axios from "axios";

class Lyrics {
  async search(spotifyTrack: any) {
    return new Promise(resolve => {
      let artists = "";

      spotifyTrack.artists.forEach((item: any) => artists += `${item.name}, `);
      artists = artists.substring(0, artists.length - 2);

      axios.get(`https://apic-desktop.musixmatch.com/ws/1.1/macro.subtitles.get?format=json&q_track=${spotifyTrack.name}&q_artist=${spotifyTrack.artists[0].name}&q_artists=${artists}&q_album=${spotifyTrack.album.name}&user_language=en&f_subtitle_length=${(spotifyTrack.duration_ms / 1000).toFixed(0)}&q_duration=${spotifyTrack.duration_ms / 1000}&tags=nowplaying&userblob_id=eW91J3ZlIGRvbmUgZW5vdWdoX2dvcmdvbiBjaXR5XzIxMy41NDY&namespace=lyrics_synched&track_spotify_id=spotify:track:${spotifyTrack.id}&f_subtitle_length_max_deviation=1&subtitle_format=mxm&app_id=web-desktop-app-v1.0&usertoken=18111573a5d5b7855fec189fa5fc591c6a61d4dab03f4e8592f3db&guid=e05094a3-30c0-47e9-b5ed-e3a657a4a72f&signature=fMi1gjVjkDMRQ7a0+tvTvFmCUGo=&signature_protocol=sha1`, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Musixmatch/0.21.27 Chrome/66.0.3359.181 Electron/3.1.3 Safari/537.36",
          "Cookie": `mxm-encrypted-token=; x-mxm-user-id=g2%3A107362761377830766775; x-mxm-token-guid=e05094a3-30c0-47e9-b5ed-e3a657a4a72f`
        }
      })
        .then(data => {
          const api = data.data.message.body.macro_calls;

          if (api['track.lyrics.get'] && api['matcher.track.get']) {
            api['track.lyrics.get'].message.body.lyrics.track_id = api['matcher.track.get'].message.body.track.track_id || false;
            api['track.lyrics.get'].message.body.lyrics.track_soundcloud_id = api['matcher.track.get'].message.body.track.track_soundcloud_id || false
            resolve(api['track.lyrics.get'].message.body.lyrics)
          } else resolve(false);
        })
        .catch(e => {
          console.log(e);
          resolve(false);
        });
    })
  }
}

export default Lyrics;