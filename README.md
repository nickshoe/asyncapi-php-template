# asyncapi-php-template

Install the AsyncAPI CLI (i.e. the generator) (it can be installed as a dev dependency, or globally):

```shell
npm install --save-dev @asyncapi/cli
```

Install this package as a project dev dependency:

```shell
npm install --save-dev https://github.com/nickshoe/asyncapi-php-template
```

Launch the generator, specifying `asyncapi-php-template` as the template name:

```shell
npx asyncapi generate fromTemplate <path-to-asyncapi-yaml> asyncapi-php-template -p server=<server-name> -o ./output
```
