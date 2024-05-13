> # DISCLAIMER
> 
> This project is not production-ready. I'm actively developing it and any issue and/or PR are welcome.

# asyncapi-php-template

An [AsyncAPI Generator](https://www.asyncapi.com/tools/generator) template for scaffolding publisher/subscriber (or producer/consumer, or wathever) PHP applications, with a focus on type safety and polymorphism.

Currently supported message brokers:
- ✅ RabbitMQ
- ✅ Kafka

## Installation and usage

Install the AsyncAPI Generator CLI (it can be installed as a dev dependency, or globally):

```shell
npm install --save-dev @asyncapi/generator
```

Install this package as a project dev dependency:

```shell
npm install --save-dev @nickshoe/asyncapi-php-template
```

Launch the generator, specifying `@nickshoe/asyncapi-php-template` as the template name:

```shell
npx ag <path-to-asyncapi-yaml> @nickshoe/asyncapi-php-template -p server=<server-name> -o ./output
```

## Example

This section shows how the generated code looks like, based on the [asyncapi-example.yml](./asyncapi-example.yml) example file.

### Payloads

The following code snippets show how the DTO classes representing the messages payloads get generated; in particular, they show how class-hierarchy and serialization aspects are handled. 

`src/Models/UserPasswordResetEvent.php`
```php
<?php

namespace ExampleApp\Models;

use ExampleApp\Models\DomainEvent;
use JMS\Serializer\Annotation\Discriminator;
use ExampleApp\Models\User;

/**
 * @Discriminator(field="_type", map={"UserPasswordResetEvent" = "ExampleApp\Models\UserPasswordResetEvent"})
 */
class UserPasswordResetEvent extends DomainEvent
{

  private User $user;
  private string $tempPassword;

  public function __construct(string $id, \DateTime $createdAt, User $user, string $tempPassword)
  {
    parent::__construct($id, $createdAt);
    $this->user = $user;
    $this->tempPassword = $tempPassword;
  }

  public function getUser(): User
  {
    return $this->user;
  }

  public function setUser(User $user): void
  {
    $this->user = $user;
  }

  public function getTempPassword(): string
  {
    return $this->tempPassword;
  }

  public function setTempPassword(string $tempPassword): void
  {
    $this->tempPassword = $tempPassword;
  }

}
```

`src/Models/DomainEvent.php`
```php
<?php

namespace ExampleApp\Models;

use JMS\Serializer\Annotation\Type;

class DomainEvent
{

  private readonly string $id;
  /**
   * @Type("DateTime<'Y-m-d\TH:i:s.uO'>")
   */
  private readonly \DateTime $createdAt;

  public function __construct(string $id, \DateTime $createdAt)
  {
    $this->id = $id;
    $this->createdAt = $createdAt;
  }

  public function getId(): string
  {
    return $this->id;
  }

  public function getCreatedAt(): \DateTime
  {
    return $this->createdAt;
  }

}
```

## Channels

The code snippets below show how the publish/subscribe operations will look like. Each channel defined in the spec will generate a corresponding class.

### Subscribe operations

```php
<?php

require_once(__DIR__ . '/vendor/autoload.php');

use AsyncAPI\Services\MessageBroker\Message;
use AsyncAPI\Services\MessageBroker\AMQP\AMQPClientConfig;
use AsyncAPI\Services\MessageBroker\AMQP\AMQPClient;

use ExampleApp\Services\Channels\EventsChannel;

use ExampleApp\Models\DomainEvent;
use ExampleApp\Models\UserPasswordResetEvent;
use ExampleApp\Models\UserLoginEvent;

$username = 'user';
$password = 'password';
$config = new AMQPClientConfig('localhost', 5672, $username, $password);
$client = new AMQPClient($config);
            
$client->connect();

$channel = new EventsChannel($client);

$channel->onDomainEvent(function (DomainEvent $object, Message $message) {
    echo "[x] Received DomainEvent object:\n";
    print_r($object);
    $message->ack();
});
$channel->onUserPasswordResetEvent(function (UserPasswordResetEvent $object, Message $message) {
    echo "[x] Received UserPasswordResetEvent object:\n";
    print_r($object);
    $message->ack();
});
$channel->onUserLoginEvent(function (UserLoginEvent $object, Message $message) {
    echo "[x] Received UserLoginEvent object:\n";
    print_r($object);
    $message->ack();
});

$channel->listen();
```

### Publish operation

```php
<?php
use ExampleApp\Models\User;

require_once(__DIR__ . '/vendor/autoload.php');

use AsyncAPI\Services\MessageBroker\Kafka\KafkaClientConfig;
use AsyncAPI\Services\MessageBroker\Kafka\KafkaClient;

use ExampleApp\Services\Channels\EventsChannel;

use ExampleApp\Models\UserLoginEvent;

$config = new KafkaClientConfig('localhost:9092');
$client = new KafkaClient($config);

$client->connect();

$channel = new EventsChannel($client);

$userLoginEvent = new UserLoginEvent(
    '01c50573-8f17-44d2-afc9-29053ce0b0ad',
    new DateTime(),
    new User(
        42,
        'Darrick',
        'Kris',
        'Maxine42@gmail.com',
        new DateTime('1970-01-01T00:00:00Z')
    )
);
$channel->publishDomainEvent($userLoginEvent);

$client->disconnect();
```

## Template Development

If you're interested in fix some bugs or add some functionality to this template, you should consider the following VSCode launch configuration for debugging.

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug template",
      "timeout": 10000,
      "sourceMaps": true,
      "args": [
        "./asyncapi-example.yml",
        "./",
        "-o",
        "./output",
        "-p",
        "server=development",
        "-p",
        "modelsNamespace=ExampleApp\\Models",
        "-p",
        "servicesNamespace=ExampleApp\\Services",
        "--force-write",
        "--debug"
      ],
      "program": "${workspaceFolder}/node_modules/@asyncapi/generator/cli.js"
    }
  ]
}
```

