# prettyindex

Pretty Autoindex – standalone Node.js addition to refine autoindex pages in nginx.

## Hot to

1. Install [Node.js](https://nodejs.org/) – `npm` included
2. Install necessary dependencies – `npm i --production`
3. [Edit prettyindex config file](#config) as you need
4. Edit nginx config:
    - Set `autoindex` to `on`
    - Set `autoindex_exact_size` to `on`
    - Set `autoindex_format` to `json`
    - Set port and other stuff in accordance with [prettyindex config](#config)
5. Edit [pm2 config](./config/pm2.production.json) if necessary
6. Start nginx (`start nginx.exe` or `systemctl start nginx`)
7. Start prettyindex – `npm run production`

Later you will need to use only last two steps to start bundle of servers.

To stop prettyindex run – `npm run stop` or `pm2 delete prettyindex` (don't forget about `nginx -s quit`).

## Development

1. Install all dependencies – `npm i`
2. Edit [nodemon config](./config/nodemon.dev.json)
3. Run in watch mode – `npm run dev`

## Config

Main config located at [`config/prettyindex.json`](./config/prettyindex.json).
See [Typescript Declaration File](./types/prettyindexconfig.d.ts) for it (same as content below).

#### PrettyIndexConfig

| parameter      | description                                                  | values                               | default      |
| -------------- | ------------------------------------------------------------ | ------------------------------------ | ------------ |
| `root_folders` | Root folders paths                                           | Array of [`RootFolder`](#rootfolder) | **Required** |
| `port`         | Pretty Index server's port.                                  | `number`                             | `80`         |
| `host`         | Pretty Index server's host.                                  | `string`                             | `"0.0.0.0"`  |
| `https`        | Use https serving instead of http. If not set, http applies. | [`HTTPSOptions`](#httpsoptions)      | `null`       |

#### RootFolder

| parameter        | description                                                                              | values    | default      |
| ---------------- | ---------------------------------------------------------------------------------------- | --------- | ------------ |
| `path`           | Absolute path to root folder. Also serves as its name, if `alias` parameter was omitted. | `string`  | **Required** |
| `alias`          | Name to be used as title instead of `path`                                               | `string`  | `null`       |
| `nginx_port`     | Port on which nginx server with same root folder.                                        | `number`  | **Required** |
| `nginx_https`    | Use https to connect to nginx server with same root folder.                              | `boolean` | `false`      |
| `nginx_hostname` | Set if nginx target server's hostname differs from Pretty Index server's `host`.         | `string`  | `null`       |

#### HTTPSOptions

| parameter | description              |
| --------- | ------------------------ |
| `cert`    | Path to certificate file |
| `key`     | Path to key file         |

### [BSL-1.0 License](./LICENSE)
### [NGINX License](./public/NGINX_LICENSE) – for some files
