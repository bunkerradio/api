# Bunker's API

🔌 Bunker's Public API, coded in TypeScript for maximum speed.

## Installation

```bash
git clone https://github.com/bunkerradio/api.git
```

Register an application from [Spotify's API Dashboard](https://developer.spotify.com/dashboard/login). Please note: API rate limits may be in affect.

Enter the client ID and secret into the `config.json` file. You MUST do this in order to use the Song Lookup. Once doing this:

```bash
yarn add
```

```bash
yarn build && yarn authorize
```

To start the API, run this:

```bash
yarn start
```

## Usage

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
