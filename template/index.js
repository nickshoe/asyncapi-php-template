import { File, Text } from "@asyncapi/generator-react-sdk";

export default function ({ asyncapi, params, originalAsyncAPI }) {
  const readmeFile = <File name="README.md">
    <Text># {asyncapi.info().title()}</Text>
  </File>;

  const composerBlock = `
{
  "require": {
    "jms/serializer": "^3.23",
    "php-amqplib/php-amqplib": "^3.5",
    "react/event-loop": "^1.3",
    "reactivex/rxphp": "^2.0"
  },
  "autoload": {
    "classmap": [
        "src/"
    ]
  }
}  
`.trim();

  const composerFile = <File name="composer.json">
    <Text>{composerBlock}</Text>
  </File>;

  return [readmeFile, composerFile];
}
