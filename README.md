# Bunker's API

🔌 Bunker's Public API, coded in TypeScript for maximum speed.


## Installation

```bash
git clone https://github.com/bunkerradio/api.git
```

Register an application from [Spotify's API Dashboard](https://developer.spotify.com/dashboard/login). Please note: API rate limits may be in affect.

Enter the client ID and secret into the `config.json` file.

```bash
yarn add
```

```bash
yarn build && yarn start
```

## Usage

JQuery Example:
```jQuery
$.getJSON('http://localhost:5050/', data => {
  console.log(data);
})
```

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License
[MIT](https://choosealicense.com/licenses/mit/)
