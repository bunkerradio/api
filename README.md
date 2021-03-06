# Bunker's API

🔌 Bunker's Public API, coded in TypeScript for maximum speed.


## Disclaimer

Bunker's API is currently in beta, if any problems arise, especially with the lookup method, please feel free to drop either Chezzer#6969 or polar!#7979 a DM.

## Installation

```bash
git clone https://github.com/bunkerradio/api.git
```

Register an application from [Spotify's API Dashboard](https://developer.spotify.com/dashboard/login). Please note: API rate limits may be in affect.

Enter the client ID and secret into the `config.json` file. You MUST do this in order to use the Song Lookup. Once done, do this:

```bash
npm install
```

```bash
npm run-script build && npm run-script authorize
```

To start the API, run this:

```bash
npm start
```

## Usage

Clear lookup track and album art cache:

```bash
npm run-script clear
```

JQuery Example:

```jQuery
$.getJSON('http://localhost:5050/stats', data => {
  console.log(data);
})
```

[More info in the wiki](https://github.com/bunkerradio/api/wiki)

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License

[MIT](https://choosealicense.com/licenses/mit/)
