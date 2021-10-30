export interface Stats {
	station: Station;
	listeners: Listeners;
	live: Live;
	now_playing: NowPlaying;
	playing_next: PlayingNext;
	is_online: boolean;
	cache: string;
}

export interface Station {
	id: number;
	name: string;
	shortcode: string;
	description: string;
	frontend: string;
	backend: string;
	listen_url: string;
	url: string;
	public_player_url: string;
	playlist_pls_url: string;
	playlist_m3u_url: string;
	is_public: boolean;
	mounts: Mount[];
	remotes: any[];
}

export interface Mount {
	path: string;
	is_default: boolean;
	id: number;
	name: string;
	url: string;
	bitrate: number;
	format: string;
	listeners: Listeners;
}

export interface Listeners {
	total: number;
	unique: number;
	current: number;
}

export interface Live {
	is_live: boolean;
	streamer_name: string;
	broadcast_start: any;
}

export interface NowPlaying {
	elapsed: number;
	remaining: number;
	sh_id: number;
	played_at: number;
	duration: number;
	playlist: string;
	streamer: string;
	is_request: boolean;
	song: Song;
}

export interface Song {
	id: string;
	text: string;
	artist: string;
	title: string;
	album: string;
	genre: string;
	lyrics: string;
	art: string;
	custom_fields: any[];
}

export interface PlayingNext {
	cued_at: number;
	duration: number;
	playlist: string;
	is_request: boolean;
	song: PlayingNextSong;
}

export interface PlayingNextSong {
	id: string;
	text: string;
	artist: string;
	title: string;
	album: string;
	genre: string;
	lyrics: string;
	art: string;
	custom_fields: any[];
}

export interface LookupSong {
	title: string;
	artist: string;
	album: LookupAlbum;
	color: string;
	covers: LookupCovers;
	duration: number;
	explicit: boolean;
	preview: string;
	spotify: string;
	deezer: string;
	isrc: string;
	ean: string;
	upc: string;
	problems: LookupProblem[];
	release_date: string;
	accuracy: number;
	powered_by: LookupCopyright;
	version: number;
	cache: number;
}

export interface LookupProblem {
	description: string;
	code: string;
}

export interface LookupArtist {
	name: string;
	spotify: string;
	deezer: string;
	covers: LookupCovers;
}

export interface LookupAlbum {
	title: string;
	artist: string;
	spotify_id: string;
	deezer_id: string;
}

export interface LookupCovers {
	big: string;
	medium: string;
	small: string;
}

export interface LookupCopyright {
	message: string;
}