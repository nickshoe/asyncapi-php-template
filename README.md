# asyncapi-php-template

## Installation and usage

Install the AsyncAPI CLI (i.e. the generator) (it can be installed as a dev dependency, or globally):

```shell
npm install --save-dev @asyncapi/cli
```

Install this package as a project dev dependency:

```shell
npm install --save-dev @nickshoe/asyncapi-php-template
```

Launch the generator, specifying `@nickshoe/asyncapi-php-template` as the template name:

```shell
npx asyncapi generate fromTemplate <path-to-asyncapi-yaml> @nickshoe/asyncapi-php-template -p server=<server-name> -o ./output
```

## Example

The following files represents how the DTO classes representing the messages schemas get generated; in particular, they show how class-hierarchy and serialization aspects are handled.

`src/models/UserPasswordResetEvent.class.php`
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

`src/models/DomainEvent.class.php`
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

The following content represents an example of a generated `README.md` file for your project, and demostrates how the generated code will look like, based on the [asyncapi-example.yml](./asyncapi-example.yml) example file.

### Example App

#### Channel `events` example

This is the main channel where all application events are published.

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

Try to publish one of the following message payloads on the `events` channel:

`UserPasswordResetEvent` example payload:
```json
{
    "_type": "UserPasswordResetEvent",
    "id": "c3e2f218-dd6c-4e03-830c-79f70f0deb0e",
    "created_at": "2037-07-21T03:11:14.768Z",
    "user": {
        "id": 96,
        "first_name": "Lacy",
        "last_name": "Stark",
        "email": "Alivia.Conroy@hotmail.com",
        "date_of_birth": "2048-08-08T01:59:47.507Z"
    },
    "temp_password": "Vjn<el\\1LC"
}
```

`UserLoginEvent` example payload:
```json
{
    "_type": "UserLoginEvent",
    "id": "859c496d-df68-42f7-900c-a03492248b0e",
    "created_at": "1997-06-17T14:13:03.548Z",
    "user": {
        "id": 44,
        "first_name": "Lewis",
        "last_name": "Renner",
        "email": "Dustin.Turcotte@yahoo.com",
        "date_of_birth": "2044-04-28T22:52:55.211Z"
    }
}
```


#### Channel `users/{userId}/notifications` example

The channel on which notifications for a specific user are published.

```php
<?php

require_once(__DIR__ . '/vendor/autoload.php');

use AsyncAPI\Services\MessageBroker\Message;
use AsyncAPI\Services\MessageBroker\AMQP\AMQPClientConfig;
use AsyncAPI\Services\MessageBroker\AMQP\AMQPClient;

use ExampleApp\Services\Channels\UsersUserIdNotificationsChannel;

use ExampleApp\Models\Notification;
use ExampleApp\Models\PasswordResetRequestedNotification;

$username = 'user';
$password = 'password';
$config = new AMQPClientConfig('localhost', 5672, $username, $password);
$client = new AMQPClient($config);
            
$client->connect();

$channel = new UsersUserIdNotificationsChannel($client, ['userId' => '123']);

$channel->onUserNotification(function (Notification $object, Message $message) {
    echo "[x] Received Notification object:\n";
    print_r($object);
    $message->ack();
});
$channel->onPasswordResetRequestedNotification(function (PasswordResetRequestedNotification $object, Message $message) {
    echo "[x] Received PasswordResetRequestedNotification object:\n";
    print_r($object);
    $message->ack();
});

$channel->listen();
```

## Template Development

VSCode launch configuration for debugging:

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

